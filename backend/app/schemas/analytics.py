from pydantic import BaseModel

class ShipmentSummary(BaseModel):
    total: int
    delivered: int
    pending: int
    in_transit: int
    delayed: int
    cancelled: int
