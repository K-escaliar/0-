const PAT = process.env.SUPABASE_ACCESS_TOKEN
const PROJECT_REF = 'wscniwsvjmkymmeeypih'

const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${PAT}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ query: `ALTER TABLE notas_pessoais ADD COLUMN IF NOT EXISTS data_lembrete date;` }),
})
const data = await res.json()
console.log(res.ok ? 'OK: coluna data_lembrete adicionada.' : 'Erro:', data)
