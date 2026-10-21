import requests, json, time
API_BASE = 'http://127.0.0.1:8000'

def pretty(r):
    print('STATUS', r.status_code)
    try:
        print(json.dumps(r.json(), indent=2))
    except Exception:
        print(r.text)

print('1) /predict-congestion')
r = requests.get(API_BASE + '/predict-congestion?segment_id=SEG-101&target_time=Now', timeout=10)
pretty(r)

print('\n2) /predict-fuel')
r = requests.post(API_BASE + '/predict-fuel', json={'route':['SEG-101','SEG-102'],'vehicle':{'vehicle_type':'medium sedan','base_efficiency':8.5}}, timeout=20)
pretty(r)

print('\n3) /compare-routes')
r = requests.post(API_BASE + '/compare-routes', json={'route_a':['SEG-101','SEG-102'],'route_b':['SEG-103','SEG-104'],'vehicle':{'vehicle_type':'medium sedan','base_efficiency':8.5}}, timeout=20)
pretty(r)

print('\n4) /analytics/history')
r = requests.get(API_BASE + '/analytics/history?segment_id=SEG-101', timeout=10)
pretty(r)

print('\n5) /sources/status')
r = requests.get(API_BASE + '/sources/status', timeout=10)
pretty(r)

print('\n6) /models/metrics?model_type=congestion')
r = requests.get(API_BASE + '/models/metrics?model_type=congestion', timeout=10)
pretty(r)

print('\n7) Create ANALYST account for retrain')
email = f'qa_analyst_{int(time.time())}@example.com'
r = requests.post(API_BASE + '/auth/signup', json={'name':'QA Analyst','email':email,'password':'QAPass123','role':'ANALYST'}, timeout=10)
pretty(r)
if r.status_code==200:
    token = r.json().get('access_token')
    headers = {'Authorization': f'Bearer {token}'}
    print('\n8) /models/retrain (ANALYST)')
    try:
        r2 = requests.post(API_BASE + '/models/retrain', json={'model_type':'both','training_window':'2023-01-01 to 2026-08-01'}, headers=headers, timeout=120)
        pretty(r2)
    except Exception as e:
        print('Retrain error', e)
else:
    print('Analyst signup failed, skipping retrain')
