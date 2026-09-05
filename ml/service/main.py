"""
SmartConveyor - Machine Learning Inference Microservice
SIH Problem Statement 26008 (NMDC Iron Ore Mining)
Exposes FastAPI REST API on Cloud Run for RUL prediction, anomaly detection, and vision defect classification.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import predictive, anomaly, vision, chatbot

app = FastAPI(
    title="SmartConveyor ML Microservice",
    description="NMDC Iron Ore Mining - Conveyor Belt Joint Rupture Monitoring and Predictive Intelligence API",
    version="1.0.0"
)

# Enable CORS for Cloud Functions and local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include inference endpoints
app.include_router(predictive.router, tags=["Predictive Maintenance (RUL)"])
app.include_router(anomaly.router, tags=["Edge Anomaly Detection"])
app.include_router(vision.router, tags=["Computer Vision Line-Scan"])
app.include_router(chatbot.router, tags=["AI Assistant Chatbot"])

@app.get("/")
@app.get("/health")
async def health_check():
    return {
        "service": "SmartConveyor ML Inference Microservice",
        "status": "healthy",
        "version": "1.0.0",
        "facility": "NMDC Iron Ore Mining",
        "endpoints": [
            "POST /predict-rul",
            "POST /detect-anomaly",
            "POST /classify-image"
        ]
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
