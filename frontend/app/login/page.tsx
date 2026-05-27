'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Mail, Lock, ArrowRight, Loader2 } from 'lucide-react'
import { login } from '@/services/api'
import { useAuthStore } from '@/store'
import { BrandMark } from '@/components/layout/BrandMark'

export default function LoginPage() {
  const router = useRouter()
  const { setAuth } = useAuthStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!email || !password) return setError('Please enter both email and password.')
    
    setIsLoading(true)
    setError(null)
    
    try {
      const res = await login(email, password)
      if (res.data) {
        setAuth(res.data.token, res.data.user)
        router.push('/assignments')
      } else {
        setError('Login successful, but no data received.')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to login')
    } finally {
      setIsLoading(false)
    }
  }

  const fillDemo = () => {
    setEmail('demo@vedaai.com')
    setPassword('demo123')
    setError(null)
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-[#f4f4f5] p-4 font-sans text-ink">
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[480px] overflow-hidden rounded-[32px] bg-white shadow-soft"
      >
        <div className="px-8 pb-6 pt-10 text-center">
          <div className="flex justify-center mb-6">
            <BrandMark />
          </div>
          <h1 className="mb-2 text-2xl font-bold tracking-tight text-ink">Welcome to VedaAI</h1>
          <p className="text-[15px] text-[#858585]">AI Powered Assessment Creation Platform</p>
        </div>

        <div className="px-8 py-2">
          {error && (
            <div className="mb-6 rounded-[16px] bg-red-50 p-4 text-center text-[14px] font-medium text-red-600 border border-red-100">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#858585]" strokeWidth={2.5} />
              <input 
                type="email" 
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-[52px] w-full rounded-full border border-gray-200 bg-gray-50 pl-11 pr-4 text-[15px] font-medium text-ink outline-none transition-all focus:border-[#ff6136] focus:bg-white focus:ring-4 focus:ring-[#ff6136]/10"
              />
            </div>
            
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#858585]" strokeWidth={2.5} />
              <input 
                type="password" 
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-[52px] w-full rounded-full border border-gray-200 bg-gray-50 pl-11 pr-4 text-[15px] font-medium text-ink outline-none transition-all focus:border-[#ff6136] focus:bg-white focus:ring-4 focus:ring-[#ff6136]/10"
              />
            </div>

            <button 
              type="submit"
              disabled={isLoading}
              className="mt-6 flex h-[52px] w-full items-center justify-center gap-2 rounded-full bg-ink text-[15px] font-semibold text-white shadow-[0_4px_16px_rgba(0,0,0,0.15)] transition-all hover:bg-black active:scale-[0.98] disabled:opacity-70"
            >
              {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Log In'}
              {!isLoading && <ArrowRight className="h-5 w-5" />}
            </button>
          </form>
        </div>

        <div className="m-8 mt-6 rounded-[24px] bg-[#fff5f2] p-6 border border-[#ffe5db]">
          <div className="mb-4 text-center">
            <span className="inline-flex rounded-full bg-[#ff6136]/10 px-3 py-1 text-[12px] font-bold text-[#ff6136] uppercase tracking-wider mb-2">
              Reviewer Access
            </span>
            <h3 className="text-[16px] font-bold text-ink">Demo Access Available</h3>
          </div>
          
          <div className="space-y-2 rounded-2xl bg-white p-4 shadow-sm border border-gray-100">
            <div className="flex justify-between items-center">
              <span className="text-[13px] font-bold text-[#858585]">EMAIL</span>
              <span className="text-[14px] font-semibold text-ink">demo@vedaai.com</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[13px] font-bold text-[#858585]">PASSWORD</span>
              <span className="text-[14px] font-semibold text-ink">demo123</span>
            </div>
          </div>
          
          <p className="mt-4 text-center text-[13px] font-medium text-[#73635d] leading-relaxed">
            Dear Sir/Ma'am, this ensures your testing experience remains isolated from internal testing workflows.
          </p>

          <button 
            onClick={fillDemo}
            className="mt-5 flex h-[44px] w-full items-center justify-center rounded-full border-[1.5px] border-[#ff6136] bg-white text-[14px] font-bold text-[#ff6136] transition-all hover:bg-[#ff6136]/5 active:scale-[0.98]"
          >
            Use Demo Credentials
          </button>
        </div>
      </motion.div>
    </div>
  )
}
