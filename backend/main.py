from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import models
from database import engine
from routers import products, customers, orders, dashboard

# Automatically create database tables if they do not exist
try:
    models.Base.metadata.create_all(bind=engine)
    print("Database tables initialized successfully.")
except Exception as e:
    print(f"Error initializing database tables: {e}")

app = FastAPI(
    title="Inventory & Order Management API",
    description="Python FastAPI backend serving a PostgreSQL database for order and stock tracking.",
    version="1.0.0"
)

# CORS configuration to allow local development and deployment environments
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific domains for enhanced security
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(products.router)
app.include_router(customers.router)
app.include_router(orders.router)
app.include_router(dashboard.router)

@app.get("/")
def read_root():
    return {
        "status": "online",
        "message": "Inventory & Order Management API is fully operational.",
        "documentation": "/docs"
    }
