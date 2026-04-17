"""
Material Recommender — Uses Apriori association rules from mlxtend.
"""
import random
import pandas as pd
from typing import List, Optional
from mlxtend.frequent_patterns import apriori, association_rules
from mlxtend.preprocessing import TransactionEncoder

MATERIALS_BY_CATEGORY = {
    "plumbing": [
        "pipe wrench", "teflon tape", "p-trap", "pipe sealant", "drain cleaner",
        "ball valve", "copper pipe", "pipe cutter", "plunger", "water supply line",
        "faucet cartridge", "plumber putty"
    ],
    "electrical": [
        "wire stripper", "electrical tape", "circuit breaker", "multimeter",
        "junction box", "wire connectors", "conduit", "outlet cover",
        "voltage tester", "cable ties", "switch plate", "wire nuts"
    ],
    "carpentry": [
        "hammer", "wood screws", "sandpaper", "wood glue", "chisel",
        "measuring tape", "drill bits", "wood filler", "clamps",
        "saw blade", "dowel pins", "wood stain"
    ],
    "painting": [
        "paint roller", "masking tape", "primer", "paintbrush", "drop cloth",
        "paint tray", "sandpaper", "putty knife", "caulk gun",
        "paint scraper", "edging tool", "tack cloth"
    ],
    "general": [
        "screwdriver set", "adjustable wrench", "utility knife", "level",
        "pliers", "safety gloves", "flashlight", "duct tape",
        "tape measure", "safety goggles", "work gloves", "zip ties"
    ],
}

# Realistic INR prices
MATERIAL_PRICES = {
    "pipe wrench": 350, "teflon tape": 30, "p-trap": 180, "pipe sealant": 120,
    "drain cleaner": 150, "ball valve": 250, "copper pipe": 400, "pipe cutter": 500,
    "plunger": 200, "water supply line": 300, "faucet cartridge": 450, "plumber putty": 80,
    "wire stripper": 300, "electrical tape": 40, "circuit breaker": 600, "multimeter": 800,
    "junction box": 150, "wire connectors": 60, "conduit": 200, "outlet cover": 50,
    "voltage tester": 350, "cable ties": 80, "switch plate": 40, "wire nuts": 50,
    "hammer": 400, "wood screws": 60, "sandpaper": 30, "wood glue": 150,
    "chisel": 350, "measuring tape": 200, "drill bits": 500, "wood filler": 180,
    "clamps": 300, "saw blade": 450, "dowel pins": 100, "wood stain": 350,
    "paint roller": 200, "masking tape": 80, "primer": 500, "paintbrush": 150,
    "drop cloth": 250, "paint tray": 120, "putty knife": 100, "caulk gun": 300,
    "paint scraper": 180, "edging tool": 250, "tack cloth": 60,
    "screwdriver set": 500, "adjustable wrench": 350, "utility knife": 200,
    "level": 400, "pliers": 300, "safety gloves": 150, "flashlight": 350,
    "duct tape": 120, "tape measure": 200, "safety goggles": 250,
    "work gloves": 180, "zip ties": 60,
}

_association_rules_cache: Optional[pd.DataFrame] = None
_transactions_by_category: dict = {}


def _generate_synthetic_transactions(n_per_category: int = 20) -> List[dict]:
    """Generate synthetic material transaction records."""
    random.seed(42)
    transactions = []

    for category, materials in MATERIALS_BY_CATEGORY.items():
        for _ in range(n_per_category):
            # Each transaction uses 3-6 materials from the category
            n_materials = random.randint(3, min(6, len(materials)))
            selected = random.sample(materials, n_materials)
            transactions.append({
                "job_type": category,
                "materials_used": selected,
            })

    return transactions


async def seed_material_transactions(db):
    """Seed material_transactions if fewer than 80 records exist."""
    count = await db.material_transactions.count_documents({})
    if count < 80:
        transactions = _generate_synthetic_transactions(20)
        from datetime import datetime
        for t in transactions:
            t["created_at"] = datetime.utcnow()
        await db.material_transactions.insert_many(transactions)
        print(f"[Recommender] Seeded {len(transactions)} material transactions")
        return True
    return False


async def build_association_rules(db):
    """Build Apriori association rules from material transaction data."""
    global _association_rules_cache, _transactions_by_category

    cursor = db.material_transactions.find({})
    records = await cursor.to_list(length=10000)

    if not records:
        print("[Recommender] No transactions found")
        return

    # Group transactions by category
    for record in records:
        cat = record.get("job_type", "general")
        if cat not in _transactions_by_category:
            _transactions_by_category[cat] = []
        _transactions_by_category[cat].append(record.get("materials_used", []))

    # Build rules from all transactions
    all_transactions = [r.get("materials_used", []) for r in records]

    try:
        te = TransactionEncoder()
        te_array = te.fit(all_transactions).transform(all_transactions)
        df = pd.DataFrame(te_array, columns=te.columns_)

        frequent_itemsets = apriori(df, min_support=0.1, use_colnames=True)

        if len(frequent_itemsets) > 0:
            rules = association_rules(frequent_itemsets, metric="confidence", min_threshold=0.5)
            _association_rules_cache = rules
            print(f"[Recommender] Built {len(rules)} association rules")
        else:
            print("[Recommender] No frequent itemsets found, will use fallback")
            _association_rules_cache = pd.DataFrame()

    except Exception as e:
        print(f"[Recommender] Error building rules: {e}")
        _association_rules_cache = pd.DataFrame()


def recommend_materials(
    job_category: str,
    existing_materials: Optional[List[str]] = None,
    top_n: int = 8,
) -> List[dict]:
    """
    Recommend materials for a job category.

    Returns list of dicts with material name and estimated price.
    """
    global _association_rules_cache, _transactions_by_category

    existing = set(existing_materials) if existing_materials else set()
    recommended = set()

    # Try association rules first
    if _association_rules_cache is not None and len(_association_rules_cache) > 0 and existing:
        try:
            for _, rule in _association_rules_cache.iterrows():
                antecedents = set(rule["antecedents"])
                consequents = set(rule["consequents"])

                # If any existing material is in the antecedent, recommend consequents
                if antecedents & existing:
                    recommended.update(consequents - existing)

                if len(recommended) >= top_n:
                    break
        except Exception:
            pass

    # If rules didn't produce enough, use category-based recommendations
    if len(recommended) < 5:
        category_materials = MATERIALS_BY_CATEGORY.get(job_category, MATERIALS_BY_CATEGORY["general"])

        # Get most common from transactions
        if job_category in _transactions_by_category:
            from collections import Counter
            all_materials = []
            for transaction in _transactions_by_category[job_category]:
                all_materials.extend(transaction)
            common = Counter(all_materials).most_common(top_n)
            for material, _ in common:
                if material not in existing:
                    recommended.add(material)
        else:
            # Fallback to static list
            for m in category_materials[:top_n]:
                if m not in existing:
                    recommended.add(m)

    # Build result with prices
    result = []
    for material in list(recommended)[:top_n]:
        result.append({
            "material": material,
            "estimated_price_inr": MATERIAL_PRICES.get(material, 200),
        })

    # Sort by price
    result.sort(key=lambda x: x["estimated_price_inr"])
    return result
