<p align="center">
  <h1 align="center">🌉 SkillBridge</h1>
  <p align="center"><strong>AI-Powered Local Services Platform</strong></p>
  <p align="center">
    Connecting customers with skilled workers through intelligent matching, dynamic pricing, and demand forecasting.
  </p>
</p>

<p align="center">
  <a href="https://skillbridge-4nrz.onrender.com/login"><strong>🔗 Live Demo</strong></a>
  &nbsp;&nbsp;·&nbsp;&nbsp;
  <a href="#-ai-pipeline"><strong>AI Pipeline</strong></a>
  &nbsp;&nbsp;·&nbsp;&nbsp;
  <a href="#-api-reference"><strong>API Docs</strong></a>
  &nbsp;&nbsp;·&nbsp;&nbsp;
  <a href="#-getting-started"><strong>Setup</strong></a>
</p>

<br/>

> **Demo Credentials** — After seeding the database (see [Quick Start](#-quick-start)):
>
> | Role     | Email               | Password |
> |----------|---------------------|----------|
> | Customer | `customer@demo.com` | `demo123`|
> | Worker   | Any seeded worker   | `demo123`|

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Live Deployment](#-live-deployment)
- [AI Pipeline](#-ai-pipeline)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Features](#-features)
- [Getting Started](#-getting-started)
- [API Reference](#-api-reference)
- [Project Structure](#-project-structure)
- [Environment Variables](#-environment-variables)
- [License](#-license)

---

## 🔭 Overview

**SkillBridge** is a full-stack AI-powered platform that connects customers with local service professionals (plumbers, electricians, carpenters, painters, etc.). Instead of manually browsing listings, customers simply describe their problem in natural language — the platform's 6-stage AI pipeline handles the rest:

1. **Understands** the problem using an LLM (Llama 3.3 70B via Groq)
2. **Matches** workers using sentence-transformer semantic search
3. **Prices** the job using a trained ML regression model
4. **Recommends** materials using Apriori association rules
5. **Ranks** workers using a blended weighted + RandomForest scoring system
6. **Forecasts** regional demand across cities and service categories

---

## 🔗 Live Deployment

The application is deployed and accessible at:

### **➡️ [https://skillbridge-4nrz.onrender.com/login](https://skillbridge-4nrz.onrender.com/login)**

> **Note:** The free-tier Render instance may take ~30–60 seconds to cold-start if it has been idle. ML models and the sentence-transformer are loaded at startup.

---

## 🤖 AI Pipeline

SkillBridge integrates **6 AI/ML components** that work together in a single request flow:

```
Customer describes problem
        │
        ▼
┌─────────────────────────────────────────────────────────────┐
│  1. LLM Parser (Llama 3.3 70B via Groq Cloud)              │
│     • Parses natural language (supports Hindi/Hinglish)     │
│     • Extracts: category, urgency, complexity, causes       │
│     • Keyword fallback if API is unavailable                │
└──────────────────────┬──────────────────────────────────────┘
                       │
        ┌──────────────┼──────────────┐
        ▼              ▼              ▼
┌──────────────┐ ┌───────────┐ ┌──────────────┐
│ 2. Semantic  │ │ 3. Pricer │ │ 4. Material  │
│   Matcher    │ │ (Linear   │ │ Recommender  │
│ (MiniLM-L6) │ │ Regression│ │ (Apriori     │
│ Cosine sim.  │ │ + rules)  │ │  Rules)      │
└──────┬───────┘ └─────┬─────┘ └──────┬───────┘
       │               │              │
       ▼               │              │
┌──────────────┐       │              │
│ 5. Ranker    │       │              │
│ (Weighted +  │       │              │
│ RandomForest)│       │              │
└──────┬───────┘       │              │
       │               │              │
       ▼               ▼              ▼
┌─────────────────────────────────────────────────────────────┐
│  Response: ranked workers, price estimate, materials list   │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  6. Demand Forecaster (independent background model)        │
│     • 7-day demand predictions per city × category          │
│     • City multipliers + day-of-week seasonality            │
└─────────────────────────────────────────────────────────────┘
```

### Component Details

| # | Component | Model / Algorithm | Purpose |
|---|-----------|-------------------|---------|
| 1 | **LLM Parser** | Llama 3.3 70B (Groq Cloud) | Parse free-text job descriptions into structured fields (category, urgency, complexity, causes, summary). Supports Hindi, Hinglish, and English. |
| 2 | **Semantic Matcher** | `all-MiniLM-L6-v2` (sentence-transformers) | Encode job descriptions and worker specialties into 384-d embeddings, rank by cosine similarity. |
| 3 | **Dynamic Pricer** | `LinearRegression` (scikit-learn) | Predict fair pricing based on job type, complexity, time of day, worker experience, and distance. Rule-based fallback. |
| 4 | **Material Recommender** | Apriori association rules (mlxtend) | Suggest materials and tools with estimated prices (INR) based on job category and transaction history. |
| 5 | **Worker Ranker** | Weighted scoring + `RandomForestRegressor` | Blend semantic similarity (35%), rating (25%), availability (20%), experience (10%), proximity (10%) with ML-predicted satisfaction. |
| 6 | **Demand Forecaster** | Statistical model with city/day-of-week factors | Generate 7-day demand forecasts for 15 city × category combinations (3 cities × 5 categories). |

---

## ⚙️ Tech Stack

### Backend
| Technology | Purpose |
|------------|---------|
| **FastAPI** | Async REST API framework |
| **MongoDB** (Motor) | NoSQL database with async driver |
| **Groq Cloud API** | LLM inference (Llama 3.3 70B) |
| **sentence-transformers** | Semantic text embeddings |
| **scikit-learn** | ML models (LinearRegression, RandomForest) |
| **mlxtend** | Apriori association rules for material recommendations |
| **PyTorch** (CPU) | Tensor backend for sentence-transformers |
| **python-jose** | JWT authentication |
| **passlib + bcrypt** | Password hashing |
| **Pydantic** | Request/response validation |

### Frontend
| Technology | Purpose |
|------------|---------|
| **React 19** | UI framework |
| **Vite 8** | Build tool and dev server |
| **Tailwind CSS 4** | Utility-first styling |
| **React Router v7** | Client-side routing |
| **Recharts** | Data visualization (charts & graphs) |
| **Lucide React** | Icon library |
| **react-hot-toast** | Toast notifications |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (React + Vite)               │
│                                                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────┐  │
│  │ Customer │  │  Worker  │  │    AI    │  │  Auth  │  │
│  │Dashboard │  │Dashboard │  │ Insights │  │ Pages  │  │
│  │  + Jobs  │  │+ Profile │  │ + Demand │  │Login/  │  │
│  │+ Bookings│  │+ Earnings│  │ Forecast │  │Register│  │
│  │ + Rate   │  │+ Ratings │  │          │  │        │  │
│  └──────────┘  └──────────┘  └──────────┘  └────────┘  │
│                        │                                │
│                   fetch API (JWT)                       │
└────────────────────────┼────────────────────────────────┘
                         │
                         ▼
┌────────────────────────────────────────────────────────────┐
│                  Backend (FastAPI)                          │
│                                                            │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌──────────────┐  │
│  │  Auth   │  │  Jobs   │  │ Workers │  │   Ratings    │  │
│  │ Router  │  │ Router  │  │ Router  │  │   Router     │  │
│  └────┬────┘  └────┬────┘  └────┬────┘  └──────┬───────┘  │
│       │            │            │               │          │
│       ▼            ▼            ▼               ▼          │
│  ┌──────────────────────────────────────────────────────┐  │
│  │               Service Layer                          │  │
│  │  auth_service · job_service · worker_service         │  │
│  │  booking_service                                     │  │
│  └──────────────────────┬───────────────────────────────┘  │
│                         │                                  │
│       ┌─────────────────┼────────────────────┐             │
│       ▼                 ▼                    ▼             │
│  ┌──────────┐  ┌──────────────────┐  ┌───────────────┐    │
│  │ AI Layer │  │    MongoDB       │  │  ML Models    │    │
│  │ LLM      │  │  (Motor async)   │  │  .pkl files   │    │
│  │ Semantic │  │                  │  │               │    │
│  │ Pricer   │  │  • users         │  │  • ranker     │    │
│  │ Ranker   │  │  • worker_profiles│ │  • pricer     │    │
│  │ Recommender│ │  • jobs          │  │               │    │
│  │ Forecaster│ │  • bookings      │  └───────────────┘    │
│  └──────────┘  │  • ratings       │                       │
│                │  • historical_jobs│                       │
│                │  • material_txns  │                       │
│                └──────────────────┘                        │
└────────────────────────────────────────────────────────────┘
```

---

## ✨ Features

### 🧑‍💼 Customer Portal
- **Natural Language Job Submission** — Describe your problem in any language (English, Hindi, Hinglish)
- **AI-Powered Analysis** — Get instant job classification, urgency assessment, and likely cause diagnosis
- **Smart Worker Matching** — AI ranks and recommends the top 5 workers based on semantic fit, rating, proximity, and availability
- **Dynamic Pricing** — ML-predicted price estimates with min/base/max range
- **Material Recommendations** — Auto-suggested tools and materials with INR pricing
- **Job Lifecycle Management** — Track jobs from pending → accepted → in-progress → completed
- **Booking Management** — View all bookings, track worker assignments
- **Worker Rating System** — Rate completed jobs with star ratings and reviews

### 👷 Worker Portal
- **Profile Management** — Set skills, specialty description, experience, hourly rate, and service radius
- **Job Feed** — View assigned jobs with full AI analysis details
- **Availability Toggle** — Go online/offline to control incoming job assignments
- **Earnings Dashboard** — Track total earnings, completed jobs, and per-job revenue
- **Ratings & Reviews** — View customer ratings and feedback

### 📊 AI Insights (Shared)
- **Platform Analytics** — Total workers, jobs, users, and busiest day
- **Workers by Category** — Interactive pie/donut chart
- **Average Rating by Category** — Skill-level quality metrics
- **Average Price by Job Type** — Market rate intelligence
- **7-Day Demand Forecast** — Predicted demand per city × category with trend indicators
- **Forecast Status** — Monitor cached forecast combinations

---

## 🚀 Getting Started

### Prerequisites

- **Python 3.10+**
- **Node.js 18+** and npm
- **MongoDB** (local or [MongoDB Atlas](https://www.mongodb.com/atlas) free tier)
- **Groq API Key** (free at [console.groq.com](https://console.groq.com))

### Quick Start

#### 1. Clone the repository

```bash
git clone https://github.com/your-username/ai4impact-hackathon.git
cd ai4impact-hackathon
```

#### 2. Set up the Backend

```bash
cd backend

# Create and activate virtual environment
python -m venv venv
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
cp .env.example .env
# Edit .env with your MONGO_URI and GROQ_API_KEY
```

#### 3. Set up the Frontend

```bash
cd frontend

# Install dependencies
npm install
```

#### 4. Run the Application

**Backend** (from `backend/` directory):
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

> ⏳ First startup takes 1–2 minutes as it loads the sentence-transformer model and trains ML models.

**Frontend** (from `frontend/` directory):
```bash
npm run dev
```

#### 5. Seed the Database

After both servers are running, seed 25 demo worker profiles + 1 demo customer:

```bash
curl -X POST http://localhost:8000/admin/seed
```

Or visit `http://localhost:8000/docs` and execute the `/admin/seed` endpoint from Swagger UI.

---

## 📡 API Reference

Base URL: `http://localhost:8000` (local) or `https://skillbridge-4nrz.onrender.com` (production)

Interactive API docs available at: [`/docs`](https://skillbridge-4nrz.onrender.com/docs) (Swagger UI)

### Auth

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `POST` | `/auth/register` | Register a new user (customer or worker) | ✗ |
| `POST` | `/auth/login` | Login with email + password, returns JWT | ✗ |
| `GET`  | `/auth/me` | Get current user profile | ✓ |

### Jobs

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `POST` | `/jobs/analyze` | **Core endpoint** — Submit a problem, run the full AI pipeline | ✓ |
| `POST` | `/jobs/{job_id}/select-worker` | Select a worker and create a booking | ✓ |
| `PATCH`| `/jobs/{job_id}/status` | Update job status (accepted → in_progress → completed) | ✓ |
| `GET`  | `/jobs/{job_id}` | Get full job details + booking info | ✗ |
| `GET`  | `/jobs/my/history` | Get all jobs for current user | ✓ |

### Workers

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `POST` | `/workers/profile` | Create worker profile (skills, specialty, rates) | ✓ |
| `GET`  | `/workers/profile/me` | Get own worker profile | ✓ |
| `PATCH`| `/workers/availability` | Toggle available / unavailable | ✓ |
| `GET`  | `/workers/me/jobs` | Get assigned jobs | ✓ |
| `GET`  | `/workers/me/earnings` | Get earnings summary | ✓ |
| `GET`  | `/workers/{id}` | Get worker by ID | ✗ |

### Ratings

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `POST` | `/ratings` | Submit a rating for a completed job | ✓ |
| `GET`  | `/ratings/worker/{worker_id}` | Get all ratings for a worker | ✗ |

### AI

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `POST` | `/ai/analyze` | Standalone LLM analysis of a description | ✗ |
| `GET`  | `/ai/demand-forecast?city=...&category=...` | 7-day demand forecast | ✗ |
| `GET`  | `/ai/forecast-status` | Check forecaster cache status | ✗ |
| `GET`  | `/ai/platform-insights` | Aggregate platform statistics | ✗ |
| `POST` | `/ai/train` | Retrain ranker + pricer models | ✗ |

### Admin

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `POST` | `/admin/seed` | Seed DB with 25 workers + 1 demo customer | ✗ |
| `GET`  | `/health` | Health check with model status and DB counts | ✗ |

---

## 📁 Project Structure

```
ai4impact-hackathon/
├── backend/
│   ├── app/
│   │   ├── main.py                 # FastAPI app entry + lifespan (startup/shutdown)
│   │   ├── config.py               # Settings (env vars, model paths, Groq config)
│   │   ├── database.py             # MongoDB connection (Motor async) + index creation
│   │   ├── ai/                     # 🤖 AI/ML Modules
│   │   │   ├── llm_parser.py       # Groq/Llama 3.3 70B — NL→structured JSON parser
│   │   │   ├── semantic_matcher.py # all-MiniLM-L6-v2 — cosine similarity matching
│   │   │   ├── pricer.py           # LinearRegression — dynamic pricing engine
│   │   │   ├── ranker.py           # Weighted + RandomForest — worker ranking
│   │   │   ├── recommender.py      # Apriori rules — material recommendations
│   │   │   └── forecaster.py       # Statistical — 7-day demand forecasting
│   │   ├── api/                    # 🌐 API Route Handlers
│   │   │   ├── auth.py             # Register, Login, /me
│   │   │   ├── jobs.py             # Job CRUD + AI pipeline trigger
│   │   │   ├── workers.py          # Worker profiles, availability, earnings
│   │   │   ├── ratings.py          # Rating submission + retrieval
│   │   │   └── ai.py               # Standalone AI endpoints
│   │   ├── models/                 # 📦 Pydantic Data Models
│   │   │   ├── user.py             # User, Location, Auth schemas
│   │   │   ├── job.py              # Job, ParsedJob, MatchedWorker schemas
│   │   │   ├── worker.py           # Worker profile schemas
│   │   │   ├── booking.py          # Booking schemas
│   │   │   └── rating.py           # Rating schemas
│   │   ├── services/               # 🔧 Business Logic Layer
│   │   │   ├── auth_service.py     # JWT, bcrypt, user auth dependency
│   │   │   ├── job_service.py      # Core AI pipeline orchestration
│   │   │   ├── worker_service.py   # Worker CRUD + earnings calculation
│   │   │   └── booking_service.py  # Booking creation + management
│   │   └── ml_models/              # 🧠 Trained Model Artifacts
│   │       ├── pricer_model.pkl    # Trained pricer (LinearRegression pipeline)
│   │       └── ranker_model.pkl    # Trained ranker (RandomForestRegressor)
│   ├── data/
│   │   └── seed_workers.json       # 25 realistic worker profiles for seeding
│   ├── requirements.txt            # Python dependencies
│   └── .env.example                # Environment variable template
│
├── frontend/
│   ├── index.html                  # HTML entry point
│   ├── package.json                # Node.js dependencies
│   ├── vite.config.js              # Vite build configuration
│   └── src/
│       ├── main.jsx                # React root mount
│       ├── App.jsx                 # Routing + protected routes
│       ├── api.js                  # API client (fetch wrapper with JWT)
│       ├── utils.js                # Formatting helpers (₹, status colors)
│       ├── index.css               # Global styles + Tailwind imports
│       ├── components/             # 🧩 Reusable UI Components
│       │   ├── Navbar.jsx          # Navigation bar (role-aware links)
│       │   ├── StatCard.jsx        # Stat display card
│       │   ├── Badge.jsx           # Tag/label badge
│       │   ├── StarRating.jsx      # Star rating display
│       │   ├── Spinner.jsx         # Loading spinner
│       │   └── EmptyState.jsx      # Empty data placeholder
│       └── pages/                  # 📄 Page Components
│           ├── Login.jsx           # Login page
│           ├── Register.jsx        # Registration page (customer/worker)
│           ├── customer/
│           │   ├── Dashboard.jsx   # AI job analysis + worker selection
│           │   ├── Jobs.jsx        # Job history + status management
│           │   ├── Bookings.jsx    # Active bookings view
│           │   └── Rate.jsx        # Rate completed jobs
│           ├── worker/
│           │   ├── Dashboard.jsx   # Worker overview + stats
│           │   ├── Profile.jsx     # Profile editor (skills, rates)
│           │   ├── Jobs.jsx        # Assigned jobs management
│           │   ├── Earnings.jsx    # Earnings dashboard
│           │   └── Ratings.jsx     # View received ratings
│           └── ai/
│               ├── Insights.jsx    # Platform analytics dashboard
│               └── Demand.jsx      # 7-day demand forecast charts
│
├── .gitignore
└── README.md                       # ← You are here
```

---

## 🔐 Environment Variables

Create a `.env` file in the `backend/` directory based on `.env.example`:

```env
# MongoDB connection string
MONGO_URI="mongodb+srv://user:pass@cluster.mongodb.net/skillbridge"
DATABASE_NAME=skillbridge

# Groq Cloud API key (free: https://console.groq.com)
GROQ_API_KEY="gsk_your_key_here"

# JWT configuration
JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_ALGORITHM=HS256
JWT_EXPIRY_HOURS=24
```

| Variable | Required | Description |
|----------|----------|-------------|
| `MONGO_URI` | ✅ | MongoDB connection string (Atlas or local) |
| `DATABASE_NAME` | ✅ | Database name (default: `skillbridge`) |
| `GROQ_API_KEY` | ✅ | Groq Cloud API key for LLM inference |
| `JWT_SECRET` | ✅ | Secret key for JWT token signing |
| `JWT_ALGORITHM` | ✗ | JWT algorithm (default: `HS256`) |
| `JWT_EXPIRY_HOURS` | ✗ | Token expiry duration (default: `24`) |

---

## 🧪 Health Check

Verify the deployment is healthy:

```bash
curl https://skillbridge-4nrz.onrender.com/health
```

Response:
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "database": "connected",
    "models": {
      "sentence_transformer": true,
      "pricer": true,
      "ranker": true,
      "forecaster": true
    },
    "counts": {
      "workers": 25,
      "jobs": 0,
      "users": 26
    }
  },
  "message": "SkillBridge API is running"
}
```

---

## 📄 License

This project was built for the **AI4Impact Hackathon**.

---

<p align="center">
  <sub>Built with ❤️ using FastAPI, React, and a whole lot of AI</sub>
</p>
