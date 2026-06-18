# SkillBridge — AI-Powered Local Services Platform

SkillBridge connects customers with skilled local workers (plumbers, electricians, carpenters, painters, and more) in Indian cities. It uses a suite of machine-learning and generative-AI models to intelligently parse job requests, semantically match the right workers, recommend required materials, predict fair prices, and forecast demand — all exposed through a clean React frontend.

---

## Table of Contents

- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Repository Structure](#repository-structure)
- [Setup & Installation](#setup--installation)
  - [Prerequisites](#prerequisites)
  - [Backend](#backend)
  - [Frontend](#frontend)
- [Environment Variables](#environment-variables)
- [Running Locally](#running-locally)
- [Seeding the Database](#seeding-the-database)
- [API Overview](#api-overview)
- [Usage Examples](#usage-examples)
- [Linting](#linting)
- [Deployment Notes](#deployment-notes)
- [Contributing](#contributing)
- [License](#license)

---

## Key Features

| Feature | Description |
|---|---|
| **AI Job Parsing** | Groq Cloud (Llama 3.3 70b) converts free-text problem descriptions into structured job data, understanding Indian-specific terminology (geysers, MCBs, etc.) |
| **Semantic Worker Matching** | `sentence-transformers` (all-MiniLM-L6-v2) encodes worker specialty descriptions and ranks them by cosine similarity to the job request |
| **Dynamic Pricing** | scikit-learn Linear Regression model trained on historical job data provides instant price estimates |
| **Intelligent Worker Ranking** | Random Forest model weighs semantic similarity, ratings, experience, and availability for an ordered worker shortlist |
| **Material Recommendations** | `mlxtend` Apriori algorithm mines co-occurrence patterns in past jobs to suggest required parts and materials |
| **Demand Forecasting** | Facebook Prophet generates 7-day city × category demand projections |
| **JWT Authentication** | Secure token-based auth for both customer and worker roles |
| **Role-Based UI** | Separate dashboards, job management, earnings, and rating workflows for customers and workers |
| **Platform Insights** | Aggregated analytics (busy days, averages) suitable for an admin dashboard |

---

## Tech Stack

### Backend
| Layer | Technology |
|---|---|
| Web Framework | [FastAPI](https://fastapi.tiangolo.com/) 0.115 |
| ASGI Server | [Uvicorn](https://www.uvicorn.org/) 0.30 |
| Database | [MongoDB](https://www.mongodb.com/) via [Motor](https://motor.readthedocs.io/) 3.6 (async) + PyMongo 4.9 |
| Auth | `python-jose` (JWT) + `passlib[bcrypt]` |
| LLM / AI Parsing | [Groq Cloud API](https://console.groq.com) — Llama 3.3 70b (OpenAI-compatible) |
| Semantic Search | [sentence-transformers](https://www.sbert.net/) 3.3 — all-MiniLM-L6-v2 |
| ML Models | [scikit-learn](https://scikit-learn.org/) 1.5 (Linear Regression, Random Forest) |
| Association Rules | [mlxtend](http://rasbt.github.io/mlxtend/) 0.23 (Apriori) |
| Time-Series Forecasting | [Prophet](https://facebook.github.io/prophet/) 1.1 |
| Deep Learning Runtime | [PyTorch](https://pytorch.org/) 2.5 (CPU-only wheel) |
| Data Processing | pandas 2.2, NumPy 1.26 |
| Config | python-dotenv 1.0 |

### Frontend
| Layer | Technology |
|---|---|
| UI Framework | [React](https://react.dev/) 19 |
| Build Tool | [Vite](https://vitejs.dev/) 8 |
| Routing | [React Router DOM](https://reactrouter.com/) 7 |
| Styling | [Tailwind CSS](https://tailwindcss.com/) 4 (Vite plugin) |
| Charts | [Recharts](https://recharts.org/) 3 |
| Icons | [Lucide React](https://lucide.dev/) 1.8 |
| Notifications | [React Hot Toast](https://react-hot-toast.com/) 2.6 |
| Linter | ESLint 9 with `eslint-plugin-react-hooks` and `eslint-plugin-react-refresh` |

---

## Repository Structure

```
ai4impact/
├── backend/
│   ├── .env.example            # Environment variable template
│   ├── requirements.txt        # Python dependencies
│   ├── README.md               # Backend API reference
│   ├── data/
│   │   └── seed_workers.json   # 25 realistic demo worker profiles
│   └── app/
│       ├── main.py             # FastAPI app, lifespan, CORS, routers
│       ├── config.py           # Settings (reads from .env)
│       ├── database.py         # MongoDB connect/disconnect/indexes
│       ├── ai/
│       │   ├── forecaster.py       # Prophet demand forecasting
│       │   ├── llm_parser.py       # Groq/Llama job description parser
│       │   ├── pricer.py           # Linear Regression dynamic pricer
│       │   ├── ranker.py           # Random Forest worker ranker
│       │   ├── recommender.py      # Apriori material recommender
│       │   └── semantic_matcher.py # Sentence-transformer semantic search
│       ├── api/
│       │   ├── auth.py         # /auth routes
│       │   ├── jobs.py         # /jobs routes
│       │   ├── workers.py      # /workers routes
│       │   ├── ratings.py      # /ratings routes
│       │   └── ai.py           # /ai routes (standalone AI tools)
│       ├── models/             # Pydantic request/response schemas
│       ├── services/           # Business logic (auth, booking, job, worker)
│       └── ml_models/          # Persisted .pkl model files (git-ignored)
└── frontend/
    ├── index.html
    ├── vite.config.js
    ├── package.json
    ├── eslint.config.js
    └── src/
        ├── App.jsx             # Root component, routing
        ├── api.js              # Axios/fetch wrappers for backend calls
        ├── utils.js            # Shared helpers
        ├── index.css           # Global styles (Tailwind entry)
        ├── components/
        │   ├── Navbar.jsx
        │   ├── Badge.jsx
        │   ├── EmptyState.jsx
        │   ├── Spinner.jsx
        │   ├── StarRating.jsx
        │   └── StatCard.jsx
        └── pages/
            ├── Login.jsx
            ├── Register.jsx
            ├── customer/       # Dashboard, Jobs, Bookings, Rate
            ├── worker/         # Dashboard, Profile, Jobs, Earnings, Ratings
            └── ai/             # Insights, Demand Forecast
```

---

## Setup & Installation

### Prerequisites

- **Python** ≥ 3.10
- **Node.js** ≥ 18 (npm ≥ 9)
- A running **MongoDB** instance (local or cloud, e.g. [MongoDB Atlas](https://www.mongodb.com/cloud/atlas))
- A free **Groq Cloud API key** from [console.groq.com](https://console.groq.com)

### Backend

```bash
# 1. Navigate to the backend directory
cd backend

# 2. Create and activate a virtual environment
python -m venv venv
source venv/bin/activate       # macOS/Linux
# venv\Scripts\activate        # Windows

# 3. Install Python dependencies
pip install -r requirements.txt

# 4. Copy the environment template and fill in your values
cp .env.example .env
```

> **Note:** The first startup downloads the `all-MiniLM-L6-v2` model (~90 MB) and trains the pricer and ranker models from synthetic data — this may take a few minutes.

### Frontend

```bash
# Navigate to the frontend directory
cd frontend

# Install Node dependencies
npm install
```

---

## Environment Variables

Create `backend/.env` based on `backend/.env.example`:

| Variable | Required | Default | Description |
|---|---|---|---|
| `MONGO_URI` | ✅ | `mongodb://localhost:27017` | MongoDB connection string |
| `DATABASE_NAME` | | `skillbridge` | MongoDB database name |
| `GROQ_API_KEY` | ✅ | — | Groq Cloud API key (free tier available) |
| `JWT_SECRET` | ✅ | `change-me-in-production` | Secret key used to sign JWTs — **change this** |
| `JWT_ALGORITHM` | | `HS256` | JWT signing algorithm |
| `JWT_EXPIRY_HOURS` | | `24` | Token lifetime in hours |

```dotenv
# backend/.env
MONGO_URI="mongodb+srv://<user>:<password>@cluster.mongodb.net"
DATABASE_NAME=skillbridge

GROQ_API_KEY="gsk_..."

JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_ALGORITHM=HS256
JWT_EXPIRY_HOURS=24
```

---

## Running Locally

### Backend

```bash
cd backend
source venv/bin/activate      # activate virtual environment
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at `http://localhost:8000`.  
Interactive Swagger docs are at `http://localhost:8000/docs`.

### Frontend

```bash
cd frontend
npm run dev
```

The React app will be available at `http://localhost:5173` (Vite default).

> Make sure the backend is running first so the frontend can reach the API.

---

## Seeding the Database

The platform ships with 25 realistic demo worker profiles spread across Bangalore, Mumbai, and Delhi. Seed them by calling:

```bash
curl -X POST http://localhost:8000/admin/seed
```

Or via the Swagger UI at `http://localhost:8000/docs` → `POST /admin/seed`.

This also creates a **demo customer** account:

| Field | Value |
|---|---|
| Email | `customer@demo.com` |
| Password | `demo123` |

All 25 workers also use the password `demo123`.

---

## API Overview

All responses follow a standard envelope:

```json
{
  "success": true,
  "data": { "..." },
  "message": "Human readable message"
}
```

| Group | Base Path | Description |
|---|---|---|
| Root & Admin | `/`, `/health`, `/admin/seed` | Health check, seeding |
| Auth | `/auth` | Register, login, get current user |
| Jobs | `/jobs` | AI-powered job analysis, booking, status updates, history |
| Workers | `/workers` | Profile management, availability toggle, earnings |
| Ratings | `/ratings` | Submit and fetch worker ratings |
| AI Tools | `/ai` | Standalone access to demand forecast, insights, model retraining |

See [`backend/README.md`](backend/README.md) for the full endpoint reference with request/response schemas.

---

## Usage Examples

### 1. Analyze a job request (the core AI pipeline)

```bash
curl -X POST http://localhost:8000/jobs/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "description": "My bathroom geyser is not heating water and I also need a new tap installed",
    "location": { "city": "Bangalore", "pincode": "560001", "lat": 12.9716, "lng": 77.5946 }
  }'
```

The response includes:
- Parsed job category and urgency
- Ranked list of semantically matched workers with scores
- Dynamic price estimate
- Recommended materials list

### 2. Register a new customer

```bash
curl -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Priya Sharma",
    "email": "priya@example.com",
    "password": "securepassword",
    "phone": "9876543210",
    "role": "customer",
    "location": { "city": "Bangalore", "pincode": "560001", "lat": 12.9716, "lng": 77.5946 }
  }'
```

### 3. Get 7-day demand forecast

```bash
curl "http://localhost:8000/ai/demand-forecast?city=Bangalore&category=plumbing"
```

---

## Linting

### Backend

There is no dedicated linter script configured; you can run standard Python tools inside the virtual environment:

```bash
cd backend
pip install flake8        # if not already installed
flake8 app/
```

### Frontend

```bash
cd frontend
npm run lint
```

This runs ESLint with the React Hooks and React Refresh plugins configured in `eslint.config.js`.

---

## Deployment Notes

- **Backend**: The app can be containerized with Docker. Ensure `MONGO_URI` points to a production MongoDB instance and set a strong `JWT_SECRET`. Run with a production-grade ASGI server:
  ```bash
  uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 2
  ```
- **Frontend**: Build a production bundle and serve it with any static host (Vercel, Netlify, S3, etc.):
  ```bash
  cd frontend
  npm run build   # outputs to frontend/dist/
  ```
- **CORS**: The backend currently allows all origins (`"*"`) which is suitable for development and hackathons. Restrict `allow_origins` in `app/main.py` before going to production.
- **ML Model Persistence**: Trained `.pkl` model files are saved to `backend/app/ml_models/` and git-ignored. On a fresh deployment they will be regenerated automatically at startup.

---

## Contributing

Contributions are welcome! To get started:

1. Fork the repository and create a feature branch:
   ```bash
   git checkout -b feat/your-feature-name
   ```
2. Make your changes and ensure the code lints cleanly (`npm run lint` for the frontend).
3. Commit with a clear message following [Conventional Commits](https://www.conventionalcommits.org/):
   ```bash
   git commit -m "feat: add worker availability calendar"
   ```
4. Push your branch and open a Pull Request against `main`.
5. Describe what you changed and why in the PR description.

Please keep PRs focused — one feature or fix per PR makes review easier.

---

## License

This project does not currently include a license file. All rights are reserved by the repository owner unless otherwise stated. If you wish to use, modify, or distribute this code, please contact the repository maintainer.
