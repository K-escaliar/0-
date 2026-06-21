# Guia de Configuração — Sistema CDI

## Pré-requisitos
- Node.js 18+ (baixar em https://nodejs.org)
- Conta no Supabase (https://supabase.com) — gratuito
- Conta na Vercel (https://vercel.com) — gratuito

---

## 1. Configurar o Supabase

1. Acesse https://supabase.com e crie um novo projeto
2. Anote a **URL do projeto** e a **anon key** (em Project Settings > API)
3. No menu lateral, vá em **SQL Editor**
4. Cole e execute todo o conteúdo do arquivo `supabase/schema.sql`
5. Isso criará todas as tabelas e preencherá com os dados iniciais (exames, médicos, convênios)

---

## 2. Criar o arquivo .env.local

Na pasta raiz do projeto, crie um arquivo chamado `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
```

As chaves estão em: **Supabase → Project Settings → API**
- `URL`: Project URL
- `ANON KEY`: Project API keys → anon/public
- `SERVICE_ROLE_KEY`: Project API keys → service_role (manter secreta!)

---

## 3. Criar o primeiro usuário admin

No Supabase, vá em **Authentication → Users → Add User**:
- Email: seu email
- Password: sua senha
- Clique em Create

Depois, no **SQL Editor**, execute:
```sql
UPDATE profiles SET role = 'admin' WHERE email = 'seu@email.com';
```

---

## 4. Rodar localmente

```bash
# Na pasta cdi-system
npm install
npm run dev
```

Acesse http://localhost:3000

---

## 5. Deploy na Vercel

1. Acesse https://vercel.com e faça login
2. Clique em "New Project" e conecte ao repositório ou faça upload da pasta
3. Na tela de configuração, adicione as variáveis de ambiente:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
4. Clique em Deploy

---

## Estrutura do Sistema

| Módulo | Acesso |
|--------|--------|
| Agendamento | Todos |
| Histórico | Todos (atendente vê só os seus) |
| Médicos & Exames | Todos |
| Central de Preparos | Todos |
| Convênios & Regras | Todos |
| Rede Externa | Todos |
| Códigos TUSS | Todos |
| Exames com Sedação | Todos |
| Dashboard | Somente Admin |
| Administração (CRUD) | Somente Admin |

---

## Credenciais padrão após setup

Não há usuário padrão criado automaticamente.
**O admin deve ser criado manualmente** conforme passo 3 acima.
