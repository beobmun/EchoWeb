from fastapi import FastAPI
from starlette.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse

import models, auth, upload_file, run_models
from database import engine

models.Base.metadata.create_all(bind=engine)

SWAGGER_HEADERS = {
    "title": "EchoWeb AI"
}

app = FastAPI(
    **SWAGGER_HEADERS
)

app.include_router(auth.auth)
app.include_router(upload_file.upload)
app.include_router(run_models.run)

# CORS 설정
origins = [
    "http://localhost:4242",
    "http://127.0.0.1:4242"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)



@app.get("/")
async def root():
    return {"message": "Hello World"}

