// Execute manualmente: node supabase/add-notas-mensagens.mjs
// Necessita SUPABASE_ACCESS_TOKEN (PAT) como variavel de ambiente
const PAT = process.env.SUPABASE_ACCESS_TOKEN
const PROJECT_REF = 'wscniwsvjmkymmeeypih' // producao

if (!PAT) {
  console.error('Defina SUPABASE_ACCESS_TOKEN antes de rodar.')
  process.exit(1)
}

const sql = `
-- ============================================================
-- TABELA: notas_pessoais
-- ============================================================
create table if not exists notas_pessoais (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references profiles(id) on delete cascade,
  titulo text not null,
  conteudo text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table notas_pessoais enable row level security;
drop policy if exists "Usuarios gerenciam suas notas" on notas_pessoais;
create policy "Usuarios gerenciam suas notas" on notas_pessoais
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================
-- TABELA: mensagens_internas
-- ============================================================
create table if not exists mensagens_internas (
  id uuid primary key default uuid_generate_v4(),
  remetente_id uuid not null references profiles(id) on delete cascade,
  destinatario_id uuid not null references profiles(id) on delete cascade,
  conteudo text not null,
  lida boolean not null default false,
  created_at timestamptz not null default now()
);
alter table mensagens_internas enable row level security;
drop policy if exists "Usuarios veem suas mensagens" on mensagens_internas;
create policy "Usuarios veem suas mensagens" on mensagens_internas
  for select using (auth.uid() = remetente_id or auth.uid() = destinatario_id);
drop policy if exists "Usuarios enviam mensagens" on mensagens_internas;
create policy "Usuarios enviam mensagens" on mensagens_internas
  for insert with check (auth.uid() = remetente_id);
drop policy if exists "Destinatario marca como lida" on mensagens_internas;
create policy "Destinatario marca como lida" on mensagens_internas
  for update using (auth.uid() = destinatario_id);

create index if not exists idx_mensagens_destinatario on mensagens_internas(destinatario_id, lida);
create index if not exists idx_mensagens_conversa on mensagens_internas(remetente_id, destinatario_id, created_at);
`

const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${PAT}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ query: sql }),
})
const data = await res.json()
console.log(res.ok ? 'OK: tabelas notas_pessoais e mensagens_internas criadas.' : 'Erro:', data)
