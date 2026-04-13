# FeHelper - 프론트엔드 도우미

<div align="center">

![FeHelper Logo](https://user-images.githubusercontent.com/865735/75407628-7399c580-594e-11ea-8ef2-00adf39d61a8.jpg)

**30개 이상의 개발자 도구 모음 | Chrome / Edge / Firefox 브라우저 확장**

[![Chrome Web Store](https://img.shields.io/chrome-web-store/v/pkgccpejnmalmdinmhkkfafefagiiiad?label=Chrome&logo=googlechrome&color=3b82f6&style=for-the-badge)](https://chrome.google.com/webstore/detail/pkgccpejnmalmdinmhkkfafefagiiiad)
[![Chrome Web Store Users](https://img.shields.io/chrome-web-store/users/pkgccpejnmalmdinmhkkfafefagiiiad?label=Users&logo=googlechrome&color=3b82f6&style=for-the-badge)](https://chrome.google.com/webstore/detail/pkgccpejnmalmdinmhkkfafefagiiiad)
[![GitHub Stars](https://img.shields.io/github/stars/zxlie/FeHelper?style=for-the-badge&color=8b5cf6&logo=github)](https://github.com/zxlie/FeHelper)
[![개발 이력](https://img.shields.io/badge/since-2012-f59e0b?style=for-the-badge&logo=calendar&logoColor=white)](https://github.com/zxlie/FeHelper)
[![CI](https://img.shields.io/github/actions/workflow/status/zxlie/FeHelper/ci.yml?style=for-the-badge&label=CI&logo=githubactions&logoColor=white)](https://github.com/zxlie/FeHelper/actions)

**[中文](README.md) | [English](README_EN.md) | [日本語](README_JA.md)**

[공식 사이트](https://fehelper.com) · [온라인 문서](https://fehelper.com/docs.html) · [이슈·피드백](https://github.com/zxlie/FeHelper/issues)

</div>

---

## 기능 한눈에 보기

### JSON 처리
| 기능 | 설명 |
|------|------|
| JSON 포맷 | 자동/수동 포맷, 구문 강조, 접기/펼치기, 노드 경로, BigInt 무손실 정밀도 |
| JSON 비교 | 두 JSON의 구조적 차이 비교, 차이 항목 강조 |
| JSON → Excel | JSON 데이터를 Excel 표로 한 번에 변환 |

### 인코딩/디코딩
| 기능 | 설명 |
|------|------|
| Unicode | 한자 ↔ `\uXXXX` 상호 변환 |
| URL / UTF-8 / UTF-16 | `%XX` / `\xXX` 인코딩·디코딩 |
| Base64 | 인코딩 및 디코딩 |
| Hex | 문자열 ↔ 16진수 |
| MD5 / SHA1 | 해시 계산 |
| Gzip | CompressionStream API 기반 압축/해제 |
| JWT | Header + Payload + Sign 디코딩 |
| Cookie | JSON 형태로 포맷 |
| HTML 엔티티 | 일반/깊은 인코딩 및 디코딩 |
| 문자열 이스케이프 | `\n` `\t` `\"` 등 이스케이프/역이스케이프 |

### 개발·디버깅
| 기능 | 설명 |
|------|------|
| 코드 정리 | JavaScript / CSS / HTML / XML / SQL 코드 포맷 |
| 코드 압축 | HTML / JS / CSS 압축 |
| 정규식 | 실시간 매칭·치환 테스트 |
| 간이 Postman | GET / POST / HEAD API 디버깅 |
| WebSocket | WebSocket 연결 테스트 및 메시지 분석 |
| 유저스크립트 | 페이지 스크립트 주입 |

### 변환 도구
| 기능 | 설명 |
|------|------|
| 타임스탬프 변환 | Unix ↔ 날짜 상호 변환, 다중 시간대 월드 클럭, Windows FILETIME 상호 변환 |
| 진법 변환 | 2/4/8/10/16진 상호 변환, BigInt로 초대형 정수 무손실 |
| 색 변환 | HEX / RGB / HSL / HSV 상호 변환, 투명도 지원 |

### 이미지 및 생성
| 기능 | 설명 |
|------|------|
| QR 코드 | 생성(로고·색·크기 옵션) 및 스캔 디코딩 |
| 바코드 | Code128 / Code39 / EAN-13 / EAN-8 / UPC / ITF-14 |
| UUID / ID 생성기 | UUID v4, 스노우플레이크 ID(생성 + 파싱), NanoID |
| 이미지 Base64 | 이미지 ↔ Base64 상호 변환 |
| 웹 페이지 캡처 | 보이는 영역 / 전체 페이지 스크롤 캡처 |
| 컬러 피커 | 임의 요소에서 색상 값 추출 |
| SVG 변환 | SVG ↔ PNG 등 형식 변환 |

### 기타 도구
| 기능 | 설명 |
|------|------|
| AI 도우미 | 코드 최적화, 설계, 자료 검색 |
| Mock 데이터 | 이름, 휴대폰, 신분증, 주소 등 테스트 데이터 생성 |
| 무작위 비밀번호 | 길이·문자 종류 사용자 정의 |
| 메모·스티커 | 분류·폴더 관리, 가져오기/내보내기 |
| Markdown 변환 | HTML → Markdown, PDF 다운로드 |
| 포스터 제작 | 다중 템플릿 포스터 디자인 |
| 차트 제작 | 다양한 차트 유형, 데이터 시각화 |
| 페이지 성능 | 페이지 로드 시간 분석 |

---

## 최근 업데이트

### v2026.04 주요 개선

**신규 기능**
- 바코드 생성(Code128 / EAN-13 / UPC 등 6종 형식)
- UUID v4 / 스노우플레이크 ID / NanoID 생성기(신규 도구 페이지)
- Windows FILETIME ↔ 날짜 상호 변환
- 문자열 이스케이프/역이스케이프 인코딩·디코딩
- 진법 변환 BigInt 지원(초대형 정수 무손실)

**보안 강화**
- 프로젝트 전반 `evalCore` 동적 실행을 안전한 방식으로 교체
- Toast / innerHTML XSS 주입 수정
- Content Script 주입 로직 개선(`insertCSS`로 잘못 사용된 API 대체)
- `_codeBeautify` fileType 화이트리스트 검증

**핵심 수정**
- JSON BigInt 무손실 정밀도 처리(순수 함수 모듈 `json-utils.js`)
- Service Worker 절전 문제(`setTimeout` 대신 `chrome.alarms`)
- Content Script를 `document_idle` + `all_frames: false`로 변경, Google Meet 등 사이트 크래시 수정
- 타임스탬프 `0` 검증 수정
- 코드 정리 `let`/`const` 구문 호환

**엔지니어링**
- 단위 테스트: Vitest + 79개 테스트 케이스
- CI/CD: GitHub Actions 자동 테스트
- ESLint 코드 스타일
- 불필요한 의존성·데드 코드 정리
- Babel target Chrome 58 → 100

---

## 설치

### 브라우저 스토어(권장)

| 브라우저 | 설치 링크 |
|--------|----------|
| Chrome | [Chrome Web Store](https://chrome.google.com/webstore/detail/pkgccpejnmalmdinmhkkfafefagiiiad) |
| Edge | [Microsoft Edge Add-ons](https://microsoftedge.microsoft.com/addons/detail/fehelper%E5%89%8D%E7%AB%AF%E5%8A%A9%E6%89%8B/pkgccpejnmalmdinmhkkfafefagiiiad) |
| Firefox | [Firefox Add-ons](https://addons.mozilla.org/en-US/firefox/addon/fehelper-%E5%89%8D%E7%AB%AF%E5%8A%A9%E6%89%8B/) |

### 소스 설치

```bash
git clone https://github.com/zxlie/FeHelper.git
cd FeHelper
npm install
npm test        # 테스트 실행
```

`chrome://extensions/`를 연 뒤 개발자 모드를 켜고, 압축 해제된 확장 프로그램을 로드하여 `apps` 폴더를 선택합니다.

### 오프라인 설치

[Chrome-Stats](https://chrome-stats.com/d/pkgccpejnmalmdinmhkkfafefagiiiad)에서 CRX 또는 ZIP을 받아 `chrome://extensions/` 페이지로 끌어다 놓아 설치합니다.

---

## 개발

```bash
npm install          # 의존성 설치
npm test             # Vitest 단위 테스트 실행
npm run test:watch   # 테스트 워치 모드
npm run test:coverage # 커버리지 리포트
npx eslint apps/     # 코드 스타일 검사
```

### 프로젝트 구조

```
FeHelper/
├── apps/                    # 확장 소스
│   ├── manifest.json        # Chrome Extension MV3 매니페스트
│   ├── background/          # Service Worker
│   ├── popup/               # 팝업 패널
│   ├── options/             # 설정 페이지 + 도구 마켓
│   ├── json-format/         # JSON 포맷
│   ├── en-decode/           # 인코딩/디코딩
│   ├── timestamp/           # 타임스탬프
│   ├── trans-radix/         # 진법 변환
│   ├── qr-code/             # QR 코드 + 바코드
│   ├── uuid-gen/            # UUID / 스노우플레이크 ID
│   ├── code-beautify/       # 코드 정리
│   └── ...                  # 기타 도구
├── test/                    # Vitest 단위 테스트
├── .github/workflows/       # CI/CD
├── vitest.config.js
├── eslint.config.js
└── package.json
```

### 기여 가이드

1. 이 저장소를 Fork합니다.
2. 브랜치 생성: `git checkout -b feature/your-feature`
3. 변경 사항 커밋: `git commit -m 'Add some feature'`
4. 푸시: `git push origin feature/your-feature`
5. Pull Request를 생성합니다.

---

## 연락처

- 공식 사이트: [fehelper.com](https://fehelper.com)
- 이메일: xianliezhao@foxmail.com
- 위챗: 398824681
- 피드백: [GitHub Issues](https://github.com/zxlie/FeHelper/issues)

## 라이선스

[MIT License](LICENSE)

---

<div align="center">

**FeHelper가 도움이 되었다면 Star를 눌러 주세요!**

[![Star History Chart](https://api.star-history.com/svg?repos=zxlie/FeHelper&type=Date)](https://star-history.com/#zxlie/FeHelper&Date)

</div>
