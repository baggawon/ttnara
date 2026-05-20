# 테더나라 관리자 운영 매뉴얼 — Plan

> This document is the **source of truth** for generating the human-friendly admin operation manual (HTML).
> It catalogs every admin page, its purpose, available actions, important fields, side effects, and related API routes.
> The final HTML manual should be designed for **non-developer administrators** and use this content verbatim where appropriate.

---

## Table of Contents (사이드바 구조)

The admin sidebar (`src/app/(admin)/admin/layout.tsx`) groups pages into the following sections. The HTML manual should mirror this grouping.

1. **대시보드 (Dashboard)**
   - `/admin/dashboard`

2. **시스템 관리 (System Management)**
   - `/admin/general` — 설정
   - `/admin/users` — 사용자
   - `/admin/ranks` — 등급
   - `/admin/partners` — 협력사 배너
   - `/admin/guarantee` — 공식보증업체
   - `/admin/popup` — 팝업
   - `/admin/push-notification` — 푸시 알림
   - `/admin/navigation` — 메뉴 관리
   - `/admin/support` — 고객센터
   - `/admin/system-control` — 거래 시스템 제어

3. **게시판 (Boards)**
   - `/admin/boards/topics` — 개별 관리
   - `/admin/boards/general` — 기본 설정
   - `/admin/boards/tether` — 거래 게시판

4. **채팅 (Chat)**
   - `/admin/chat` — 채팅

5. **로그 (Logs)** — *비활성 / 향후 예정 (disabled)*
6. **개발팀 안내사항 (Dev Board)** — *비활성 / 향후 예정 (disabled)*

---

## HTML Manual — Design Notes (for later)

When converting this plan to HTML:

- **Layout**: left-hand sticky table of contents mirroring the sidebar grouping above; main content scrolls.
- **Typography**: Korean-first, clear hierarchy. Use system fonts (`Pretendard`, `Apple SD Gothic Neo`, sans-serif fallback).
- **Per-page block** should include these sub-sections in order:
  1. Route path (mono) + Korean menu label as the H2 heading
  2. 🎯 **목적 (Purpose)** — 1–2 sentences in plain language
  3. ✅ **주요 기능 (Key Actions)** — bulleted checklist
  4. 📋 **화면 구성 (Fields / Columns)** — table or bulleted field list
  5. ⚠️ **주의사항 (Warnings)** — highlighted callout box (red for destructive)
  6. 🔌 **관련 API (Related APIs)** — collapsible details/summary block
- **Destructive operations** (`/admin/system-control`, "모든 거래 취소", "거래 기록 리셋", topic/category 삭제) should have a prominent red warning banner.
- **Screenshots placeholders**: leave `[SCREENSHOT: /admin/...]` markers in HTML so the team can drop in real screenshots later.
- **Print-friendly**: include `@media print` styles so the manual can be exported to PDF.

---

# 1. 대시보드 (Dashboard)

## `/admin/dashboard` — 대시보드

### 🎯 목적
플랫폼 운영 현황(사용자 추이, 거래량, 평점 분포, 시스템 상태, 상위 트레이더, 신고 내역, 토픽 활동 등)을 실시간으로 한눈에 보는 종합 모니터링 화면입니다.

### ✅ 주요 기능
- KPI 카드(사용자 수, 거래 수, 활성 사용자, 평점 통계) 조회
- 신규 사용자 가입 추이 그래프 조회
- 완료 거래량 추이 그래프 조회
- 상위 트레이더 리더보드 조회
- 사용자 평점 분포 차트 조회
- 시스템 상태(가동 시간, API 응답, DB 상태) 모니터링
- 최근 사용자 신고 내역 조회
- 토픽별 활동 수준 조회
- 현재 플랫폼 설정 요약 카드(레벨/사용자/시스템) 조회

### 📋 화면 구성
- **KPI 행**: 사용자 수 / 거래 수 / 활성 사용자 / 평점 통계
- **사용자 추이 카드**: 가입자 시계열 그래프
- **거래 추이 카드**: 거래 완료 시계열 그래프
- **상위 트레이더 카드**: 거래 횟수 기준 리더보드
- **평점 분포 카드**: 사용자 평점 히스토그램
- **최근 신고 카드**: 신고자/대상자 정보 리스트
- **토픽 활동 카드**: 토픽별 참여 횟수
- **시스템 상태 카드**: 가동 시간, API 응답 시간, DB 상태

### ⚠️ 주의사항
- 이 화면은 **읽기 전용**입니다 — 데이터 수정 불가.
- 차트와 통계는 실시간(자동 새로고침) 데이터입니다.

### 🔌 관련 API
- `GET /api/admin_di2u3k2j/settings/general/read`
- `GET /api/admin_di2u3k2j/settings/level/read`
- `GET /api/admin_di2u3k2j/users/read`
- 기타 대시보드 분석용 보호 엔드포인트

---

# 2. 시스템 관리 (System Management)

## `/admin/general` — 설정

### 🎯 목적
플랫폼의 전역 설정(일반/시스템/레벨/사용자)을 한 화면에서 관리합니다. 네 개의 독립 카드(폼)로 구성됩니다.

### ✅ 주요 기능
- **일반 설정**: 사이트명, 설명 등 기본 정보 설정
- **시스템 설정**: 환경, 점검 모드 등 시스템 동작 설정
- **레벨 설정**: 최대 시스템 레벨, 포인트 계산 등 설정
- **사용자 설정**: 닉네임 길이 제한, 이메일 검증 등 회원 가입 관련 설정
- 각 카드별 개별 저장

### 📋 화면 구성
1. 일반 설정 카드
2. 시스템 설정 카드
3. 레벨 설정 카드
4. 사용자 설정 카드

