import logging

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

from app.api.routes import router
from app.config import get_settings

logger = logging.getLogger("forgemind")

settings = get_settings()

app = FastAPI(title=settings.app_name, version="0.1.0")


class CatchAllMiddleware(BaseHTTPMiddleware):
    """Turn any unhandled exception into a JSON 500 instead of a bare error.

    Registered as a *user* middleware (via add_middleware) below, added
    BEFORE CORSMiddleware. Starlette's default exception handling — via
    ServerErrorMiddleware — sits outside every user middleware, including
    CORSMiddleware, so a 500 it produces never gets CORS headers attached;
    the browser then reports a misleading CORS failure instead of the real
    error. Catching the exception here, inside CORSMiddleware, ensures the
    response still passes through CORS header injection.
    """

    async def dispatch(self, request: Request, call_next):
        try:
            return await call_next(request)
        except Exception as exc:  # noqa: BLE001
            logger.exception("Unhandled error on %s %s", request.method, request.url.path)
            return JSONResponse(status_code=500, content={"error": str(exc) or exc.__class__.__name__})


# Order matters: add_middleware makes each new one the outermost of the user
# layer, so CatchAllMiddleware (added first) ends up wrapped BY CORSMiddleware
# (added second) — exactly what the class docstring above depends on.
app.add_middleware(CatchAllMiddleware)

origins = [o.strip() for o in settings.cors_origins.split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins or ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix=settings.api_prefix)


@app.get("/")
async def root():
    return {
        "name": "ForgeMind AI",
        "description": "Ask questions about plant equipment and documents.",
        "docs": "/docs",
    }
