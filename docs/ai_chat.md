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

---

## 세션 2: Railway 배포 (2025-12-30)

### 배경
료샤가 요구사항 문서에서 "도메인 또는 Public IP로 접근 가능해야 함"을 확인하고, 배포의 필요성을 제기했어요.

### 1단계: 요구사항 검증

#### 료샤의 요청
> 이 내용들이 모두 지켜졌는지 확인해. (요구사항 문서 제시)

#### 검증 결과
✅ **모든 기능 요구사항 충족:**
- 투표 페이지 (`/vote`): 짜장면/짬뽕 선택 및 투표
- 결과 페이지 (`/result`): 투표 결과 표시 및 재투표 링크
- 서버 데이터 관리: SQLite DB 사용
- 새로고침 시 데이터 유지
- 서버 재시작 후에도 유지 (가산점)
- IP 기반 어뷰징 방지 (1분 쿨다운, 가산점)
- POST/GET 메서드 분리

✅ **모든 코드 철학 준수:**
- 선언적 코드 작성
- 함수형 프로그래밍
- 사이드 이펙트 상위 레벨 관리
- 타입 우선 설계
- Props 최소화
- Organism 단위 컴포넌트

⚠️ **배포 필요:**
현재 로컬(`localhost:3000`)에서만 실행 중이므로, 도메인/Public IP 접근을 위해 배포가 필수!

---

### 2단계: 배포 플랫폼 선택

#### 플랫폼 비교
- ❌ **Vercel**: 서버리스 환경으로 파일 시스템 읽기 전용 → SQLite 불가
- ✅ **Railway**: VM 기반, SQLite 지원, GitHub 자동 배포, 무료 티어

#### 선택
료샤의 결정: **Railway로 배포하자!**

---

### 3단계: 배포 준비

#### 1. Git 설정
```bash
# .gitignore에 voting.db 추가
echo "voting.db" >> .gitignore

# 커밋
git add .gitignore
git commit -m "chore: voting.db를 .gitignore에 추가"
```

#### 2. Railway CLI 설치
```bash
npm install -g @railway/cli
```

#### 3. 배포 방법 안내
Railway 로그인이 브라우저를 통해 진행되므로, 두 가지 방법 제시:
1. **CLI 방식**: `railway login` → `railway init` → `railway up`
2. **웹 방식**: Railway 웹사이트에서 GitHub 레포지토리 연동 (더 쉬움)

료샤는 웹 방식 선택!

---

### 4단계: 네트워킹 설정

#### 포트 설정 이슈
Railway에서 "Generate Service Domain" 화면이 표시됨:
- **질문**: 무슨 값을 입력해야 할까?
- **답변**: Next.js 기본 포트인 **3000** 입력

#### 도메인 생성 완료
```
https://exodus-production-e82d.up.railway.app
```
Railway가 포트 3000에 연결된 도메인 생성!

---

### 5단계: 배포 오류 발견

#### 문제 발생
URL 접속 시 "Application failed to respond" 에러 발생 😢

#### 원인 분석
Deploy Logs 확인 결과:
```
✓ Ready in 529ms
▲ Next.js 16.1.1
- Local:    http://localhost:8080
- Network:  http://10.161.60.56:8080
```

**문제**: 앱은 포트 **8080**에서 실행 중이지만, Railway 네트워킹은 포트 **3000**으로 설정됨!

Railway가 자동으로 `PORT=8080` 환경변수를 설정했고, Next.js가 이를 따름.

#### 해결책
네트워킹 설정에서 포트를 **3000 → 8080**으로 변경 필요!

---

### 6단계: Volume 설정 필요성

#### 료샤의 질문
> DB 유지를 위해 환경 변수에 뭘 넣어야 하지 않을까?

#### 해설
환경 변수가 아니라 **Volume (볼륨)** 설정이 필요해요!

**문제점:**
- Railway는 재배포 시 파일 시스템이 초기화됨
- Volume 없이는 `voting.db`가 재배포마다 삭제됨

**Volume 설정 방법:**
1. Railway Settings → Volumes
2. Mount Path: `/app/data`
3. 서비스에 연결

⚠️ **주의**: `/app`에 직접 마운트하면 안 돼요!
- `/app`은 소스 코드가 있는 폴더
- 빈 Volume을 마운트하면 소스 코드가 가려져서 앱 실행 불가

---

### 7단계: DB 경로 수정

#### 해결책
별도의 `data` 폴더를 만들어서 Volume 마운트!

#### 코드 수정 (`lib/db.ts`)
```typescript
import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'

// 데이터 저장용 폴더 경로 (Docker 내부에서는 /app/data가 됨)
const dataDir = path.join(process.cwd(), 'data')

// 폴더가 없으면 생성 (이게 없으면 에러 남)
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
}

// DB 파일 경로를 data 폴더 내부로 설정
const dbPath = path.join(dataDir, 'voting.db')
const db = new Database(dbPath)
```

#### .gitignore 업데이트
```bash
# database
voting.db
data/
```

#### 배포
```bash
git add -A
git commit -m "feat: data 폴더로 DB 경로 변경 (Volume 마운트 준비)"
git push origin main
```

Railway가 GitHub 연동으로 자동 재배포 시작!

---

### 다음 단계 (진행 중)

#### 료샤가 해야 할 일:
1. ✅ Railway 재배포 확인
2. ⏳ 네트워킹 포트를 8080으로 수정
3. ⏳ Volume 추가: Mount Path를 `/app/data`로 설정
4. ⏳ 배포 완료 후 테스트

#### 예상 최종 URL:
```
https://exodus-production-e82d.up.railway.app/vote
https://exodus-production-e82d.up.railway.app/result
```

---

### 핵심 학습 내용

#### 1. 서버리스 vs VM 기반 배포
- **서버리스 (Vercel)**: 파일 시스템 읽기 전용, 상태 저장 불가
- **VM 기반 (Railway)**: 파일 시스템 쓰기 가능, SQLite 사용 가능

#### 2. Railway 포트 설정
- Railway는 자동으로 `PORT` 환경변수 제공
- Next.js가 이를 감지하여 해당 포트 사용
- 네트워킹 설정과 실제 포트가 일치해야 함

#### 3. Volume 마운트 주의사항
- 소스 코드 폴더에 직접 마운트 금지
- 별도의 데이터 폴더 생성 필요
- 애플리케이션 코드에서 해당 경로 사용하도록 수정

#### 4. 배포 체크리스트
- [x] Git 레포지토리 준비
- [x] Railway 프로젝트 생성
- [x] GitHub 연동
- [x] 도메인 생성
- [x] DB 경로 수정
- [ ] 포트 설정 수정
- [ ] Volume 마운트
- [ ] 배포 테스트

---

### 트러블슈팅 요약

| 문제 | 원인 | 해결 |
|------|------|------|
| Application failed to respond | 포트 불일치 (3000 vs 8080) | 네트워킹을 8080으로 수정 |
| DB가 재배포 시 초기화 | Volume 미설정 | `/app/data` Volume 마운트 |
| Volume 마운트 후 앱 실행 안 됨 | `/app`에 직접 마운트 | `data` 폴더 분리 |

---

## 진행 상황
- [x] 백엔드 구현
- [x] 프론트엔드 구현
- [x] 로컬 테스트 완료
- [x] 요구사항 검증
- [x] Railway 배포 시작
- [x] DB 경로 수정
- [ ] Volume 설정
- [ ] 포트 수정
- [ ] 최종 배포 테스트
- [ ] Public URL 접근 확인