### ⚠️ 주의사항
- 변경 사항은 즉시 플랫폼 전체에 적용됩니다.
- 일부 설정은 캐시 갱신이 필요할 수 있습니다.
- 모든 사용자/모든 게시판에 영향을 주는 **전역 설정**임을 항상 인지하세요.

### 🔌 관련 API
- `GET/POST /api/admin_di2u3k2j/settings/general/read|update`
- `GET/POST /api/admin_di2u3k2j/settings/level/read|update`
- `GET/POST /api/admin_di2u3k2j/settings/user/read|update`

---

## `/admin/users` — 사용자 (목록)

### 🎯 목적
전체 회원을 검색·필터링하여 조회하고, 상세 보기 또는 수정 페이지로 진입하는 회원 관리의 진입점입니다.

### ✅ 주요 기능
- 사용자명/닉네임으로 검색
- 시스템 권한 레벨로 필터
- 계정 상태(전체/활성/비활성)로 필터
- 관리자 권한(전체/관리자/일반)으로 필터
- 가입일(최신/오래된) 정렬
- 회원 상세 보기/수정 이동
- 페이지네이션 (기본 페이지당 10명)

### 📋 화면 구성 (테이블 컬럼)
| 컬럼 | 설명 |
|---|---|
| 사용자 | 계정 ID |
| 닉네임 | 표시 이름 |
| 이메일 | 등록 이메일 |
| 가입일 | YYYY-MM-DD |
| KYC 인증 | 미등록 / 시뮬레이션 인증 / 인증완료 |
| 등급 | 거래 등급 (1~N) |
| 보증 회원 | 보증 / 해당없음 |
| 보증금 | 금액 |
| 시스템레벨 | 시스템 권한 (0~최대) |
| 관리자 | Yes / No |
| 활성화 | Yes / No |
| 수정 | 보기 / 수정 버튼 |

> 모바일에서는 카드 형태로 표시됩니다.

### ⚠️ 주의사항
- 필터/정렬 변경 시 즉시 API 호출이 발생합니다.
- 회원 수정 저장은 즉시 반영됩니다.

### 🔌 관련 API
- `GET /api/admin_di2u3k2j/users/read`
- `GET /api/admin_di2u3k2j/user/read`
- `POST /api/admin_di2u3k2j/user/update`
- `GET /api/admin_di2u3k2j/settings/level/read`

---

## `/admin/users/[user_id]` — 회원 상세 (읽기 전용)

### 🎯 목적
한 회원의 프로필, 계정 상태, KYC, 거래 통계를 한 화면에서 읽기 전용으로 조회합니다.

### ✅ 주요 기능
- 회원 기본 정보 조회 (사용자명, 이메일, 닉네임, 가입일)
- 프로필 통계 조회 (레벨, 포인트, 등급, 거래 횟수, 권한 레벨, 상태)
- 권한 상태 조회 (관리자, 활성화, 보증 여부)
- KYC 정보 조회 (인증 결과, 금융기관, 계좌번호, 예금주, 등록일)
- 수정 페이지로 이동
- 목록으로 돌아가기

### 📋 화면 구성
- **기본 정보 카드**: 사용자명 / 닉네임 / 이메일 / 가입일
- **통계 카드**: 사용자 레벨 / 거래 등급 / 포인트 / 거래 횟수 / 권한 레벨 / 계정 상태(녹색·빨강 점)
- **권한 카드**: 관리자 권한 / 활성화 상태 / 거래 보증 상태 토글(읽기 전용)
- **KYC 카드**: 인증 결과 / 금융기관 / 계좌번호 / 예금주 / 등록일

### ⚠️ 주의사항
- 모든 토글은 **표시용**이며 수정되지 않습니다.
- KYC가 "미등록"인 경우 KYC 카드 세부 정보는 표시되지 않습니다.

### 🔌 관련 API
- `GET /api/admin_di2u3k2j/user/read`

---

## `/admin/users/[user_id]/edit` — 회원 수정

### 🎯 목적
회원의 프로필, 레벨/포인트, 권한, 보증 상태 등을 편집·저장합니다.

### ✅ 주요 기능
- 사용자명 / 닉네임 / 이메일 수정
- 사용자 레벨 / 권한 레벨 / 포인트 / 거래 횟수 수정
- 관리자 권한 토글
- 활성화 상태 토글
- 거래 보증 상태 토글
- 저장 / 취소
- 목록으로 돌아가기

### 📋 화면 구성 (입력 항목)
| 항목 | 유형 | 비고 |
|---|---|---|
| 사용자 | 텍스트 | |
| 닉네임 | 텍스트 | min/max 길이 검증(사용자 설정 기반) |
| 이메일 | 이메일 | |
| 사용자 레벨 | 숫자 | |
| 권한 레벨 | 숫자 | 최대 시스템 레벨 초과 불가 |
| 포인트 | 숫자 | |
| 거래 횟수 | 숫자 | |
| 관리자 권한 | 스위치 | |
| 활성화 상태 | 스위치 | |
| 거래 보증 상태 | 스위치 | |
| KYC 정보 | 표시 전용 | 수정 불가 |

### ⚠️ 주의사항 (Destructive)
- **관리자 권한** 변경은 즉시 해당 사용자의 어드민 접근 권한을 바꿉니다.
- **활성화 상태** 해제는 즉시 사용자의 플랫폼 이용을 차단합니다.
- 닉네임 길이는 사용자 설정의 min/max 범위 안이어야 합니다.
- 권한 레벨은 레벨 설정의 `max_system_level`을 초과할 수 없습니다.
- 저장 성공 시 목록으로 자동 이동합니다.

### 🔌 관련 API
- `GET /api/admin_di2u3k2j/user/read`
- `POST /api/admin_di2u3k2j/user/update`
- `GET /api/admin_di2u3k2j/settings/level/read`
- `GET /api/signup/read`

