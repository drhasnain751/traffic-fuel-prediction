import traceback
from src.train_congestion_model import CongestionModel
from src.train_fuel_model import FuelModel
from src.feature_engineering import FeatureEngineer
from src.predict import PredictionService

try:
    print('Loading models...')
    c = CongestionModel.load(registry_path='models', model_type='congestion', version='v1.0.0')
    f = FuelModel.load(registry_path='models', model_type='fuel', version='v1.0.0')
    fe = FeatureEngineer()
    ps = PredictionService(c, f, fe)
    print('Calling get_congestion for SEG-101...')
    res = ps.get_congestion('SEG-101', 'Now')
    print('Result:', res)
except Exception as e:
    print('Exception during prediction:')
    traceback.print_exc()
