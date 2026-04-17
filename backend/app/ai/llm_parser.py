"""
LLM Problem Parser — Uses Groq Cloud (Llama 3.3 70B) to parse customer problem descriptions.

SETUP:
  1. Get a free API key from https://console.groq.com
  2. Set GROQ_API_KEY in your .env file
  3. Restart the uvicorn server
"""
import json
import hashlib
import logging
import traceback
import re
from typing import Optional
from openai import AsyncOpenAI
from app.config import settings

logger = logging.getLogger("skillbridge.llm_parser")

# In-memory cache for identical inputs
_parse_cache: dict[str, dict] = {}

_client: Optional[AsyncOpenAI] = None


def _get_client() -> AsyncOpenAI:
    global _client
    if _client is None:
        api_key = settings.GROQ_API_KEY
        if not api_key or not api_key.strip():
            raise ValueError(
                "GROQ_API_KEY is not set or is empty. "
                "Set it in your .env file: GROQ_API_KEY=gsk_your_key_here "
                "(get a free key at https://console.groq.com)"
            )
        _client = AsyncOpenAI(
            api_key=api_key.strip(),
            base_url=settings.GROQ_API_BASE,
        )
    return _client


SYSTEM_PROMPT = """You are an expert Indian home-services job classifier. You understand local terminology and common household problems across India.

DOMAIN GLOSSARY (use these to inform your classification):
- MCB = Miniature Circuit Breaker, MCCB = Moulded Case Circuit Breaker, RCCB = Residual Current Circuit Breaker
- Geyser = water heater, Tap/Nalla = faucet, Earthing = electrical grounding
- P-trap = curved drain pipe section, OHT = Overhead Tank, Sump = underground water tank
- PVC conduit = plastic pipe for housing electrical wires
- Inverter/UPS = battery backup for power cuts
- Putty = wall filler before painting, POP = Plaster of Paris ceiling work

YOUR TASK: Parse the customer's problem description into a structured JSON object.

OUTPUT SCHEMA (return ONLY this JSON, nothing else):
{
  "job_category": "plumbing | electrical | carpentry | painting | general",
  "urgency": "low | medium | high",
  "complexity": "low | medium | high",
  "likely_causes": ["<cause 1>", "<cause 2>", "<cause 3>"],
  "job_summary": "<professional one-sentence rewrite>"
}

FIELD RULES:
- job_category: Exactly one of plumbing, electrical, carpentry, painting, general
- urgency: "high" for safety risks (water flooding, electrical sparks, gas leaks), "low" for cosmetic/non-urgent
- complexity: "high" for full rewiring/renovation/structural, "low" for single fixture replacement
- likely_causes: 2 to 4 specific diagnostic phrases (e.g. "worn rubber washer in tap spindle causing slow drip")
- job_summary: Professional rewrite of the problem, NOT a copy of the customer's input

EXAMPLES:

Input: "bathroom me paani ka leakage ho raha hai pipe se"
Output: {"job_category": "plumbing", "urgency": "medium", "complexity": "medium", "likely_causes": ["corroded or cracked pipe joint behind wall", "worn-out plumber tape at threaded connection", "high water pressure causing fitting failure"], "job_summary": "Water leakage detected from bathroom plumbing pipe requiring inspection and repair of pipe joints."}

Input: "fan chal nahi raha aur switch se sparking aa rahi hai"
Output: {"job_category": "electrical", "urgency": "high", "complexity": "medium", "likely_causes": ["loose or burnt wire connection inside switch board", "faulty ceiling fan capacitor preventing motor start", "damaged switch mechanism causing internal arcing"], "job_summary": "Ceiling fan non-operational with sparking observed at wall switch, indicating potential wiring or switch fault requiring urgent attention."}

Input: "kitchen cabinet ka door toot gaya hai"
Output: {"job_category": "carpentry", "urgency": "low", "complexity": "low", "likely_causes": ["worn-out or broken cabinet door hinge", "swollen wood due to moisture exposure near sink", "loose screw holes in cabinet frame from repeated use"], "job_summary": "Kitchen cabinet door detached or broken, likely requiring hinge replacement or door refitting."}

CRITICAL: Output ONLY the raw JSON object. No markdown fences, no code blocks, no explanation, no preamble."""