---

## `/admin/ranks` — 등급 (목록)

### 🎯 목적
사용자 거래 등급(랭크)을 관리합니다. 단건 생성/수정/삭제, 자동 생성, 일괄 편집, 배지 이미지 관리 진입점을 제공합니다.

### ✅ 주요 기능
- 이름/설명으로 등급 검색 (검색 필드 선택 가능)
- 정렬 (최신/오래된)
- 단건 등급 생성
- 자동 등급 생성으로 이동
- 일괄 편집
- 배지 이미지 관리로 이동
- 단건 삭제
- 등급 수정 페이지로 이동

### 📋 화면 구성 (테이블 컬럼)
- 이름 / 등급 레벨 / 최소 거래 횟수 / 배지 이미지 / 활성화 / 작업 버튼

### ⚠️ 주의사항
- **등급 레벨은 유일해야 합니다** (중복 불가, 보통 1·2·3 순차).
- 상위 등급의 **최소 거래 횟수**는 하위 등급보다 커야 합니다.
- 배지 이미지는 여러 등급이 공유할 수 있어, 해제 시 모든 사용 등급에 영향.
- 등급 삭제 시 해당 등급 보유 사용자는 한 단계 낮은 등급으로 떨어집니다.
- **자동 생성**은 기존 등급을 모두 삭제 후 재생성합니다 (파괴적).

### 🔌 관련 API
- `GET /api/admin_di2u3k2j/ranks/read`
- `POST /api/admin_di2u3k2j/ranks/create`
- `POST /api/admin_di2u3k2j/ranks/batch-create`
- `POST /api/admin_di2u3k2j/ranks/update`
- `POST /api/admin_di2u3k2j/ranks/delete`
- `GET /api/admin_di2u3k2j/rank_badges/list`
- `POST /api/admin_di2u3k2j/rank_badges/upload`

---

## `/admin/ranks/create` — 등급 생성

### 🎯 목적
새 등급을 한 건 추가합니다.

### ✅ 주요 기능
- 이름 / 등급 레벨 / 최소 거래 횟수 / 설명 / 활성화 입력
- 저장 / 취소

### 📋 화면 구성
| 항목 | 유형 | 검증 |
|---|---|---|
| 이름 | 텍스트 | 필수 |
| 등급 레벨 | 숫자 | 최소 1, 필수 |
| 최소 거래 횟수 | 숫자 | 0–10,000,000 |
| 설명 | 텍스트영역 | 선택 |
| 활성화 | 스위치 | 기본 ON |

### ⚠️ 주의사항
- 등급 레벨 중복 불가.
- 최소 거래 횟수는 직전 등급보다 커야 합니다.
- 비활성 등급은 신규 사용자에게 할당되지 않지만, 기존 보유자는 유지됩니다.
- 생성 후 상세 페이지에서 배지 이미지를 지정할 수 있습니다.

### 🔌 관련 API
- `POST /api/admin_di2u3k2j/ranks/create`

---

## `/admin/ranks/[rank]` — 등급 수정

### 🎯 목적
기존 등급의 정보와 배지 이미지를 수정합니다.

### ✅ 주요 기능
- 이름 / 레벨 / 최소 거래 횟수 / 설명 / 활성화 수정
- 배지 이미지 업로드 / 교체 / 해제 (PNG·JPG·WebP·SVG, 최대 2MB)
- 배지 이미지 관리 페이지로 이동
- 저장

### 📋 화면 구성
- 이름 / 등급 레벨 / 최소 거래 횟수 / **배지 이미지(64×64 미리보기 + 업로드/교체/해제 버튼)** / 설명 / 활성화

### ⚠️ 주의사항
- 배지 해제 시 해당 이미지를 공유하는 **모든 등급**에서 해제됩니다 (확인 다이얼로그 표시).
- 파일 형식: PNG / JPG / WebP / SVG, 최대 2MB.

### 🔌 관련 API
- `GET /api/admin_di2u3k2j/ranks/read`
- `POST /api/admin_di2u3k2j/ranks/update`
- `POST /api/admin_di2u3k2j/rank_badges/upload`
- `POST /api/admin_di2u3k2j/rank_badges/unassign`

---

## `/admin/ranks/auto` — 자동 등급 생성

### 🎯 목적
최대 등급 수, 최대 거래 횟수, 진행 곡선을 지정해 전체 등급을 자동 생성합니다. 시뮬레이션 후 저장합니다.

### ✅ 주요 기능
- 최대 등급 수 입력
- 최대 거래 횟수 입력
- 진행 유형 선택 (선형 / 오목 / 볼록)
- 진행 속도 조정 (1–5, 비선형일 때만)
- **계산** 버튼으로 시뮬레이션
- 시뮬레이션 결과(그리드 + 차트) 확인
- **저장** 버튼으로 확정 (확인 다이얼로그 후)

### 📋 화면 구성
- 입력 필드: 최대 등급 수 / 최대 거래 횟수 / 진행 유형 / 진행 속도
- 결과 그리드: 등급별 카드 (등급 9개 초과 시 처음 3 + 중간 3 + 마지막 3개만 표시)
- 결과 차트: X=등급 레벨, Y=필요 거래 횟수

### ⚠️ 주의사항 (Destructive)
- **저장 시 기존 등급을 전부 삭제하고 새로 생성합니다.**
- 진행 유형:
  - **선형**: 균등 증가
  - **오목**: 초반은 완만, 후반은 가파름 (신규 사용자에게 친화적)
  - **볼록**: 초반은 가파름, 후반은 완만
- 차트는 그리드가 잘리더라도 전체 곡선을 표시합니다.

### 🔌 관련 API
- `POST /api/admin_di2u3k2j/ranks/batch-create`

---

