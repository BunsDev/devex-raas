from fastapi import FastAPI
from fastapi.responses import JSONResponse

app = FastAPI()

@app.get("/ping")
async def ping():
    """
    Handles the /ping endpoint, returning a success message.
    """
    return JSONResponse(content={"success": True, "message": "pong"})

@app.get("/{full_path:path}")
async def catch_all(full_path: str):
    """
    Handles all other routes, returning a default message.
    The 'full_path:path' syntax allows FastAPI to capture the entire path.
    """
    return JSONResponse(content={"success": True, "message": "Winter is Coming 🐺"})
