'use client'
import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import { Eye, EyeOff, LogIn } from 'lucide-react'
import MedicalBackground from '@/components/MedicalBackground'

// Domínio técnico interno — o usuário nunca vê isso, só digita o nome de usuário
const DOMINIO_INTERNO = '@cdi.local'

export default function LoginPage() {
  const [usuario, setUsuario] = useState('')
  const [senha, setSenha] = useState('')
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [carregando, setCarregando] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  useEffect(() => {
    if (searchParams.get('motivo') === 'sessao_encerrada') {
      toast.error('Sua sessão foi encerrada porque outro dispositivo fez login com este usuário.', { duration: 6000 })
    }
  }, [])

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setCarregando(true)
    try {
      const email = usuario.trim().toLowerCase() + DOMINIO_INTERNO
      const { data, error } = await supabase.auth.signInWithPassword({ email, password: senha })
      if (error || !data.user) {
        toast.error('Usuário ou senha incorretos.')
        return
      }

      // Gera token único de sessão e salva no banco
      const sessionToken = crypto.randomUUID()
      await supabase.from('profiles').update({ session_token: sessionToken }).eq('id', data.user.id)

      // Salva no cookie para o middleware validar
      document.cookie = `cdi_session_id=${sessionToken}; path=/; SameSite=Lax; max-age=86400`

      router.push('/')
      router.refresh()
    } catch {
      toast.error('Erro ao fazer login. Tente novamente.')
    } finally {
      setCarregando(false)
    }
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-blue-900 to-blue-700 flex items-center justify-center p-4 overflow-hidden">
      <MedicalBackground variant="hero" />
      <div className="relative z-10 bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl w-full max-w-md p-8">
        {/* Logo / Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-800 rounded-2xl mb-4">
            <span className="text-white text-2xl font-bold">CDI</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Sistema CDI</h1>
          <p className="text-gray-500 text-sm mt-1">Centro de Diagnóstico por Imagem</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Usuário</label>
            <input
              type="text"
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              className="input-field"
              placeholder="seu usuário"
              required
              autoComplete="username"
              autoCapitalize="none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
            <div className="relative">
              <input
                type={mostrarSenha ? 'text' : 'password'}
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                className="input-field pr-10"
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setMostrarSenha(!mostrarSenha)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {mostrarSenha ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={carregando}
            className="btn-primary w-full flex items-center justify-center gap-2 py-3 text-base"
          >
            {carregando ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <LogIn size={18} />
                Entrar
              </>
            )}
          </button>
        </form>

        <p className="text-center text-xs text-gray-400 mt-6">
          CDI Prime · CDI Treze de Maio
        </p>
      </div>
    </div>
  )
}