## `/admin/ranks/badges` — 배지 이미지 관리

### 🎯 목적
등급 배지 이미지를 업로드하고, 특정 등급 범위에 일괄 할당/해제합니다.

### ✅ 주요 기능
- 배지 이미지 업로드 (이름 선택 입력)
- 등급 범위(예: 1~5)로 일괄 할당
- 범위 수정
- 할당 해제
- 배지 이미지 삭제
- 전체 배지 목록 보기

### 📋 화면 구성
- **업로드 섹션**: 이름 입력 + 파일 선택
- **배지 목록**: 48×48 미리보기 / 이름 (또는 `배지 #ID`) / 할당 상태("미할당" 또는 "등급 X 할당됨" / "등급 X–Y 할당됨") / 범위 할당·수정·해제·삭제 버튼

### ⚠️ 주의사항
- 범위 오류: 시작 > 종료, 시작 < 1, 비정상 숫자 → "범위 설정에 오류가 있습니다" 토스트
- 다른 배지와 **범위 겹침 불가**.
- 파일 형식: PNG / JPG / WebP / SVG, 최대 2MB.

### 🔌 관련 API
- `GET /api/admin_di2u3k2j/rank_badges/list`
- `POST /api/admin_di2u3k2j/rank_badges/upload`
- `POST /api/admin_di2u3k2j/rank_badges/assign`
- `POST /api/admin_di2u3k2j/rank_badges/unassign`
- `POST /api/admin_di2u3k2j/rank_badges/delete`

---

## `/admin/partners` — 협력사 배너

### 🎯 목적
플랫폼에 노출되는 협력사 배너(이미지 + 외부 링크)를 관리합니다.

### ✅ 주요 기능
- 협력사 배너 목록 조회
- 신규 등록 / 수정 / 삭제
- 배너 이미지·링크 URL 설정
- 표시 순서 설정

### 📋 화면 구성
- 협력사명 / 배너 이미지 / 링크 / 표시 순서 / 활성화 / 작업 버튼

### ⚠️ 주의사항
- 배너 이미지는 업로드 용량 제한이 있을 수 있습니다.
- 링크는 일반적으로 외부 URL입니다.

### 🔌 관련 API
- `GET/POST /api/admin_di2u3k2j/partners/read|create|update|delete`

---

## `/admin/guarantee` — 공식보증업체

### 🎯 목적
공식 보증(거래 안전성을 책임지는 제휴사)을 관리하고, 보증 배너 설정을 수정합니다.

### ✅ 주요 기능
- 보증 배너 설정 (제목 / 이미지 / 링크 / 활성화) 수정
- 공식 보증업체 등록 / 수정 / 삭제
- 표시 순서 설정

### 📋 화면 구성
- **배너 섹션**: 제목 / 이미지 / 링크 / 활성화 토글
- **업체 목록**: 로고 / 업체명 / 링크 / 활성화 / 표시 순서 / 작업

### ⚠️ 주의사항
- 공식 보증업체는 계약·검증을 거친 업체여야 합니다.
- 배너 설정은 전역으로 모든 사용자에게 영향을 줍니다.

### 🔌 관련 API
- `GET/POST /api/admin_di2u3k2j/guarantee/banner/read|update`
- `GET/POST /api/admin_di2u3k2j/guarantee/read|create|update|delete`

---

## `/admin/popup` — 팝업

### 🎯 목적
공지/프로모션 팝업을 생성하고, 노출 기간·대상·빈도를 관리합니다.

### ✅ 주요 기능
- 팝업 생성 / 수정 / 삭제
- 본문(제목·메시지·이미지·링크) 설정
- 노출 시작/종료일 설정
- 대상 사용자 세그먼트 지정 (전체 / 신규 / 활성 등)
- 노출 빈도 (항상 / 세션당 1회 / 일 1회) 설정
- 활성화 토글

### 📋 화면 구성
- 제목 / 본문 / 이미지 / 버튼 텍스트·링크 / 시작·종료일 / 대상 세그먼트 / 노출 빈도 / 활성화 / 작업

### ⚠️ 주의사항
- 비활성화 시 즉시 노출 중단.
- 노출 빈도 설정은 사용자 경험 저하를 막는 핵심 요소입니다.

### 🔌 관련 API
- `GET/POST /api/admin_di2u3k2j/popup/read|create|update|delete`

---

## `/admin/push-notification` — 푸시 알림

### 🎯 목적
대상 세그먼트로 푸시 알림을 발송하고, 재사용 가능한 템플릿과 발송 이력을 관리합니다.

### ✅ 주요 기능
- 푸시 알림 발송 (대상·제목·메시지·이미지·액션 URL)
- 템플릿 생성 / 수정 / 삭제
- 발송 이력 조회 (대상·발송 시간·전송 수·상태)

### 📋 화면 구성
- **발송 섹션**: 대상 / 제목 / 메시지 / 이미지·아이콘 / 액션 버튼 텍스트·링크
- **템플릿 섹션**: 이름 / 본문 미리보기 / 생성일 / 작업(수정·삭제·이 템플릿으로 발송)
- **이력 섹션**: 본문 / 대상 / 발송 시간 / 전송 수 / 상태 (대기/완료/실패)

### ⚠️ 주의사항
- 발송은 즉시 대상 사용자에게 영향을 줍니다.
- 발송 이력은 감사(audit)를 위해 변경 불가합니다.

### 🔌 관련 API
- `POST /api/admin_di2u3k2j/push-notification/send`
- `GET/POST /api/admin_di2u3k2j/push-notification/template/read|create|update|delete`
- `GET /api/admin_di2u3k2j/push-notification/history/read`

---

## `/admin/navigation` — 메뉴 관리

### 🎯 목적
상단 데스크톱 메뉴와 모바일 하단 메뉴 항목을 추가·수정·삭제·재정렬합니다.

