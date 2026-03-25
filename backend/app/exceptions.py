from fastapi import Request
from fastapi.responses import JSONResponse


class AuthenticationError(Exception):
    def __init__(self, detail: str = "Invalid or expired token"):
        self.detail = detail


async def authentication_error_handler(request: Request, exc: AuthenticationError) -> JSONResponse:
    return JSONResponse(
        status_code=401,
        content={"error": {"code": "UNAUTHORIZED", "message": exc.detail}},
    )
