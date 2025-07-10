from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer

# Routers
from app.auth.routes import router as auth_router
from app.shipment.routes import shipment_router, provider_router
from app.analytics.routes import router as analytics_router  # ✅ NEW

# Create FastAPI app
app = FastAPI()

# Define OAuth2 token URL for Swagger (Authorize button) support
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/token")

# CORS setup for frontend access (Next.js)
origins = [
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers with clear URL prefixes and tags
app.include_router(auth_router, prefix="/auth", tags=["Auth"])
app.include_router(shipment_router, prefix="/shipments", tags=["Shipments"])
app.include_router(provider_router, prefix="/providers", tags=["Shipping Providers"])

app.include_router(analytics_router, prefix="/analytics", tags=["Analytics"])  # ✅ NEW
