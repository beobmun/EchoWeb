from fastapi import FastAPI
from starlette.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
import auth
import upload_file


app = FastAPI()

app.include_router(auth.auth)
app.include_router(upload_file.upload)

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
    return FileResponse("../frontend/home.html")

