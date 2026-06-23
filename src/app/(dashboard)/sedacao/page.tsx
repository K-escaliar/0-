'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import { Bed, AlertTriangle, Info, Pencil, Check, X, CalendarClock } from 'lucide-react'

export default function SedacaoPage() {
  const supabase = createClient()
  const [sedacoes, setSedacoes] = useState<any[]>([])
  const [carregando, setCarregando] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [taxa, setTaxa] = useState('800')
  const [editandoTaxa, setEditandoTaxa] = useState(false)
  const [novaTaxa, setNovaTaxa] = useState('800')

  useEffect(() => {
    async function carregar() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
        setIsAdmin(profile?.role === 'admin')
      }
      const { data: cfg } = await supabase.from('configuracoes').select('valor').eq('chave', 'taxa_anestesista').single()
      if (cfg?.valor) { setTaxa(cfg.valor); setNovaTaxa(cfg.valor) }

      const { data } = await supabase
        .from('exames_sedacao')
        .select('*, exame:exames(nome, categoria)')
        .order('exame(nome)')
      if (data) setSedacoes(data)
      setCarregando(false)
    }
    carregar()
  }, [])

  async function salvarTaxa() {
    const valor = novaTaxa.replace(/[^\d.,]/g, '').replace(',', '.')
    if (!valor || isNaN(Number(valor))) { toast.error('Valor inválido.'); return }
    await supabase.from('configuracoes').upsert({ chave: 'taxa_anestesista', valor, updated_at: new Date().toISOString() })
    setTaxa(valor)
    setEditandoTaxa(false)
    toast.success('Valor atualizado!')
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Aviso fixo */}
      <div className="bg-amber-50 border-2 border-amber-400 rounded-xl p-4 mb-6 flex items-start gap-3">
        <AlertTriangle size={24} className="text-amber-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-bold text-amber-800 text-lg">Atenção!</p>
          <p className="text-amber-700 mt-1">
            Exames com sedação são agendados <strong>somente pela nossa enfermeira Francieli</strong>.
            Não agende diretamente — informe o paciente e transfira para a enfermeira.
          </p>
        </div>
      </div>

      {/* Regra de segurança 30 dias — informativa (atendente apenas avisa o paciente) */}
      <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 mb-6 flex items-start gap-3">
        <CalendarClock size={24} className="text-blue-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-bold text-blue-800">Oriente o paciente</p>
          <p className="text-blue-700 mt-1">
            Cada paciente pode fazer <strong>apenas 1 exame com sedação a cada 30 dias</strong>. Se o paciente
            tiver 2 exames com sedação, oriente que o primeiro seja feito agora e o segundo somente 30 dias depois.
            <strong> Apenas informe o paciente</strong> — esta orientação não bloqueia o agendamento.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-blue-100 rounded-lg">
          <Bed className="text-blue-700" size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Exames com Sedação</h1>
          <p className="text-gray-500 text-sm">Restrições, indicações e valores</p>
        </div>
      </div>

      {/* Informações sobre valores */}
      <div className="card mb-6 bg-blue-50 border border-blue-200">
        <h2 className="font-semibold text-blue-800 mb-3 flex items-center gap-2">
          <Info size={16} /> Valores e Convênios
        </h2>
        <div className="grid sm:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="font-medium text-gray-700 mb-2">Convênios que cobrem sedação:</p>
            <ul className="space-y-1 text-green-700">
              <li className="flex items-center gap-2">✓ Unimed Norte — cobre sedação e anestesista</li>
              <li className="flex items-center gap-2">✓ BRF — cobre sedação e anestesista</li>
            </ul>
            <p className="font-medium text-gray-700 mb-2 mt-3">NÃO cobrem sedação:</p>
            <ul className="space-y-1 text-red-600 text-xs">
              {['Bradesco', 'Sul América', 'CASSI', 'Infinity', 'MedService', 'Postal'].map(c => (
                <li key={c} className="flex items-center gap-2">✗ {c}</li>
              ))}
            </ul>
          </div>
          <div>
            <p className="font-medium text-gray-700 mb-2">Valores (particular):</p>
            <div className="space-y-2 text-sm">
              <div className="bg-white rounded-lg p-3 border border-blue-100">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-gray-900">Taxa do Anestesista (1 sedação)</p>
                  {isAdmin && !editandoTaxa && (
                    <button onClick={() => setEditandoTaxa(true)} className="text-blue-600 hover:text-blue-800" title="Alterar valor">
                      <Pencil size={14} />
                    </button>
                  )}
                </div>
                {editandoTaxa ? (
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-gray-600">R$</span>
                    <input
                      type="text"
                      value={novaTaxa}
                      onChange={e => setNovaTaxa(e.target.value)}
                      className="input-field py-1 w-28"
                      autoFocus
                    />
                    <button onClick={salvarTaxa} className="p-1.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-200"><Check size={14} /></button>
                    <button onClick={() => { setEditandoTaxa(false); setNovaTaxa(taxa) }} className="p-1.5 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200"><X size={14} /></button>
                  </div>
                ) : (
                  <p className="text-gray-600 mt-1">
                    Valor: <span className="font-bold text-blue-700 text-base">R$ {Number(taxa).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </p>
                )}
                <p className="text-xs text-gray-400 mt-1">Pagamento direto com anestesista + NF</p>
              </div>
            </div>
            <p className="text-xs text-amber-700 bg-amber-50 rounded p-2 mt-2">
              Sedação somente para crianças acima de 2 anos.
            </p>
          </div>
        </div>
      </div>

      {/* Lista de exames */}
      {carregando ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : sedacoes.length === 0 ? (
        <div className="card text-center py-12 text-gray-400">
          <Bed size={40} className="mx-auto mb-3 opacity-30" />
          <p>Nenhum exame cadastrado</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sedacoes.map(s => (
            <div key={s.id} className="card border border-gray-200">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{s.exame?.nome}</h3>
                  {s.exame?.categoria && (
                    <span className="badge-blue text-xs mt-1">{s.exame.categoria}</span>
                  )}
                </div>
              </div>
              {s.indicacoes && (
                <div className="mt-3">
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Indicações</p>
                  <p className="text-sm text-gray-700 bg-green-50 rounded-lg p-3">{s.indicacoes}</p>
                </div>
              )}
              {s.restricoes && (
                <div className="mt-3">
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Restrições</p>
                  <p className="text-sm text-gray-700 bg-red-50 rounded-lg p-3">{s.restricoes}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
