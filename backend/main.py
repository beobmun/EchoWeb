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

