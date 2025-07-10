from pydantic import BaseModel
from typing import Optional
from datetime import datetime, date
from uuid import UUID
from app.models.shipment import ShipmentStatus

class ShipmentCreate(BaseModel):
    origin: str
    destination: str
    status: ShipmentStatus
    provider_id: UUID  # ✅ Updated to UUID for consistency
    estimated_delivery: date
    weight_kg: float
    dimensions: str
    description: Optional[str] = None
    external_tracking_id: Optional[str] = None  # ✅ Optional user-defined tracking ID

class ShipmentUpdate(BaseModel):
    status: Optional[ShipmentStatus] = None
    estimated_delivery: Optional[date] = None

class ShipmentResponse(BaseModel):
    id: UUID
    shipment_id: UUID
    tracking_id: UUID
    external_tracking_id: Optional[str] = None  # ✅ Shown in responses
    origin: str
    destination: str
    status: ShipmentStatus
    estimated_delivery: date
    weight_kg: float
    dimensions: str
    description: Optional[str] = None
    created_at: datetime

    class Config:
        orm_mode = True
