# 🤝 Contributing to EchoWeb (심초음파 AI 분석 웹 플랫폼)

먼저, 본 프로젝트에 관심을 가져주셔서 감사합니다!
이 문서는 여러분이 EchoWeb 프로젝트에 기여하기 위해 따라야 할 절차와 규칙을 안내합니다.

---

## 📋 목차

1. 프로젝트 소개
2. 브랜치 전략
3. 커밋 메시지 규칙
4. PR(Pull Request) 가이드
6. 이슈 작성 가이드

---

## 1. 프로젝트 소개

EchoWeb은 심초음파 비디오 분석을 위한 AI 기반 웹 플랫폼입니다.
본 프로젝트는 다음 기능을 포함합니다:

- View Classification (CNN)
- 좌심실 Segmentation (UNet + SAM2)
- EF(Ejection Fraction) 계산
- React 기반 사용자 인터페이스
- FastAPI 기반 백엔드
- Docker Compose로 통합 배포

## 2. 브랜치 전략

- `main`: 배포용 브랜치입니다. 직접 Push 금지!
- `develop`: 개발 통합 브랜치입니다. 모든 기능은 이 브랜치로 PR을 보냅니다.
- `{기능명}`: 기능 단위 브랜치입니다.
  - 예: `classification-api`, `frontend-upload`
 
## 3. 커밋 메시지 규칙

```bash
# 형식: <타입>: <변경 내용 요약>
```

> feat: 기능 추가
> 
> fix: 오류 수정
> 
> docs: README에 추가
> 
> style: 코드 포맷 정리
> 
> refactor: 구조 개선, 성능 최적화 등
> 
> test: 테스트 코드 추가/수정
> 
> chore: 빌드 설정, 의존성 패치 등

예시:
```bash
git commit -m "feat: Add classification endpoint to FastAPI"
```

## 4. PR(Pull Request) 가이드
- 제목은 명확히 작성 (ex: `feat: add EF calculation`)
- `develop`브랜치로 PR 생성
- 관련된 이슈가 있다면 PR 설명에 `Closes #issue_number` 추가
- CI 확인 후 Merge 가능

## 5. 이슈 작성 가이드

이슈 등록 시 다음 양식을 따라 주세요:

```markdown
### 버그 설명
- 업로드된 비디오가 분할되지 않습니다.

### 재현 방법
1. /upload 페이즈 접속
2. 특정 .mp4 업로드
3. "다음" 클릭 시 오류 발생

### 기대 결과
- 결과 화면으로 넘어가야 함.

### 환경
- OS: Ubuntu 22.04
- 브라우저: Chrome 124.0
```
또는 기능 요청 시:
```markdown
### 요청 기능
- Upload 페이지에 진행률(progress bar) 표시 기능 추가

### 제안 이유
- 사용자 편의성 향상
```
---
# 📮 문의
프로젝트 관련 문의는 Issue 탭을 통해 남겨주세요.
