'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Bed, AlertTriangle, Info } from 'lucide-react'

export default function SedacaoPage() {
  const supabase = createClient()
  const [sedacoes, setSedacoes] = useState<any[]>([])
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    async function carregar() {
      const { data } = await supabase
        .from('exames_sedacao')
        .select('*, exame:exames(nome, categoria)')
        .order('exame(nome)')
      if (data) setSedacoes(data)
      setCarregando(false)
    }
    carregar()
  }, [])

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
                <p className="font-semibold text-gray-900">Taxa do Anestesista</p>
                <p className="text-gray-600">Até 2 exames: <span className="font-bold text-blue-700">R$ 800,00</span></p>
                <p className="text-gray-600">Acima de 2: <span className="font-bold text-blue-700">R$ 1.600,00</span></p>
                <p className="text-xs text-gray-400 mt-1">Pagamento direto com anestesista + NF</p>
              </div>
              <div className="bg-white rounded-lg p-3 border border-blue-100">
                <p className="font-semibold text-gray-900">Sedação (material e medicamento)</p>
                <p className="text-gray-600">Valor: <span className="font-bold text-blue-700">R$ 483,00</span></p>
                <p className="text-xs text-gray-400 mt-1">Pago na recepção</p>
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
