# ✍️ 핵심 클래스 및 기능

## 🫀 Classification 관련

#### `CNNModel`
- PyTorch 기반 CNN 모델
- 입력: 단일 채널 `224x224` 이미지
- 출력: 2 class softmax logit
  
#### `ClassificationModel`
- `CNNModel`을 래핑하여:
  - `.with_weight()`: 모델 가중치 로드
  - `.with_device()`: 장치 설정(gpu or cpu)
  - `.build()`: 모델 반환

#### `Classfication`
- 비디오에서 프레임을 추출해 CNN 모델로 예측
- `.predict()`: 프레임별로 예측 후 평균 계산
- `.run()`: 기준보다 낮으면 유효한 뷰로 간주하고 경로 반환
---
## 💼 Segmentation 관련

#### `UnetPredictor`
- UNet 모델로 마스크 예측
- `.load_weight()`, `.to()`, `.predict()`: 마스크 반환

#### `SAM2Predictor`
- SAM2 모델로 시간에 다른 마스크 전파
- `with_video_path()`, `.with_output_path()`, `.load_weight()`
- `.predict(mask)`: 초기 포인트로 예측 전파
- `.save_segmented_video(...)`: 영상 저장
- `.get_segmented_video_path()`, `.get_video_segment()`

#### `Calculator`
- 영역 계산 및 박출률 추정
- `.calc_areas()`: 프레임별 영역
- `.find_es_ed()`: 수축기(ES)/이완기(ED) 프레임 탐지
- `.save_frames()`: 프레임 저장
- `.calc_ef()`: EF 계산

#### `Segmentation`
- 전체 파이프라인을 연결
- `.run()`: UNet -> SAM2 -> Calculator 실행
- `get_*()`: 결과 접근자 메서드들
---
## 📽️ 영상 처리 관련

#### `Video2Img`
- OpenCV로 비디오 로드 및 프레임 추출
- `.load_video()`, `.convert()`, `.save_imgs()`
- `.get_fps()`, `.get_width()`, `.get_height()`, `.get_imgs()`
---
## 🛠️ 보조 클래스

#### `Dataset`
- 프레임을 `torchvision` 텐서로 로딩하는 Dataset

#### `Resize`
- 이미지를 특정 크기로 리사이징

#### `GetPoints`
- 마스크에서 positive/negative 포인트를 샘플링하여 SAM2에 제공

# ⛪️ Class Diagram
![class_diagram](https://github.com/user-attachments/assets/d671c3fb-3ab3-4a3d-932f-6ec4170a5dd3)