DEFAULT_PARSED = {
    "job_category": "general",
    "urgency": "medium",
    "complexity": "medium",
    "likely_causes": ["Unable to determine specific cause from description"],
    "job_summary": "General maintenance request requiring on-site assessment"
}

VALID_CATEGORIES = {"plumbing", "electrical", "carpentry", "painting", "general"}
VALID_URGENCY = {"low", "medium", "high"}
VALID_COMPLEXITY = {"low", "medium", "high"}


def _clean_json_response(content: str) -> str:
    """Clean LLM response to extract raw JSON."""
    content = content.strip()

    # Remove markdown code fences: ```json ... ``` or ``` ... ```
    if content.startswith("```"):
        # Find the closing fence
        match = re.search(r"```(?:json)?\s*\n?(.*?)\n?\s*```", content, re.DOTALL)
        if match:
            content = match.group(1)
        else:
            # Fallback: strip first and last lines that start with ```
            lines = content.split("\n")
            lines = [l for l in lines if not l.strip().startswith("```")]
            content = "\n".join(lines)

    content = content.strip()

    # Remove leading "json" prefix if someone wrote it without fences
    if content.lower().startswith("json"):
        content = content[4:].strip()

    return content


def _validate_parsed(parsed: dict, raw_description: str) -> tuple[bool, str]:
    """Validate the parsed result. Returns (is_valid, reason)."""
    if parsed.get("job_category") not in VALID_CATEGORIES:
        return False, f"Invalid job_category: {parsed.get('job_category')}"
    if parsed.get("urgency") not in VALID_URGENCY:
        return False, f"Invalid urgency: {parsed.get('urgency')}"
    if parsed.get("complexity") not in VALID_COMPLEXITY:
        return False, f"Invalid complexity: {parsed.get('complexity')}"

    causes = parsed.get("likely_causes", [])
    if not isinstance(causes, list) or len(causes) < 1:
        return False, "likely_causes must be a non-empty list"

    # Check for placeholder causes
    placeholder_strings = {"unable to determine", "n/a", "unknown", "not sure", "none"}
    if all(c.strip().lower() in placeholder_strings for c in causes):
        return False, "likely_causes contains only placeholder text"

    summary = parsed.get("job_summary", "")
    if not summary or len(summary) < 10:
        return False, "job_summary is too short or missing"

    # Check if summary is just an echo of input
    if summary.strip().lower() == raw_description.strip().lower():
        return False, "job_summary is identical to raw input"

    return True, "ok"


