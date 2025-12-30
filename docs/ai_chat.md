# AI Chat History

## 프로젝트 개요
이 문서는 Voting App 개발 과정에서 진행된 AI와의 대화 내용을 기록합니다.

---

## 세션 1: 짜장면 vs 짬뽕 투표 앱 개발 (2025-12-30)

### 1단계: 백엔드 구현

#### 료샤의 요청
> 나는 짜장면 vs 짬뽕 투표 웹앱을 만들고 있어. Next.js App Router와 better-sqlite3를 사용해서 아래 백엔드 로직을 구현해 줘.
>
> 1. **DB 설정 (`lib/db.ts`):**
>    - `voting.db`라는 SQLite 파일을 사용해.
>    - 테이블이 없으면 생성해: `votes` (id, type, ip_address, created_at).
>    - `type`은 'jjajang' 또는 'jjamppong'만 가능.
>
> 2. **API 구현 (`app/api/vote/route.ts`):**
>    - **GET:** 현재 투표 집계 결과를 반환해.
>    - **POST:** 투표를 수행해.
>      - Body로 `{ type: 'jjajang' | 'jjamppong' }`을 받아.
>      - 동일 IP의 중복 투표를 방지하는 로직을 추가해 줘 (최근 1분 내 재투표 금지).
>      - 투표 성공 시 성공 메시지 반환.
>
> 3. **요구사항:**
>    - 서버 재시작 후에도 데이터가 유지되어야 함.
>    - 에러 처리를 확실히 해줘.

#### 구현 내용

**1. 의존성 설치**
```bash
npm install --save-dev @types/better-sqlite3
```

**2. DB 설정 파일 (`lib/db.ts`)**
- SQLite 데이터베이스 초기화
- `votes` 테이블 자동 생성 (type 제약 조건 포함)
- 성능 최적화를 위한 인덱스 생성
- 선언적 함수 구성:
  - `getVoteCounts()`: 투표 집계 조회
  - `hasRecentVote()`: 중복 투표 확인 (1분 쿨다운)
  - `insertVote()`: 투표 삽입
- 타입 정의:
  - `VoteType = 'jjajang' | 'jjamppong'`
  - `Vote` 인터페이스
  - `VoteCount` 인터페이스

**3. API 라우트 (`src/app/api/vote/route.ts`)**
- **GET 엔드포인트**: 현재 투표 집계 반환
- **POST 엔드포인트**: 투표 수행
  - 투표 타입 검증
  - IP 주소 추출 (x-forwarded-for, x-real-ip 헤더 지원)
  - 중복 투표 방지 (최근 1분 내)
  - 상세한 에러 처리 (400, 429, 500)
- 선언적 함수 구성:
  - `extractIpAddress()`: IP 추출
  - `isValidVoteType()`: 타입 가드
  - `createErrorResponse()`: 에러 응답 생성
  - `createSuccessResponse()`: 성공 응답 생성

**4. TypeScript 설정 업데이트**
- `@/lib/*` path alias 추가

#### 코드 철학 반영
✅ 선언적 함수 조합 (순수 함수 분리)
✅ 타입 안정성 (인터페이스 우선 설계)
✅ 함수형 프로그래밍 (사이드 이펙트 최소화)
✅ 작은 함수들의 조합
✅ 상세한 에러 처리

---

### 2단계: 프론트엔드 구현

#### 료샤의 요청
> 이제 프론트엔드 페이지를 구현해 줘. Tailwind CSS로 깔끔하게 스타일링해 줘.
>
> 1. **투표 페이지 (`app/vote/page.tsx`):**
>    - 제목: "짜장면 vs 짬뽕, 당신의 선택은?"
>    - 큰 버튼 2개: "짜장면", "짬뽕".
>    - 버튼 클릭 시 `POST /api/vote`로 요청을 보내.
>    - 요청 성공 시 `/result` 페이지로 라우팅.
>    - 실패 시 alert으로 메시지 띄우기.
>
> 2. **결과 페이지 (`app/result/page.tsx`):**
>    - 페이지 로드 시 `GET /api/vote`로 데이터를 가져와.
>    - 현재 스코어를 큰 숫자로 보여줘.
>    - "다시 투표하기" 버튼을 누르면 `/vote`로 이동.
>    - 새로고침 시에도 결과가 유지되어야 함.
>
> 3. **메인 리다이렉트 (`app/page.tsx`):**
>    - 접속 시 바로 `/vote`로 리다이렉트 시켜줘.

#### 구현 내용

**1. 메인 페이지 (`src/app/page.tsx`)**
- 루트 경로에서 `/vote`로 자동 리다이렉트

**2. 투표 페이지 (`src/app/vote/page.tsx`)**
- 선언적 컴포넌트 구조:
  - `VoteButton`: 순수 컴포넌트로 분리
  - `submitVote`: API 호출 함수
  - `handleVote`: 사이드 이펙트 처리
