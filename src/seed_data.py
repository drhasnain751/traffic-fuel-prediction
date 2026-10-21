import os
import pandas as pd
import numpy as np
import logging
from src.data_pipeline import ETLPipeline
from src.feature_engineering import FeatureEngineer
from src.train_congestion_model import CongestionModel
from src.train_fuel_model import FuelModel

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def generate_mock_data():
    logger.info("Generating initial sample data...")
    os.makedirs('data/raw', exist_ok=True)
    os.makedirs('data/processed', exist_ok=True)
    
    # Generate sample traffic data
    num_records = 2000
    timestamps = pd.date_range('2023-01-01', periods=num_records, freq='15min')
    segment_ids = ['SEG-101', 'SEG-102', 'SEG-103', 'SEG-104']
    
    data = []
    for t in timestamps:
        for s in segment_ids:
            # Create somewhat realistic patterns
            hour = t.hour
            is_rush = (7 <= hour <= 9) or (16 <= hour <= 18)
            base_speed = 60
            if is_rush:
                base_speed -= np.random.randint(20, 40)
            else:
                base_speed -= np.random.randint(0, 15)
                
            data.append({
                'timestamp': t,
                'segment_id': s,
                'speed': max(5, base_speed + np.random.normal(0, 5)),
                'volume': max(50, 200 if is_rush else 50 + np.random.normal(0, 20))
            })
            
    df_traffic = pd.DataFrame(data)
    df_traffic.to_csv('data/raw/traffic.csv', index=False)
    
    # Road network data
    df_road = pd.DataFrame({
        'segment_id': segment_ids,
        'lane_count': [2, 3, 2, 4],
        'road_type': ['arterial', 'highway', 'arterial', 'highway']
    })
    
    # Weather data
    df_weather = pd.DataFrame({
        'timestamp': pd.date_range('2023-01-01', periods=num_records//4 + 1, freq='1h'),
        'temperature': np.random.normal(15, 5, num_records//4 + 1),
        'precipitation': np.random.choice([0, 0, 0, 5, 10], num_records//4 + 1),
        'visibility': np.random.normal(10, 2, num_records//4 + 1)
    })
    
    return df_traffic, df_road, df_weather

def run_seed():
    df_traffic, df_road, df_weather = generate_mock_data()
    
    # 1. Data Pipeline
    pipeline = ETLPipeline()
    df_traffic_clean = pipeline.clean(df_traffic, target_cols=['speed', 'volume'])
    df_merged = pipeline.merge(df_traffic_clean, df_weather, df_road)
    
    pipeline.save_processed(df_merged, 'data/processed/merged_data.parquet')
    
    # 2. Feature Engineering
    fe = FeatureEngineer(schema_version="v1.0")
    df_features = fe.fit_transform(df_merged)
    
    df_features.dropna(inplace=True) # Drop NAs from lag/rolling
    
    # Prepare X and y
    # For demonstration, we'll try to predict 'speed' and then calculate fuel
    features_to_use = [
        'hour', 'day_of_week', 'is_holiday', 'is_rush_hour', 
        'temperature', 'precipitation', 'visibility',
        'speed_lag_15', 'speed_lag_30', 'speed_lag_60',
        'speed_rolling_mean', 'speed_rolling_std', 'volume_rolling_mean'
    ]
    
    X = df_features[features_to_use]
    y_speed = df_features['speed']
    
    # Train test split
    train_size = int(len(X) * 0.8)
    X_train, X_test = X.iloc[:train_size], X.iloc[train_size:]
    y_train, y_test = y_speed.iloc[:train_size], y_speed.iloc[train_size:]
    
    # 3. Train Congestion Model (Regression)
    c_model = CongestionModel(task="regression", version="v1.0.0")
    c_model.train(X_train, y_train)
    c_model.evaluate(X_test, y_test)
    c_model.save("models")
    
    # 4. Train Fuel Model
    # For fuel, we need a dataset mapping distance, efficiency, predicted_speed to fuel_l
    # We will synthesize this based on the physics formula + some noise to let ML learn the residual
    logger.info("Synthesizing fuel training data...")
    f_model = FuelModel(version="v1.0.0")
    
    # Synthesize fuel dataset
    fuel_X = pd.DataFrame({
        'distance_km': np.random.uniform(1, 20, len(X_train)),
        'vehicle_efficiency': np.random.uniform(5, 15, len(X_train)),
        'predicted_speed': c_model.predict_speed(X_train)
    })
    
    # Base physics fuel + random realistic noise (residual)
    base_fuel = fuel_X.apply(lambda row: f_model.physics_base_fuel(row['distance_km'], row['vehicle_efficiency'], row['predicted_speed']), axis=1)
    noise = np.random.normal(0, 0.1, len(fuel_X)) * base_fuel
    y_fuel = base_fuel + noise
    
    # Test set for fuel
    fuel_X_test = pd.DataFrame({
        'distance_km': np.random.uniform(1, 20, len(X_test)),
        'vehicle_efficiency': np.random.uniform(5, 15, len(X_test)),
        'predicted_speed': c_model.predict_speed(X_test)
    })
    base_fuel_test = fuel_X_test.apply(lambda row: f_model.physics_base_fuel(row['distance_km'], row['vehicle_efficiency'], row['predicted_speed']), axis=1)
    noise_test = np.random.normal(0, 0.1, len(fuel_X_test)) * base_fuel_test
    y_fuel_test = base_fuel_test + noise_test
    
    f_model.train(fuel_X, y_fuel)
    f_model.evaluate(fuel_X_test, y_fuel_test)
    f_model.save("models")
    
    logger.info("Seed completed successfully.")

if __name__ == "__main__":
    run_seed()
