import pandas as pd
import numpy as np
import logging
from .train_congestion_model import BasePredictionModel
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.metrics import mean_squared_error, mean_absolute_error, mean_absolute_percentage_error

logger = logging.getLogger(__name__)

class FuelModel(BasePredictionModel):
    def __init__(self, **kwargs):
        super().__init__(model_type="fuel", **kwargs)
        # Residual correction model
        self.model = GradientBoostingRegressor(n_estimators=100, random_state=42)
        
    def physics_base_fuel(self, distance_km: float, vehicle_efficiency: float, speed: float) -> float:
        """
        Physics-informed base calculation.
        vehicle_efficiency is L/100km at optimal speed.
        If speed is low, fuel consumption per km goes up.
        """
        # Simplistic curve: optimal speed around 80 km/h
        speed_factor = 1.0 + (abs(80 - max(speed, 5)) / 80) ** 2
        return (vehicle_efficiency / 100) * distance_km * speed_factor

    def train(self, X_train, y_train):
        """
        X_train contains 'distance_km', 'vehicle_efficiency', 'predicted_speed', and other features.
        y_train is actual fuel consumed.
        We train the model on the residuals: actual - base.
        """
        logger.info("Training Fuel Model (residual correction)...")
        # Ensure required columns are present
        base_preds = X_train.apply(lambda row: self.physics_base_fuel(
            row['distance_km'], row['vehicle_efficiency'], row.get('predicted_speed', 40)), axis=1)
        
        residuals = y_train - base_preds
        self.model.fit(X_train, residuals)
        
    def predict(self, X):
        base_preds = X.apply(lambda row: self.physics_base_fuel(
            row['distance_km'], row['vehicle_efficiency'], row.get('predicted_speed', 40)), axis=1)
            
        # Add residual correction if we have a trained model
        try:
            residuals = self.model.predict(X)
        except Exception:
            residuals = 0
            
        final_preds = base_preds + residuals
        return np.maximum(final_preds, 0) # Fuel cannot be negative
        
    def evaluate(self, X_test, y_test):
        preds = self.predict(X_test)
        self.metrics = {
            "rmse": float(np.sqrt(mean_squared_error(y_test, preds))),
            "mae": float(mean_absolute_error(y_test, preds)),
            "mape": float(mean_absolute_percentage_error(y_test, preds))
        }
        logger.info(f"Fuel Evaluation metrics: {self.metrics}")
        return self.metrics
