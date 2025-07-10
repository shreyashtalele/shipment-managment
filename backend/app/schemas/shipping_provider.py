# app/schemas/shipping_provider.py

from pydantic import BaseModel, EmailStr, HttpUrl
from uuid import UUID
from typing import Optional

class ShippingProviderCreate(BaseModel):
    name: str
    display_name: Optional[str] = None  # ✅ new field
    tracking_url: Optional[str] = None
    contact_email: Optional[EmailStr] = None
    phone: Optional[str] = None

class ShippingProviderResponse(BaseModel):
    id: UUID
    name: str
    display_name: Optional[str] = None  # ✅ new field
    tracking_url: Optional[str] = None
    contact_email: Optional[EmailStr] = None
    phone: Optional[str] = None

    class Config:
        from_attributes = True  # Pydantic v2+
