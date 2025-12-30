'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import type { VoteType } from '@/lib/db'

// 타입 정의: 투표 버튼 Props
interface VoteButtonProps {
  type: VoteType
  label: string
  emoji: string
  gradient: string
  onVote: (type: VoteType) => Promise<void>
  disabled: boolean
}

// 타입 정의: API 응답
interface VoteResponse {
  success: boolean
  message: string
  votes?: {
    jjajang: number
    jjamppong: number
  }
}

// 순수 컴포넌트: 투표 버튼
const VoteButton = ({ type, label, emoji, gradient, onVote, disabled }: VoteButtonProps) => (
  <button
    onClick={() => onVote(type)}
    disabled={disabled}
    className={`
      relative overflow-hidden
      w-full max-w-md h-32
      rounded-3xl
      ${gradient}
      text-white text-3xl font-bold
      transform transition-all duration-300
      hover:scale-105 hover:shadow-2xl
      active:scale-95
      disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
      flex items-center justify-center gap-4
      shadow-lg
    `}
  >
    <span className="text-5xl">{emoji}</span>
    <span>{label}</span>
  </button>
)

// 순수 함수: API 호출
const submitVote = async (type: VoteType): Promise<VoteResponse> => {
  const response = await fetch('/api/vote', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type }),
  })
  
  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.message || '투표 처리 중 오류가 발생했어요')
  }
  
  return response.json()
}

// 메인 컴포넌트
export default function VotePage() {
  const router = useRouter()
  const [isVoting, setIsVoting] = useState(false)

  // 사이드 이펙트: 투표 처리
  const handleVote = async (type: VoteType) => {
    if (isVoting) return

    setIsVoting(true)

    try {
      const response = await submitVote(type)
      
      if (response.success) {
        router.push('/result')
      }
    } catch (error) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : '투표 처리 중 오류가 발생했어요'
      
      alert(errorMessage)
    } finally {
      setIsVoting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-yellow-50 to-red-50 flex items-center justify-center p-8">
      <div className="w-full max-w-2xl">
        {/* 헤더 */}
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-black text-gray-800 mb-4 leading-tight">
            짜장면 vs 짬뽕
          </h1>
          <p className="text-2xl md:text-3xl text-gray-600 font-semibold">
            당신의 선택은?
          </p>
        </div>

        {/* 투표 버튼들 */}
        <div className="flex flex-col gap-6 items-center">
          <VoteButton
            type="jjajang"
            label="짜장면"
            emoji="🍜"
            gradient="bg-gradient-to-r from-gray-800 to-gray-900"
            onVote={handleVote}
            disabled={isVoting}
          />
          
          <div className="text-2xl font-bold text-gray-400">
            VS
          </div>
          
          <VoteButton
            type="jjamppong"
            label="짬뽕"
            emoji="🌶️"
            gradient="bg-gradient-to-r from-red-500 to-red-600"
            onVote={handleVote}
            disabled={isVoting}
          />
        </div>

        {/* 로딩 상태 */}
        {isVoting && (
          <div className="mt-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-gray-800" />
            <p className="mt-2 text-gray-600 font-medium">투표 중...</p>
          </div>
        )}
      </div>
    </div>
  )
}

