from fastapi import FastAPI
from starlette.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
import models, auth, upload_file, run_models
import os

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

# 정적 파일 경로 설정 -> 프론트엔드엣 동영상 파일을 불러오기 위해
os.makedirs("temp", exist_ok=True)
app.mount("/temp", StaticFiles(directory="temp"), name="temp")

# CORS 설정
# origins = [
#     "http://localhost:4242",
#     "http://127.0.0.1:4242",
#     "http://localhost:3000",
#     "http://127.0.0.1:3000",
#     "http://10.125.208.184:3000",
#     "http://10.125.208.185:3000",
#     "http://10.125.208.186:3000",
#     "http://10.125.208.187:3000",
#     "http://10.125.208.217:3000",
# ]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)



@app.get("/")
async def root():
    return {"EchoWeb AI Backend!!"}

