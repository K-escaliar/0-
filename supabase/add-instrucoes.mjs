import { Client } from 'pg'
const c = new Client({ host:'aws-1-us-east-2.pooler.supabase.com', port:5432,
  user:'postgres.wscniwsvjmkymmeeypih', password:process.env.DBPASS, database:'postgres',
  ssl:{rejectUnauthorized:false} })
await c.connect()
try {
  const txt = 'Confira o convênio e a unidade do exame antes de confirmar. Para exames com contraste, oriente jejum e pergunte sobre alergias. Sedação: transferir para a enfermeira Francieli.'
  await c.query(`insert into configuracoes (chave, valor) values ('instrucoes_agendamento', $1) on conflict (chave) do nothing`, [txt])
  console.log('Config instrucoes_agendamento criada.')
} catch(e){ console.error('ERRO:',e.message); process.exitCode=1 } finally { await c.end() }
