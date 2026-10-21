import requests
import sys

url = 'http://127.0.0.1:8000/predict-congestion?segment_id=SEG-101&target_time=Now'
print('Calling', url)
try:
    r = requests.get(url, timeout=20)
    print('STATUS', r.status_code)
    print(r.text)
except Exception as e:
    print('ERROR', type(e).__name__, e)
    sys.exit(1)
