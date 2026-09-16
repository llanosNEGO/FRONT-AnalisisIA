import { useState } from 'react'
import { GoogleLogin } from '@react-oauth/google'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const navigate = useNavigate()
  const { signInWithGoogle } = useAuth()
  const [error, setError] = useState<string | null>(null)

  const handleSuccess = async (credential?: string) => {
    if (!credential) return
    try {
      setError(null)
      await signInWithGoogle(credential)
      navigate('/dashboard', { replace: true })
    } catch {
      setError('No se pudo iniciar sesión. Verifica tu cuenta de Google e intenta de nuevo.')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 relative overflow-hidden font-sans selection:bg-purple-500/30">
      {/* Background gradients */}
      <div className="absolute top-1/4 left-1/4 w-[40rem] h-[40rem] bg-purple-600/20 rounded-full blur-[128px] pointer-events-none animate-pulse-slow" />
      <div className="absolute bottom-1/4 right-1/4 w-[40rem] h-[40rem] bg-indigo-600/20 rounded-full blur-[128px] pointer-events-none animate-pulse-slow" style={{ animationDelay: '2s' }} />

      <div className="relative z-10 w-full max-w-md p-8 rounded-3xl bg-gray-900/40 border border-gray-800/60 backdrop-blur-2xl shadow-2xl shadow-black/50">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/25 mb-6">
            <span className="text-white text-2xl font-bold">AI</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Welcome Back</h1>
          <p className="text-gray-400 text-center">Sign in to manage your captured prompts and analysis.</p>
        </div>

        <div className="flex justify-center my-8">
          <GoogleLogin
            onSuccess={({ credential }) => handleSuccess(credential)}
            onError={() => setError('No se pudo iniciar sesión con Google. Intenta de nuevo.')}
            theme="filled_black"
            shape="pill"
            size="large"
            text="continue_with"
          />
        </div>

        {error && (
          <p className="text-center text-sm text-red-400 mt-4 px-4">{error}</p>
        )}

        <div className="text-center mt-6">
          <p className="text-xs text-gray-500">
            By continuing, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  )
}