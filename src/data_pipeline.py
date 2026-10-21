import pandas as pd
import numpy as np
import logging
from typing import Dict, Any, Optional

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class ETLPipeline:
    def __init__(self, config: Optional[Dict[str, Any]] = None):
        self.config = config or {}
    
    def ingest(self, file_path: str, source_type: str) -> pd.DataFrame:
        """
        Ingest data from CSV or JSON. Must have timestamp and segment_id.
        """
        logger.info(f"Ingesting {source_type} data from {file_path}")
        try:
            if file_path.endswith('.csv'):
                df = pd.read_csv(file_path)
            elif file_path.endswith('.json'):
                df = pd.read_json(file_path)
            elif file_path.endswith('.parquet'):
                df = pd.read_parquet(file_path)
            else:
                raise ValueError("Unsupported file format. Use CSV, JSON, or Parquet.")
            
            # Validation: missing timestamp or segment_id should be discarded
            if 'timestamp' not in df.columns or 'segment_id' not in df.columns:
                logger.warning("Missing timestamp or segment_id. Discarding invalid records if possible, or rejecting file.")
                if 'timestamp' not in df.columns or 'segment_id' not in df.columns:
                     raise ValueError("Schema validation failed: missing timestamp or segment_id")
            
            df = df.dropna(subset=['timestamp', 'segment_id'])
            df['timestamp'] = pd.to_datetime(df['timestamp'])
            return df
        except Exception as e:
            logger.error(f"Error ingesting data: {e}")
            raise
    
    def clean(self, df: pd.DataFrame, target_cols: list = None) -> pd.DataFrame:
        """
        Clean data: Handle missing values and remove statistical outliers (3 std dev).
        """
        logger.info("Cleaning data")
        df_clean = df.copy()
        
        # Handle missing values (forward fill for time series)
        df_clean = df_clean.sort_values(by=['segment_id', 'timestamp'])
        for col in df_clean.columns:
            if col in ['timestamp', 'segment_id']:
                continue
            df_clean[col] = df_clean.groupby('segment_id')[col].transform(lambda x: x.ffill().bfill())
        
        if target_cols:
            for col in target_cols:
                if col in df_clean.columns:
                    # Remove outliers beyond 3 std dev of rolling mean (using a window, e.g., 24 hours or just global for now)
                    # The prompt says: "Values beyond 3 standard deviations of the segment's rolling mean"
                    rolling_mean = df_clean.groupby('segment_id')[col].transform(lambda x: x.rolling(window=10, min_periods=1).mean())
                    rolling_std = df_clean.groupby('segment_id')[col].transform(lambda x: x.rolling(window=10, min_periods=1).std())
                    
                    # Fill na in std with 0 to avoid dropping all single items
                    rolling_std = rolling_std.fillna(0)
                    
                    upper_bound = rolling_mean + 3 * rolling_std
                    lower_bound = rolling_mean - 3 * rolling_std
                    
                    # Keep only non-outliers or where std is 0
                    mask = (df_clean[col] >= lower_bound) & (df_clean[col] <= upper_bound) | (rolling_std == 0)
                    df_clean = df_clean[mask]
                    
        return df_clean

    def merge(self, traffic_df: pd.DataFrame, weather_df: pd.DataFrame, road_df: pd.DataFrame) -> pd.DataFrame:
        """
        Merge traffic, weather, and road metadata.
        """
        logger.info("Merging datasets")
        # Merge traffic and road metadata on segment_id
        merged = pd.merge(traffic_df, road_df, on='segment_id', how='left')
        
        # Align timestamps to nearest hour for weather merge, assuming weather is hourly
        merged['hour_timestamp'] = merged['timestamp'].dt.floor('h')
        if 'timestamp' in weather_df.columns:
            weather_df['hour_timestamp'] = weather_df['timestamp'].dt.floor('h')
            # Drop original timestamp from weather to avoid conflict
            weather_df = weather_df.drop(columns=['timestamp'])
        
        # Merge with weather on hour_timestamp
        # Sometimes weather is by region, but assuming global for now unless region_id exists
        merged = pd.merge(merged, weather_df, on='hour_timestamp', how='left')
        
        # Drop the temporary hour_timestamp
        merged = merged.drop(columns=['hour_timestamp'])
        
        return merged

    def save_processed(self, df: pd.DataFrame, output_path: str):
        """
        Save processed data to Parquet.
        """
        logger.info(f"Saving processed data to {output_path}")
        df.to_parquet(output_path, index=False)

if __name__ == "__main__":
    # Example usage for testing pipeline
    print("ETLPipeline initialized")
