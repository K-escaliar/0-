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

console.log('Adicionando coluna imagem_url...')
console.log(await query(`ALTER TABLE mensagens_internas ADD COLUMN IF NOT EXISTS imagem_url text;`))

console.log('\nCriando bucket de storage "mensagens-anexos"...')
const bucketRes = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/storage/buckets`, {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${PAT}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({
    id: 'mensagens-anexos',
    name: 'mensagens-anexos',
    public: false,
    file_size_limit: 10485760, // 10MB
    allowed_mime_types: ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif'],
  }),
})
console.log(bucketRes.status, await bucketRes.json())

console.log('\nCriando policies de storage...')
console.log(await query(`
  drop policy if exists "Usuarios autenticados enviam anexos" on storage.objects;
  create policy "Usuarios autenticados enviam anexos" on storage.objects
    for insert with check (bucket_id = 'mensagens-anexos' and auth.role() = 'authenticated');

  drop policy if exists "Usuarios autenticados veem anexos" on storage.objects;
  create policy "Usuarios autenticados veem anexos" on storage.objects
    for select using (bucket_id = 'mensagens-anexos' and auth.role() = 'authenticated');
`))

console.log('\nOK: configuracao de imagens em mensagens concluida.')
