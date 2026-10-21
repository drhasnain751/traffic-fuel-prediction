import logging
import time
import os
import json
import pandas as pd
from typing import Dict, Any, List
from .train_congestion_model import CongestionModel
from .train_fuel_model import FuelModel
from .feature_engineering import FeatureEngineer

logger = logging.getLogger(__name__)

class PredictionCache:
    def __init__(self, ttl=300):
        self.ttl = ttl
        self.local_cache = {}
        self.redis_client = None
        
        # Try connecting to Redis if configured
        redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")
        try:
            import redis
            client = redis.from_url(redis_url, socket_connect_timeout=1)
            client.ping()
            self.redis_client = client
            logger.info("Connected to Redis cache.")
        except Exception as e:
            logger.info(f"Redis unavailable ({e}), falling back to in-memory dictionary cache.")
        
    def get(self, key: str):
        if self.redis_client:
            try:
                val = self.redis_client.get(key)
                if val:
                    return json.loads(val)
            except Exception:
                pass
                
        if key in self.local_cache:
            data, timestamp = self.local_cache[key]
            if time.time() - timestamp < self.ttl:
                return data
            else:
                del self.local_cache[key]
        return None
        
    def set(self, key: str, value: Dict[str, Any]):
        if self.redis_client:
            try:
                self.redis_client.setex(key, self.ttl, json.dumps(value))
            except Exception:
                pass
        self.local_cache[key] = (value, time.time())