- 최소 상태 사용:
  - `isVoting`: 로딩 상태만 관리
- UI/UX:
  - 🍜 짜장면 (검정 그라데이션)
  - 🌶️ 짬뽕 (빨강 그라데이션)
  - 호버/클릭 애니메이션
  - 로딩 스피너
  - 중복 투표 방지 (버튼 비활성화)

**3. 결과 페이지 (`src/app/result/page.tsx`)**
- 선언적 함수 구성:
  - `calculatePercentage`: 퍼센트 계산
  - `determineWinner`: 승자 판정
  - `ResultCard`: 결과 카드 컴포넌트
  - `fetchVoteResults`: API 호출
- 상태 관리:
  - `votes`: 투표 집계 데이터
  - `isLoading`: 로딩 상태
  - `error`: 에러 상태
- UI/UX:
  - 득표수 및 퍼센트 표시
  - 승자 표시 (🏆)
  - 로딩/에러 상태 처리
  - "다시 투표하기" 버튼

**4. 레이아웃 업데이트 (`src/app/layout.tsx`)**
- 메타데이터 변경: "짜장면 vs 짬뽕 투표"
- 언어 설정: `lang="ko"`

#### 코드 철학 반영
✅ 선언적 코드 (의도 중심)
✅ 함수형 컴포넌트 (순수 함수 분리)
✅ 최소 상태 (필요한 것만)
✅ 사이드 이펙트 페이지 레벨 관리
✅ 컴포지션 패턴 (작은 컴포넌트 조합)

#### 스타일링 특징
- Tailwind CSS로 그라데이션 디자인
- 반응형 레이아웃 (모바일/데스크톱)
- 애니메이션 효과 (transform, transition)
- 직관적인 색상 구분
- 현대적이고 깔끔한 UI

---

## 최종 결과

### 프로젝트 구조
```
voting-app/
├── lib/
│   └── db.ts                    # DB 설정 및 함수
├── src/
│   └── app/
│       ├── api/
│       │   └── vote/
│       │       └── route.ts     # API 엔드포인트
│       ├── vote/
│       │   └── page.tsx         # 투표 페이지
│       ├── result/
│       │   └── page.tsx         # 결과 페이지
│       ├── page.tsx             # 메인 (리다이렉트)
│       ├── layout.tsx           # 레이아웃
│       └── globals.css
├── voting.db                    # SQLite 데이터베이스
└── package.json
```

### 기능 요약
- ✅ SQLite 기반 투표 시스템
- ✅ IP 기반 중복 투표 방지 (1분 쿨다운)
- ✅ 실시간 투표 집계
- ✅ 반응형 UI/UX
- ✅ 에러 처리 및 로딩 상태
- ✅ 서버 재시작 후에도 데이터 유지

### API 엔드포인트
- `GET /api/vote`: 투표 집계 조회
- `POST /api/vote`: 투표 수행

### 페이지 라우트
- `/`: 메인 → `/vote` 리다이렉트
- `/vote`: 투표 페이지
- `/result`: 결과 페이지

### 실행 방법
```bash
npm run dev
# http://localhost:3000
```

---

## 개발 철학 적용 사례

### 1. 선언적 코드
```typescript
// Bad: 절차적
let percentage = 0
if (total > 0) {
  percentage = Math.round((count / total) * 100)
}

// Good: 선언적
const calculatePercentage = (count: number, total: number): number => {
  if (total === 0) return 0
  return Math.round((count / total) * 100)
}
```

### 2. 함수 조합
```typescript
// 작은 함수들의 조합
const getCurrentTimestamp = (): number => Date.now()
const calculateDuplicateCheckPeriod = (currentTime: number): number => 
  currentTime - 60_000

// 조합하여 사용
const currentTime = getCurrentTimestamp()
const checkPeriod = calculateDuplicateCheckPeriod(currentTime)
```

### 3. 타입 우선 설계
```typescript
// 인터페이스를 먼저 설계
export type VoteType = 'jjajang' | 'jjamppong'

export interface Vote {
  id: number
  type: VoteType
  ip_address: string
  created_at: number
}

// 구현은 인터페이스를 따름
export const insertVote = (type: VoteType, ipAddress: string): void => {
  // ...
}
```

### 4. 사이드 이펙트 분리
```typescript
// 순수 함수
const submitVote = async (type: VoteType): Promise<VoteResponse> => {
  // API 호출만 담당
}

// 사이드 이펙트 처리 (페이지 레벨)
const handleVote = async (type: VoteType) => {
  // 상태 변경, 라우팅 등
}
```

---

## 완료 상태
- [x] 백엔드 로직 구현
- [x] 프론트엔드 페이지 구현
- [x] 스타일링 완료
- [x] 에러 처리
- [x] 코드 철학 반영
- [x] 대화 내용 정리
