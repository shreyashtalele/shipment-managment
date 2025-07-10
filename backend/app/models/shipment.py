# app/models/shipment.py

import enum
import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Enum, ForeignKey, Float
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base

# Shipment Status Enum
class ShipmentStatus(str, enum.Enum):
    pending = "pending"
    dispatched = "dispatched"
    in_transit = "in_transit"
    delayed = "delayed"
    delivered = "delivered"
    cancelled = "cancelled"

class Shipment(Base):
    __tablename__ = "shipments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    shipment_id = Column(UUID(as_uuid=True), unique=True, nullable=False, default=uuid.uuid4)
    tracking_id = Column(UUID(as_uuid=True), unique=True, nullable=False, default=uuid.uuid4)
    external_tracking_id = Column(String, nullable=True, index=True)  # Optional user-provided tracking ID

    origin = Column(String, nullable=False)
    destination = Column(String, nullable=False)
    status = Column(Enum(ShipmentStatus), default=ShipmentStatus.pending, nullable=False)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    estimated_delivery = Column(DateTime, nullable=True)

    weight_kg = Column(Float, nullable=True)
    dimensions = Column(String, nullable=True)
    description = Column(String, nullable=True)

    provider_id = Column(UUID(as_uuid=True), ForeignKey("shipping_providers.id"))
    provider = relationship("ShippingProvider")

    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    creator = relationship("User")

    status_history = relationship("StatusHistory", back_populates="shipment", cascade="all, delete")