### ✅ 주요 기능
- 메뉴 항목 추가 / 수정 / 삭제
- 라벨 / 링크 / 아이콘 / 순서 설정
- 서브메뉴(중첩) 구성
- 표시 여부 토글
- 순서 변경

### 📋 화면 구성
- 라벨 / 링크 / 아이콘 / 표시 순서 / 상위 메뉴 / 활성화 / 작업

### ⚠️ 주의사항
- 변경은 데스크톱 상단·모바일 하단 양쪽에 즉시 반영됩니다.
- 메뉴 삭제 시 사용자에게서 즉시 사라집니다.

### 🔌 관련 API
- `GET/POST /api/admin_di2u3k2j/nav/list|create|update|delete|reorder`

---

## `/admin/support` — 고객센터

### 🎯 목적
링크 카드(바로가기), QnA 카테고리, QnA 문서를 통합 관리하는 고객지원 본거지입니다. 3개 탭으로 구성됩니다.

### ✅ 주요 기능 (탭별)
1. **링크 카드** — FAQ·문의·문서 등 바로가기 카드 관리
2. **QnA 카테고리** — QnA 분류 관리 (이름·설명·순서)
3. **QnA** — QnA 문서 목록 / 생성·수정·삭제 진입점

### 📋 화면 구성
- 상단 탭 바: `링크 카드 / QnA 카테고리 / QnA`
- 각 탭 안에 해당 리스트와 추가/수정/삭제 UI

### ⚠️ 주의사항
- 변경은 사용자에게 즉시 노출됩니다.

---

### `/admin/support/qna/create` — QnA 문서 생성

#### 🎯 목적
새로운 FAQ/QnA 문서를 작성합니다.

#### ✅ 주요 기능
- 질문(제목) / 답변(본문) 입력
- 카테고리 선택
- 표시 순서 설정
- 활성화 토글
- 저장 / 취소

#### 📋 화면 구성
- 제목 / 내용 / 카테고리 드롭다운 / 표시 순서 / 활성화

#### ⚠️ 주의사항
- 본문은 서식 지원(볼드, 링크 등).
- 비활성 문서는 사용자에게 노출되지 않습니다.

#### 🔌 관련 API
- `POST /api/admin_di2u3k2j/support/qna/create`
- `GET /api/admin_di2u3k2j/support/qna-categories/read`

---

### `/admin/support/qna/[id]` — QnA 문서 수정

#### 🎯 목적
기존 QnA 문서를 수정하거나 삭제합니다.

#### ✅ 주요 기능
- 제목 / 본문 / 카테고리 / 순서 / 활성화 수정
- 저장 / 삭제 / 목록으로 이동

#### ⚠️ 주의사항
- 삭제는 되돌릴 수 없습니다.

#### 🔌 관련 API
- `GET/POST /api/admin_di2u3k2j/support/qna/read|update|delete`
- `GET /api/admin_di2u3k2j/support/qna-categories/read`

---

## `/admin/system-control` — 거래 시스템 제어 ⚠️ 위험

### 🎯 목적
P2P 거래 시스템 비상 제어 도구. 3개의 파괴적 작업을 확인 다이얼로그·확인 문구와 함께 제공합니다.

### ✅ 주요 기능

#### 1) 거래 게시 일시 중단 (P2P Pause)
- ON: 신규 거래 글 작성 차단
- OFF: 정상 운영
- 진행 중 거래·제안은 영향 없음
- 토글 시 확인 다이얼로그 표시

#### 2) 모든 거래 취소 (Cancel All Active Trades)
- 모든 진행/공개 거래·제안을 일괄 취소
- 완료된 거래는 보존
- 취소된 거래에 대한 `trade_count` 감소
- 확인 문구 **"모든 거래 취소"** 입력 필요

#### 3) 거래 기록 리셋 (Full Reset)
- 모든 `tether` / `tether_proposal` / `tether_rate` 삭제
- 모든 사용자의 `trade_total`, `trade_count`, `trade_joined`, `trade_rate` 초기화
- 모든 사용자의 등급을 최저 등급으로 초기화
- 모든 리더보드(전체·주간·일간) 초기화
- 확인 문구 **"거래 기록 리셋"** 입력 필요

### 📋 화면 구성
- **Pause 카드**: 상태 아이콘(PauseCircle/PlayCircle) + 상태 텍스트(일시 중단/정상 운영) + 설명 + 토글
- **Cancel All 카드**: 경고 배너(AlertTriangle) + 설명 + 빨간색 파괴 버튼 + 확인 다이얼로그
- **Full Reset 카드**: 위험 배너 + 삭제·초기화 항목 목록 + 빨간색 파괴 버튼 + 확인 다이얼로그

### ⚠️ 주의사항 (Destructive — 절대 주의)
- **Pause**: 즉시 모든 사용자에게 영향.
- **Cancel All**: 되돌릴 수 없음. 완료 거래는 보존되지만 진행 거래는 모두 종료.
- **Full Reset**: 수개월~수년의 거래 이력을 영구 삭제. 데이터 복구 불가.
- 확인 문구를 정확히 입력해야 실행됩니다 — 실수 방지 장치.
- 비상시·점검 시간·서비스 종료 시에만 사용하세요.
- 실행 시 외부에 별도 로그를 남겨 감사 추적을 유지하세요.

### 🔌 관련 API
- `POST /api/admin_di2u3k2j/system/p2p-pause`
- `POST /api/admin_di2u3k2j/system/cancel-active-tethers`
- `POST /api/admin_di2u3k2j/system/reset-trade-records`
- `GET /api/admin_di2u3k2j/settings/general/read`

---

# 3. 게시판 (Boards)

## `/admin/boards/topics` — 개별 관리 (토픽 목록)

