"""
Semantic Matcher — Uses sentence-transformers to match job descriptions to worker specialties.
"""
import numpy as np
from typing import List, Optional
from sklearn.metrics.pairwise import cosine_similarity

# Module-level singleton for the model
_model = None


def load_model():
    """Load the sentence-transformer model once at startup."""
    global _model
    if _model is None:
        from sentence_transformers import SentenceTransformer
        print("[Semantic Matcher] Loading all-MiniLM-L6-v2 model...")
        _model = SentenceTransformer("all-MiniLM-L6-v2")
        print("[Semantic Matcher] Model loaded successfully")
    return _model


def get_model():
    """Get the loaded model singleton."""
    global _model
    return _model


def encode_text(text: str) -> List[float]:
    """Encode a text string into an embedding vector."""
    model = get_model()
    if model is None:
        raise RuntimeError("Sentence transformer model not loaded. Call load_model() first.")
    embedding = model.encode(text, convert_to_numpy=True)
    return embedding.tolist()


async def match_workers(
    job_description: str,
    workers: List[dict],
    db=None
) -> List[dict]:
    """
    Match workers to a job description using semantic similarity.

    Args:
        job_description: The raw or parsed job description text
        workers: List of worker profile dicts from database
        db: Database reference for saving computed embeddings

    Returns:
        List of dicts with worker_id and similarity_score
    """
    model = get_model()
    if model is None or len(workers) == 0:
        return []

    # Encode job description
    job_embedding = model.encode(job_description, convert_to_numpy=True).reshape(1, -1)

    results = []
    for worker in workers:
        worker_id = str(worker.get("_id", worker.get("user_id", "")))

        # Use stored embedding if available, otherwise compute and save
        if worker.get("specialty_embedding") and len(worker["specialty_embedding"]) > 0:
            worker_embedding = np.array(worker["specialty_embedding"]).reshape(1, -1)
        else:
            specialty = worker.get("specialty_description", "")
            if not specialty:
                skills = worker.get("skills", [])
                specialty = ", ".join(skills) if skills else "general worker"

            worker_embedding = model.encode(specialty, convert_to_numpy=True).reshape(1, -1)

            # Save embedding back to database
            if db is not None:
                try:
                    await db.worker_profiles.update_one(
                        {"_id": worker["_id"]},
                        {"$set": {"specialty_embedding": worker_embedding.flatten().tolist()}}
                    )
                except Exception as e:
                    print(f"[Semantic Matcher] Failed to save embedding for worker {worker_id}: {e}")

        # Calculate cosine similarity
        similarity = cosine_similarity(job_embedding, worker_embedding)[0][0]
        similarity = float(max(0.0, min(1.0, similarity)))  # Clamp to [0, 1]

        results.append({
            "worker_id": worker_id,
            "similarity_score": round(similarity, 4)
        })

    # Sort by similarity descending
    results.sort(key=lambda x: x["similarity_score"], reverse=True)
    return results
