# SkillBridge AI Backend Documentation

SkillBridge is an AI-powered local services platform that connects customers with skilled workers (e.g., plumbers, electricians, carpenters, painters). The overall backend has been built robustly using FastAPI and MongoDB, with specialized ML models supporting a dynamic user experience.

This document serves as a complete reference for the endpoints available in the backend API.

---

## 🚀 Quick Setup & Seeding

**Important Note for Testing:** If you are seeing `0` matched workers in the `/jobs/analyze` endpoint, it means your database is completely empty.

To fix this and test the real magic, run the following:
```bash
POST http://localhost:8000/admin/seed
```
This will automatically generate and seed **25 realistic worker profiles** across Bangalore, Mumbai, and Delhi.

---

## 🛠️ API Endpoints Reference

All endpoints return a standardized wrapper:
```json
{
  "success": true,
  "data": { ... },
  "message": "Human readable message"
}
```

### 1. Main & Admin Routes
These routes handle system health, initialization, and root navigation.

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/` | Root endpoint displaying API name and version. | No |
| `GET` | `/health` | In-depth health check (DB connection, loaded AI models, general counts). | No |
| `POST`| `/admin/seed` | Seeds the MongoDB with 25 realistic worker profiles (for demo). | No |

---

### 2. Authentication API (`/auth`)
Routes for managing users, both customers and workers.

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `POST` | `/auth/register` | Register a new user (`customer` or `worker`). Gives back a JWT. | No |
| `POST` | `/auth/login` | Login using email and password. Gives back a JWT. | No |
| `GET` | `/auth/me` | Fetch the active user's details based on their provided JWT. | **Yes** |

---

### 3. Core Jobs & AI Pipeline (`/jobs`)
The heart of SkillBridge. The `analyze` endpoint triggers 6 ML/AI operations asynchronously.

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `POST` | `/jobs/analyze` | **The Magic Endpoint.** Parses problem with Llama, semantically matches workers, prices dynamically, and generates material lists. | Optional |
| `POST` | `/jobs/{job_id}/select-worker`| Choose a worker from the matched output to create a confirmed booking. | **Yes** |
| `PATCH`| `/jobs/{job_id}/status` | Update job state (`accepted`, `in_progress`, `completed`, `cancelled`). | **Yes** |
| `GET` | `/jobs/my/history` | Retrieves all past jobs relevant to the logged-in user (works differently for customers vs. workers). | **Yes** |
| `GET` | `/jobs/{job_id}` | Fetch detailed data about a specific job, including its booking object. | No |

---

### 4. Worker Profiles & Earnings (`/workers`)
Worker-specific actions to handle profile management, visibility, and finances.

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `POST` | `/workers/profile` | Create/update details like skills, specialty descriptions, hourly rates. | **Yes (Worker)**|
| `GET` | `/workers/profile/me` | Fetch the logged-in worker's current profile. | **Yes (Worker)**|
| `PATCH`| `/workers/availability`| Toggle status between `available` and `busy`. | **Yes (Worker)**|
| `GET` | `/workers/me/jobs` | See all jobs where this exact worker has been selected. | **Yes (Worker)**|
| `GET` | `/workers/me/earnings` | View earning breakdowns (total, this month, pending). | **Yes (Worker)**|
| `GET` | `/workers/{worker_id}` | Public endpoint to view a specific worker's aggregated details and ratings. | No |

---

### 5. Ratings API (`/ratings`)
Collecting and distributing feedback.

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `POST` | `/ratings` | Submit a rating (1-5) and review text after a job marks `completed`. | **Yes (Customer)**|
| `GET` | `/ratings/worker/{worker_id}`| View all historical ratings and written reviews for a worker. | No |

---

### 6. Standalone AI Tools & Dashboard (`/ai`)
Modular access to the AI services that are otherwise used internally by the `/jobs/analyze` orchestration.

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `POST` | `/ai/analyze` | Test the Llama-based problem parser directly with varying text descriptions. | No |
| `GET` | `/ai/demand-forecast`| Provide a `city` and `category` to see a 7-day predicted demand projection. | No |
| `POST` | `/ai/train` | Manually kick off retraining for the Random Forest ranker and Linear Regression pricer. | No |
| `GET` | `/ai/platform-insights`| Collect heavy aggregations (busy days, averages) suitable for a platform admin dashboard. | No |

---

## 🧠 What's Happening Under The Hood? (Prompt Summary)
Through previous prompts, the following full suite of features was built without cutting corners:

1. **AI Parsing Migration:** Switched from xAI Grok to **Groq Cloud (Llama 3.3 70b)** for drastically smarter structured parsing of Indian domestic situations (e.g. knowing what "geysers" and "MCBs" are).
2. **Semantic Matching:** Built an embedded `sentence-transformers` vector system that matches job requirements to the actual text of worker specialty descriptions.
3. **Machine Learning Integrations:** 
   * **Pricer:** `scikit-learn` LinearRegression trained on synthetic historical jobs.
   * **Ranker:** Weighted scoring layered cleanly with a RandomForest algorithm.
   * **Demand Forecasting:** Background time-series processing using `prophet`.
   * **Material Recommendations:** `mlxtend` apriori algorithm determining co-occurrences of parts.
4. **Resilient System:** Handled bugs effectively, such as preventing HTTP failures missing API keys, mapping MongoDB ID objects carefully with String arrays, adding intelligent fallbacks for city searches, and configuring reliable Uvicorn terminal logging.