### 🎯 목적
모든 게시판 토픽(대분류)을 관리합니다. 생성/수정/삭제, 카테고리 관리 진입, 홈 미리보기 노출 제어를 제공합니다.

### ✅ 주요 기능
- 이름/URL로 토픽 검색
- 정렬 (최신/오래된)
- 신규 토픽 생성
- 홈 미리보기 ON/OFF (최대 2개)
- 토픽 설정 수정
- 카테고리 관리 진입
- 삭제 (확인 다이얼로그)
- 페이지네이션 (기본 10개)

### 📋 화면 구성 (테이블 컬럼)
- 이름 / URL / 순서 (0–100) / 활성화 / **미리보기 토글** / 작업(수정·카테고리 관리·삭제)

### ⚠️ 주의사항
- **미리보기 최대 2개** — 3번째 활성화 시도 시 `"미리보기는 최대 2개까지 설정할 수 있습니다"` 토스트.
- 미리보기는 토픽이 활성 상태일 때만 가능.
- **삭제 시 해당 토픽의 모든 스레드/댓글/파일이 함께 삭제됩니다.**
- 변경은 홈에 즉시 반영됩니다.

### 🔌 관련 API
- `GET /api/admin_di2u3k2j/topics/read`
- `POST /api/admin_di2u3k2j/topics/update`
- `POST /api/admin_di2u3k2j/topics/delete`
- `GET /api/board-preview/read`

---

## `/admin/boards/topics/[topic]` — 토픽 상세/편집

### 🎯 목적
토픽(게시판) 생성 또는 편집. 접근 권한, 글/댓글 길이, 파일 업로드, 포인트, 특수 기능(익명·단일 댓글·추천·썸네일) 등을 종합 설정합니다.

### ✅ 주요 기능 (섹션별)
- **게시판 기본 설정**: 이름 · URL · 설명 · 표시 순서 · 활성화 · 단일 댓글만 허용
- **위젯 설정**: 빠른 메뉴 표시 · 게시판 위젯 등록(홈 노출)
- **글 설정**: 제목/본문/댓글 min·max 길이
- **접근 권한**: 읽기 · 작성 · 댓글 · 다운로드 · 주제 관리 권한(0–100)
- **파일 설정**: 업로드 허용 · 최대 수(0–10) · 허용 확장자(쉼표) · 최대 크기(1–20 MB)
- **부가 기능**: 썸네일 · 익명 · 본인 글만 열람 · 추천 · 비추천
- **페이지네이션**: 페이지당 글 수(10–50) · 페이지 버튼 수(3–10)
- **게시글 보존**: 수정/삭제 방지 댓글 수(0–20)
- **포인트**: 작성·읽기·댓글·추천·비추천 (0–10000)

### 📋 화면 구성
- 위 9개 섹션을 카드/접이식 패널로 구성

### ⚠️ 주의사항
- **min ≤ max** 검증.
- 익명을 끄면 "본인 글만 열람"도 자동 비활성.
- 파일 확장자는 **쉼표 + 공백 없이** 입력 (예: `pdf,doc,docx`).
- 접근 권한 0 = 공개, 숫자가 높을수록 상위 사용자만 접근.
- 토픽 ID = 0 → 신규 생성 모드. 1 이상 → 편집 모드.
- 비활성화 시 사용자에게 즉시 숨겨지지만 스레드는 DB에 보존됩니다.

### 🔌 관련 API
- `GET /api/admin_di2u3k2j/topics/read`
- `POST /api/admin_di2u3k2j/topics/create`
- `POST /api/admin_di2u3k2j/topics/update`
- `GET /api/admin_di2u3k2j/settings/thread/read`

---

## `/admin/boards/topics/[topic]/categories` — 카테고리 목록

### 🎯 목적
특정 토픽의 소분류(카테고리)를 관리합니다.

### ✅ 주요 기능
- 이름/설명으로 검색
- 정렬 (최신/오래된)
- 신규 카테고리 생성
- 수정 / 삭제
- 페이지네이션

### 📋 화면 구성
- 이름 / 설명 / 표시 순서 / 활성화 / 작업

### ⚠️ 주의사항
- 카테고리는 단일 상위 토픽에 속합니다.
- 삭제 시 해당 카테고리의 글 분류가 재구성될 수 있습니다.

### 🔌 관련 API
- `GET /api/admin_di2u3k2j/topics/read`
- `GET/POST /api/admin_di2u3k2j/topics/categories/read|update|delete`

---

## `/admin/boards/topics/[topic]/categories/[category]` — 카테고리 상세/편집

### 🎯 목적
카테고리 한 건을 생성 또는 편집합니다.

### ✅ 주요 기능
- 이름 / 설명 / 표시 순서 / 활성화 설정
- 저장 / 취소

### 📋 화면 구성
- 이름 (텍스트) / 설명 (텍스트영역) / 표시 순서 (숫자) / 활성화 (스위치 + 안내: "비활성화된 주제는 사용자에게 표시되지 않습니다")

### ⚠️ 주의사항
- ID = 0 → 신규 생성 모드.
- 비활성화는 글을 삭제하지 않으며 사용자에게만 숨깁니다.

### 🔌 관련 API
- `GET /api/admin_di2u3k2j/topics/read`
- `GET/POST /api/admin_di2u3k2j/topics/categories/read|update`

---

## `/admin/boards/general` — 기본 설정 (전역 게시판 설정)

### 🎯 목적
모든 게시판에 적용되는 전역 기본값(글/댓글 길이, 권한 기본값, 파일 업로드, 포인트)을 설정합니다.

### ✅ 주요 기능
- 전역 글(스레드) 설정 수정
- 전역 댓글 설정 수정
- 전역 파일 업로드 설정 수정
- 전역 접근 권한 기본값 수정
- 전역 포인트 보상 설정 수정
- 일괄 저장

