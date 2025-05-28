# EchoWeb AI
[사용된 AI 모델 : https://github.com/beobmun/Capstone_DeepEcho]

## 🎯 프로젝트 소개
심초음파(Echocardiography)는 심장 질환 진단에 필수적인 검사 방법이지만, 낮은 해상도와 높은 잡음 특성으로 인해 영상 해석이 어렵고 진단자의 숙련도에 따라 진단 결과에 편차가 발생할 수 있다.

이러한 문제를 해결하기 위해 본 프로젝트는 **좌심실(Left Ventricle)** 의 기능과 크기를 정량적으로 분석할 수 있는 도구를 제공한다. 특히 **좌심실 박출률(Ejection Fraction, EF)** 은 심장의 수축 및 이완 능력을 평가하는 핵심 지표로, 이를 정확하게 계산하기 위해 영상에서 좌심실의 정밀한 **분할(Segmentation)** 이 요구된다.

본 프로젝트에서는 다양한 각도에서 촬영된 심초음파 비디오를 대상으로:
- Classification 모델을 통해 EF 측정에 적합한 비디오를 선택하고,
- Segmentation 모델을 통해 해당 비디오에서 좌심실을 자동으로 분할한다.

이를 바탕으로 의료진이 AI 기반 분석을 직관적이고 효율적으로 사용할 수 있도록, 본 시스템은 웹 인터페이스를 통해 제공된다. 사용자는 심초음파 영상을 업로드하고, EF 계산 결과 및 면적 변화 시각화를 손쉽게 확인할 수 있다.

## 🖥️ DEMO
**데모 gif 넣기**


## 📦 기술 스택
|  구분  |사용기술|
|---|------|
|  Frontend  |<img src="https://img.shields.io/badge/react-61DAFB?style=for-the-badge&logo=react&logoColor=white">|
|  Backend  |<img src="https://img.shields.io/badge/fastapi-009688?style=for-the-badge&logo=fastapi&logoColor=white">|
|  Database  |<img src="https://img.shields.io/badge/mysql-4479A1?style=for-the-badge&logo=mysql&logoColor=white">|
|  AI Model  |<img src="https://img.shields.io/badge/pytorch-EE4C2C?style=for-the-badge&logo=pytorch&logoColor=white">||
|  Infra  |<img src="https://img.shields.io/badge/docker-2496ED?style=for-the-badge&logo=docker&logoColor=white"> <img src="https://img.shields.io/badge/nginx-009639?style=for-the-badge&logo=nginx&logoColor=white">|

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
|조계진|프론트엔드 개발|https://github.com/CorinEz|
|한법문|백엔드 개발|https://github.com/beobmun|

