"""
Dynamic Pricer — LinearRegression with synthetic data generation and rule-based fallback.
"""
import os
import pickle
import random
import numpy as np
import pandas as pd
from typing import Optional
from sklearn.linear_model import LinearRegression
from sklearn.preprocessing import OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from app.config import settings

BASE_PRICES = {
    "plumbing": 500,
    "electrical": 600,
    "carpentry": 700,
    "painting": 800,
    "general": 400,
}

COMPLEXITY_MULTIPLIERS = {"low": 0.8, "medium": 1.0, "high": 1.4}
TIME_MULTIPLIERS = {
    "morning": 1.0,
    "afternoon": 1.0,
    "evening": 1.1,
    "night": 1.3,
    "weekend": 1.2,
}

_pricer_model = None
_pricer_preprocessor = None


def _generate_synthetic_data(n=500) -> pd.DataFrame:
    """Generate synthetic historical job data for training."""
    random.seed(42)
    np.random.seed(42)

    job_types = list(BASE_PRICES.keys())
    complexities = list(COMPLEXITY_MULTIPLIERS.keys())
    times = list(TIME_MULTIPLIERS.keys())

    records = []
    for _ in range(n):
        job_type = random.choice(job_types)
        complexity = random.choice(complexities)
        time_of_day = random.choice(times)
        experience = random.randint(1, 30)
        distance = round(random.uniform(1, 20), 1)

        base = BASE_PRICES[job_type]
        price = base * COMPLEXITY_MULTIPLIERS[complexity]
        price *= TIME_MULTIPLIERS[time_of_day]
        price *= (1.0 + experience / 100)
        price += distance * 10
        price += np.random.normal(0, 50)
        price = max(200, price)

        satisfaction = min(5, max(1, round(
            3.5 + (experience / 30) - (distance / 40) + np.random.normal(0, 0.5), 1
        )))

        records.append({
            "job_type": job_type,
            "complexity": complexity,
            "time_of_day": time_of_day,
            "worker_experience": experience,
            "distance_km": distance,
            "final_price": round(price, 2),
            "customer_satisfaction": satisfaction,
            "worker_rating": round(min(5, max(1, 3.0 + experience / 15 + np.random.normal(0, 0.3))), 1),
            "availability_numeric": random.choice([0, 1]),
            "urgency": random.choice(complexities),
        })

    return pd.DataFrame(records)


async def seed_historical_data(db):
    """Seed the historical_jobs collection if it has fewer than 100 records."""
    count = await db.historical_jobs.count_documents({})
    if count < 100:
        df = _generate_synthetic_data(500)
        records = df.to_dict("records")
        await db.historical_jobs.insert_many(records)
        print(f"[Pricer] Seeded {len(records)} synthetic historical jobs")
        return records
    return None


def train_pricer_model(data: pd.DataFrame) -> dict:
    """Train the pricer model on historical data."""
    global _pricer_model, _pricer_preprocessor

    categorical_features = ["job_type", "complexity", "time_of_day"]
    numerical_features = ["worker_experience", "distance_km"]

    preprocessor = ColumnTransformer(
        transformers=[
            ("cat", OneHotEncoder(handle_unknown="ignore", sparse_output=False), categorical_features),
            ("num", "passthrough", numerical_features),
        ]
    )

    model = Pipeline([
        ("preprocessor", preprocessor),
        ("regressor", LinearRegression()),
    ])

    X = data[categorical_features + numerical_features]
    y = data["final_price"]

    model.fit(X, y)

    # Save model and preprocessor
    os.makedirs(os.path.dirname(settings.PRICER_MODEL_PATH), exist_ok=True)
    with open(settings.PRICER_MODEL_PATH, "wb") as f:
        pickle.dump(model, f)

    _pricer_model = model
    r2 = model.score(X, y)
    print(f"[Pricer] Model trained. R² = {r2:.4f}")
    return {"status": "trained", "r2_score": round(r2, 4), "records_used": len(data)}


def load_pricer_model():
    """Load trained model from disk."""
    global _pricer_model
    if os.path.exists(settings.PRICER_MODEL_PATH):
        try:
            with open(settings.PRICER_MODEL_PATH, "rb") as f:
                _pricer_model = pickle.load(f)
            print("[Pricer] Loaded pricer model from disk")
            return True
        except Exception as e:
            print(f"[Pricer] Failed to load model: {e}")
    return False


def predict_price(
    job_type: str,
    complexity: str = "medium",
    time_of_day: str = "morning",
    worker_experience: int = 5,
    distance_km: float = 5.0,
) -> dict:
    """Predict job price. Returns min, base, max dict."""
    global _pricer_model

    if _pricer_model is not None:
        try:
            input_df = pd.DataFrame([{
                "job_type": job_type,
                "complexity": complexity,
                "time_of_day": time_of_day,
                "worker_experience": worker_experience,
                "distance_km": distance_km,
            }])
            base_price = float(_pricer_model.predict(input_df)[0])
            base_price = max(200, base_price)
        except Exception as e:
            print(f"[Pricer] ML prediction failed, using rule-based: {e}")
            base_price = _rule_based_price(job_type, complexity, time_of_day, worker_experience, distance_km)
    else:
        base_price = _rule_based_price(job_type, complexity, time_of_day, worker_experience, distance_km)

    return {
        "min": round(base_price * 0.85, 2),
        "base": round(base_price, 2),
        "max": round(base_price * 1.15, 2),
    }


def _rule_based_price(
    job_type: str,
    complexity: str,
    time_of_day: str,
    worker_experience: int,
    distance_km: float,
) -> float:
    """Fallback rule-based pricing."""
    base = BASE_PRICES.get(job_type, 400)
    price = base * COMPLEXITY_MULTIPLIERS.get(complexity, 1.0)
    price *= TIME_MULTIPLIERS.get(time_of_day, 1.0)
    price *= (1.0 + worker_experience / 100)
    price += distance_km * 10
    return max(200, price)


async def retrain_pricer(db) -> dict:
    """Retrain the pricer model from current database data."""
    cursor = db.historical_jobs.find({})
    records = await cursor.to_list(length=10000)
    if len(records) < 10:
        return {"error": "Not enough data", "records": len(records)}

    df = pd.DataFrame(records)
    required = ["job_type", "complexity", "time_of_day", "worker_experience", "distance_km", "final_price"]
    for col in required:
        if col not in df.columns:
            return {"error": f"Missing column: {col}"}

    return train_pricer_model(df)
