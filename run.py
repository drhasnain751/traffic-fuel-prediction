#!/usr/bin/env python3
"""
Single-Command Runner for the Smart Traffic Congestion & Fuel Prediction System
================================================================================
Designed for non-technical users and analysts:
One command starts the entire system:
  - Frontend Dashboard (React + Tailwind CSS)
  - Backend REST API (FastAPI)
  - AI/ML Prediction Engines (RandomForest + GradientBoosting)
  - Database & Feature Store (SQLite + Parquet)
  - Interactive Documentation (Swagger UI)

Usage:
  python run.py
  python run.py --port 3000
  python run.py --dev
"""

import sys
import os
import subprocess
import time
import argparse
import webbrowser
import socket

# Ensure root directory is in sys.path
ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

# ANSI Color codes for clean friendly terminal presentation
GREEN = "\033[92m"
BLUE = "\033[94m"
CYAN = "\033[96m"
YELLOW = "\033[93m"
RED = "\033[91m"
BOLD = "\033[1m"
DIM = "\033[2m"
RESET = "\033[0m"

def print_banner():
    banner = f"""
{CYAN}{BOLD}================================================================================{RESET}
{GREEN}{BOLD}   🚦 SMART TRAFFIC CONGESTION & FUEL PREDICTION SYSTEM{RESET}
{CYAN}================================================================================{RESET}
{DIM}   Integrated AI/ML Analytics, Route Optimization & Forecasting Platform{RESET}
"""
    print(banner)

def is_port_in_use(port: int, host: str = "127.0.0.1") -> bool:
    """Check if a TCP port is currently occupied."""
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.settimeout(0.5)
        return s.connect_ex((host, port)) == 0

def check_python_version():
    """Verify minimum required Python version."""
    if sys.version_info < (3, 9):
        print(f"{RED}[!] Error: Python 3.9 or higher is required. Current: {sys.version}{RESET}")
        sys.exit(1)
    print(f"{GREEN}✓{RESET} Python runtime verified: {sys.version.split()[0]}")

def ensure_python_dependencies():
    """Verify key python packages and install automatically if missing."""
    print(f"{BLUE}[1/4]{RESET} Checking Python dependencies...")
    required_packages = ["fastapi", "uvicorn", "sklearn", "pandas", "numpy", "sqlalchemy", "pyarrow"]
    missing = []
    
    for pkg in required_packages:
        try:
            __import__(pkg)
        except ImportError:
            missing.append(pkg)

    if missing:
        print(f"{YELLOW}    Installing required dependencies from requirements.txt...{RESET}")
        req_file = os.path.join(ROOT_DIR, "requirements.txt")
        try:
            subprocess.run([sys.executable, "-m", "pip", "install", "-r", req_file], check=True)
            print(f"{GREEN}✓{RESET} Python dependencies installed successfully.")
        except Exception as e:
            print(f"{RED}[!] Automatic dependency installation encountered an error: {e}{RESET}")
            print(f"    You can manually run: pip install -r requirements.txt")
    else:
        print(f"{GREEN}✓{RESET} All core Python packages are ready.")

def ensure_ml_models():
    """Ensure machine learning models and dataset are generated."""
    print(f"{BLUE}[2/4]{RESET} Checking AI/ML Prediction Models...")
    congestion_model = os.path.join(ROOT_DIR, "models", "congestion", "v1.0.0", "model.pkl")
    fuel_model = os.path.join(ROOT_DIR, "models", "fuel", "v1.0.0", "model.pkl")
    parquet_data = os.path.join(ROOT_DIR, "data", "processed", "merged_data.parquet")

    if not (os.path.exists(congestion_model) and os.path.exists(fuel_model) and os.path.exists(parquet_data)):
        print(f"{YELLOW}    Training models & initializing feature store (seed_data)...{RESET}")
        try:
            from src.seed_data import run_seed
            run_seed()
            print(f"{GREEN}✓{RESET} ML Models trained & saved to models/ registry.")
        except Exception as e:
            print(f"{RED}[!] Error training ML models: {e}{RESET}")
            sys.exit(1)
    else:
        print(f"{GREEN}✓{RESET} ML models ready: Congestion (RandomForest) & Fuel (GradientBoosting).")

def ensure_frontend_build():
    """Ensure dashboard production build exists."""
    print(f"{BLUE}[3/4]{RESET} Checking Frontend Dashboard build...")
    dist_index = os.path.join(ROOT_DIR, "dashboard", "dist", "index.html")
    
    if not os.path.exists(dist_index):
        print(f"{YELLOW}    Frontend build not found. Building dashboard...{RESET}")
        dashboard_dir = os.path.join(ROOT_DIR, "dashboard")
        node_modules = os.path.join(dashboard_dir, "node_modules")
        
        # Check npm install
        if not os.path.exists(node_modules):
            print(f"    Installing frontend npm packages...")
            subprocess.run(["npm", "install"], cwd=dashboard_dir, check=True, shell=(os.name == 'nt'))
        
        # Run build
        subprocess.run(["npm", "run", "build"], cwd=dashboard_dir, check=True, shell=(os.name == 'nt'))
        print(f"{GREEN}✓{RESET} Frontend dashboard built successfully.")
    else:
        print(f"{GREEN}✓{RESET} Frontend dashboard is compiled and ready.")

def choose_port(requested_port: int, host: str = "0.0.0.0") -> int:
    """Find an available port if requested port is in use."""
    check_host = "127.0.0.1" if host == "0.0.0.0" else host
    if not is_port_in_use(requested_port, check_host):
        return requested_port

    print(f"{YELLOW}[!] Port {requested_port} is currently in use.{RESET}")
    for candidate in [3000, 8080, 5000, 8001, 8002]:
        if not is_port_in_use(candidate, check_host):
            print(f"{GREEN}    -> Automatically selected available port: {candidate}{RESET}")
            return candidate

    return requested_port

