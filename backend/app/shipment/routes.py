from fastapi import APIRouter, Depends, HTTPException, Path, status
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from uuid import uuid4, UUID
from typing import List, Optional, Dict
from datetime import datetime, timedelta

from app.database import SessionLocal
from app.models.shipment import Shipment, ShipmentStatus
from app.models.shipping_provider import ShippingProvider
from app.models.user import User
from app.schemas.shipment import ShipmentCreate, ShipmentResponse, ShipmentUpdate
from app.schemas.shipping_provider import ShippingProviderCreate, ShippingProviderResponse
from app.schemas.analytics import ShipmentSummary
from app.auth.dependencies import get_current_user
import csv
import io
from fastapi.responses import StreamingResponse

# Routers
shipment_router = APIRouter(tags=["Shipments"])
provider_router = APIRouter(tags=["Shipping Providers"])

# Dependency to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ------------------------
# 🚚 Shipment Endpoints
# ------------------------

@shipment_router.post("/create-shipments", response_model=ShipmentResponse)
def create_shipment(
    shipment_data: ShipmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    provider = db.query(ShippingProvider).filter(ShippingProvider.id == shipment_data.provider_id).first()
    if not provider:
        raise HTTPException(status_code=404, detail="Shipping provider not found")

    new_shipment = Shipment(
        shipment_id=uuid4(),
        tracking_id=uuid4(),
        origin=shipment_data.origin,
        destination=shipment_data.destination,
        status=shipment_data.status,
        provider_id=shipment_data.provider_id,
        estimated_delivery=shipment_data.estimated_delivery,
        weight_kg=shipment_data.weight_kg,
        dimensions=shipment_data.dimensions,
        description=shipment_data.description,
        external_tracking_id=shipment_data.external_tracking_id,  # ✅ ADDED
        created_by=current_user.id
    )
    db.add(new_shipment)
    db.commit()
    db.refresh(new_shipment)
    return new_shipment


@shipment_router.post("/bulk", response_model=List[ShipmentResponse], status_code=status.HTTP_201_CREATED)
def create_bulk_shipments(
    shipment_list: List[ShipmentCreate],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    created_shipments = []

    for shipment_data in shipment_list:
        provider = db.query(ShippingProvider).filter(
            ShippingProvider.id == shipment_data.provider_id
        ).first()

        if not provider:
            raise HTTPException(
                status_code=404,
                detail=f"Shipping provider not found: {shipment_data.provider_id}"
            )

        new_shipment = Shipment(
            shipment_id=uuid4(),
            tracking_id=uuid4(),
            origin=shipment_data.origin,
            destination=shipment_data.destination,
            status=shipment_data.status,
            provider_id=shipment_data.provider_id,
            estimated_delivery=shipment_data.estimated_delivery,
            weight_kg=shipment_data.weight_kg,
            dimensions=shipment_data.dimensions,
            description=shipment_data.description,
            external_tracking_id=shipment_data.external_tracking_id,  # ✅ ADDED
            created_by=current_user.id
        )
        db.add(new_shipment)
        created_shipments.append(new_shipment)

    db.commit()
    for shipment in created_shipments:
        db.refresh(shipment)

    return created_shipments


@shipment_router.get("/list-shipments", response_model=List[ShipmentResponse])
def list_user_shipments(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return db.query(Shipment).filter(Shipment.created_by == current_user.id).all()


@shipment_router.get("/by-provider/{provider_id}", response_model=List[ShipmentResponse])
def get_shipments_by_provider(
    provider_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    shipments = db.query(Shipment).filter(
        Shipment.provider_id == provider_id,
        Shipment.created_by == current_user.id
    ).all()

    if not shipments:
        raise HTTPException(status_code=404, detail="No shipments found for this provider")

    return shipments


@shipment_router.get("/search", response_model=List[ShipmentResponse])
def search_shipments(
    origin: Optional[str] = None,
    destination: Optional[str] = None,
    status: Optional[str] = None,
    provider_id: Optional[UUID] = None,
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Shipment).filter(Shipment.created_by == current_user.id)

    if origin:
        query = query.filter(Shipment.origin.ilike(f"%{origin}%"))
    if destination:
        query = query.filter(Shipment.destination.ilike(f"%{destination}%"))
    if status:
        query = query.filter(Shipment.status == status)
    if provider_id:
        query = query.filter(Shipment.provider_id == provider_id)
    if date_from:
        query = query.filter(Shipment.created_at >= date_from)
    if date_to:
        query = query.filter(Shipment.created_at <= date_to)

    return query.all()


@shipment_router.get("/{shipment_id}", response_model=ShipmentResponse)
def get_shipment_by_id(
    shipment_id: str = Path(..., description="Public shipment ID"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    shipment = db.query(Shipment).filter(
        Shipment.shipment_id == shipment_id,
        Shipment.created_by == current_user.id
    ).first()

    if not shipment:
        raise HTTPException(status_code=404, detail="Shipment not found")
    return shipment


@shipment_router.patch("/{shipment_id}", response_model=ShipmentResponse)
def update_shipment_status_or_delivery(
    shipment_id: str,
    update_data: ShipmentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    shipment = db.query(Shipment).filter(
        Shipment.shipment_id == shipment_id,
        Shipment.created_by == current_user.id
    ).first()

    if not shipment:
        raise HTTPException(status_code=404, detail="Shipment not found")

    if update_data.status is not None:
        shipment.status = update_data.status
    if update_data.estimated_delivery is not None:
        shipment.estimated_delivery = update_data.estimated_delivery

    db.commit()
    db.refresh(shipment)
    return shipment

@shipment_router.delete("/delete-all", status_code=status.HTTP_204_NO_CONTENT)
def delete_all_shipments(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db.query(Shipment).filter(Shipment.created_by == current_user.id).delete()
    db.commit()


@shipment_router.delete("/{shipment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_shipment(
    shipment_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    shipment = db.query(Shipment).filter(
        Shipment.shipment_id == shipment_id,
        Shipment.created_by == current_user.id
    ).first()

    if not shipment:
        raise HTTPException(status_code=404, detail="Shipment not found")

    db.delete(shipment)
    db.commit()





# -------------------------------
# 🏢 Shipping Provider Endpoints
# -------------------------------

@provider_router.post("/create-provider", response_model=ShippingProviderResponse)
def create_provider(
    data: ShippingProviderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    existing = db.query(ShippingProvider).filter_by(name=data.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Provider already exists")

    provider = ShippingProvider(
        name=data.name,
        display_name=data.display_name,
        tracking_url=data.tracking_url,
        contact_email=data.contact_email,
        phone=data.phone,
        created_by=current_user.id
    )
    db.add(provider)
    db.commit()
    db.refresh(provider)
    return provider


@provider_router.get("/list-provider", response_model=List[ShippingProviderResponse])
def list_providers(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return db.query(ShippingProvider).filter(
        ShippingProvider.created_by == current_user.id
    ).all()


@provider_router.delete("/delete-provider/{provider_id}", status_code=204)
def delete_provider(
    provider_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    provider = db.query(ShippingProvider).filter_by(
        id=provider_id,
        created_by=current_user.id
    ).first()

    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")

    db.delete(provider)
    db.commit()
    return


@provider_router.patch("/patch-provider/{provider_id}", response_model=ShippingProviderResponse)
def update_provider(
    provider_id: UUID,
    data: ShippingProviderCreate,  # Reusing the same schema for update
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    provider = db.query(ShippingProvider).filter_by(
        id=provider_id,
        created_by=current_user.id
    ).first()

    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")

    provider.name = data.name
    provider.display_name = data.display_name
    provider.tracking_url = data.tracking_url
    provider.contact_email = data.contact_email
    provider.phone = data.phone

    db.commit()
    db.refresh(provider)
    return provider


# ------------------------
# 📦 CSV Exports
# ------------------------

@shipment_router.get("/export/csv", response_class=StreamingResponse)
def export_all_shipments_to_csv(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    shipments = db.query(Shipment).filter(Shipment.created_by == current_user.id).all()

    if not shipments:
        raise HTTPException(status_code=404, detail="No shipments found to export.")

    output = io.StringIO()
    writer = csv.writer(output)

    # Header row
    writer.writerow([
        "Shipment ID", "Tracking ID", "External Tracking ID", "Origin", "Destination", "Status",
        "Estimated Delivery", "Weight (kg)", "Dimensions", "Description", "Provider ID"
    ])

    # Data rows
    for s in shipments:
        writer.writerow([
            s.shipment_id,
            s.tracking_id,
            s.external_tracking_id,
            s.origin,
            s.destination,
            s.status,
            s.estimated_delivery,
            s.weight_kg,
            s.dimensions,
            s.description,
            s.provider_id
        ])

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=all_shipments.csv"}
    )


@shipment_router.get("/export/csv/by-provider/{provider_id}", response_class=StreamingResponse)
def export_shipments_by_provider_to_csv(
    provider_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    shipments = db.query(Shipment).filter(
        Shipment.created_by == current_user.id,
        Shipment.provider_id == provider_id
    ).all()

    if not shipments:
        raise HTTPException(status_code=404, detail="No shipments found for this provider.")

    output = io.StringIO()
    writer = csv.writer(output)

    writer.writerow([
        "Shipment ID", "Tracking ID", "External Tracking ID", "Origin", "Destination", "Status",
        "Estimated Delivery", "Weight (kg)", "Dimensions", "Description", "Provider ID"
    ])

    for s in shipments:
        writer.writerow([
            s.shipment_id,
            s.tracking_id,
            s.external_tracking_id,
            s.origin,
            s.destination,
            s.status,
            s.estimated_delivery,
            s.weight_kg,
            s.dimensions,
            s.description,
            s.provider_id
        ])

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=shipments_provider_{provider_id}.csv"}
    )
