import pandas as pd
import numpy as np
import logging
import pickle
import os
from datetime import datetime
from sklearn.ensemble import RandomForestRegressor, RandomForestClassifier
from sklearn.metrics import accuracy_score, f1_score, mean_squared_error, mean_absolute_error, r2_score
from typing import Dict, Any

logger = logging.getLogger(__name__)

class BasePredictionModel:
    def __init__(self, model_type="congestion", version="v1.0.0", schema_version="v1.0"):
        self.model_type = model_type
        self.version = version
        self.schema_version = schema_version
        self.model = None
        self.metrics = {}
        self.status = "experimental"
        
    def train(self, X_train, y_train):
        raise NotImplementedError
        
    def predict(self, X):
        raise NotImplementedError
        
    def evaluate(self, X_test, y_test):
        raise NotImplementedError
        
    def save(self, registry_path="models"):
        os.makedirs(f"{registry_path}/{self.model_type}/{self.version}", exist_ok=True)
        model_path = f"{registry_path}/{self.model_type}/{self.version}/model.pkl"
        with open(model_path, 'wb') as f:
            pickle.dump({
                'model': self.model,
                'metrics': self.metrics,
                'schema_version': self.schema_version,
                'status': self.status,
                'created_at': datetime.utcnow().isoformat()
            }, f)
        logger.info(f"Model saved to {model_path}")
        
    @classmethod
    def load(cls, registry_path="models", model_type="congestion", version="v1.0.0"):
        model_path = f"{registry_path}/{model_type}/{version}/model.pkl"
        with open(model_path, 'rb') as f:
            data = pickle.load(f)
            
        instance = cls(version=version, schema_version=data.get('schema_version', 'v1.0'))
        instance.model = data['model']
        instance.metrics = data['metrics']
        instance.status = data['status']
        return instance

class CongestionModel(BasePredictionModel):
    def __init__(self, task="regression", **kwargs):
        super().__init__(model_type="congestion", **kwargs)
        self.task = task
        if self.task == "regression":
            self.model = RandomForestRegressor(n_estimators=100, random_state=42)
        else:
            self.model = RandomForestClassifier(n_estimators=100, random_state=42)

    def train(self, X_train, y_train):
        logger.info(f"Training congestion model ({self.task})...")
        self.model.fit(X_train, y_train)
        
    def predict_level(self, X):
        if self.task == "classification":
            return self.model.predict(X)
        else:
            speed = self.model.predict(X)
            # Map speed to level
            levels = np.where(speed > 40, 'LOW', np.where(speed > 20, 'MEDIUM', 'HIGH'))
            return levels
            
    def predict_speed(self, X):
        if self.task == "regression":
            return self.model.predict(X)
        else:
            raise ValueError("Classification model cannot predict exact speed.")
            
    def evaluate(self, X_test, y_test) -> Dict[str, float]:
        preds = self.model.predict(X_test)
        if self.task == "classification":
            self.metrics = {
                "accuracy": float(accuracy_score(y_test, preds)),
                "f1_score": float(f1_score(y_test, preds, average='macro'))
            }
        else:
            self.metrics = {
                "rmse": float(np.sqrt(mean_squared_error(y_test, preds))),
                "mae": float(mean_absolute_error(y_test, preds)),
                "r2": float(r2_score(y_test, preds))
            }
        logger.info(f"Evaluation metrics: {self.metrics}")
        return self.metrics

if __name__ == "__main__":
    # Test script
    X = pd.DataFrame(np.random.rand(100, 5), columns=['f1','f2','f3','f4','f5'])
    y = np.random.rand(100) * 60
    
    model = CongestionModel(task="regression")
    model.train(X, y)
    model.evaluate(X, y)
    model.save("../models")
