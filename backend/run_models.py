from fastapi import APIRouter, HTTPException
from utils.classification import Classification
from utils.segmentation import Segmentation
run = APIRouter(prefix="/run")

@run.post("/classification", tags=["run"])
async def run_classification(file_paths: list[str]):
    try:
        results = list()
        # 동영상 파일 경로를 받아서 분류 모델을 실행합니다.
        for f in file_paths:
            # 동영상 파일인지 확인
            if not f.endswith(('.mp4', '.avi', '.mov')):
                continue
            # Classification 모델을 실행
            result = Classification(f).run()
            if result is not None:
                results.append(f)
        if not results:
            return {"result": True, "file_path": file_paths}
        else:
            return {"result": True, "file_path": results}
    except HTTPException as e:
        return {"result": False, "message": str(e)}
    
@run.get("/segmentation", tags=["run"])
async def run_segmentation(video_path: str):
    try:
        # segmentation 모델을 실행하는 로직을 추가해야 합니다.
        output_path = "temp/segmentation_output"
        Segmentation().run(video_path=video_path, output_path=output_path)
        # 예를 들어, segmentation 모델을 실행하고,
        # 결과를 반환합니다.
        # segmentation 모델의 결과로는 해당 영상의 file_path가 return됩니다.
        # 여기서는 단순히 file_path, ef, 면적 변화 흐름 그래프를 반환합니다.
        return {"result": True, "origin_path": video_path, "result_path": output_path}
    except HTTPException as e:
        return {"result": False, "message": str(e)}