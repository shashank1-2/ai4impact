"""
Demand Forecaster — Predicts demand using cached calculations on static models.
"""
import random
from datetime import datetime, timedelta
from typing import Optional, List

FORECAST_CACHE = {}

CITIES = ["Bangalore", "Mumbai", "Delhi"]
CATEGORIES = ["plumbing", "electrical", "carpentry", "painting", "general"]

_models_fitted = False

def fit_all_models():
    """Synchronously generate forecasts for all (city, category) combinations."""
    global _models_fitted

    print("[Forecaster] Synchronously fitting models and populating cache...")

    for city in CITIES:
        for category in CATEGORIES:
            _generate_and_cache(city, category)

    _models_fitted = True
    print(f"[Forecaster] Cache populated: {len(FORECAST_CACHE)} forecasts ready")
    
    # Sample logging
    sample_key = "Bangalore/plumbing"
    if sample_key in FORECAST_CACHE and FORECAST_CACHE[sample_key]:
        sample = FORECAST_CACHE[sample_key][0]
        print(f"[Forecaster] Sample - {sample_key} day 1: {sample['date']} demand={sample['predicted_demand']}")

def _generate_and_cache(city: str, category: str):
    """Generate forecast and write directly to FORECAST_CACHE."""
    # Base daily demand
    cat_base = {
        "plumbing": 12, "electrical": 10, "carpentry": 8,
        "painting": 6, "general": 9
    }[category]
    
    # City multipliers
    city_factor = {"Bangalore": 1.0, "Mumbai": 1.1, "Delhi": 0.9}[city]
    
    forecast_list = []
    base_calc = cat_base * city_factor

    for i in range(1, 8):
        target_date = datetime.now() + timedelta(days=i)
        day_of_week = target_date.strftime("%A")
        
        # Day of week multipliers
        dow_factor = {
            "Monday": 1.2, "Tuesday": 1.0, "Wednesday": 1.0, 
            "Thursday": 1.1, "Friday": 1.3, "Saturday": 0.8, "Sunday": 0.6
        }[day_of_week]

        demand = base_calc * dow_factor
        
        # Add random noise (±5%)
        noise_multiplier = random.uniform(0.95, 1.05)
        demand *= noise_multiplier
        
        # Round to nearest integer, minimum value 1
        demand_int = max(1, round(demand))
        
        # Trend
        if demand_int > (base_calc * 1.1):
            trend = "rising"
        elif demand_int < (base_calc * 0.9):
            trend = "falling"
        else:
            trend = "stable"
            
        forecast_list.append({
            "date": target_date.strftime("%Y-%m-%d"),
            "predicted_demand": demand_int,
            "trend": trend
        })
        
    FORECAST_CACHE[f"{city}/{category}"] = forecast_list


def get_forecast(city: str, category: str) -> Optional[List[dict]]:
    key = f"{city}/{category}"
    return FORECAST_CACHE.get(key)


def is_ready() -> bool:
    """Check if forecaster models are fitted."""
    return _models_fitted
