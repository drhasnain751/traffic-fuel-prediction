# Smart Traffic Congestion & Fuel Consumption Prediction System
## How It Works & Manual Setup Guide

---

## Table of Contents
1. [What This System Does](#what-this-system-does)
2. [How It Works (Under the Hood)](#how-it-works-under-the-hood)
3. [System Architecture](#system-architecture)
4. [Installation & Setup](#installation--setup)
5. [Running the Application](#running-the-application)
6. [Using the Application](#using-the-application)
7. [Understanding the ML Models](#understanding-the-ml-models)
8. [Database & Data Flow](#database--data-flow)

---

## What This System Does

The **Smart Traffic Congestion & Fuel Consumption Prediction System** is a real-time analytics platform that predicts:

1. **Traffic Congestion Levels**: Forecasts urban traffic speed for a specific road segment at a specific time using machine learning.
2. **Fuel Consumption**: Estimates how much fuel (in liters) a vehicle will consume on a given route, accounting for vehicle type, driving efficiency, and route characteristics.
3. **Route Optimization**: Compares two alternative routes and recommends the most fuel-efficient option.

**Real-World Use Cases**:
- Delivery services optimize routes to reduce fuel costs
- Traffic management systems warn drivers about congested areas in advance
- City planners use historical trends to improve road infrastructure
- Environmental agencies track emissions based on traffic patterns

---

## How It Works (Under the Hood)

### The Flow: Request → Prediction → Storage

When you request a prediction, here's what happens behind the scenes:

#### **Congestion Prediction Flow**
```
User Input (Segment ID, Time)
        ↓
API Receives Request + JWT Token
        ↓
Backend Loads RandomForest ML Model
        ↓
Extract Historical Speed Features (last 15/30/60 minutes)
        ↓
Combine with Temporal Features (hour, day of week, is_weekend)
        ↓
ML Model Predicts Speed (km/h)
        ↓
Convert Speed to Congestion Level (LOW/MEDIUM/HIGH)
        ↓
Store Prediction in SQLite Database
        ↓
Return JSON Response with Prediction
```

#### **Fuel Consumption Flow**
```
User Input (Route Coordinates, Vehicle Type, Efficiency)
        ↓
API Receives Request + JWT Token
        ↓
Calculate Route Characteristics (distance, elevation change)
        ↓
Backend Loads GradientBoosting ML Model
        ↓
Extract Route Features (avg speed, segment conditions)
        ↓
Physics-Based Calculation: Base Fuel = Distance × (1 / Efficiency)
        ↓
ML Model Adds Adjustment Based on Road Conditions
        ↓
Store Prediction in SQLite Database
        ↓
Return JSON Response with Fuel Consumption
```

### Authentication (Security Layer)

Every prediction request requires a **JWT (JSON Web Token)** for security:

1. **Signup**: You create an account with email/password
2. **Backend**: Hashes password with bcrypt (never stored in plain text)
3. **Login**: Backend validates credentials and issues a JWT token
4. **Requests**: Client includes token in header: `Authorization: Bearer {token}`
5. **Validation**: Backend verifies token on every prediction request

---

## System Architecture

### Technology Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19 + TypeScript + Vite + Tailwind CSS |
| **Backend API** | FastAPI (Python 3.13) |
| **Database** | SQLite (traffic.db) |
| **ML Framework** | Scikit-Learn (RandomForest + GradientBoosting) |
| **Authentication** | JWT + OAuth2 Bearer Token |
| **Data Processing** | Pandas + NumPy + Parquet |

### Architecture Diagram

```
┌──────────────────────────────────────────────────────────┐
│              REACT FRONTEND (Tailwind CSS)               │
│         (Localhost 5173 - Interactive Dashboard)         │
└─────────────────────────────┬──────────────────────────┘
                              │ HTTP + JWT Auth
                              ↓
┌──────────────────────────────────────────────────────────┐
│          FASTAPI BACKEND REST API (Port 8000)            │
│  ├─ Authentication: Signup/Login (OAuth2)                │
│  ├─ Predictions: Congestion & Fuel                       │
│  ├─ Analytics: Historical Trends                         │
│  ├─ Monitoring: Model Metrics & Status                   │
│  └─ Admin: Model Retraining (ANALYST role only)          │
└──────────────┬──────────────────────────┬────────────────┘
               │                          │
               ↓                          ↓
    ┌──────────────────┐      ┌──────────────────────┐
    │  SQLite Database │      │  ML Models Loaded    │
    │   (traffic.db)   │      │  (In Memory)         │
    ├─ users          │      ├─ RandomForest        │
    ├─ predictions    │      │  (Congestion)        │
    ├─ trip_predictions│      └─ GradientBoosting   │
    └─ model_versions │         (Fuel)             │
                                                     │
                                          ↓──────────────────┐
                                          │  Data Pipeline    │
                                          │  ├─ Raw Traffic   │
                                          │  ├─ Weather Data  │
                                          │  └─ Road Network  │
                                          └──────────────────┘
```

---

## Installation & Setup

### System Requirements
- **Python**: 3.10+ (tested on 3.13)
- **Node.js**: 18+ with npm
- **OS**: Windows, macOS, or Linux
- **Disk Space**: ~500MB
- **RAM**: 2GB minimum

### Step 1: Clone/Extract Project
```bash
cd "d:/New folder (2)/traffic-fuel-prediction"
```

### Step 2: Backend Setup

#### Create Virtual Environment (Windows PowerShell)
```powershell
python -m venv .venv
& ".\.venv\Scripts\Activate.ps1"
```

#### Install Python Dependencies
```bash
pip install -r requirements.txt
```

**Key packages installed:**
- fastapi (REST API)
- sqlalchemy (Database ORM)
- scikit-learn (ML Models)
- pandas (Data processing)
- pydantic (Data validation)
- python-jose + bcrypt (JWT + Password hashing)
- email-validator (Email verification)

### Step 3: Frontend Setup
```bash
cd dashboard
npm install
cd ..
```

**Key packages installed:**
- react & react-dom (UI framework)
- vite (Build tool)
- tailwind css (Styling)
- typescript (Type safety)

---

---

## Running the Application

### 🌟 Method 1: Single-Command Startup (RECOMMENDED FOR ALL USERS)

You do **not** need multiple terminals, complicated scripts, or technical knowledge. A single command starts everything:
- Checks & auto-installs Python packages
- Checks & auto-trains AI/ML prediction models
- Verifies & builds the frontend dashboard
- Starts the unified server (Frontend + Backend REST API + Database + Models)
- Automatically opens your default web browser

#### Running in VS Code (Visual Studio Code):
1. Open VS Code.
2. Click **File** ➔ **Open Folder...** and select this project folder.
3. Choose either:
   - **Option A (Zero-Typing 1-Click)**: Press **`F5`** on your keyboard (or click **Run ➔ Start Debugging** / the green Play icon on the left sidebar).
   - **Option B (VS Code Terminal)**: Press **`` Ctrl + ` ``** (or **Terminal ➔ New Terminal**) and type:
     ```bash
     python run.py
     ```
     *(or `python3 run.py` on Mac)*

#### Windows (Outside VS Code):
Open PowerShell or Command Prompt in the project folder and run:
```cmd
python run.py
```
*(Or simply double-click `run.bat`!)*

#### macOS / Linux (Outside VS Code):
Open Terminal in the project folder and run:
```bash
python3 run.py
```
*(Or run `./run.sh`)*

#### What you will see:
```text
================================================================================
   🚦 SMART TRAFFIC CONGESTION & FUEL PREDICTION SYSTEM
================================================================================
✓ Python runtime verified: 3.11.2
[1/4] Checking Python dependencies...
✓ All core Python packages are ready.
[2/4] Checking AI/ML Prediction Models...
✓ ML models ready: Congestion (RandomForest) & Fuel (GradientBoosting).
[3/4] Checking Frontend Dashboard build...
✓ Frontend dashboard is compiled and ready.
[4/4] Launching Unified Server...

================================================================================
   🚀 SYSTEM IS LIVE AND OPERATIONAL!
================================================================================

   🌐 Frontend Dashboard:   http://localhost:3000
   📡 Backend REST API:     http://localhost:3000
   📚 Interactive API Docs: http://localhost:3000/docs
   🧠 AI/ML Engine:         RandomForest (Congestion) + GradientBoosting (Fuel)
   💾 Database:             SQLite (traffic.db) & Parquet Data Store

   -------------------------------------------------------------------------
   👥 DEFAULT DEMO CREDENTIALS (Pre-Configured in Database):
   -------------------------------------------------------------------------
      • Analyst Account:  analyst@traffic.gov  /  Password: password123  (Role: ANALYST)
      • Commuter Account: commuter@test.com    /  Password: commuter123  (Role: USER)
      • Senior Analyst:   analyst@test.com     /  Password: analyst123   (Role: ANALYST)
```

---

### Method 2: Development Mode (With Live Code Reloading)

If you are developing frontend code and want hot module reloading:
```bash
python run.py --dev
```
This runs Vite (`http://localhost:5173`) and FastAPI (`http://localhost:8000`) simultaneously with automated proxying.

### Method 3: Using Docker (Optional)

```bash
docker-compose up -d
```

---

## Using the Application

### Access the Dashboard
Open browser: **http://localhost:5173**

### Step 1: Create Account
1. Click "Signup" in the top menu
2. Enter:
   - Name: `Test User`
   - Email: `test@example.com`
   - Password: `secure123`
3. Click "Create Account"
4. You'll receive a JWT token (stored automatically in browser)

### Step 2: Make a Congestion Prediction
1. Navigate to "Congestion Prediction" tab
2. Enter:
   - Segment ID: `SEG-101` (example road segment)
   - Target Time: Leave default (uses current hour)
3. Click "Predict Congestion"
4. Backend ML model runs → Speed prediction (km/h) → Congestion level assigned

**Congestion Classification:**
- **LOW**: Speed > 40 km/h (free-flowing traffic)
- **MEDIUM**: Speed 20-40 km/h (moderate slowdown)
- **HIGH**: Speed < 20 km/h (severe congestion)

### Step 3: Make a Fuel Prediction
1. Navigate to "Fuel Prediction" tab
2. Enter:
   - Route Points: (Click to add multiple coordinates)
   - Vehicle Type: `SUV` or `Sedan`
   - Fuel Efficiency: `8 L/100km` (or your vehicle's efficiency)
3. Click "Calculate Fuel"
4. Backend ML model calculates → Estimated fuel consumption (liters)

### Step 4: Compare Routes
1. Navigate to "Route Comparison" tab
2. Define Route A and Route B with different coordinates
3. System calculates fuel for both routes
4. Recommendation: Which route saves the most fuel?

### Step 5: View Historical Analytics
1. Click "Historical Trends" tab
2. See traffic patterns over time (extracted from training dataset)
3. Charts show average speed per hour and per day of week

### Step 6: Check Model Performance (Admin Only)
1. Navigate to "Model Evaluation" tab
2. View model metrics:
   - **R² Score**: How well model fits data (0-1, higher is better)
   - **RMSE**: Root mean squared error (lower is better)
   - **MAE**: Mean absolute error (lower is better)

### Step 7: Retrain Models (ANALYST Role)
1. Navigate to "Model Retraining" tab
2. Select model type: `congestion` or `fuel`
3. Select retraining window: `7 days` or `30 days`
4. Click "Start Retraining"
5. System will:
   - Load new data
   - Engineer features
   - Train new model
   - Evaluate performance
   - Save improved model

---

## Understanding the ML Models

### Congestion Model (RandomForestRegressor)

**What it does**: Predicts traffic speed (km/h) for any road segment at any time.

**How it's trained:**
1. **Data**: 8,000+ historical traffic records
2. **Features extracted**: 
   - Speed from 15/30/60 minutes ago (lag features)
   - Traffic volume (vehicles per hour)
   - Lane count
   - Hour of day
   - Day of week
   - Weekend flag
3. **Algorithm**: RandomForest with 100 decision trees
4. **Output**: Predicted speed in km/h

**Performance Metrics:**
- R² = 0.836 (explains 83.6% of speed variance)
- RMSE = 4.848 km/h (average error)
- MAE = 3.781 km/h (typical prediction error)

### Fuel Model (GradientBoostingRegressor)

**What it does**: Predicts fuel consumption (liters) for a route given vehicle and conditions.

**How it's trained:**
1. **Base Formula**: `Base Fuel = Route Distance (km) / Efficiency (km/L)`
2. **ML Adjustment**: GradientBoosting learns how traffic/weather changes this
3. **Features**:
   - Average predicted speed on route
   - Segment characteristics
   - Elevation changes
   - Vehicle type
4. **Algorithm**: GradientBoosting (sequential decision tree ensemble)
5. **Output**: Estimated fuel in liters

**Performance Metrics:**
- RMSE = 0.149 L (typical error)
- MAE = 0.099 L (acceptable range)
- Accounts for congestion, vehicle type, and route difficulty

---

## Database & Data Flow

### SQLite Database Structure

#### Table: `users`
Stores authenticated users
```
id          | email          | name       | password_hash  | role
1           | test@example.com | Test User | bcrypt_hash... | USER
2           | analyst@...    | Analyst    | bcrypt_hash... | ANALYST
```

#### Table: `predictions`
Stores congestion prediction history
```
id  | segment_id | target_time | predicted_speed | congestion_level | created_by | timestamp
1   | SEG-101    | 14:00       | 45.2            | LOW              | 1          | 2026-01-15
```

#### Table: `trip_predictions`
Stores fuel prediction history
```
id  | route_points | vehicle_type | efficiency | predicted_fuel | cost_estimate | created_by | timestamp
1   | [[lat,lng]...] | SUV        | 8.0        | 2.34           | €3.51         | 1          | 2026-01-15
```

#### Table: `model_versions`
Tracks model training history
```
id  | model_type | version | r2_score | rmse    | mae     | trained_at
1   | congestion | 1.0.0  | 0.836   | 4.848   | 3.781   | 2026-01-10
2   | fuel       | 1.0.0  | 0.149   | 0.149   | 0.099   | 2026-01-10
```

### Data Flow Diagram

```
Raw Traffic Data (CSV)
        ↓
data_pipeline.py (Clean & Merge)
        ↓
feature_engineering.py (Create ML Features)
        ↓
train_*.py (Train Models)
        ↓
models/*.pkl (Save Trained Models)
        ↓
api/main.py (Load Models at Startup)
        ↓
User Request (Frontend)
        ↓
predict.py (Use Model to Predict)
        ↓
SQLite DB (Store Prediction)
        ↓
Response to Frontend
        ↓
User Sees Result on Dashboard
```

---

## Troubleshooting

### Issue: Backend won't start
**Solution**: Check if port 8000 is in use
```bash
# On Windows PowerShell
Get-NetTCPConnection -LocalPort 8000
# Kill process if needed: Stop-Process -Id PID -Force
```

### Issue: Frontend won't compile
**Solution**: Clear node_modules and reinstall
```bash
cd dashboard
rm -r node_modules
npm install
npm run dev
```

### Issue: "Prediction returned 401 Unauthorized"
**Solution**: Your JWT token expired. Log in again.

### Issue: Models not loading
**Solution**: Ensure model files exist:
```
models/congestion/v1.0.0/model.pkl
models/fuel/v1.0.0/model.pkl
```

Run `python src/seed_data.py` to train and save models.

---

## Summary

This system combines **real machine learning** with a **production-grade REST API** and **modern frontend dashboard** to solve real-world traffic and fuel consumption problems. Every prediction is backed by trained ML models, stored in persistent database, and served through authenticated API endpoints.

**Key Takeaway**: When you make a prediction, you're using actual mathematical models trained on traffic data—not hardcoded values or random numbers.

#### **Step 2: Start Frontend Application**
In a separate terminal, navigate to `dashboard` and run:
```bash
npm run dev
```
Open `http://localhost:5173` in your browser.

---

### 4. Running Verification & Test Suites

#### **Execute Python Backend Tests**:
```bash
python -m unittest discover tests
```

#### **Execute Frontend Production Build Check**:
```bash
cd dashboard
npm run build
```

---

### 5. Standard User Workflows

#### **Commuter Workflow (User Role)**
1. Open application at `http://localhost:5173`.
2. Sign up or log in using standard credentials.
3. Access **Congestion Map** to forecast traffic speeds for segments across time horizons (Now, +15m, +30m, +60m).
4. Access **Fuel Estimation** to calculate fuel (L) and financial cost ($) for planned routes.
5. Access **Route Comparison** to evaluate two alternative routes using the 5% cost equivalence rule.

#### **Analyst Workflow (Analyst Role)**
1. Log in as an Analyst (`analyst@traffic.gov`).
2. Access **Model Evaluation** to review real-time $R^2$, MAE, and RMSE metrics.
3. Access **Model Retraining** to trigger retraining of `CongestionModel` and `FuelModel` on updated telemetry datasets.
4. Verify updated model version logs recorded in the database.
