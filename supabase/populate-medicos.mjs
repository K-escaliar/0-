// Popula vinculos de US (medico_exames) dos 3 medicos que fazem ultrassom e cria/popula
// a tabela medico_responsabilidades (responsavel por TC/RM/RX por unidade).
// Fonte: "Dr. Claudio EXAMES REALIZADOS.pdf", "LISTA DE MEDICOS.pdf", "ATENDIMENTO DE EXAMES.pdf".
import { Client } from 'pg'
const c = new Client({ host: 'aws-1-us-east-2.pooler.supabase.com', port: 5432,
  user: 'postgres.wscniwsvjmkymmeeypih', password: process.env.DBPASS, database: 'postgres',
  ssl: { rejectUnauthorized: false } })
await c.connect()
try {
  // ids dos medicos
  const med = await c.query('select id, nome from medicos')
  const id = (frag) => med.rows.find(m => m.nome.toLowerCase().includes(frag))?.id
  const claudio = id('claudio'), mioso = id('mioso'), martucci = id('martucci')
  const ricardo = id('ricardo'), flavia = id('flavia'), valentini = id('valentini')

  // ---- 1) US: classificar cada exame e atribuir realiza por medico ----
  const us = await c.query(`select id, nome from exames where categoria='Ultrassom'`)
  const re = {
    mamas: /mama/i,
    gyn: /transvaginal|obst[ée]tric|morfolog|transluc|endovaginal|gemelar|f[óo]licul|colo de [úu]tero|perfil biof/i,
    doppler: /doppler/i,
    dopTireoide: /doppler.*tireoide|tireoide.*doppler/i,
    biopsia: /biopsia|puncao|punç/i,
  }
  const links = [] // {medico_id, exame_id, realiza}
  for (const e of us.rows) {
    const n = e.nome
    const isMama = re.mamas.test(n), isGyn = re.gyn.test(n), isDop = re.doppler.test(n)
    const isDopTir = re.dopTireoide.test(n), isBio = re.biopsia.test(n)
    const geral = !isMama && !isGyn && !isBio

    // CLAUDIO (Prime): geral + dopplers = faz; mamas/gyn/biopsia = nao faz
    if (geral) links.push({ m: claudio, e: e.id, r: true })
    else if (isMama || isGyn || isBio) links.push({ m: claudio, e: e.id, r: false })

    // MIOSO (13): tudo menos mamas; mamas = nao faz
    if (isMama) links.push({ m: mioso, e: e.id, r: false })
    else links.push({ m: mioso, e: e.id, r: true })

    // MARTUCCI (13): mamas sim; doppler (nao tireoide) nao; geral/gyn sim; doppler tireoide sim
    if (isMama) links.push({ m: martucci, e: e.id, r: true })
    else if (isDop && !isDopTir) links.push({ m: martucci, e: e.id, r: false })
    else links.push({ m: martucci, e: e.id, r: true })
  }

  // limpar vinculos antigos desses 3 e inserir
  for (const m of [claudio, mioso, martucci]) {
    if (m) await c.query('delete from medico_exames where medico_id=$1', [m])
  }
  let n = 0
  for (const l of links) {
    if (!l.m) continue
    await c.query('insert into medico_exames (medico_id, exame_id, realiza) values ($1,$2,$3) on conflict do nothing', [l.m, l.e, l.r])
    n++
  }
  console.log('US vinculos inseridos:', n)

  // ---- 2) Responsabilidades TC/RM/RX ----
  await c.query(`create table if not exists medico_responsabilidades (
    id uuid primary key default uuid_generate_v4(),
    medico_id uuid not null references medicos(id) on delete cascade,
    modalidade text not null check (modalidade in ('TC','RM','RX')),
    unidade text not null,
    escopo text,
    ordem int not null default 0,
    created_at timestamptz not null default now()
  )`)
  await c.query('alter table medico_responsabilidades enable row level security')
  await c.query(`drop policy if exists "auth resp" on medico_responsabilidades`)
  await c.query(`create policy "auth resp" on medico_responsabilidades for all using (auth.role() = 'authenticated')`)
  await c.query('delete from medico_responsabilidades')

  const resp = [
    // CDI Prime
    [ricardo, 'TC', 'CDI Prime', 'Crânio e Coluna', 1],
    [ricardo, 'RM', 'CDI Prime', 'Crânio e Coluna', 1],
    [claudio, 'TC', 'CDI Prime', 'Musculoesquelético (membros, articulações, bacia, quadril, coluna, mão, pé)', 2],
    [claudio, 'RM', 'CDI Prime', 'Musculoesquelético (membros, articulações, bacia, quadril, coluna, mão, pé)', 2],
    [flavia, 'RM', 'CDI Prime', 'Mamas', 3],
    [valentini, 'TC', 'CDI Prime', 'Angio TC de coronárias e Escore de cálcio (2ª, 4ª e 6ª até 09:30h, com o Dr. presente)', 4],
    [valentini, 'RM', 'CDI Prime', 'Coração (2ª, 4ª e 6ª até 09:30h, com o Dr. presente)', 4],
    // CDI 13 de Maio
    [martucci, 'TC', 'CDI Treze de Maio', 'Geral — normal e contrastado', 1],
    [martucci, 'RM', 'CDI Treze de Maio', 'Geral — normal e contrastado', 1],
    [martucci, 'RX', 'CDI Treze de Maio', 'Geral — normal e contrastado (uretrocistografia, urografia, enema opaco, EED)', 1],
    [mioso, 'TC', 'CDI Treze de Maio', 'Geral — normal e contrastado', 2],
    [mioso, 'RM', 'CDI Treze de Maio', 'Geral — normal e contrastado', 2],
    [mioso, 'RX', 'CDI Treze de Maio', 'Geral — normal e contrastado (uretrocistografia, urografia, enema opaco, EED)', 2],
  ]
  let rn = 0
  for (const [m, mod, uni, esc, ord] of resp) {
    if (!m) continue
    await c.query('insert into medico_responsabilidades (medico_id, modalidade, unidade, escopo, ordem) values ($1,$2,$3,$4,$5)', [m, mod, uni, esc, ord])
    rn++
  }
  console.log('Responsabilidades inseridas:', rn)
} catch (e) { console.error('ERRO:', e.message); process.exitCode = 1 } finally { await c.end() }
