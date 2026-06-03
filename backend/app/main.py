from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from mangum import Mangum

from app.routers import entries, upload, analysis

app = FastAPI(title="Trade Lab API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(entries.router, prefix="/entries", tags=["entries"])
app.include_router(upload.router, prefix="/upload", tags=["upload"])
app.include_router(analysis.router, prefix="/analysis", tags=["analysis"])


@app.get("/health")
def health():
    return {"status": "ok"}


handler = Mangum(app, lifespan="off")
