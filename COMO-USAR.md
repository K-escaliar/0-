# Sistema CDI — Como Usar

## 🌐 LINK DO SISTEMA (funciona em qualquer PC/celular)

# 👉 https://cdi-system.vercel.app

É só abrir esse link no navegador de qualquer PC da clínica. Não precisa instalar nada.

---

## ✅ O que já está pronto

- **Banco de dados** configurado no Supabase (91 exames, 7 médicos, 15 convênios, 11 clínicas parceiras)
- **Seu usuário administrador** criado
- **Login por usuário** (sem precisar de e-mail)

## 🔑 Seu login de administrador

- **Usuário:** `admin`
- **Senha:** `CdiAdmin2026`

> Recomendo trocar a senha depois. Como admin, você pode criar os usuários dos atendentes em **Administração → Usuários**.

---

## 🌐 Para rodar em VÁRIOS PCs (recomendado: Vercel — grátis e permanente)

O jeito certo para a clínica é publicar na internet com um link fixo. Aí qualquer PC
só abre o link no navegador — não precisa instalar nada.

### Passo a passo (uma vez só, ~5 min):

1. Acesse **https://vercel.com/signup**
2. Clique em **"Continue with GitHub"** (você já tem GitHub) e autorize
3. No painel da Vercel, clique em **"Add New… → Project"**
4. Será preciso enviar o código para o GitHub primeiro. Me chame que eu faço isso
   com você (ou use o GitHub Desktop para subir a pasta `cdi-system`)
5. Importe o projeto na Vercel
6. Em **Environment Variables**, adicione estas 3 (estão no arquivo `.env.local`):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
7. Clique em **Deploy**

Em ~2 minutos você recebe um link tipo `https://cdi-system.vercel.app` que funciona
em qualquer PC, celular ou tablet.

---

## 💻 Para testar AGORA neste PC

Abra o PowerShell na pasta `cdi-system` e rode:

```
npm run dev
```

Depois abra no navegador: **http://localhost:3000**

---

## 📋 Resumo técnico

- Projeto Supabase: `wscniwsvjmkymmeeypih`
- Stack: Next.js + Supabase + Tailwind
- Login: usuário vira `usuario@cdi.local` internamente (a pessoa só digita o usuário)