### ⚠️ 주의사항
- **전역 기본값**으로 토픽에서 재정의하지 않은 설정에 적용됩니다.
- 변경은 즉시 적용되며 토픽별 커스텀이 없는 모든 게시판에 영향을 줍니다.

### 🔌 관련 API
- `GET/POST /api/admin_di2u3k2j/settings/thread/read|update`

---

## `/admin/boards/tether` — 거래 게시판

### 🎯 목적
P2P 거래(테더) 게시판을 관리합니다. **2단계 지역 계층**(시/도 → 군/구)을 관리하고, 거래 게시판 전용 설정 폼을 제공합니다.

### ✅ 주요 기능
- 거래 게시판 전용 설정(TetherSettingsForm) 수정
- **지역 관리**:
  - 상위 지역(시/도) 추가
  - 하위 지역(군/구) 추가
  - 활성 지역 삭제 (소프트 삭제)
  - 삭제된 지역 복구
  - "삭제된 지역 표시" 체크박스 토글

### 📋 화면 구성
- **거래 설정 폼** (상단)
- **지역 관리 섹션**: 상위 지역 = 아코디언, 그 안에 하위 지역. 활성 항목은 삭제·하위 추가 버튼, 삭제 항목은 복구 버튼 + "삭제됨" 배지 + 취소선.

### ⚠️ 주의사항
- **계층**: 상위 지역만 자식을 가질 수 있음 (3단계 불가).
- **소프트 삭제**: 삭제는 `is_active=false` 표시일 뿐 DB에서 제거되지 않음.
- 복구는 "복구" 버튼으로 가능.
- 이름은 `validateTetherCategoryName` 검증 통과 필요.
- 변경은 즉시 API로 저장됩니다 (전통적 폼 제출 없음).

### 🔌 관련 API
- `GET/POST /api/admin_di2u3k2j/tether_category/read|update|delete|restore`
- `GET/POST /api/admin_di2u3k2j/settings/tether/read|update`

---

# 4. 채팅 (Chat)

## `/admin/chat` — 채팅 모더레이션

### 🎯 목적
실시간 채팅의 토픽·메시지·사용자·신고를 종합 모더레이션합니다. 10개 탭으로 구성됩니다.

### ✅ 주요 기능 (10개 탭)
1. **설정** — 전역 채팅 설정 수정
2. **채팅 토픽** — 채팅 토픽(채널) 관리
3. **공지 (캐러셀)** — 채팅에 노출되는 캐러셀 공지 관리
4. **금지어** — 금지/필터링 단어 목록 관리
5. **고정 메시지** — 채팅 상단 고정 메시지 관리
6. **채팅 기록** — 과거 메시지 검색·열람
7. **뮤트 유저** — 뮤트된 사용자 목록·해제
8. **차단 유저** — 차단된 사용자 목록·해제
9. **숨김 메시지** — 숨김 처리된 메시지 목록·복구
10. **신고 내역** — 사용자 신고 접수 처리

### 📋 화면 구성
- 상단 탭 바 (10개 탭)
- 각 탭의 전용 UI (리스트/폼/검색 등)

### ⚠️ 주의사항
- **금지어**: 등록 즉시 모든 메시지에서 필터링.
- **뮤트**: 메시지 송신 불가, 수신은 가능.
- **차단**: 채팅 접근 자체 불가.
- **메시지 숨김**: 화면에서 제거되나 DB에는 보존.
- **고정 메시지**: 모든 채팅 세션 상단에 표시.
- 신고는 검토 후 적절한 모더레이션 조치(뮤트/차단/메시지 삭제)로 이어져야 합니다.

### 🔌 관련 API
- `GET/POST /api/admin_di2u3k2j/chat/settings/read|update`
- `GET/POST /api/admin_di2u3k2j/chat/topics/read|update|delete`
- `GET /api/admin_di2u3k2j/chat/topics/stats`
- `GET/POST /api/admin_di2u3k2j/chat/notices/read|update|delete`
- `GET/POST /api/admin_di2u3k2j/chat/banned-words/read|update|delete`
- `GET/POST /api/admin_di2u3k2j/chat/fixed-messages/read|update|delete`
- `GET /api/admin_di2u3k2j/chat/history/read`
- `GET/POST /api/admin_di2u3k2j/chat/moderation/muted|mute|unmute`
- `GET/POST /api/admin_di2u3k2j/chat/moderation/banned|ban|unban`
- `GET/POST /api/admin_di2u3k2j/chat/moderation/hidden|hide|unhide`
- `GET /api/admin_di2u3k2j/chat/moderation/reports`

---

# 5. 로그 (Logs) — *비활성*

향후 보안 로그·접근 이력·관리자 작업 로그 등을 제공할 예정입니다. 현재는 메뉴에서 비활성 상태입니다.

# 6. 개발팀 안내사항 (Dev Board) — *비활성*

개발팀 공지를 위한 보드. 현재 비활성 상태입니다.

---

## 부록 A — 파괴적 작업 빠른 참조

| 작업 | 경로 | 영향 범위 | 복구 가능 |
|---|---|---|---|
| 토픽 삭제 | `/admin/boards/topics` | 토픽의 모든 스레드·댓글·파일 | ❌ |
| 자동 등급 생성 | `/admin/ranks/auto` | 기존 모든 등급 | ❌ |
| 거래 게시 일시 중단 | `/admin/system-control` | 신규 거래 등록 | ✅ (다시 OFF) |
| 모든 거래 취소 | `/admin/system-control` | 모든 진행 거래/제안 | ❌ |
| 거래 기록 리셋 | `/admin/system-control` | 모든 거래 데이터·등급·리더보드 | ❌ |
| 회원 활성화 해제 | `/admin/users/[id]/edit` | 해당 사용자 접근 | ✅ |
| 회원 관리자 권한 변경 | `/admin/users/[id]/edit` | 해당 사용자 어드민 접근 | ✅ |

