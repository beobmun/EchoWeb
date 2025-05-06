from fastapi import APIRouter

run = APIRouter(prefix="/run")

@run.get("/classification", tags=["run"])
async def run_classification(file_path: str):
    # classification 모델을 실행하는 로직을 추가해야 합니다.
    # 예를 들어, classification 모델을 실행하고,
    # 결과를 반환합니다.
    # classification 모델의 결과로는 해당 영상의 file_path가 return됩니다.
    # 여기서는 단순히 file_path를 반환합니다.
    return {"result": ["classification_result_path/file1.mp4", "classification_result_path/file2.mp4"]}

@run.get("/segmentation", tags=["run"])
async def run_segmentation(file_path: str):
    # segmentation 모델을 실행하는 로직을 추가해야 합니다.
    # 예를 들어, segmentation 모델을 실행하고,
    # 결과를 반환합니다.
    # segmentation 모델의 결과로는 해당 영상의 file_path가 return됩니다.
    # 여기서는 단순히 file_path, ef, 면적 변화 흐름 그래프를 반환합니다.
    return {"result": "segmentation_result_path/file1.mp4",
            "ef": 30,
            "area_change_graph": [200, 300, 400, 500, 600, 700, 800, 900, 1000, 800, 700, 600, 500, 400, 300, 200, 400, 500, 600, 700, 800, 900, 1000, 800, 700, 600, 500, 400, 300]}
