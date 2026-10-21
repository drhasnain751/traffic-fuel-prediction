import pandas as pd
import numpy as np
import logging

logger = logging.getLogger(__name__)

class FeatureEngineer:
    def __init__(self, schema_version="v1.0"):
        self.schema_version = schema_version
        self.feature_columns = []

    def generate_temporal_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Extract hour, day_of_week, is_holiday, is_rush_hour.
        """
        logger.info("Generating temporal features")
        df['hour'] = df['timestamp'].dt.hour
        df['day_of_week'] = df['timestamp'].dt.dayofweek
        
        # Simple holiday logic (can be expanded with a real holiday calendar)
        df['is_holiday'] = df['day_of_week'].isin([5, 6]).astype(int)
        
        # Rush hour: 7-9 AM and 4-6 PM (16-18) on weekdays
        df['is_rush_hour'] = ((df['hour'].isin([7, 8, 9, 16, 17, 18])) & (df['is_holiday'] == 0)).astype(int)
        return df

    def generate_spatial_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Spatial features like segment_id, lane_count, road_type should already be in df from merge.
        We ensure they are properly typed.
        """
        logger.info("Generating spatial features")
        # Assuming lane_count and road_type are present
        if 'road_type' in df.columns:
            # One-hot encode road_type or categorical
            df['road_type'] = df['road_type'].astype('category')
        return df

    def generate_weather_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Weather features like temperature, precipitation, visibility.
        Handle any specific transformations needed.
        """
        logger.info("Generating weather features")
        # Ensure they exist, fill missing with defaults if necessary
        weather_cols = ['temperature', 'precipitation', 'visibility']
        for col in weather_cols:
            if col in df.columns:
                df[col] = df[col].fillna(df[col].median() if not df[col].empty else 0)
        return df

    def generate_lag_features(self, df: pd.DataFrame, target_col: str = 'speed') -> pd.DataFrame:
        """
        Create 15, 30, 60 min lag features.
        Assumes data is sorted by time and interval is consistent (e.g., 5 min).
        We'll use time-based rolling/shifting if exact interval is unknown, but shift is easier if resampled.
        """
        logger.info(f"Generating lag features for {target_col}")
        df = df.sort_values(['segment_id', 'timestamp'])
        
        # Resample to 15 min frequency to make lag calculation robust
        # But we want to keep original timestamps if possible, so we use merge_asof or simple shift if interval is fixed.
        # Assuming a 15-minute regular interval for simplicity:
        df[f'{target_col}_lag_15'] = df.groupby('segment_id')[target_col].shift(1)
        df[f'{target_col}_lag_30'] = df.groupby('segment_id')[target_col].shift(2)
        df[f'{target_col}_lag_60'] = df.groupby('segment_id')[target_col].shift(4)
        
        # Fill NA from shifting
        df[f'{target_col}_lag_15'] = df[f'{target_col}_lag_15'].ffill().bfill().fillna(0)
        df[f'{target_col}_lag_30'] = df[f'{target_col}_lag_30'].ffill().bfill().fillna(0)
        df[f'{target_col}_lag_60'] = df[f'{target_col}_lag_60'].ffill().bfill().fillna(0)
        
        return df

    def generate_rolling_features(self, df: pd.DataFrame, target_col: str = 'speed', volume_col: str = 'volume') -> pd.DataFrame:
        """
        Create rolling mean and std for speed and volume.
        """
        logger.info(f"Generating rolling features for {target_col} and {volume_col}")
        df = df.sort_values(['segment_id', 'timestamp'])
        
        if target_col in df.columns:
            df[f'{target_col}_rolling_mean'] = df.groupby('segment_id')[target_col].transform(lambda x: x.rolling(4, min_periods=1).mean())
            df[f'{target_col}_rolling_std'] = df.groupby('segment_id')[target_col].transform(lambda x: x.rolling(4, min_periods=1).std()).fillna(0)
            
        if volume_col in df.columns:
            df[f'{volume_col}_rolling_mean'] = df.groupby('segment_id')[volume_col].transform(lambda x: x.rolling(4, min_periods=1).mean())
            
        return df

    def generate_fuel_features(self, df: pd.DataFrame, speed_col: str = 'speed') -> pd.DataFrame:
        """
        Derived features for fuel: idle_time, stop_frequency, speed_variance
        These are proxy calculations from speed if high-freq telemetry isn't available.
        """
        logger.info("Generating fuel-derived features")
        if speed_col in df.columns:
            # Proxy for idle_time: 1 if speed < 5 km/h, else 0
            df['idle_time_proxy'] = (df[speed_col] < 5).astype(float)
            
            # Proxy for stop_frequency: transitions from >5 to <5
            df['is_stopped'] = df['idle_time_proxy']
            df['stop_frequency_proxy'] = df.groupby('segment_id')['is_stopped'].diff().apply(lambda x: 1 if x == 1 else 0)
            
            # Speed variance over short window
            df['speed_variance'] = df.groupby('segment_id')[speed_col].transform(lambda x: x.rolling(3, min_periods=1).var()).fillna(0)
            
        return df

    def fit_transform(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Run all feature engineering steps.
        """
        df = self.generate_temporal_features(df)
        df = self.generate_spatial_features(df)
        df = self.generate_weather_features(df)
        df = self.generate_lag_features(df, target_col='speed')
        df = self.generate_rolling_features(df, target_col='speed', volume_col='volume')
        df = self.generate_fuel_features(df, speed_col='speed')
        
        # Save columns for validation later
        self.feature_columns = df.columns.tolist()
        return df

    def get_schema(self):
        return {
            "version": self.schema_version,
            "columns": self.feature_columns
        }
