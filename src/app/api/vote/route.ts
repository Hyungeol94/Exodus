import { NextRequest, NextResponse } from 'next/server'
import { getVoteCounts, hasRecentVote, insertVote, type VoteType } from '@/lib/db'

// 타입 정의: POST 요청 바디
interface VoteRequestBody {
  type: VoteType
}

// 타입 정의: 에러 응답
interface ErrorResponse {
  error: string
  message: string
}

// 타입 정의: 성공 응답
interface SuccessResponse {
  success: boolean
  message: string
  votes?: {
    jjajang: number
    jjamppong: number
  }
}

// 순수 함수: IP 주소 추출
const extractIpAddress = (request: NextRequest): string => {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  
  if (realIp) {
    return realIp
  }
  
  return 'unknown'
}

// 순수 함수: 투표 타입 검증
const isValidVoteType = (type: unknown): type is VoteType => {
  return type === 'jjajang' || type === 'jjamppong'
}

// 순수 함수: 에러 응답 생성
const createErrorResponse = (
  error: string,
  message: string,
  status: number
): NextResponse<ErrorResponse> => {
  return NextResponse.json({ error, message }, { status })
}

// 순수 함수: 성공 응답 생성
const createSuccessResponse = <T extends SuccessResponse>(
  data: T,
  status = 200
): NextResponse<T> => {
  return NextResponse.json(data, { status })
}

// GET: 투표 집계 조회
export async function GET() {
  try {
    const votes = getVoteCounts()
    
    return createSuccessResponse({
      success: true,
      message: '투표 집계를 성공적으로 조회했어요',
      votes,
    })
  } catch (error) {
    console.error('투표 집계 조회 중 오류:', error)
    
    return createErrorResponse(
      'DATABASE_ERROR',
      '투표 집계를 조회하는 중 오류가 발생했어요',
      500
    )
  }
}

// POST: 투표 수행
export async function POST(request: NextRequest) {
  try {
    // 요청 바디 파싱
    const body = await request.json() as Partial<VoteRequestBody>
    
    // 투표 타입 검증
    if (!body.type || !isValidVoteType(body.type)) {
      return createErrorResponse(
        'INVALID_VOTE_TYPE',
        '유효하지 않은 투표 타입이에요. jjajang 또는 jjamppong을 선택해주세요',
        400
      )
    }
    
    // IP 주소 추출
    const ipAddress = extractIpAddress(request)
    
    // 중복 투표 확인 (최근 1분 내)
    if (hasRecentVote(ipAddress)) {
      return createErrorResponse(
        'DUPLICATE_VOTE',
        '최근 1분 내에 이미 투표하셨어요. 잠시 후 다시 시도해주세요',
        429
      )
    }
    
    // 투표 삽입
    insertVote(body.type, ipAddress)
    
    // 업데이트된 투표 집계 반환
    const votes = getVoteCounts()
    
    return createSuccessResponse(
      {
        success: true,
        message: `${body.type === 'jjajang' ? '짜장면' : '짬뽕'} 투표가 완료되었어요!`,
        votes,
      },
      201
    )
  } catch (error) {
    console.error('투표 처리 중 오류:', error)
    
    // JSON 파싱 오류 처리
    if (error instanceof SyntaxError) {
      return createErrorResponse(
        'INVALID_JSON',
        '잘못된 요청 형식이에요',
        400
      )
    }
    
    return createErrorResponse(
      'SERVER_ERROR',
      '투표 처리 중 오류가 발생했어요',
      500
    )
  }
}

