'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { CreditCard, CheckCircle, XCircle, AlertTriangle, FileText, ChevronDown, ChevronUp } from 'lucide-react'

export default function ConveniosPage() {
  const supabase = createClient()
  const [convenios, setConvenios] = useState<any[]>([])
  const [carregando, setCarregando] = useState(true)
  const [expandido, setExpandido] = useState<string | null>(null)

  useEffect(() => {
    async function carregar() {
      const { data } = await supabase
        .from('convenios')
        .select(`*, convenio_exames(status, observacao, exame:exames(nome, categoria))`)
        .order('nome')
      if (data) setConvenios(data)
      setCarregando(false)
    }
    carregar()
  }, [])

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-blue-100 rounded-lg">
          <CreditCard className="text-blue-700" size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Convênios & Regras</h1>
          <p className="text-gray-500 text-sm">Exames autorizados, negados e alertas por convênio</p>
        </div>
      </div>

      {carregando ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-4">
          {convenios.map(convenio => {
            const autorizados = convenio.convenio_exames?.filter((ce: any) => ce.status === 'autorizado') ?? []
            const negados = convenio.convenio_exames?.filter((ce: any) => ce.status === 'negado') ?? []
            const restritos = convenio.convenio_exames?.filter((ce: any) => ce.status === 'restrito') ?? []
            const isOpen = expandido === convenio.id

            return (
              <div key={convenio.id} className="card border border-gray-200">
                <button
                  onClick={() => setExpandido(isOpen ? null : convenio.id)}
                  className="w-full flex items-start justify-between text-left"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="font-bold text-gray-900 text-lg">{convenio.nome}</h3>
                      {convenio.precisa_guia && (
                        <span className="badge-yellow flex items-center gap-1">
                          <FileText size={11} /> Exige guia
                        </span>
                      )}
                      {convenio.precisa_autorizacao && (
                        <span className="badge-yellow flex items-center gap-1">
                          <FileText size={11} /> Autorização prévia
                        </span>
                      )}
                    </div>
                    {convenio.alertas && (
                      <div className="flex items-start gap-2 mt-2 text-sm text-amber-700 bg-amber-50 rounded-lg px-3 py-2">
                        <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" />
                        <p>{convenio.alertas}</p>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                    <div className="hidden sm:flex gap-2 text-xs">
                      {autorizados.length > 0 && <span className="text-green-600">{autorizados.length} aut.</span>}
                      {negados.length > 0 && <span className="text-red-500">{negados.length} neg.</span>}
                    </div>
                    {isOpen ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
                  </div>
                </button>

                {isOpen && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    {convenio.observacoes && (
                      <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 mb-4 text-sm text-blue-800">
                        {convenio.observacoes}
                      </div>
                    )}

                    <div className="grid sm:grid-cols-3 gap-4">
                      {/* Negados */}
                      <div>
                        <h4 className="text-sm font-semibold text-red-600 flex items-center gap-1 mb-2">
                          <XCircle size={14} /> Exames Negados
                        </h4>
                        {negados.length === 0 ? (
                          <p className="text-xs text-gray-400">Nenhum</p>
                        ) : (
                          <ul className="space-y-1">
                            {negados.map((ce: any, i: number) => (
                              <li key={i} className="text-sm text-gray-700 flex items-start gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0 mt-1.5" />
                                <span>
                                  {ce.exame?.nome}
                                  {ce.observacao && <span className="text-xs text-gray-400 block">{ce.observacao}</span>}
                                </span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>

                      {/* Restritos */}
                      <div>
                        <h4 className="text-sm font-semibold text-yellow-600 flex items-center gap-1 mb-2">
                          <AlertTriangle size={14} /> Restritos
                        </h4>
                        {restritos.length === 0 ? (
                          <p className="text-xs text-gray-400">Nenhum</p>
                        ) : (
                          <ul className="space-y-1">
                            {restritos.map((ce: any, i: number) => (
                              <li key={i} className="text-sm text-gray-700 flex items-start gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 flex-shrink-0 mt-1.5" />
                                <span>
                                  {ce.exame?.nome}
                                  {ce.observacao && <span className="text-xs text-gray-400 block">{ce.observacao}</span>}
                                </span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>

                      {/* Autorizados */}
                      <div>
                        <h4 className="text-sm font-semibold text-green-600 flex items-center gap-1 mb-2">
                          <CheckCircle size={14} /> Autorizados
                        </h4>
                        {autorizados.length === 0 ? (
                          <p className="text-xs text-gray-400">Todos (exceto negados)</p>
                        ) : (
                          <ul className="space-y-1">
                            {autorizados.map((ce: any, i: number) => (
                              <li key={i} className="text-sm text-gray-700 flex items-start gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0 mt-1.5" />
                                {ce.exame?.nome}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
