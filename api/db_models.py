from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from .database import Base

class DBUser(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, default="USER", nullable=False) # 'USER' or 'ANALYST'
    created_at = Column(DateTime, default=datetime.utcnow)

    predictions = relationship("DBPrediction", back_populates="user")
    trips = relationship("DBTripPrediction", back_populates="user")

class DBRoadSegment(Base):
    __tablename__ = "road_segments"

    segment_id = Column(String, primary_key=True, index=True)
    lane_count = Column(Integer, default=2)
    road_type = Column(String, default="arterial")
    speed_limit = Column(Float, default=60.0)

class DBPrediction(Base):
    __tablename__ = "predictions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    segment_id = Column(String, index=True, nullable=False)
    target_time = Column(String, nullable=False)
    predicted_speed = Column(Float, nullable=False)
    congestion_level = Column(String, nullable=False)
    model_version = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("DBUser", back_populates="predictions")

class DBTripPrediction(Base):
    __tablename__ = "trip_predictions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    route_segments = Column(String, nullable=False)
    vehicle_type = Column(String, nullable=False)
    predicted_fuel_l = Column(Float, nullable=False)
    estimated_cost = Column(Float, nullable=False)
    model_version = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("DBUser", back_populates="trips")

class DBModelVersion(Base):
    __tablename__ = "model_versions"

    id = Column(Integer, primary_key=True, index=True)
    model_type = Column(String, nullable=False) # 'congestion' or 'fuel'
    version = Column(String, nullable=False)
    metrics = Column(JSON, nullable=False)
    status = Column(String, default="experimental") # 'production', 'experimental'
    created_at = Column(DateTime, default=datetime.utcnow)
