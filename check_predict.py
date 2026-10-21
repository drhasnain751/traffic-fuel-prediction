import requests

API = "http://127.0.0.1:8000"
try:
    r = requests.get(f"{API}/predict-congestion?segment_id=SEG-101&target_time=Now", timeout=15)
    print('STATUS', r.status_code)
    try:
        print('JSON:', r.json())
    except Exception:
        print('TEXT:', r.text)
except Exception as e:
    print('ERROR:', str(e))
