// Remove BOM (U+FEFF), espaco de largura zero (U+200B), espacos e quebras de linha
// que podem ser introduzidos ao configurar variaveis de ambiente (ex: PowerShell
// adiciona BOM). Sem isso o fetch falha com "non ISO-8859-1 code point" nos headers.
function limpar(valor: string | undefined): string {
  let s = valor ?? ''
  let out = ''
  for (let i = 0; i < s.length; i++) {
    const code = s.charCodeAt(i)
    // pula BOM, zero-width space, CR e LF
    if (code === 0xfeff || code === 0x200b || code === 13 || code === 10) continue
    out += s[i]
  }
  return out.trim()
}

export const SUPABASE_URL = limpar(process.env.NEXT_PUBLIC_SUPABASE_URL)
export const SUPABASE_ANON_KEY = limpar(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
