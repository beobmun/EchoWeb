# EchoWeb AI
## 🎯 프로젝트 소개
심초음파(Echocardiography)는 심장 질환 진단에 필수적인 검사 방법이지만, 낮은 해상도와 높은 잡음 특성으로 인해 영상 해석이 어렵고 진단자의 숙련도에 따라 진단 결과에 편차가 발생할 수 있다.

이러한 문제를 해결하기 위해 본 프로젝트는 **좌심실(Left Ventricle)** 의 기능과 크기를 정량적으로 분석할 수 있는 도구를 제공한다. 특히 **좌심실 박출률(Ejection Fraction, EF)** 은 심장의 수축 및 이완 능력을 평가하는 핵심 지표로, 이를 정확하게 계산하기 위해 영상에서 좌심실의 정밀한 **분할(Segmentation)** 이 요구된다.

본 프로젝트에서는 다양한 각도에서 촬영된 심초음파 비디오를 대상으로:
- Classification 모델을 통해 EF 측정에 적합한 비디오를 선택하고,
- Segmentation 모델을 통해 해당 비디오에서 좌심실을 자동으로 분할한다.

이를 바탕으로 의료진이 AI 기반 분석을 직관적이고 효율적으로 사용할 수 있도록, 본 시스템은 웹 인터페이스를 통해 제공된다. 사용자는 심초음파 영상을 업로드하고, EF 계산 결과 및 면적 변화 시각화를 손쉽게 확인할 수 있다.

## 🖥️ DEMO
![Image](https://github.com/user-attachments/assets/91e39fa2-ee9b-407a-88bb-41bc3d56708f)

## 🚀 설치 및 실행 방법
### 1. 프로젝트 클론
```bash
git clone https://github.com/beobmun/EchoWeb.git
cd EchoWeb
```
<details>
  <summary>
    
  ### 2. Docker, Docker-compose 설치
  </summary>
  
  #### 2-1. Docker 설치에 필요한 패키지 설치
  ```bash
  sudo apt-get install apt-transport-https ca-certificates curl gnupg-agent software-properties-common
  ```
  #### 2-2. Docker 공식 GPG 설치
  ```bash
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -
  ```
  #### 2-3. Docker 공식 apt 저장소 추가
  ```bash
  sudo add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable"
  ```
  #### 2-4. Docker 설치
  ```bash
  sudo apt-get install docker-ce docker-ce-cli containerd.io
  ```
  #### 2-5. Docker 설치 확인
  ```bash
  sudo systemctl status docker
  docker -v
  ```
  #### 2-6. Docker-compose 설치
  ```bash
  sudo curl -SL "https://github.com/docker/compose/releases/download/v2.23.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
  ```
  #### 2-7. Docker-compose 권한 부여
  ```bash
  sudo chmod +x /usr/local/bin/docker-compose
  ```
  #### 2-8. Docker-compose 심볼릭 링크 지정
  ```bash
  sudo ln -s /usr/local/bin/docker-compose /usr/bin/docker-compose
  ```
  #### 2-9. Docker-compose 버전 확인
  ```bash
  docker-compose --version
  ```
</details>

### 3. model weights 다운
> [model_weights](https://drive.google.com/drive/folders/1Sz0Pox7EK7c0mRxSX12g7wUa3q6K_-Jg?usp=sharing)를 다운 받아 ```EchoWeb/backend/model_weights/``` 에 넣어주세요.
>
> 🔎 사용된 AI 모델에 대한 코드를 확인할 수 있습니다. : https://github.com/beobmun/Capstone_DeepEcho
### 4. .env 파일 설정
```
MYSQL_ROOT_PASSWORD=
MYSQL_DATABASE=
MYSQL_USER=
MYSQL_PASSWORD=

DB_HOST=
DB_PORT=3306
DB_USER=
DB_PASSWORD=
DB_NAME=
```
해당 내용을 작성 후 ```.env```파일을 ```EchoWeb\```에 저장해 주세요.
### 5. Docker-compose 실행
```bash
docker-compose up --build
```
### 6. 웹 서비스 실행
> http://localhost:8042

## 📦 기술 스택
|  구분  |사용기술|
|---|------|
|  Frontend  |<img src="https://img.shields.io/badge/react-61DAFB?style=for-the-badge&logo=react&logoColor=white">|
|  Backend  |<img src="https://img.shields.io/badge/fastapi-009688?style=for-the-badge&logo=fastapi&logoColor=white">|
|  Database  |<img src="https://img.shields.io/badge/mysql-4479A1?style=for-the-badge&logo=mysql&logoColor=white">|
|  AI Model  |<img src="https://img.shields.io/badge/pytorch-EE4C2C?style=for-the-badge&logo=pytorch&logoColor=white">||
|  Infra  |<img src="https://img.shields.io/badge/docker-2496ED?style=for-the-badge&logo=docker&logoColor=white"> <img src="https://img.shields.io/badge/nginx-009639?style=for-the-badge&logo=nginx&logoColor=white">|

## 🏗️ 시스템 구성 (3-Tier Architecture)
![docker 3-tier Archtecture](https://github.com/user-attachments/assets/25c7ae01-789f-4d19-80e7-bcc1f8c9c22e)

## 📬 API 명세
|Method|URL|기능|
|------|---|---|
|POST|`/auth/signin`|로그인|
|POST|`/auth/signup`|회원가입|
|POST|`/upload/zip`|`.zip`파일 업로드|
|POST|`/upload/video`|`.mp4`파일 업로드|
|POST|`/run/classification`|classification 모델 실행|
|GET|`/run/segmentation`|segmentation 모델 실행|
> ### Swagger 문서 <img src="https://img.shields.io/badge/swagger-85EA2D?style=for-the-badge&logo=swagger&logoColor=white">
> FastAPI Swagger UI로 전체 API 문서를 확인할 수 있습니다:
http://localhost:4242/docs

## 📁 디렉토리 구조
```
EchoWeb/
├── backend/
│   └── model_weight/...
│   └── utils/...
│   └── Dockerfile
│   └── main.py ...
├── db/
│   └── init.sql
├── frontend/
│   └── react-echoweb/
│       ├── nginx/
│       │   └── default.conf
│       ├── public/...
│       ├── src/
│       │   └── pages/...
│       │   └── App.js ...
│       ├── Dockerfile
│       ├── package-lock.json
│       └── package.json
└── docker-compose.yml
```

## 👨‍💻 Team Members
|이름|역할|GitHub|
|--|----|------|
|조계진|프론트엔드 개발|https://github.com/gyejin|
|한법문|백엔드 개발|https://github.com/beobmun|

## ⚖️ License
MIT License