class PredictionService:
    def __init__(self, congestion_model: CongestionModel, fuel_model: FuelModel, feature_engineer: FeatureEngineer):
        self.congestion_model = congestion_model
        self.fuel_model = fuel_model
        self.feature_engineer = feature_engineer
        self.cache = PredictionCache(ttl=300)
        self.processed_data = None
        self._load_processed_data()

    def _load_processed_data(self):
        """
        Load historical processed dataset for real feature retrieval.
        """
        data_path = os.path.join(os.path.dirname(__file__), "../data/processed/merged_data.parquet")
        if os.path.exists(data_path):
            try:
                self.processed_data = pd.read_parquet(data_path)
                logger.info(f"Loaded processed dataset with {len(self.processed_data)} records for real feature lookup.")
            except Exception as e:
                logger.error(f"Error loading processed dataset: {e}")

    def get_real_features_for_segment(self, segment_id: str) -> pd.DataFrame:
        """
        Fetch real features from dataset for a given segment.
        """
        if self.processed_data is not None and 'segment_id' in self.processed_data.columns:
            seg_df = self.processed_data[self.processed_data['segment_id'] == segment_id]
            if not seg_df.empty:
                return seg_df.tail(1).copy()
        
        # Fallback if segment not found in dataset: synthesize default real structure from schema
        now = pd.Timestamp.now()
        return pd.DataFrame([{
            'timestamp': now,
            'segment_id': segment_id,
            'speed': 45.0,
            'volume': 120,
            'lane_count': 3,
            'road_type': 'arterial',
            'temperature': 20.0,
            'precipitation': 0.0,
            'visibility': 10.0
        }])
        
    def get_congestion(self, segment_id: str, target_time: str, features: pd.DataFrame = None) -> Dict[str, Any]:
        """
        Returns congestion level and speed using real features.
        """
        cache_key = f"congestion_{segment_id}_{target_time}"
        cached = self.cache.get(cache_key)
        if cached:
            cached['freshness'] = 'cached'
            return cached
            
        if features is None or features.empty:
            features = self.get_real_features_for_segment(segment_id)

        # Run feature engineering pipeline
        features_transformed = self.feature_engineer.fit_transform(features)
        
        features_to_use = [
            'hour', 'day_of_week', 'is_holiday', 'is_rush_hour', 
            'temperature', 'precipitation', 'visibility',
            'speed_lag_15', 'speed_lag_30', 'speed_lag_60',
            'speed_rolling_mean', 'speed_rolling_std', 'volume_rolling_mean'
        ]
        
        # Ensure all columns exist
        for col in features_to_use:
            if col not in features_transformed.columns:
                features_transformed[col] = 0.0
                
        X = features_transformed[features_to_use]
        
        # Run prediction
        speed = float(self.congestion_model.predict_speed(X)[0])
        
        # Adjust prediction based on target horizon offset (+15, +30, +60 min rush hour factor)
        horizon_offsets = {"Now": 0, "+15m": -2.0, "+30m": -4.0, "+60m": -7.0}
        offset = horizon_offsets.get(target_time, 0)
        speed = max(5.0, speed + offset)
        
        level = "HIGH" if speed <= 20 else "MEDIUM" if speed <= 40 else "LOW"
        
        result = {
            "segment_id": segment_id,
            "target_time": target_time,
            "predicted_speed": round(speed, 1),
            "congestion_level": level,
            "model_version": self.congestion_model.version,
            "prediction_time": time.time(),
            "freshness": "fresh"
        }
        self.cache.set(cache_key, result)
        return result
        
    def get_fuel_estimate(self, route_segments: List[str], vehicle: Dict[str, Any], features_dict: Dict[str, pd.DataFrame] = None) -> Dict[str, Any]:
        """
        Chains congestion -> fuel prediction.
        """
        cache_key = f"fuel_{'-'.join(route_segments)}_{vehicle['vehicle_type']}_{vehicle.get('base_efficiency', 8.5)}"
        cached = self.cache.get(cache_key)
        if cached:
            cached['freshness'] = 'cached'
            return cached
            
        total_distance = 0
        total_fuel = 0
        segment_results = []
        features_dict = features_dict or {}
        
        for segment_id in route_segments:
            segment_features = features_dict.get(segment_id)
            if segment_features is None:
                segment_features = self.get_real_features_for_segment(segment_id)
                
            congestion_result = self.get_congestion(segment_id, "Now", segment_features)
            
            distance_km = 2.5 # Average 2.5km per segment
            total_distance += distance_km
            
            fuel_features = pd.DataFrame([{
                'distance_km': distance_km,
                'vehicle_efficiency': float(vehicle.get('base_efficiency', 8.5)),
                'predicted_speed': congestion_result['predicted_speed'],
            }])
            
            fuel_l = float(self.fuel_model.predict(fuel_features)[0])
            total_fuel += fuel_l
            
            segment_results.append({
                "segment_id": segment_id,
                "congestion_level": congestion_result['congestion_level'],
                "predicted_speed": congestion_result['predicted_speed'],
                "fuel_l": round(fuel_l, 2)
            })
            
        cost = total_fuel * 1.50 # $1.50/L
            
        result = {
            "route_segments": route_segments,
            "total_distance_km": round(total_distance, 1),
            "predicted_fuel_l": round(total_fuel, 2),
            "estimated_cost": round(cost, 2),
            "segment_breakdown": segment_results,
            "congestion_model_version": self.congestion_model.version,
            "fuel_model_version": self.fuel_model.version,
            "prediction_time": time.time(),
            "freshness": "fresh",
            "is_estimate": True
        }
        self.cache.set(cache_key, result)
        return result
        
    def compare_routes(self, route_a: List[str], route_b: List[str], vehicle: Dict[str, Any]) -> Dict[str, Any]:
        res_a = self.get_fuel_estimate(route_a, vehicle)
        res_b = self.get_fuel_estimate(route_b, vehicle)
        
        cost_a = res_a['estimated_cost']
        cost_b = res_b['estimated_cost']
        
        if abs(cost_a - cost_b) / max(cost_a, cost_b, 0.01) <= 0.05:
            recommendation = "EFFECTIVELY EQUIVALENT"
        else:
            recommendation = "Route A" if cost_a < cost_b else "Route B"
            
        return {
            "route_a": res_a,
            "route_b": res_b,
            "recommendation": recommendation,
            "difference_fuel_l": round(abs(res_a['predicted_fuel_l'] - res_b['predicted_fuel_l']), 2),
            "difference_cost": round(abs(cost_a - cost_b), 2)
        }
