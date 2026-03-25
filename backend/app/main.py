from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.exceptions import AuthenticationError, authentication_error_handler
from app.routes.auth import router as auth_router
from app.routes.loans import router as loans_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield


app = FastAPI(title="Reddy Loan Helper API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_exception_handler(AuthenticationError, authentication_error_handler)

app.include_router(auth_router)
app.include_router(loans_router)


@app.get("/api/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}
