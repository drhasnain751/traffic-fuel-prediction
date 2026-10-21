import requests
import json

API = 'http://127.0.0.1:8000/predict-congestion?segment_id=SEG-101&target_time=Now'
try:
    r = requests.get(API, timeout=10)
    print('STATUS', r.status_code)
    try:
        print(json.dumps(r.json(), indent=2))
    except Exception:
        print(r.text)
except Exception as e:
    print('ERROR', type(e).__name__, e)
