"""
Worker Ranker — Weighted scoring + optional RandomForest ML model for ranking workers.
"""
import os
import pickle
import numpy as np
import pandas as pd
from typing import List, Optional
from sklearn.ensemble import RandomForestRegressor
from app.config import settings

# Weights for the scoring pipeline
WEIGHTS = {
    "semantic_similarity": 0.35,
    "normalized_rating": 0.25,
    "availability": 0.20,
    "normalized_experience": 0.10,
    "proximity_score": 0.10,
}

MAX_DISTANCE_KM = 20.0
MAX_JOBS_CAP = 100

_ranker_model: Optional[RandomForestRegressor] = None


def load_ranker_model() -> Optional[RandomForestRegressor]:
    """Load the trained ranker model from disk."""
    global _ranker_model
    if os.path.exists(settings.RANKER_MODEL_PATH):
        try:
            with open(settings.RANKER_MODEL_PATH, "rb") as f:
                _ranker_model = pickle.load(f)
            print("[Ranker] Loaded ranker model from disk")
            return _ranker_model
        except Exception as e:
            print(f"[Ranker] Failed to load ranker model: {e}")
    return None


def _calculate_weighted_score(
    similarity: float,
    rating: float,
    is_available: bool,
    experience_years: int,
    distance_km: float,
) -> float:
    """Calculate the weighted ranking score."""
    normalized_rating = rating / 5.0
    availability = 1.0 if is_available else 0.0
    normalized_experience = min(experience_years, MAX_JOBS_CAP) / MAX_JOBS_CAP
    proximity = max(0.0, 1.0 - distance_km / MAX_DISTANCE_KM)

    score = (
        WEIGHTS["semantic_similarity"] * similarity
        + WEIGHTS["normalized_rating"] * normalized_rating
        + WEIGHTS["availability"] * availability
        + WEIGHTS["normalized_experience"] * normalized_experience
        + WEIGHTS["proximity_score"] * proximity
    )
    return round(score, 4)


def _map_urgency(urgency: str) -> int:
    return {"low": 1, "medium": 2, "high": 3}.get(urgency, 2)


def _map_complexity(complexity: str) -> int:
    return {"low": 1, "medium": 2, "high": 3}.get(complexity, 2)


def rank_workers(
    workers_with_scores: List[dict],
    job_urgency: str = "medium",
    job_complexity: str = "medium",
) -> List[dict]:
    """
    Rank workers using weighted scoring + optional ML model.

    Args:
        workers_with_scores: List of dicts with worker info and similarity_score
        job_urgency: Job urgency level
        job_complexity: Job complexity level

    Returns:
        Sorted list of workers with final_score added
    """
    global _ranker_model

    results = []
    for w in workers_with_scores:
        similarity = w.get("similarity_score", 0.0)
        rating = w.get("avg_rating", 3.0)
        is_available = w.get("availability_status", "available") == "available"
        experience = w.get("experience_years", 1)
        distance = w.get("distance_km", 10.0)

        # Weighted score
        weighted_score = _calculate_weighted_score(
            similarity, rating, is_available, experience, distance
        )

        # ML model prediction (if available)
        final_score = weighted_score
        if _ranker_model is not None:
            try:
                features = np.array([[
                    rating,
                    distance,
                    1.0 if is_available else 0.0,
                    experience,
                    _map_urgency(job_urgency),
                    _map_complexity(job_complexity),
                ]])
                ml_prediction = _ranker_model.predict(features)[0]
                # Normalize to 0-1 range (satisfaction is 1-5)
                ml_score = ml_prediction / 5.0
                ml_score = max(0.0, min(1.0, ml_score))
                # Blend 50/50
                final_score = 0.5 * weighted_score + 0.5 * ml_score
            except Exception as e:
                print(f"[Ranker] ML prediction failed, using weighted score: {e}")

        w["final_score"] = round(final_score, 4)
        w["weighted_score"] = weighted_score
        results.append(w)

    results.sort(key=lambda x: x["final_score"], reverse=True)
    return results


async def train_ranker(db) -> dict:
    """Train the ranker model from historical_jobs data."""
    global _ranker_model

    cursor = db.historical_jobs.find({})
    records = await cursor.to_list(length=10000)

    if len(records) < 10:
        return {"error": "Not enough training data", "records": len(records)}

    df = pd.DataFrame(records)

    required_cols = ["worker_experience", "distance_km", "final_price", "customer_satisfaction"]
    for col in required_cols:
        if col not in df.columns:
            return {"error": f"Missing column: {col}"}

    # Map categorical features
    urgency_map = {"low": 1, "medium": 2, "high": 3}
    complexity_map = {"low": 1, "medium": 2, "high": 3}

    if "job_type" not in df.columns:
        df["job_type"] = "general"
    if "complexity" not in df.columns:
        df["complexity"] = "medium"

    df["urgency_numeric"] = df.get("urgency", pd.Series(["medium"] * len(df))).map(urgency_map).fillna(2)
    df["complexity_numeric"] = df["complexity"].map(complexity_map).fillna(2)

    # Derive worker_rating from satisfaction if not present
    if "worker_rating" not in df.columns:
        df["worker_rating"] = df["customer_satisfaction"].clip(1, 5)

    # Availability numeric
    if "availability_numeric" not in df.columns:
        df["availability_numeric"] = 1.0

    features = df[["worker_rating", "distance_km", "availability_numeric",
                    "worker_experience", "urgency_numeric", "complexity_numeric"]].values
    target = df["customer_satisfaction"].values

    model = RandomForestRegressor(n_estimators=100, random_state=42, max_depth=10)
    model.fit(features, target)

    # Save model
    os.makedirs(os.path.dirname(settings.RANKER_MODEL_PATH), exist_ok=True)
    with open(settings.RANKER_MODEL_PATH, "wb") as f:
        pickle.dump(model, f)

    _ranker_model = model

    feature_names = ["worker_rating", "distance_km", "availability_numeric",
                     "worker_experience", "urgency_numeric", "complexity_numeric"]
    importances = dict(zip(feature_names, model.feature_importances_.tolist()))

    print(f"[Ranker] Model trained on {len(records)} records")
    return {
        "status": "trained",
        "records_used": len(records),
        "feature_importances": importances,
        "r2_score": round(model.score(features, target), 4),
    }
