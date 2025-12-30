'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

// 타입 정의: 투표 집계
interface VoteCount {
  jjajang: number
  jjamppong: number
}

// 타입 정의: API 응답
interface VoteResultResponse {
  success: boolean
  message: string
  votes: VoteCount
}

// 타입 정의: 결과 카드 Props
interface ResultCardProps {
  label: string
  emoji: string
  count: number
  total: number
  gradient: string
}

// 순수 함수: 퍼센트 계산
const calculatePercentage = (count: number, total: number): number => {
  if (total === 0) return 0
  return Math.round((count / total) * 100)
}

// 순수 함수: 승자 판정
const determineWinner = (jjajang: number, jjamppong: number): 'jjajang' | 'jjamppong' | 'tie' => {
  if (jjajang > jjamppong) return 'jjajang'
  if (jjamppong > jjajang) return 'jjamppong'
  return 'tie'
}

// 순수 컴포넌트: 결과 카드
const ResultCard = ({ label, emoji, count, total, gradient }: ResultCardProps) => {
  const percentage = calculatePercentage(count, total)
  
  return (
    <div className="relative w-full max-w-md">
      <div className={`
        rounded-3xl p-8
        ${gradient}
        text-white
        shadow-2xl
        transform transition-all duration-300
        hover:scale-105
      `}>
        <div className="flex items-center justify-between mb-4">
          <span className="text-5xl">{emoji}</span>
          <span className="text-3xl font-bold">{label}</span>
        </div>
        
        <div className="text-center">
          <div className="text-7xl font-black mb-2">
            {count}
          </div>
          <div className="text-2xl font-semibold opacity-90">
            {percentage}%
          </div>
        </div>
      </div>
    </div>
  )
}

// 순수 함수: API 호출
const fetchVoteResults = async (): Promise<VoteCount> => {
  const response = await fetch('/api/vote')
  
  if (!response.ok) {
    throw new Error('투표 결과를 불러오는 중 오류가 발생했어요')
  }
  
  const data: VoteResultResponse = await response.json()
  return data.votes
}

// 메인 컴포넌트
export default function ResultPage() {
  const router = useRouter()
  const [votes, setVotes] = useState<VoteCount | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 사이드 이펙트: 데이터 로드
  useEffect(() => {
    const loadResults = async () => {
      try {
        const data = await fetchVoteResults()
        setVotes(data)
      } catch (err) {
        const errorMessage = err instanceof Error 
          ? err.message 
          : '투표 결과를 불러오는 중 오류가 발생했어요'
        setError(errorMessage)
      } finally {
        setIsLoading(false)
      }
    }

    loadResults()
  }, [])

  // 로딩 상태
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-yellow-50 to-red-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-gray-300 border-t-gray-800 mb-4" />
          <p className="text-xl text-gray-600 font-medium">결과를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  // 에러 상태
  if (error || !votes) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-yellow-50 to-red-50 flex items-center justify-center p-8">
        <div className="text-center">
          <p className="text-xl text-red-600 font-medium mb-4">
            {error || '투표 결과를 불러올 수 없어요'}
          </p>
          <button
            onClick={() => router.push('/vote')}
            className="px-8 py-3 bg-gray-800 text-white rounded-full font-semibold hover:bg-gray-900 transition-colors"
          >
            투표하러 가기
          </button>
        </div>
      </div>
    )
  }

  // 결과 계산
  const totalVotes = votes.jjajang + votes.jjamppong
  const winner = determineWinner(votes.jjajang, votes.jjamppong)

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-yellow-50 to-red-50 flex items-center justify-center p-8">
      <div className="w-full max-w-2xl">
        {/* 헤더 */}
        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-6xl font-black text-gray-800 mb-4">
            투표 결과
          </h1>
          <p className="text-xl text-gray-600 font-medium">
            총 <span className="font-bold text-gray-800">{totalVotes}</span>표
          </p>
        </div>

        {/* 승자 표시 */}
        {totalVotes > 0 && winner !== 'tie' && (
          <div className="text-center mb-8">
            <div className="inline-block bg-yellow-400 text-gray-800 px-6 py-3 rounded-full font-bold text-xl shadow-lg">
              🏆 {winner === 'jjajang' ? '짜장면' : '짬뽕'} 우세!
            </div>
          </div>
        )}

        {/* 결과 카드들 */}
        <div className="flex flex-col gap-6 items-center mb-12">
          <ResultCard
            label="짜장면"
            emoji="🍜"
            count={votes.jjajang}
            total={totalVotes}
            gradient="bg-gradient-to-r from-gray-800 to-gray-900"
          />
          
          <div className="text-2xl font-bold text-gray-400">
            VS
          </div>
          
          <ResultCard
            label="짬뽕"
            emoji="🌶️"
            count={votes.jjamppong}
            total={totalVotes}
            gradient="bg-gradient-to-r from-red-500 to-red-600"
          />
        </div>

        {/* 액션 버튼 */}
        <div className="flex justify-center">
          <button
            onClick={() => router.push('/vote')}
            className="
              px-12 py-4
              bg-gray-800 text-white
              rounded-full
              text-lg font-bold
              shadow-lg
              transform transition-all duration-300
              hover:scale-105 hover:bg-gray-900
              active:scale-95
            "
          >
            다시 투표하기
          </button>
        </div>
      </div>
    </div>
  )
}

