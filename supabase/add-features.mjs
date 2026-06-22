import { Client } from 'pg'
const c = new Client({
  host: 'aws-1-us-east-2.pooler.supabase.com', port: 5432,
  user: 'postgres.wscniwsvjmkymmeeypih', password: process.env.DBPASS,
  database: 'postgres', ssl: { rejectUnauthorized: false },
})
await c.connect()
try {
  // Tabela de configurações (valores editáveis, ex: taxa do anestesista)
  await c.query(`
    create table if not exists configuracoes (
      chave text primary key,
      valor text not null,
      updated_at timestamptz not null default now()
    )
  `)
  await c.query(`
    insert into configuracoes (chave, valor) values ('taxa_anestesista', '800')
    on conflict (chave) do nothing
  `)

  // Tabela de avisos / novidades
  await c.query(`
    create table if not exists avisos (
      id uuid primary key default uuid_generate_v4(),
      titulo text not null,
      mensagem text not null,
      expira_em timestamptz,
      ativo boolean not null default true,
      criado_por uuid references profiles(id),
      created_at timestamptz not null default now()
    )
  `)

  // RLS
  await c.query(`alter table configuracoes enable row level security`)
  await c.query(`alter table avisos enable row level security`)
  await c.query(`drop policy if exists "auth configuracoes" on configuracoes`)
  await c.query(`create policy "auth configuracoes" on configuracoes for all using (auth.role() = 'authenticated')`)
  await c.query(`drop policy if exists "auth avisos" on avisos`)
  await c.query(`create policy "auth avisos" on avisos for all using (auth.role() = 'authenticated')`)

  const cfg = await c.query(`select * from configuracoes`)
  console.log('Configuracoes:', JSON.stringify(cfg.rows))
  console.log('Tabelas configuracoes e avisos criadas com sucesso.')
} catch (e) {
  console.error('ERRO:', e.message)
  process.exitCode = 1
} finally { await c.end() }
