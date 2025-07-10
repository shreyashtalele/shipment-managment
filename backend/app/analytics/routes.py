# app/analytics/routes.py

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from datetime import datetime
from typing import Dict

from app.database import SessionLocal
from app.models.shipment import Shipment, ShipmentStatus
from app.models.shipping_provider import ShippingProvider
from app.models.user import User
from app.schemas.analytics import ShipmentSummary
from app.auth.dependencies import get_current_user

router = APIRouter(tags=["Analytics"])

# Dependency to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/summary", response_model=ShipmentSummary)
def get_shipment_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    def count_by_status(status: ShipmentStatus) -> int:
        return db.query(Shipment).filter(
            Shipment.created_by == current_user.id,
            Shipment.status == status
        ).count()

    total = db.query(Shipment).filter(Shipment.created_by == current_user.id).count()

    return ShipmentSummary(
        total=total,
        delivered=count_by_status(ShipmentStatus.delivered),
        pending=count_by_status(ShipmentStatus.pending),
        in_transit=count_by_status(ShipmentStatus.in_transit),
        delayed=count_by_status(ShipmentStatus.delayed),
        cancelled=count_by_status(ShipmentStatus.cancelled),
    )

@router.get("/monthly-trends", response_model=Dict[str, int])
def monthly_shipment_trends(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    current_year = datetime.now().year
    results = (
        db.query(extract('month', Shipment.created_at), func.count(Shipment.id))
        .filter(
            Shipment.created_by == current_user.id,
            extract('year', Shipment.created_at) == current_year
        )
        .group_by(extract('month', Shipment.created_at))
        .order_by(extract('month', Shipment.created_at))
        .all()
    )
    return {str(int(month)): count for month, count in results}

@router.get("/average-delivery-time", response_model=float)
def average_delivery_time(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    delivered_shipments = db.query(Shipment).filter(
        Shipment.created_by == current_user.id,
        Shipment.status == ShipmentStatus.delivered,
        Shipment.estimated_delivery != None
    ).all()

    if not delivered_shipments:
        return 0.0

    total_days = sum(
        (shipment.estimated_delivery - shipment.created_at).days
        for shipment in delivered_shipments
    )
    return round(total_days / len(delivered_shipments), 2)

@router.get("/provider-count", response_model=Dict[str, int])
def provider_wise_shipment_count(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    results = (
        db.query(ShippingProvider.name, func.count(Shipment.id))
        .join(Shipment, Shipment.provider_id == ShippingProvider.id)
        .filter(ShippingProvider.created_by == current_user.id)
        .group_by(ShippingProvider.name)
        .all()
    )
    return {name: count for name, count in results}
