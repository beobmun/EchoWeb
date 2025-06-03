# 📚 API 명세
---
## 📕 auth

### ✅ `POST /auth/signin`
- 기능: 로그인 처리
- 입력: `email`, `password`, `username(선택)`
- 출력: `result`, `message`
  - `result == true`: 로그인 성공
  - `result == false`: 로그인 실패

### ✅ `POST /auth/signup`
- 기능: 회원가입 처리
- 입력: `email`, `password`, `username`
- 출력: `result`, `message`
  - `result == true`: 회원가입 성공
  - `result == false`: 회원가입 실패
    -  `message`: 에러 내용

### ✅ `GET /auth/signup/{email}`
- 기능: 이메일 중복 확인
- 입력: `email`
- 출력: `result`, `message`
  - `result == true`: 사용 가능한 email
  - `result == false`: 이미 사용중인 email

---

## 📗 upload

### ✅ `POST /upload/zip`
- 기능: zip 파일 업로드 및 압축 해제
- 입력: zip 파일(mp4 파일 포함)
- 출력: `result`
    - `result == true`: `unzip_files`를 통해 unzip된 동영상 파일 path들 함께 출력
    - `result == false`: `message`를 통해 에러 내용 출력
 
### ✅ `POST /upload/video`
- 기능: 단일 비디오 업로드
- 입력: mp4 파일
- 출력: `result`
  - `result == true`: `video_path`를 통해 upload된 파일 path 출력
  - `result == false`: `message`를 통해 에러 내용 출력

---

## 📘 run

### ✅ `POST /run/classification`
- 기능: 비디오 분류 모델 실행
- 입력: `video_paths`: 여러 개의 video_paths 리스트
- 출력: `result`
  - `result == true`: `video_paths`를 통해 A4C로 분류된 동영상 파일들을 path 리스트
  - `result == false`: `message`를 통해 에러 내용 출력

### ✅  `GET /run/segmentation`
- 기능: segmentation 및 박출률(EF) 분석 실행
- 입력: `video_path`
- 출력:
  - `result == true`:
    - `origin_video_path`: 원본 영상 경로
    - `segmented_video_path`: segmentation된 영상 경로
    - `areas`: segmentation으로 수치화된 좌심실 영역 면적 리스트
    - `es_frames_path`: 수축기 말(ES) 프레임의 이미지 저장 경로
    - `ed_frames_path`: 이완기 말(ED) 프레임의 이미지 저장 경로
    - `es_points`: 비디오에서 수축기 말 프레임 인덱스 리스트
    - `ed_points`: 비디오에서 이완기 말 프레임 인덱스 리스트
    - `ef`: 좌심실 박출률(EF)
  - `result == false`: `message`를 통해 에러 내용 출력

