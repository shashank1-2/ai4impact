"""
AI API Routes — Standalone AI endpoints for analysis, forecasting, training, and insights.
"""
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from app.database import get_db
from app.ai import llm_parser, forecaster, ranker, pricer
from app.ai.forecaster import FORECAST_CACHE

router = APIRouter(prefix="/ai", tags=["AI"])


def _format_response(success: bool, data=None, message: str = ""):
    return {"success": success, "data": data, "message": message}


class AnalyzeRequest(BaseModel):
    description: str


@router.post("/analyze")
async def analyze_description(request: AnalyzeRequest):
    """Standalone endpoint to run the LLM parser on a description."""
    try:
        parsed = await llm_parser.parse_problem(request.description)
        return _format_response(True, parsed, "Description analyzed successfully")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")


@router.get("/demand-forecast")
async def get_demand_forecast(
    city: str = Query(..., description="City name: Bangalore, Mumbai, or Delhi"),
    category: str = Query(..., description="Job category: plumbing, electrical, carpentry, painting, general"),
):
    """Get 7-day demand forecast for a city/category combination."""
    valid_cities = ["Bangalore", "Mumbai", "Delhi"]
    valid_categories = ["plumbing", "electrical", "carpentry", "painting", "general"]

    if city not in valid_cities:
        raise HTTPException(status_code=400, detail=f"Invalid city. Must be one of: {valid_cities}")
    if category not in valid_categories:
        raise HTTPException(status_code=400, detail=f"Invalid category. Must be one of: {valid_categories}")

    if not forecaster.is_ready():
        return _format_response(False, None, "Forecaster is still initializing. Please try again in a minute.")

    cache_key = f"{city}/{category}"
    forecast_data = FORECAST_CACHE.get(cache_key)
    
    if not forecast_data:
        # Fallback generation on the fly
        forecaster._generate_and_cache(city, category)
        forecast_data = FORECAST_CACHE.get(cache_key)

    return _format_response(True, {
        "city": city,
        "category": category,
        "forecast": forecast_data,
    }, "7-day demand forecast generated")

@router.get("/forecast-status")
async def get_forecast_status():
    """Check the status of the forecaster cache."""
    keys = list(FORECAST_CACHE.keys())
    return {
        "cached_combinations": len(keys),
        "keys": keys
    }


@router.post("/train")
async def train_models():
    """Trigger retraining of both ranker and pricer models."""
    db = get_db()

    results = {}

    # Train ranker
    try:
        ranker_result = await ranker.train_ranker(db)
        results["ranker"] = ranker_result
    except Exception as e:
        results["ranker"] = {"error": str(e)}

    # Train pricer
    try:
        pricer_result = await pricer.retrain_pricer(db)
        results["pricer"] = pricer_result
    except Exception as e:
        results["pricer"] = {"error": str(e)}

    return _format_response(True, results, "Model training completed")


@router.get("/platform-insights")
async def get_platform_insights():
    """Return aggregate platform statistics for dashboard."""
    db = get_db()

    try:
        # Total workers per category
        pipeline_workers = [
            {"$unwind": "$skills"},
            {"$group": {"_id": "$skills", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}},
        ]
        workers_by_category = {}
        async for doc in db.worker_profiles.aggregate(pipeline_workers):
            workers_by_category[doc["_id"]] = doc["count"]

        # Average rating per category
        pipeline_ratings = [
            {"$unwind": "$skills"},
            {"$group": {
                "_id": "$skills",
                "avg_rating": {"$avg": "$avg_rating"},
                "total_workers": {"$sum": 1},
            }},
        ]
        avg_ratings = {}
        async for doc in db.worker_profiles.aggregate(pipeline_ratings):
            avg_ratings[doc["_id"]] = round(doc["avg_rating"], 2)

        # Average price per job type from historical data
        pipeline_prices = [
            {"$group": {
                "_id": "$job_type",
                "avg_price": {"$avg": "$final_price"},
            }},
        ]
        avg_prices = {}
        async for doc in db.historical_jobs.aggregate(pipeline_prices):
            if doc["_id"]:
                avg_prices[doc["_id"]] = round(doc["avg_price"], 2)

        # Busiest day of week from jobs
        pipeline_days = [
            {"$project": {"day_of_week": {"$dayOfWeek": "$created_at"}}},
            {"$group": {"_id": "$day_of_week", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}},
            {"$limit": 1},
        ]
        busiest_day = None
        day_names = {1: "Sunday", 2: "Monday", 3: "Tuesday", 4: "Wednesday",
                     5: "Thursday", 6: "Friday", 7: "Saturday"}
        async for doc in db.jobs.aggregate(pipeline_days):
            busiest_day = day_names.get(doc["_id"], "Unknown")

        # Total counts
        total_workers = await db.worker_profiles.count_documents({})
        total_jobs = await db.jobs.count_documents({})
        total_users = await db.users.count_documents({})

        insights = {
            "total_workers": total_workers,
            "total_jobs": total_jobs,
            "total_users": total_users,
            "workers_per_category": workers_by_category,
            "avg_rating_per_category": avg_ratings,
            "avg_price_per_job_type": avg_prices,
            "busiest_day": busiest_day or "Not enough data",
        }

        return _format_response(True, insights, "Platform insights generated")

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate insights: {str(e)}")
