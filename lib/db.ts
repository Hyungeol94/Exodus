import Database from 'better-sqlite3'
import path from 'path'

// 타입 정의: 투표 타입
export type VoteType = 'jjajang' | 'jjamppong'

// 타입 정의: 투표 레코드
export interface Vote {
  id: number
  type: VoteType
  ip_address: string
  created_at: number
}

// 타입 정의: 투표 집계 결과
export interface VoteCount {
  jjajang: number
  jjamppong: number
}

// DB 파일 경로 설정
const dbPath = path.join(process.cwd(), 'voting.db')

// DB 인스턴스 생성 (싱글톤 패턴)
const db = new Database(dbPath)

// 테이블 초기화
const initializeTable = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS votes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL CHECK(type IN ('jjajang', 'jjamppong')),
      ip_address TEXT NOT NULL,
      created_at INTEGER NOT NULL
    )
  `)
  
  // 성능을 위한 인덱스 생성
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_ip_created 
    ON votes(ip_address, created_at)
  `)
}

initializeTable()

// 순수 함수: 현재 타임스탬프 조회 쿼리 생성
const getCurrentTimestamp = (): number => Date.now()

// 순수 함수: 중복 투표 확인 기간 계산 (1분 = 60,000ms)
const calculateDuplicateCheckPeriod = (currentTime: number): number => 
  currentTime - 60_000

// DB 조회: 최근 투표 존재 여부 확인
export const hasRecentVote = (ipAddress: string): boolean => {
  const currentTime = getCurrentTimestamp()
  const checkPeriod = calculateDuplicateCheckPeriod(currentTime)
  
  const stmt = db.prepare(`
    SELECT COUNT(*) as count 
    FROM votes 
    WHERE ip_address = ? AND created_at > ?
  `)
  
  const result = stmt.get(ipAddress, checkPeriod) as { count: number }
  return result.count > 0
}

// DB 삽입: 투표 추가
export const insertVote = (type: VoteType, ipAddress: string): void => {
  const stmt = db.prepare(`
    INSERT INTO votes (type, ip_address, created_at) 
    VALUES (?, ?, ?)
  `)
  
  stmt.run(type, ipAddress, getCurrentTimestamp())
}

// DB 조회: 투표 집계 결과
export const getVoteCounts = (): VoteCount => {
  const stmt = db.prepare(`
    SELECT 
      SUM(CASE WHEN type = 'jjajang' THEN 1 ELSE 0 END) as jjajang,
      SUM(CASE WHEN type = 'jjamppong' THEN 1 ELSE 0 END) as jjamppong
    FROM votes
  `)
  
  const result = stmt.get() as { jjajang: number | null; jjamppong: number | null }
  
  return {
    jjajang: result.jjajang ?? 0,
    jjamppong: result.jjamppong ?? 0,
  }
}

// DB 정리 (필요시 사용)
export const closeDatabase = (): void => {
  db.close()
}

export default db

