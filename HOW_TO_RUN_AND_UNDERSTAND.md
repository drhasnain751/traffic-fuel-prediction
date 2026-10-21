# Smart Traffic Congestion & Fuel Consumption Prediction System
## How It Works & Manual Setup Guide

---

## Table of Contents
1. [What This System Does](#what-this-system-does)
2. [How It Works (Under the Hood)](#how-it-works-under-the-hood)
3. [System Architecture](#system-architecture)
4. [Installation & Prerequisites](#installation--prerequisites)
5. [Running on VS Code (All Manual Methods)](#running-on-vs-code-all-manual-methods)
   - [5.1 VS Code Method 1: Press F5 (Zero-Typing 1-Click)](#51-vs-code-method-1-press-f5-zero-typing-1-click--easiest-for-everyone)
   - [5.2 VS Code Method 2: Single-Command Terminal](#52-vs-code-method-2-single-command-via-integrated-terminal)
   - [5.3 VS Code Method 3: VS Code Command Palette Tasks](#53-vs-code-method-3-command-palette-task-runner)
   - [5.4 VS Code Method 4: Split-Terminal Developer Mode](#54-vs-code-method-4-split-terminal-manual-mode-separate-backend--frontend)
   - [5.5 VS Code Method 5: Using Python Virtual Environment (.venv)](#55-vs-code-method-5-using-a-virtual-environment-venv-in-vs-code)
   - [5.6 VS Code Method 6: Running Automated QA Tests](#56-vs-code-method-6-running-automated-qa-tests-in-vs-code)
   - [5.7 VS Code Troubleshooting & Tips](#57-vs-code-troubleshooting--tips-for-non-tech-users)
6. [Running Outside VS Code (Windows / Mac / Linux / Docker)](#running-outside-vs-code-windows--mac--linux--docker)
7. [Using the Application & Demo Logins](#using-the-application--demo-logins)
8. [Understanding the ML Models](#understanding-the-ml-models)
9. [Database & Data Flow](#database--data-flow)

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

## 5. Running on VS Code (All Manual Methods)

This project has been pre-configured with **VS Code launch profiles (`.vscode/launch.json`)**, **automated task definitions (`.vscode/tasks.json`)**, and **workspace settings (`.vscode/settings.json`)**.

Below are all the different ways you can run it inside Visual Studio Code, ranging from **1-click zero-terminal methods** to **advanced developer split-terminal setups**.

---

### 5.1 VS Code Method 1: Press `F5` (Zero-Typing 1-Click — Easiest for Everyone)

This is the recommended method for non-technical users, instructors, or evaluators who do not want to use command-line prompts.

1. **Open VS Code**.
2. Click **File** ➔ **Open Folder...** (or `Ctrl+K Ctrl+O` on Windows / `Cmd+O` on Mac) and select the `traffic-fuel-prediction` root folder.
3. On your keyboard, press **`F5`**!
   *(Alternatively: Click the **Run & Debug** play icon on the left sidebar, ensure **"▶ Run Entire Application (One-Click)"** is selected at the top dropdown, and click the green Play arrow).*
4. **What happens:**
   - VS Code automatically opens its integrated terminal at the bottom.
   - It checks Python, verifies dependencies, trains the AI/ML models if needed, and builds the frontend.
   - The unified server launches on port `3000`.
   - **Your default web browser automatically pops open** to `http://localhost:3000`!
5. **How to stop:** Click the orange square **Stop** button in the top floating debug toolbar (or press `Shift + F5`).

```text
VS Code Window:
┌─────────────────────────────────────────────────────────────┐
│  ▶ Run Entire Application (One-Click) [F5]  [||] [■]       │
├───────────────┬─────────────────────────────────────────────┤
│ EXPLORER      │                                             │
│ > api         │                                             │
│ > dashboard   │                                             │
│ > models      │                                             │
│ > run.py      │                                             │
├───────────────┴─────────────────────────────────────────────┤
│ TERMINAL                                                    │
│ 🚦 SMART TRAFFIC CONGESTION & FUEL PREDICTION SYSTEM       │
│ ✓ Python runtime verified                                  │
│ ✓ ML models ready: Congestion & Fuel                       │
│ 🚀 SYSTEM IS LIVE: http://localhost:3000                   │
└─────────────────────────────────────────────────────────────┘
```

---

### 5.2 VS Code Method 2: Single-Command via Integrated Terminal

If you prefer using the built-in terminal inside VS Code:

1. Open the project folder in VS Code.
2. Open the integrated terminal:
   - Shortcut: Press **`` Ctrl + ` ``** (Windows/Linux) or **`` Cmd + ` ``** (macOS).
   - Menu: Click **Terminal** ➔ **New Terminal**.
3. Type the following command and press **Enter**:
   ```bash
   python run.py
   ```
   *(On macOS or if your default python is Python 2, use `python3 run.py`)*

4. The system will start everything and auto-open your browser.
5. **How to stop:** Click inside the terminal and press **`Ctrl + C`**.

---

### 5.3 VS Code Method 3: Command Palette Task Runner

VS Code includes built-in task automation:

1. Press **`Ctrl + Shift + P`** (Windows/Linux) or **`Cmd + Shift + P`** (macOS) to open the VS Code Command Palette.
2. Type **`Tasks: Run Task`** and press **Enter**.
3. Select **`Run Application (One-Click)`**.
4. VS Code will spin up the terminal task and launch the platform.
5. To run the automated tests instead, select **`Run Tests`**.

---

### 5.4 VS Code Method 4: Split-Terminal Manual Mode (Separate Backend & Frontend)

If you are a developer and want live code hot-reloading for both Python and React/Vite independently:

#### Quick Option: One-Command Dev Mode
In the VS Code terminal, simply run:
```bash
python run.py --dev
```
*(This automatically runs both FastAPI on port 8000 and Vite on port 5173 with automatic API reverse-proxying).*

#### Manual Split-Terminal Option:
1. Open VS Code Terminal (`Ctrl + ` `).
2. Click the **Split Terminal** icon (`| \ |`) in the top-right corner of the terminal panel (or press `Ctrl + Shift + 5`).
3. You now have two side-by-side terminal panes:

**In Pane 1 (Left - Backend API):**
```bash
uvicorn api.main:app --reload --port 8000
```
*Expected: `Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)`*

**In Pane 2 (Right - Frontend Dashboard):**
```bash
cd dashboard
npm run dev
```
*Expected: `VITE ready at http://localhost:5173/`*

4. Open your browser to **`http://localhost:5173`**. Any changes to `.tsx` or `.py` files will reload instantly.

---

### 5.5 VS Code Method 5: Using a Virtual Environment (`.venv`) in VS Code

If you prefer isolating dependencies inside a local Python virtual environment:

1. **Create Virtual Environment in VS Code Terminal:**
   ```bash
   # Windows:
   python -m venv .venv
   
   # macOS / Linux:
   python3 -m venv .venv
   ```

2. **Select Interpreter in VS Code:**
   - Press **`Ctrl + Shift + P`** (or `Cmd + Shift + P`).
   - Type **`Python: Select Interpreter`**.
   - Choose the one marked `('.venv': venv) ./ .venv/Scripts/python.exe` (or `bin/python`).

3. **Activate & Run:**
   - Open a new terminal (`Terminal ➔ New Terminal`). VS Code will automatically activate `(.venv)`.
   - Run:
     ```bash
     python run.py
     ```
   *(Any missing dependencies will be automatically installed into `.venv` on first run!)*

---

### 5.6 VS Code Method 6: Running Automated QA Tests in VS Code

You can verify all endpoints, authentication, ML models, and RBAC security rules directly in VS Code:

- **Via F5 Debugger**:
  1. Click **Run & Debug** on the left bar.
  2. In the dropdown, pick **`🧪 Run All Tests (QA Suite)`**.
  3. Press **`F5`**.

- **Via Terminal**:
  ```bash
  python tests/qa_test.py
  ```

**Expected output:**
```text
======================================================================
TEST SUMMARY
======================================================================
✓ Signup - Create USER                               PASS
✓ Signup - Create ANALYST                            PASS
✓ Login - Valid credentials                          PASS
✓ Login - Invalid password                           PASS
✓ Predict Congestion                                 PASS
✓ Predict Fuel                                       PASS
✓ Compare Routes                                     PASS
✓ Historical Trends                                  PASS
✓ Data Sources Status                                PASS
✓ Model Metrics                                      PASS
✓ RBAC - USER denied retraining                      PASS
✓ Retrain Model - ANALYST allowed                    PASS
----------------------------------------------------------------------
Total: 12 | Passed: 12 | Failed: 0 | Errors: 0
Success Rate: 100.0%
======================================================================
```

---

### 5.7 VS Code Troubleshooting & Tips for Non-Tech Users

- **Issue: "python is not recognized" in VS Code Terminal**:
  - *Fix:* Ensure Python 3.9+ is installed from [python.org](https://www.python.org/downloads/). During Windows installation, check the box **"Add python.exe to PATH"**. In VS Code, press `Ctrl+Shift+P` ➔ `Python: Select Interpreter` and pick your installed Python.
- **Issue: "Port 3000 is already in use"**:
  - *Fix:* `run.py` automatically detects occupied ports and switches to `8080`, `5000`, or `8001`. You can also specify an exact port manually:
    ```bash
    python run.py --port 5000
    ```
- **Issue: "Browser did not open automatically"**:
  - *Fix:* Simply click or copy-paste the URL shown in the terminal: `http://localhost:3000`.
- **How to completely stop the application in VS Code**:
  - Click into the terminal window and press **`Ctrl + C`**. If running via F5, click the red/orange square **Stop** button on the debug bar.

---

## 6. Running Outside VS Code (Windows / Mac / Linux / Docker)

You can also run the system completely outside of VS Code using native OS tools:

### Windows (Outside VS Code)
- **Easiest:** Double-click **`run.bat`** in the project folder.
- **Or via Command Prompt / PowerShell:**
  ```cmd
  cd "path\to\traffic-fuel-prediction"
  python run.py
  ```

### macOS / Linux (Outside VS Code)
- **Easiest:** Run the shell launcher:
  ```bash
  ./run.sh
  ```
- **Or via Terminal:**
  ```bash
  python3 run.py
  ```

### Docker (Optional)
```bash
docker-compose up -d
```

---

## 7. Using the Application & Demo Logins

### Access the Dashboard
Open your browser to: **`http://localhost:3000`** *(or `http://localhost:5173` in dev mode)*.

### Ready-To-Use Demo Accounts (Pre-Seeded in Database)
You do not need to register a new account to test; these accounts are already configured:
- **Traffic Analyst Account** *(Full Admin Access + Model Retraining)*:
  - **Email:** `analyst@traffic.gov`
  - **Password:** `password123`
  - **Role:** `ANALYST`
- **Daily Commuter Account** *(Route Comparison & Congestion Prediction)*:
  - **Email:** `commuter@test.com`
  - **Password:** `commuter123`
  - **Role:** `USER`

### Or Create a New Account:
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

## 8. Understanding the ML Models

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

## 9. Database & Data Flow

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
