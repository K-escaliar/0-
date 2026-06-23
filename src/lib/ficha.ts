// Gera uma ficha/comprovante de agendamento em HTML (formato A4) e abre o diálogo de
// impressão do navegador — o atendente pode imprimir em papel ou "Salvar como PDF".
import { ENDERECOS } from './utils'

export interface FichaExame {
  nome: string
  preparo?: string | null
  categoria?: string
}
export interface FichaBloco {
  unidade: string
  data: string      // já formatada (dd/MM/yyyy)
  horario: string
  chegadaMin: number
  exames: FichaExame[]
}
export interface FichaDados {
  pacienteNome: string
  convenio: string
  medicoSolicitante?: string | null
  blocos: FichaBloco[]
}

function esc(s: string): string {
  return (s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string))
}

export function gerarFichaHTML(d: FichaDados): string {
  const multi = d.blocos.length > 1

  const blocosHTML = d.blocos.map(b => {
    const endereco = ENDERECOS[b.unidade as keyof typeof ENDERECOS] ?? b.unidade
    const enderecoLimpo = String(endereco).replace(/\*/g, '')
    const examesLi = b.exames.map(e => `<li>${esc(e.nome)}</li>`).join('')
    return `
      <div class="bloco">
        ${multi ? `<div class="bloco-titulo">${esc(b.unidade)}</div>` : ''}
        <table class="dados">
          <tr><th>Unidade</th><td>${esc(b.unidade)}</td></tr>
          <tr><th>Data</th><td>${esc(b.data)}</td></tr>
          <tr><th>Horário</th><td>${esc(b.horario.slice(0, 5))}</td></tr>
          <tr><th>Chegada</th><td>Chegar com ${b.chegadaMin} minutos de antecedência</td></tr>
        </table>
        <div class="rotulo">Exame(s)</div>
        <ul class="exames">${examesLi}</ul>
        <div class="endereco"><strong>Endereço:</strong> ${esc(enderecoLimpo)}</div>
      </div>`
  }).join('')

  // preparos (de todos os blocos), sem repetir exames iguais
  const vistos = new Set<string>()
  const preparos: { nome: string; preparo: string }[] = []
  for (const b of d.blocos) {
    for (const e of b.exames) {
      if (e.preparo && e.preparo.trim() && !vistos.has(e.nome)) {
        vistos.add(e.nome)
        preparos.push({ nome: e.nome, preparo: e.preparo.trim() })
      }
    }
  }
  const preparosHTML = preparos.length
    ? preparos.map(p => `<div class="prep"><div class="prep-nome">${esc(p.nome)}</div><div class="prep-texto">${esc(p.preparo)}</div></div>`).join('')
    : '<p class="sem-prep">Seus exames não exigem preparo especial. Basta chegar no horário com os documentos.</p>'

  const hoje = new Date().toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })

  return `<!DOCTYPE html>
<html lang="pt-BR"><head><meta charset="utf-8"><title>Ficha de Agendamento - ${esc(d.pacienteNome)}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: Arial, Helvetica, sans-serif; color: #1f2937; margin: 0; padding: 24px 28px; font-size: 13px; line-height: 1.5; }
  .cabecalho { display: flex; align-items: center; gap: 12px; border-bottom: 3px solid #1e40af; padding-bottom: 12px; margin-bottom: 16px; }
  .logo { width: 48px; height: 48px; background: #1e40af; color: #fff; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 18px; }
  .cabecalho h1 { font-size: 18px; margin: 0; color: #1e3a8a; }
  .cabecalho p { margin: 2px 0 0; font-size: 11px; color: #6b7280; }
  .titulo-doc { text-align: center; font-size: 15px; font-weight: 700; margin: 6px 0 16px; color: #111827; letter-spacing: .5px; }
  .paciente { background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 10px 14px; margin-bottom: 16px; }
  .paciente .nome { font-size: 16px; font-weight: 700; color: #111827; }
  .paciente .sub { font-size: 12px; color: #374151; margin-top: 2px; }
  .bloco { border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px 14px; margin-bottom: 12px; }
  .bloco-titulo { font-weight: 700; color: #1e40af; margin-bottom: 8px; border-bottom: 1px dashed #cbd5e1; padding-bottom: 4px; }
  table.dados { width: 100%; border-collapse: collapse; }
  table.dados th { text-align: left; width: 110px; color: #6b7280; font-weight: 600; padding: 2px 0; vertical-align: top; }
  table.dados td { padding: 2px 0; }
  .rotulo { font-size: 11px; text-transform: uppercase; color: #6b7280; font-weight: 700; margin: 8px 0 2px; }
  ul.exames { margin: 0; padding-left: 18px; }
  ul.exames li { font-weight: 600; }
  .endereco { margin-top: 8px; font-size: 12px; color: #374151; }
  .secao-titulo { font-size: 14px; font-weight: 700; color: #1e3a8a; border-bottom: 2px solid #dbeafe; padding-bottom: 4px; margin: 18px 0 10px; }
  .prep { margin-bottom: 10px; padding: 8px 12px; background: #fffbeb; border: 1px solid #fde68a; border-radius: 6px; }
  .prep-nome { font-weight: 700; color: #92400e; }
  .prep-texto { white-space: pre-line; }
  .sem-prep { color: #6b7280; }
  .docs { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; padding: 10px 14px; margin-top: 8px; }
  .docs strong { color: #111827; }
  .rodape { margin-top: 22px; border-top: 1px solid #e5e7eb; padding-top: 8px; font-size: 10px; color: #9ca3af; text-align: center; }
  @media print { body { padding: 0; } .bloco, .prep, .paciente, .docs { break-inside: avoid; } }
</style></head>
<body>
  <div class="cabecalho">
    <div class="logo">CDI</div>
    <div><h1>CDI — Centro de Diagnóstico por Imagem</h1><p>CDI Prime · CDI Treze de Maio</p></div>
  </div>

  <div class="titulo-doc">COMPROVANTE DE AGENDAMENTO</div>

  <div class="paciente">
    <div class="nome">${esc(d.pacienteNome)}</div>
    <div class="sub">Convênio: <strong>${esc(d.convenio)}</strong>${d.medicoSolicitante ? ` &nbsp;·&nbsp; Médico solicitante: ${esc(d.medicoSolicitante)}` : ''}</div>
  </div>

  ${blocosHTML}

  <div class="secao-titulo">Orientações e Preparo</div>
  ${preparosHTML}

  <div class="docs">
    <strong>Documentos necessários no dia:</strong>
    <ul style="margin:6px 0 0; padding-left:18px;">
      <li>Documento oficial com foto (RG ou CNH)</li>
      <li>Pedido médico original dentro da validade</li>
      <li>Carteirinha do convênio (se aplicável)</li>
    </ul>
  </div>

  <div class="rodape">Emitido em ${hoje} · Em caso de dúvidas, entre em contato com a recepção.</div>
</body></html>`
}

export function imprimirFicha(d: FichaDados) {
  const html = gerarFichaHTML(d)
  const w = window.open('', '_blank', 'width=820,height=900')
  if (!w) {
    alert('Permita pop-ups para gerar a ficha em PDF.')
    return
  }
  w.document.open()
  w.document.write(html)
  w.document.close()
  w.focus()
  // espera renderizar e abre o diálogo de impressão (Salvar como PDF)
  setTimeout(() => w.print(), 400)
}
