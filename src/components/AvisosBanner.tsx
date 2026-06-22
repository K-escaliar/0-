'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Megaphone, X } from 'lucide-react'

export default function AvisosBanner() {
  const supabase = createClient()
  const [avisos, setAvisos] = useState<any[]>([])
  const [fechados, setFechados] = useState<string[]>([])

  useEffect(() => {
    async function carregar() {
      const agora = new Date().toISOString()
      const { data } = await supabase
        .from('avisos')
        .select('*')
        .eq('ativo', true)
        .or(`expira_em.is.null,expira_em.gt.${agora}`)
        .order('created_at', { ascending: false })
      if (data) setAvisos(data)
    }
    carregar()
  }, [])

  const visiveis = avisos.filter(a => !fechados.includes(a.id))
  if (visiveis.length === 0) return null

  return (
    <div className="space-y-2 mb-4">
      {visiveis.map(aviso => (
        <div key={aviso.id} className="bg-amber-50 border-l-4 border-amber-400 rounded-lg p-3 flex items-start gap-3">
          <Megaphone size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-amber-900">{aviso.titulo}</p>
            <p className="text-sm text-amber-800 whitespace-pre-line">{aviso.mensagem}</p>
          </div>
          <button
            onClick={() => setFechados(f => [...f, aviso.id])}
            className="text-amber-400 hover:text-amber-700 flex-shrink-0"
            title="Ocultar"
          >
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  )
}
