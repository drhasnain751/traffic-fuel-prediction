import unittest
import os

# Set test-only database URL before importing api models
os.environ["DATABASE_URL"] = "sqlite:///:memory:"

import pandas as pd
import numpy as np
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from src.data_pipeline import ETLPipeline
from src.feature_engineering import FeatureEngineer
from api.database import Base
from api.db_models import DBUser, DBPrediction
from api.auth import get_password_hash, verify_password, create_access_token

class TestDataPipeline(unittest.TestCase):
    def setUp(self):
        self.pipeline = ETLPipeline()
        self.fe = FeatureEngineer()
        
    def test_clean_missing(self):
        df = pd.DataFrame({
            'timestamp': pd.date_range('2023-01-01', periods=3, freq='h'),
            'segment_id': ['A', 'A', 'A'],
            'speed': [40.0, np.nan, 45.0]
        })
        cleaned = self.pipeline.clean(df)
        self.assertFalse(cleaned['speed'].isna().any())

    def test_feature_engineering_lag(self):
        df = pd.DataFrame({
            'timestamp': pd.date_range('2023-01-01', periods=5, freq='15min'),
            'segment_id': ['A']*5,
            'speed': [40, 42, 38, 45, 50],
            'volume': [100, 110, 105, 120, 130]
        })
        features = self.fe.generate_lag_features(df, target_col='speed')
        self.assertIn('speed_lag_15', features.columns)

class TestDatabaseAndAuth(unittest.TestCase):
    def setUp(self):
        self.engine = create_engine("sqlite:///:memory:")
        Base.metadata.create_all(self.engine)
        self.Session = sessionmaker(bind=self.engine)
        self.db = self.Session()

    def tearDown(self):
        self.db.close()

    def test_user_creation_and_hashing(self):
        hashed = get_password_hash("securepassword123")
        user = DBUser(name="Test Analyst", email="analyst@example.com", hashed_password=hashed, role="ANALYST")
        self.db.add(user)
        self.db.commit()

        queried = self.db.query(DBUser).filter(DBUser.email == "analyst@example.com").first()
        self.assertIsNotNone(queried)
        self.assertEqual(queried.role, "ANALYST")
        self.assertTrue(verify_password("securepassword123", queried.hashed_password))
        self.assertFalse(verify_password("wrongpassword", queried.hashed_password))

    def test_jwt_token_generation(self):
        token = create_access_token({"sub": "user@example.com", "role": "USER"})
        self.assertIsInstance(token, str)
        self.assertTrue(len(token) > 20)

if __name__ == '__main__':
    unittest.main()