async def parse_problem(description: str) -> dict:
    """Parse a customer problem description using Groq Cloud (Llama)."""
    # Check cache
    cache_key = hashlib.md5(description.strip().lower().encode()).hexdigest()
    if cache_key in _parse_cache:
        return _parse_cache[cache_key]

    max_attempts = 2

    for attempt in range(1, max_attempts + 1):
        try:
            client = _get_client()

            api_kwargs = {
                "model": settings.GROQ_MODEL,
                "messages": [
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": description}
                ],
                "temperature": 0.3,
                "max_tokens": 500,
            }

            # Use JSON mode if supported (Groq supports this for Llama 3)
            try:
                api_kwargs["response_format"] = {"type": "json_object"}
            except Exception:
                pass  # Fall through without JSON mode

            response = await client.chat.completions.create(**api_kwargs)

            raw_content = response.choices[0].message.content
            content = _clean_json_response(raw_content)

            logger.debug(f"Groq raw response (attempt {attempt}): {raw_content[:300]}")

            parsed = json.loads(content)

            # Validate
            is_valid, reason = _validate_parsed(parsed, description)
            if not is_valid:
                logger.warning(
                    f"[LLM Parser] Validation failed (attempt {attempt}): {reason}. "
                    f"Raw response: {raw_content[:200]}"
                )
                if attempt < max_attempts:
                    continue  # Retry

                # On final attempt failure, fix what we can
                logger.warning("[LLM Parser] Using partially valid response with corrections")

            # Apply corrections for any out-of-range values
            if parsed.get("job_category") not in VALID_CATEGORIES:
                parsed["job_category"] = "general"
            if parsed.get("urgency") not in VALID_URGENCY:
                parsed["urgency"] = "medium"
            if parsed.get("complexity") not in VALID_COMPLEXITY:
                parsed["complexity"] = "medium"
            if not isinstance(parsed.get("likely_causes"), list) or len(parsed["likely_causes"]) == 0:
                parsed["likely_causes"] = ["Requires on-site inspection to determine root cause"]
            parsed["likely_causes"] = parsed["likely_causes"][:4]
            if not parsed.get("job_summary") or len(parsed.get("job_summary", "")) < 10:
                parsed["job_summary"] = description[:100]

            # Cache and return
            _parse_cache[cache_key] = parsed
            logger.info(f"[LLM Parser] Successfully parsed: category={parsed['job_category']}, urgency={parsed['urgency']}")
            return parsed

        except json.JSONDecodeError as e:
            logger.error(
                f"[LLM Parser] JSON parse error (attempt {attempt}): {e}\n"
                f"Raw content: {raw_content[:500] if 'raw_content' in dir() else 'N/A'}\n"
                f"{traceback.format_exc()}"
            )
            if attempt < max_attempts:
                continue

        except Exception as e:
            logger.error(
                f"[LLM Parser] Groq API call failed (attempt {attempt}): {type(e).__name__}: {e}\n"
                f"{traceback.format_exc()}"
            )
            if attempt < max_attempts:
                continue

    # All attempts failed — use keyword fallback
    logger.warning(f"[LLM Parser] All {max_attempts} attempts failed. Using keyword fallback.")
    fallback = _keyword_fallback(description)
    _parse_cache[cache_key] = fallback
    return fallback


def _keyword_fallback(description: str) -> dict:
    """Simple keyword-based fallback when API fails."""
    desc_lower = description.lower()

    category_keywords = {
        "plumbing": ["pipe", "leak", "faucet", "drain", "toilet", "water", "tap", "plumb",
                      "sink", "shower", "bathroom", "geyser", "nalla", "p-trap", "tank", "sump", "oht"],
        "electrical": ["wire", "switch", "outlet", "power", "electric", "light", "fan", "circuit",
                        "socket", "breaker", "voltage", "mcb", "earthing", "inverter", "ups", "conduit",
                        "rccb", "mccb", "spark", "wiring"],
        "carpentry": ["wood", "door", "cabinet", "shelf", "furniture", "carpenter", "table",
                       "drawer", "hinge", "wardrobe", "plywood", "laminate", "panel"],
        "painting": ["paint", "wall", "color", "coat", "primer", "brush", "stain",
                      "whitewash", "texture", "putty", "pop", "damp", "seepage"],
    }

    urgency = "medium"
    if any(w in desc_lower for w in ["emergency", "urgent", "immediately", "dangerous",
                                      "flooding", "spark", "fire", "shock", "electr"]):
        urgency = "high"
    elif any(w in desc_lower for w in ["whenever", "no rush", "convenience", "sometime"]):
        urgency = "low"

    complexity = "medium"
    if any(w in desc_lower for w in ["simple", "small", "minor", "quick", "just", "only"]):
        complexity = "low"
    elif any(w in desc_lower for w in ["major", "complete", "full", "entire", "renovation",
                                        "overhaul", "rewire", "replac"]):
        complexity = "high"

    matched_category = "general"
    max_hits = 0
    for cat, keywords in category_keywords.items():
        hits = sum(1 for kw in keywords if kw in desc_lower)
        if hits > max_hits:
            max_hits = hits
            matched_category = cat

    return {
        "job_category": matched_category,
        "urgency": urgency,
        "complexity": complexity,
        "likely_causes": ["Determined via keyword analysis — LLM API was unavailable"],
        "job_summary": description[:100].strip()
    }
