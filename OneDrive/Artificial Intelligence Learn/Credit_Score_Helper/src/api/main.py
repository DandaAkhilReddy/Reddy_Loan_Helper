from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.api.routes import accounts, factors, payoff, projection, report

app = FastAPI(
    title="Credit Score Helper API",
    description="Serves credit analysis data parsed from a structured credit report.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["GET"],
    allow_headers=["*"],
)

app.include_router(report.router, prefix="/api", tags=["Report"])
app.include_router(factors.router, prefix="/api", tags=["Score Factors"])
app.include_router(payoff.router, prefix="/api", tags=["Payoff Plan"])
app.include_router(projection.router, prefix="/api", tags=["Projection"])
app.include_router(accounts.router, prefix="/api", tags=["Accounts"])


@app.get("/health", tags=["Health"])
def health_check() -> dict[str, str]:
    return {"status": "ok"}
