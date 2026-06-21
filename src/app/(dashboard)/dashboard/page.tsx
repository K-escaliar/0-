'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { BarChart3, Target, TrendingUp, Users, CalendarDays } from 'lucide-react'
import { redirect } from 'next/navigation'

const META_MENSAL = 500

export default function DashboardPage() {
  const supabase = createClient()
  const [dados, setDados] = useState<any[]>([])
  const [agendamentosPorDia, setAgendamentosPorDia] = useState<any[]>([])
  const [carregando, setCarregando] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [mesAtual] = useState(() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  })

  useEffect(() => {
    async function carregar() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
      if (profile?.role !== 'admin') {
        setIsAdmin(false)
        setCarregando(false)
        return
      }
      setIsAdmin(true)

      const inicioMes = `${mesAtual}-01`
      const hoje = new Date()
      const fimMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).toISOString().split('T')[0]

      // Buscar agendamentos do mês com exames (cada exame conta como 1)
      const { data: ags } = await supabase
        .from('agendamentos')
        .select(`atendente_id, atendente:profiles!agendamentos_atendente_id_fkey(nome), exames:agendamento_exames(id), data`)
        .gte('data', inicioMes)
        .lte('data', fimMes)

      if (ags) {
        // Agrupar por atendente
        const mapa: Record<string, { nome: string; total: number }> = {}
        const porDia: Record<string, number> = {}

        for (const ag of ags) {
          const qtdExames = ag.exames?.length ?? 1
          const atendenteId = ag.atendente_id
          const atendenteNome = (ag.atendente as any)?.nome ?? 'Desconhecido'

          if (!mapa[atendenteId]) {
            mapa[atendenteId] = { nome: atendenteNome, total: 0 }
          }
          mapa[atendenteId].total += qtdExames

          if (ag.data) {
            porDia[ag.data] = (porDia[ag.data] ?? 0) + qtdExames
          }
        }

        const lista = Object.entries(mapa)
          .map(([id, val]) => ({ id, ...val }))
          .sort((a, b) => b.total - a.total)

        setDados(lista)

        const diasOrdenados = Object.entries(porDia)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([data, total]) => ({ data, total }))
        setAgendamentosPorDia(diasOrdenados)
      }

      setCarregando(false)
    }
    carregar()
  }, [])

  if (!isAdmin && !carregando) {
    return (
      <div className="p-6 flex items-center justify-center min-h-64">
        <div className="text-center">
          <p className="text-gray-500">Acesso restrito a administradores.</p>
        </div>
      </div>
    )
  }

  const totalGeral = dados.reduce((sum, a) => sum + a.total, 0)
  const mesNome = new Date(`${mesAtual}-01`).toLocaleString('pt-BR', { month: 'long', year: 'numeric' })

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-blue-100 rounded-lg">
          <BarChart3 className="text-blue-700" size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 text-sm capitalize">{mesNome}</p>
        </div>
      </div>

      {carregando ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* Cards resumo */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="card">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <TrendingUp size={20} className="text-green-700" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium uppercase">Total Geral</p>
                  <p className="text-2xl font-bold text-gray-900">{totalGeral}</p>
                  <p className="text-xs text-gray-400">agendamentos no mês</p>
                </div>
              </div>
            </div>
            <div className="card">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users size={20} className="text-blue-700" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium uppercase">Atendentes</p>
                  <p className="text-2xl font-bold text-gray-900">{dados.length}</p>
                  <p className="text-xs text-gray-400">ativos no mês</p>
                </div>
              </div>
            </div>
            <div className="card">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Target size={20} className="text-purple-700" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium uppercase">Meta Total</p>
                  <p className="text-2xl font-bold text-gray-900">{dados.length * META_MENSAL}</p>
                  <p className="text-xs text-gray-400">({META_MENSAL}/atendente)</p>
                </div>
              </div>
            </div>
          </div>

          {/* Atendentes */}
          <div className="card mb-6">
            <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Users size={18} /> Performance por Atendente
            </h2>
            {dados.length === 0 ? (
              <p className="text-gray-400 text-sm">Nenhum agendamento registrado este mês.</p>
            ) : (
              <div className="space-y-4">
                {dados.map(atendente => {
                  const pct = Math.min(Math.round((atendente.total / META_MENSAL) * 100), 100)
                  const cor = pct >= 100 ? 'bg-green-500' : pct >= 70 ? 'bg-blue-500' : pct >= 40 ? 'bg-yellow-500' : 'bg-red-400'
                  return (
                    <div key={atendente.id}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-medium text-gray-800">{atendente.nome}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-gray-500">{atendente.total}/{META_MENSAL}</span>
                          <span className={`text-sm font-bold ${pct >= 100 ? 'text-green-600' : pct >= 70 ? 'text-blue-600' : 'text-gray-600'}`}>
                            {pct}%
                          </span>
                        </div>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-3">
                        <div className={`h-3 rounded-full transition-all duration-500 ${cor}`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Agendamentos por dia */}
          {agendamentosPorDia.length > 0 && (
            <div className="card">
              <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <CalendarDays size={18} /> Agendamentos por Dia
              </h2>
              <div className="space-y-2">
                {agendamentosPorDia.map(({ data, total }) => {
                  const maxTotal = Math.max(...agendamentosPorDia.map(d => d.total))
                  const pct = Math.round((total / maxTotal) * 100)
                  const dataFmt = new Date(data + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', weekday: 'short' })
                  return (
                    <div key={data} className="flex items-center gap-3">
                      <span className="text-xs text-gray-500 w-28 flex-shrink-0">{dataFmt}</span>
                      <div className="flex-1 bg-gray-100 rounded-full h-2.5">
                        <div className="h-2.5 rounded-full bg-blue-500" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs font-semibold text-gray-700 w-6 text-right">{total}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