def run_dev_mode(api_port: int, vite_port: int = 5173):
    """Run in development mode with hot-reloading Vite dev server + FastAPI."""
    print(f"{BLUE}[4/4]{RESET} Starting services in Development Mode...")
    dashboard_dir = os.path.join(ROOT_DIR, "dashboard")
    
    # 1. Start FastAPI backend
    backend_proc = subprocess.Popen([
        sys.executable, "-m", "uvicorn", "api.main:app",
        "--host", "0.0.0.0", "--port", str(api_port), "--reload"
    ], cwd=ROOT_DIR)

    # 2. Start Vite dev server
    frontend_proc = subprocess.Popen([
        "npm", "run", "dev"
    ], cwd=dashboard_dir, shell=(os.name == 'nt'))

    print("\n" + "="*80)
    print(f"{GREEN}{BOLD}🚀 DEVELOPMENT SERVERS ARE LIVE!{RESET}")
    print(f"   🌐 {BOLD}Frontend App:{RESET}     http://localhost:{vite_port}")
    print(f"   📡 {BOLD}Backend API:{RESET}      http://localhost:{api_port}")
    print(f"   📚 {BOLD}API Docs:{RESET}         http://localhost:{api_port}/docs")
    print("="*80 + "\n")

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print(f"\n{YELLOW}Shutting down development servers...{RESET}")
        backend_proc.terminate()
        frontend_proc.terminate()
        backend_proc.wait()
        frontend_proc.wait()
        print(f"{GREEN}✓ All services stopped cleanly.{RESET}")

def run_production(port: int, host: str = "0.0.0.0", open_browser: bool = True):
    """Run unified single-process application serving Frontend + API + AI/ML on one port."""
    print(f"{BLUE}[4/4]{RESET} Launching Unified Server...")
    
    # Set environment variable so internal services know the port
    os.environ["PORT"] = str(port)

    display_host = "localhost" if host == "0.0.0.0" else host
    app_url = f"http://{display_host}:{port}"
    docs_url = f"http://{display_host}:{port}/docs"

    banner_ready = f"""
{GREEN}{BOLD}================================================================================{RESET}
{GREEN}{BOLD}   🚀 SYSTEM IS LIVE AND OPERATIONAL!{RESET}
{GREEN}{BOLD}================================================================================{RESET}

   🌐 {BOLD}Frontend Dashboard:{RESET}   {CYAN}{app_url}{RESET}
   📡 {BOLD}Backend REST API:{RESET}     {CYAN}{app_url}{RESET}
   📚 {BOLD}Interactive API Docs:{RESET} {CYAN}{docs_url}{RESET}
   🧠 {BOLD}AI/ML Engine:{RESET}         RandomForest (Congestion) + GradientBoosting (Fuel)
   💾 {BOLD}Database:{RESET}             SQLite (traffic.db) & Parquet Data Store

{YELLOW}{BOLD}   -------------------------------------------------------------------------{RESET}
{YELLOW}{BOLD}   👥 DEFAULT DEMO CREDENTIALS (Auto-Configured in Database):{RESET}
{YELLOW}{BOLD}   -------------------------------------------------------------------------{RESET}
      • {BOLD}Analyst Account:{RESET}  {GREEN}analyst@traffic.gov{RESET}  /  Password: {GREEN}password123{RESET}  (Role: ANALYST)
      • {BOLD}Commuter Account:{RESET} {GREEN}commuter@test.com{RESET}    /  Password: {GREEN}commuter123{RESET}  (Role: USER)
      • {BOLD}Senior Analyst:{RESET}   {GREEN}analyst@test.com{RESET}     /  Password: {GREEN}analyst123{RESET}   (Role: ANALYST)

{DIM}   Tip: Press Ctrl+C at any time in this window to stop the system.{RESET}
{GREEN}{BOLD}================================================================================{RESET}
"""
    print(banner_ready)

    if open_browser:
        def try_open():
            time.sleep(1.2)
            try:
                webbrowser.open(app_url)
            except Exception:
                pass
        import threading
        threading.Thread(target=try_open, daemon=True).start()

    import uvicorn
    # Start uvicorn server directly with our FastAPI app
    uvicorn.run("api.main:app", host=host, port=port, log_level="info", access_log=False)

def main():
    parser = argparse.ArgumentParser(description="Smart Traffic Congestion & Fuel Prediction System Runner")
    # Default port: check env PORT or default to 3000
    env_port = int(os.getenv("PORT", 3000))
    parser.add_argument("--port", type=int, default=env_port, help="Port to serve the application on (default: 3000)")
    parser.add_argument("--host", type=str, default="0.0.0.0", help="Host interface to bind (default: 0.0.0.0)")
    parser.add_argument("--dev", action="store_true", help="Run with live Vite dev server for frontend development")
    parser.add_argument("--no-browser", action="store_true", help="Do not automatically launch web browser")
    args = parser.parse_args()

    print_banner()
    check_python_version()
    ensure_python_dependencies()
    ensure_ml_models()

    if args.dev:
        api_port = choose_port(8000)
        run_dev_mode(api_port=api_port)
    else:
        ensure_frontend_build()
        port = choose_port(args.port, args.host)
        run_production(port=port, host=args.host, open_browser=not args.no_browser)

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print(f"\n{GREEN}Thank you for using the Smart Traffic & Fuel Prediction System. Goodbye!{RESET}")
        sys.exit(0)
