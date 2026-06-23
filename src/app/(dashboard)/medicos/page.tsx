'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Users, Search, CheckCircle, XCircle, ChevronDown, ChevronUp, Stethoscope, Scan } from 'lucide-react'
import { semAcento } from '@/lib/utils'

const MODALIDADES: { sigla: string; nome: string }[] = [
  { sigla: 'TC', nome: 'Tomografia' },
  { sigla: 'RM', nome: 'Ressonância' },
  { sigla: 'RX', nome: 'Raio-X' },
]
const UNIDADES = ['CDI Prime', 'CDI Treze de Maio']

export default function MedicosPage() {
  const supabase = createClient()
  const [medicos, setMedicos] = useState<any[]>([])
  const [responsabilidades, setResponsabilidades] = useState<any[]>([])
  const [carregando, setCarregando] = useState(true)
  const [busca, setBusca] = useState('')
  const [expandido, setExpandido] = useState<string | null>(null)

  useEffect(() => {
    async function carregar() {
      const [{ data: meds }, { data: resp }] = await Promise.all([
        supabase.from('medicos').select(`*, medico_exames(realiza, exame:exames(nome, categoria))`).order('nome'),
        supabase.from('medico_responsabilidades').select(`*, medico:medicos(nome)`).order('ordem'),
      ])
      if (meds) setMedicos(meds)
      if (resp) setResponsabilidades(resp)
      setCarregando(false)
    }
    carregar()
  }, [])

  // médicos que fazem ultrassom (têm ao menos 1 exame de US vinculado)
  const medicosUS = medicos.filter(m =>
    (m.medico_exames ?? []).some((me: any) => me.exame?.categoria === 'Ultrassom')
  )

  const q = semAcento(busca.trim())

  // BUSCA POR EXAME: para cada médico, exames que ELE FAZ cujo nome casa com a busca
  const resultadosBusca = q
    ? medicos.map(m => {
        const exames = (m.medico_exames ?? [])
          .filter((me: any) => me.realiza && me.exame && semAcento(me.exame.nome).includes(q))
          .map((me: any) => me.exame)
        return { medico: m, exames }
      }).filter(r => r.exames.length > 0)
    : []

  function listaUS(m: any, realiza: boolean) {
    return (m.medico_exames ?? [])
      .filter((me: any) => me.exame?.categoria === 'Ultrassom' && me.realiza === realiza)
      .map((me: any) => me.exame)
      .sort((a: any, b: any) => a.nome.localeCompare(b.nome))
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-blue-100 rounded-lg"><Users className="text-blue-700" size={24} /></div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Médicos & Exames</h1>
          <p className="text-gray-500 text-sm">Quem faz cada exame e os responsáveis por modalidade</p>
        </div>
      </div>

      {/* Busca por exame */}
      <div className="card mb-6">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text" value={busca} onChange={e => setBusca(e.target.value)}
            placeholder="Buscar por exame (ex.: tireoide, joelho, doppler...)"
            className="input-field pl-9"
          />
        </div>
        <p className="text-xs text-gray-400 mt-2">Digite um exame para ver quais médicos o realizam.</p>
      </div>

      {carregando ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : q ? (
        /* ===== MODO BUSCA ===== */
        <div className="space-y-4">
          {resultadosBusca.length === 0 ? (
            <div className="card text-center py-12 text-gray-400">
              <Search size={40} className="mx-auto mb-3 opacity-30" />
              <p className="font-medium">Nenhum médico realiza um exame com “{busca}”.</p>
              <p className="text-sm mt-1">Verifique o nome ou cadastre o vínculo no painel admin.</p>
            </div>
          ) : (
            resultadosBusca.map(({ medico, exames }) => (
              <div key={medico.id} className="card border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-900">{medico.nome}</h3>
                  <span className="badge-blue text-xs">{medico.unidade}</span>
                </div>
                <ul className="space-y-1">
                  {exames.map((e: any, i: number) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-gray-700">
                      <CheckCircle size={14} className="text-green-500 flex-shrink-0" />
                      {e.nome}
                    </li>
                  ))}
                </ul>
              </div>
            ))
          )}
        </div>
      ) : (
        /* ===== MODO PADRÃO ===== */
        <div className="space-y-8">
          {/* Médicos de Ultrassom */}
          <section>
            <h2 className="flex items-center gap-2 text-lg font-bold text-gray-900 mb-3">
              <Stethoscope size={20} className="text-blue-700" /> Médicos de Ultrassom
            </h2>
            <div className="space-y-3">
              {medicosUS.map(medico => {
                const faz = listaUS(medico, true)
                const naoFaz = listaUS(medico, false)
                const isOpen = expandido === medico.id
                return (
                  <div key={medico.id} className="card border border-gray-200">
                    <button onClick={() => setExpandido(isOpen ? null : medico.id)} className="w-full flex items-center justify-between text-left">
                      <div>
                        <h3 className="font-semibold text-gray-900 text-lg">{medico.nome}</h3>
                        <div className="flex items-center gap-2 mt-0.5">
                          {medico.especialidade && <p className="text-sm text-gray-500">{medico.especialidade}</p>}
                          <span className="badge-blue text-xs">{medico.unidade}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                        <div className="text-right hidden sm:block">
                          <p className="text-xs text-green-600 font-medium">{faz.length} faz</p>
                          <p className="text-xs text-red-500">{naoFaz.length} não faz</p>
                        </div>
                        {isOpen ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
                      </div>
                    </button>
                    {isOpen && (
                      <div className="mt-4 pt-4 border-t border-gray-100 grid sm:grid-cols-2 gap-4">
                        <div>
                          <h4 className="text-sm font-semibold text-green-700 flex items-center gap-1 mb-2"><CheckCircle size={14} /> Exames de US que realiza</h4>
                          {faz.length === 0 ? <p className="text-xs text-gray-400">Nenhum cadastrado</p> : (
                            <ul className="space-y-1">
                              {faz.map((e: any, i: number) => (
                                <li key={i} className="flex items-center gap-2 text-sm text-gray-700">
                                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0" />{e.nome}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-red-600 flex items-center gap-1 mb-2"><XCircle size={14} /> Não realiza (US)</h4>
                          {naoFaz.length === 0 ? <p className="text-xs text-gray-400">—</p> : (
                            <ul className="space-y-1">
                              {naoFaz.map((e: any, i: number) => (
                                <li key={i} className="flex items-center gap-2 text-sm text-gray-700">
                                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />{e.nome}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
              {medicosUS.length === 0 && <p className="text-sm text-gray-400">Nenhum médico de ultrassom cadastrado.</p>}
            </div>
          </section>

          {/* Responsáveis por TC / RM / RX */}
          <section>
            <h2 className="flex items-center gap-2 text-lg font-bold text-gray-900 mb-3">
              <Scan size={20} className="text-blue-700" /> Responsáveis por Tomografia, Ressonância e Raio-X
            </h2>
            <div className="space-y-5">
              {MODALIDADES.map(mod => {
                const daModalidade = responsabilidades.filter(r => r.modalidade === mod.sigla)
                if (daModalidade.length === 0) return null
                return (
                  <div key={mod.sigla} className="card border border-gray-200">
                    <h3 className="font-bold text-gray-900 mb-3">{mod.nome} <span className="text-gray-400 font-normal">({mod.sigla})</span></h3>
                    <div className="grid sm:grid-cols-2 gap-4">
                      {UNIDADES.map(uni => {
                        const itens = daModalidade.filter(r => r.unidade === uni)
                        if (itens.length === 0) return null
                        return (
                          <div key={uni} className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                            <p className="text-xs font-semibold text-blue-700 uppercase mb-2">{uni}</p>
                            <ul className="space-y-2">
                              {itens.map(r => (
                                <li key={r.id} className="text-sm">
                                  <span className="font-medium text-gray-800">{r.medico?.nome}</span>
                                  {r.escopo && <span className="text-gray-500"> — {r.escopo}</span>}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
            <p className="text-xs text-gray-400 mt-3">Os vínculos de exames podem ser ajustados pelo administrador em Administração → Médicos.</p>
          </section>
        </div>
      )}
    </div>
  )
}
