import os
from dotenv import load_dotenv

load_dotenv()


class Settings:
    MONGODB_URL: str = os.getenv("MONGO_URI", os.getenv("MONGODB_URL", "mongodb://localhost:27017"))
    DATABASE_NAME: str = os.getenv("DATABASE_NAME", "skillbridge")
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
    JWT_SECRET: str = os.getenv("JWT_SECRET", "change-me-in-production")
    JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
    JWT_EXPIRY_HOURS: int = int(os.getenv("JWT_EXPIRY_HOURS", "24"))

    # AI Model paths
    ML_MODELS_DIR: str = os.path.join(os.path.dirname(os.path.dirname(__file__)), "app", "ml_models")
    RANKER_MODEL_PATH: str = os.path.join(ML_MODELS_DIR, "ranker_model.pkl")
    PRICER_MODEL_PATH: str = os.path.join(ML_MODELS_DIR, "pricer_model.pkl")
    PRICER_PREPROCESSOR_PATH: str = os.path.join(ML_MODELS_DIR, "pricer_preprocessor.pkl")

    # Sentence transformer model name
    SENTENCE_MODEL_NAME: str = "all-MiniLM-L6-v2"

    # Groq Cloud API (serves Llama models, OpenAI-compatible)
    GROQ_API_BASE: str = "https://api.groq.com/openai/v1"
    GROQ_MODEL: str = "llama-3.3-70b-versatile"


settings = Settings()
