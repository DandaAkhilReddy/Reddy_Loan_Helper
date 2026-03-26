from __future__ import annotations

from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles

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


# Serve frontend static files — try multiple possible locations
_PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
_CANDIDATES = [
    _PROJECT_ROOT / "frontend" / "dist",                  # from src/api/ → src/frontend/dist
    _PROJECT_ROOT.parent / "src" / "frontend" / "dist",   # from project root
    Path("/app/src/frontend/dist"),                        # Railway absolute
    Path("/app/frontend/dist"),                            # Railway if flattened
    Path.cwd() / "src" / "frontend" / "dist",             # cwd-relative
]
_FRONTEND_DIST: Path | None = next((p for p in _CANDIDATES if p.is_dir()), None)

import logging as _logging
_log = _logging.getLogger(__name__)
_log.info("Frontend dist search: %s", {str(p): p.exists() for p in _CANDIDATES})
_log.info("CWD: %s, __file__: %s", Path.cwd(), Path(__file__).resolve())

if _FRONTEND_DIST is not None and (_FRONTEND_DIST / "assets").is_dir():
    app.mount("/assets", StaticFiles(directory=_FRONTEND_DIST / "assets"), name="assets")

    @app.get("/{full_path:path}", response_class=HTMLResponse, include_in_schema=False)
    async def serve_spa(request: Request, full_path: str) -> FileResponse:
        """Serve the React SPA for all non-API routes."""
        assert _FRONTEND_DIST is not None
        file_path = _FRONTEND_DIST / full_path
        if file_path.is_file():
            return FileResponse(file_path)
        return FileResponse(_FRONTEND_DIST / "index.html")
elif _FRONTEND_DIST is None:
    @app.get("/", include_in_schema=False)
    async def no_frontend() -> dict[str, str]:
        candidates_str = ", ".join(str(p) for p in _CANDIDATES)
        return {"error": "Frontend dist not found", "searched": candidates_str}
