# Smart Traffic Congestion & Fuel Consumption Prediction System
## Comprehensive Technical Documentation

---

### 1. Project Overview
The **Smart Traffic Congestion & Fuel Consumption Prediction System** is a software engineering analytics and predictive intelligence platform designed to forecast urban traffic congestion levels and estimate vehicle energy consumption/emissions. It integrates a **React + TypeScript + Tailwind CSS** dashboard with a **FastAPI** backend, utilizing **SQLAlchemy ORM** backed by **SQLite** (`./traffic.db`), a **Redis** caching layer (with in-memory fallback), and machine learning pipelines (`RandomForestRegressor` and `GradientBoostingRegressor`).

---

### 2. Architecture & Technology Stack
- **Presentation Layer**: React, TypeScript, Vite, Tailwind CSS, Lucide React, Recharts.
- **REST API Layer**: FastAPI, Python 3.13, Pydantic, OAuth2 Bearer Tokens.
- **Database Layer**: SQLAlchemy ORM with SQLite (`sqlite:///./traffic.db`).
- **Caching Layer**: Redis client with graceful in-memory TTL dictionary fallback.
- **Data Engineering & ML Layer**: Pandas, NumPy, Scikit-Learn, PyArrow/Parquet (`merged_data.parquet`).

```
                    ┌─────────────────────────────────────────┐
                    │       REACT FRONTEND (Tailwind)         │
                    └────────────────────┬────────────────────┘
                                         │  (HTTP / JWT Auth Header)
                                         ▼
                    ┌─────────────────────────────────────────┐
                    │      FASTAPI REST SERVER (Main API)     │
                    └───────┬─────────────────────────┬───────┘
                            │                         │
            ┌───────────────┴───────┐         ┌───────┴───────────────┐
            │   SQLAlchemy Engine   │         │    ML Predict Engine   │
            │  (sqlite:///traffic.db)│        │   (src/predict.py)    │
            └───────────────┬───────┘         └───────┬───────────────┘
                            │                         │
    ┌───────────────────────┼──────────────────────┐  ├──► Redis Cache (6379 / In-Memory TTL)
    │                       │                      │  └──► Parquet Feature Store (merged_data.parquet)
    ▼                       ▼                      ▼
  Users               Predictions            ModelVersions
 (SQLite)               (SQLite)                (SQLite)
```

---

### 3. Machine Learning & Fuel Prediction Architecture

#### **A. Congestion Model (`CongestionModel`)**
- **Algorithm**: `RandomForestRegressor(n_estimators=100, random_state=42)`
- **Input Features**: `speed_lag_15`, `speed_lag_30`, `speed_lag_60`, `volume`, `lane_count`, `hour`, `dayofweek`, `is_weekend`.
- **Target Variable**: Traffic speed ($\text{km/h}$).
- **Classification Thresholds**:
  - `speed > 40 km/h` $\rightarrow$ **LOW** congestion
  - `20 km/h < speed <= 40 km/h` $\rightarrow$ **MEDIUM** congestion
  - `speed <= 20 km/h` $\rightarrow$ **HIGH** congestion

#### **B. Physics-Informed Fuel Model (`FuelModel`)**
The fuel prediction engine uses a **Physics Baseline + Machine Learning Residual Correction** methodology.

1. **Physics Baseline Formula**:
   $$\text{Speed Factor} = 1.0 + \left( \frac{|80 - \max(v, 5)|}{80} \right)^2$$
   $$\text{Base Fuel (L)} = \left( \frac{\text{Base Efficiency (L/100km)}}{100} \right) \times \text{Distance (km)} \times \text{Speed Factor}$$
   *Where $v$ is the predicted segment speed ($\text{km/h}$), and optimal vehicle speed is 80 km/h.*

2. **ML Residual Correction**:
   $$\text{Residual} = \text{Actual Fuel} - \text{Base Fuel}$$
   A `GradientBoostingRegressor(n_estimators=100, random_state=42)` predicts the residual deviation based on route features.

3. **Final Fuel Prediction**:
   $$\text{Final Fuel (L)} = \max(\text{Base Fuel} + \text{ML Residual}, 0.0)$$
   $$\text{Estimated Cost (\$)} = \text{Final Fuel (L)} \times \$1.50/\text{L}$$

---

### 4. API Endpoints

| Endpoint | Method | Auth | Role | Description |
|---|---|---|---|---|
| `/auth/signup` | POST | None | Any | Registers user & hashes password via PBKDF2-SHA256 |
| `/auth/login` | POST | None | Any | Verifies credentials & issues JWT bearer token |
| `/auth/me` | GET | Bearer | Any | Returns decoded token claims & active user info |
| `/predict-congestion` | GET | Bearer | Any | Predicts segment congestion speed using parquet features |
| `/predict-fuel` | POST | Bearer | Any | Calculates route fuel consumption & logs prediction |
| `/compare-routes` | POST | Bearer | Any | Evaluates 2 routes with 5% cost equivalence rule |
| `/analytics/history` | GET | Bearer | Any | Returns telemetry historical trends from parquet |
| `/sources/status` | GET | Bearer | Any | Performs health checks on raw/processed data files |
| `/models/metrics` | GET | Bearer | Any | Returns evaluation metrics embedded in model binaries |
| `/models/retrain` | POST | Bearer | **ANALYST** | Triggers end-to-end retraining pipeline & logs version to DB |

---

### 5. Database Schema (`./traffic.db`)

- `users`: `id`, `name`, `email`, `hashed_password`, `role`, `created_at`
- `road_segments`: `segment_id`, `lane_count`, `road_type`, `speed_limit`
- `predictions`: `id`, `user_id`, `segment_id`, `target_time`, `predicted_speed`, `congestion_level`, `model_version`, `created_at`
- `trip_predictions`: `id`, `user_id`, `route_segments`, `vehicle_type`, `predicted_fuel_l`, `estimated_cost`, `model_version`, `created_at`
- `model_versions`: `id`, `model_type`, `version`, `metrics`, `status`, `created_at`

---

### 6. Frequently Asked Viva Questions & Answers

**Q1: What dataset does the system use?**  
*Answer:* The system processes raw traffic volume/speed telemetry from `data/raw/traffic.csv`, which is cleaned and transformed by `ETLPipeline` into the feature store `data/processed/merged_data.parquet`.

**Q2: How does fuel consumption prediction work?**  
*Answer:* It uses a physics-informed residual learning model. A physics baseline calculates standard consumption adjusted by speed factors derived from vehicle speed curves, and a `GradientBoostingRegressor` predicts the residual variance caused by stop-and-go congestion.

**Q3: How is authorization handled?**  
*Answer:* Authentication uses OAuth2 Bearer Tokens signed with JWT (`HS256`). Authorization uses FastAPI server-side dependencies (`require_role(["ANALYST"])`) to enforce RBAC on administrative endpoints like `/models/retrain`.
