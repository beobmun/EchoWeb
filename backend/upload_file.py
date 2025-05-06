from fastapi import APIRouter
from fastapi import UploadFile, File

upload = APIRouter(prefix="/upload")

@upload.post("/zip", tags=["upload"])
async def upload_zip(file: UploadFile):
    # 파일이 zip 파일인지 확인하는 로직을 추가해야 합니다.
    # 예를 들어, file.content_type이 "application/zip"인지 확인합니다.
    
    # upload_path = f"temp/{file.filename}"
    
    # content = await file.read()
    # with open(upload_path, "wb") as f:
    #     f.write(content)
        
    return {"filename": file.filename, "content_type": file.content_type}  

@upload.get("/unzip", tags=["upload"])
async def unzip_file(file_path: str):
    # file_path의 zip 파일을 unzip하는 로직을 추가해야 합니다.
    # 예를 들어, zipfile 모듈을 사용하여 zip 파일을 unzip하고,
    # unzip된 파일들을 temp 폴더에 저장합니다.
    # 여기서는 단순히 unzip된 파일들의 경로를 반환합니다.

    return {"message": ["unziped_file_path/file1.txt", "unziped_file_path/file2.txt"]}

@upload.post("/video", tags=["upload"])
async def upload_video(file: UploadFile):
    # video 파일을 업로드하는 로직을 추가해야 합니다.
    # 예를 들어, video 파일을 temp 폴더에 저장하고,
    # 저장된 video 파일의 경로를 반환합니다.
    # 여기서는 단순히 video 파일의 경로를 반환합니다.
    return {"message": f"uploaded_video_path/video.mp4"}