## 부록 B — 글로벌 설정 요약

- **일반/시스템/레벨/사용자 설정**: `/admin/general`
- **게시판 전역 기본값**: `/admin/boards/general`
- **거래 게시판 전용 설정**: `/admin/boards/tether`
- **채팅 전역 설정**: `/admin/chat` → 설정 탭

## 부록 C — 외부에 노출되는 콘텐츠

- **홈 배너/위젯**: `/admin/partners`, `/admin/guarantee`, `/admin/boards/topics` (미리보기)
- **팝업**: `/admin/popup`
- **푸시 알림**: `/admin/push-notification`
- **메뉴**: `/admin/navigation`
- **고객센터/FAQ**: `/admin/support`

## 부록 D — 관리자(Admin) vs 권한 레벨(Auth Level), 그리고 모더레이션

이 앱에는 권한을 결정하는 **독립된 두 가지 시스템**이 동시에 존재합니다. 경계가 직관적이지 않아 자주 혼동되므로 명확히 정리합니다.

### 1. 두 가지 권한 시스템

| 시스템 | DB 필드 | UI 라벨 | 역할 |
|---|---|---|---|
| **어드민 권한 (이진)** | `is_app_admin` (Boolean) 또는 `is_superuser` | 관리자 권한 | `/admin/*` 백오피스 접근의 **유일한 게이트** |
| **권한 레벨 (숫자)** | `auth_level` (Int, 기본 1) | 권한 레벨 / 시스템레벨 | 사용자 화면(게시판·다운로드·작성·모더레이션)에서의 행동 가능 범위 |

> **핵심**: 두 시스템은 **독립적**입니다. 어드민이라고 권한 레벨이 오르지 않고, 권한 레벨이 높다고 어드민이 되지 않습니다.

### 2. 어떤 동작이 어떤 권한을 요구하는가

| 동작 | 필요 조건 |
|---|---|
| `/admin/*` 백오피스 접근 | `is_app_admin = ON` **(단독)** — auth_level 무관 |
| 게시판 글 읽기 | `is_app_admin=ON` 또는 `auth_level ≥ 토픽.level_read` |
| 글 작성·댓글·다운로드 | `is_app_admin=ON` 또는 `auth_level ≥ 토픽.level_create/comment/download` |
| 게시판 모더레이션 | `is_app_admin=ON` 또는 `auth_level ≥ 토픽.level_moderator` |
| 채팅 모더레이션 (뮤트·차단·숨김) | `is_app_admin = ON` **(단독)** — auth_level 경로 **없음** |

### 3. "모더레이터"라는 별도 역할은 없음

- 코드에 `is_moderator` 같은 별도 필드는 **존재하지 않음**.
- 모더레이터 = 어드민(전역) **또는** 권한 레벨이 토픽의 `level_moderator` 이상인 사용자(특정 게시판만).
- 특정 게시판만 관리할 외부 모더레이터를 만들려면:
  1. 해당 토픽의 `level_moderator`를 적절한 숫자로 설정
  2. 대상 사용자의 `auth_level`을 그 숫자 이상으로 설정
  3. **관리자 권한은 OFF로 유지** — 어드민 백오피스에는 못 들어옴

### 4. 자주 묻는 시나리오

| 상황 | 결과 |
|---|---|
| 관리자 OFF, 권한 레벨 99 | ❌ 어드민 진입 불가. ✅ 일반 게시판에서 작성·다운로드·(레벨 맞는 토픽에서) 모더레이션 가능. |
| 관리자 ON, 권한 레벨 1 | ✅ 어드민 전체 사용 가능. 사용자 화면에서도 어드민이라는 이유로 게시판 모더레이션 통과. |
| 관리자 ON, 권한 레벨 99 | ✅ 모든 것 가능 — 일반 운영자 셋업. |

### 5. 운영상 주의사항

- **어드민은 다른 사람을 어드민으로 승급시킬 수 있음**: 회원 수정 화면(`/admin/users/[id]/edit`)에서 토글 한 번이면 됨. 본인의 권한 레벨이 충분히 높은지 등의 추가 검증 **없음**. 어드민 권한 부여는 신중히.
- **관리자 권한을 꺼도 권한 레벨은 함께 떨어지지 않음**: 둘은 독립이므로 어드민 해제 시 권한 레벨도 함께 조정.
- **채팅 모더레이션은 권한 레벨로 위임 불가**: 채팅 운영을 맡기려면 반드시 어드민 권한 부여 필요.
- `src/helpers/config.ts`의 `admins = ["admin", "superAdmin"]` 상수는 **UI 라벨**일 뿐 권한 인증과 무관.

### 6. 한눈에 보는 의사결정 가이드

| 원하는 것 | 해야 할 일 |
|---|---|
| 운영팀 전체 권한 부여 | 관리자 ON + 권한 레벨 최상위 |
| 특정 게시판만 관리하는 보조 모더레이터 | 관리자 OFF + 권한 레벨 ≥ 해당 토픽의 `level_moderator` |
| 비공개 게시판 출입 권한 | 권한 레벨 ≥ 해당 토픽의 `level_read` (관리자 불필요) |
| 채팅 운영 위임 | 관리자 ON 외에는 방법 없음 |
| 외부 협력자에게 일부 게시판만 노출 | 해당 토픽의 `level_*` 값을 낮추고, 그 사용자의 권한 레벨만 약간 올림 |

---

*이 문서는 HTML 매뉴얼 생성의 원본입니다. 페이지 신설/변경 시 본 문서를 먼저 업데이트한 뒤 HTML을 재생성하세요.*
