from fastapi import APIRouter, UploadFile, HTTPException, File
import zipfile
import os
import shutil

upload = APIRouter(prefix="/upload")

def unzip_file(src, dest):
    try:
        os.makedirs(dest, exist_ok=True)
        with zipfile.ZipFile(src, 'r') as zip_ref:
            zip_ref.extractall(dest)
            # dest 경로에 __MACOSX 폴더가 생성되는 경우 삭제
            shutil.rmtree(os.path.join(dest, '__MACOSX'), ignore_errors=True)
            # 압축 해제된 파일 경로를 반환
            unzip_files = zip_ref.namelist()
            # 동영상 외 파일은 삭제, video 파일만 남김
            video_files = list()
            for file in unzip_files:
                try:
                    if not file.startswith('__MACOSX') and file.endswith(('.mp4', '.avi')):
                        video_files.append(file)
                    elif file.startswith('__MACOSX'):
                        continue
                    else:
                        os.remove(os.path.join(dest, file))
                except Exception as e:
                    print(f"Error removing file {file}: {str(e)}")
            # video_files 경로 반환
            return video_files
            # return unzip_files
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error unzipping file: {str(e)}")
    
@upload.post("/zip", tags=["upload"])
async def upload_zip(file: UploadFile):
    try:
        # 파일이 zip 파일인지 확인
        if file.content_type != "application/zip":
            raise HTTPException(status_code=400, detail="Invalid file type. Only zip files are allowed.")
        os.makedirs("temp", exist_ok=True)
        upload_path = f"temp/{file.filename}"
    
        # 파일을 temp 폴더에 저장
        content = await file.read()
        with open(upload_path, "wb") as f:
            f.write(content)
        # 파일을 temp 폴더에 저장한 후, unzip_file 함수를 호출하여 압축 해제
        unzip_files = unzip_file(upload_path, "temp")
        return {"result": True, "unzip_files": unzip_files}  
    except HTTPException as e:
        return {"result": False, "message": str(e)}

@upload.post("/video", tags=["upload"])
async def upload_video(file: UploadFile):
    try:
        # 파일이 mp4나 avi 파일인지 확인
        if file.content_type != "video/mp4":
            raise HTTPException(status_code=400, detail="Invalid file type. Only mp4 files are allowed.")
        os.makedirs("temp", exist_ok=True)
        upload_path = f"temp/{file.filename}"
        # 파일을 temp 폴더에 저장
        content = await file.read()
        with open(upload_path, "wb") as f:
            f.write(content)
        return {"result": True, "file_path": upload_path}
    except HTTPException as e:
        return {"result": False, "message": str(e)}

