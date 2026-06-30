const PAT = process.env.SUPABASE_ACCESS_TOKEN
const PROJECT_REF = 'wscniwsvjmkymmeeypih'

async function query(sql) {
  const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${PAT}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: sql }),
  })
  return res.json()
}

console.log('Tabelas atualmente na publicacao supabase_realtime:')
console.log(await query(`select tablename from pg_publication_tables where pubname = 'supabase_realtime'`))

console.log('\nAdicionando mensagens_internas ao realtime...')
console.log(await query(`alter publication supabase_realtime add table mensagens_internas;`))
