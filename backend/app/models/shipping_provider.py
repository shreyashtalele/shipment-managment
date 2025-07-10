# app/models/shipping_provider.py

from sqlalchemy import Column, String, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from app.database import Base

class ShippingProvider(Base):
    __tablename__ = "shipping_providers"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False, unique=True)
    display_name = Column(String, nullable=True)  # ✅ new field
    tracking_url = Column(String, nullable=True)  # ✅ new field

    contact_email = Column(String, nullable=True)
    phone = Column(String, nullable=True)

    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    creator = relationship("User", backref="providers")
