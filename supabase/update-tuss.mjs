import { Client } from 'pg'
const c = new Client({
  host: 'aws-1-us-east-2.pooler.supabase.com', port: 5432,
  user: 'postgres.wscniwsvjmkymmeeypih', password: process.env.DBPASS,
  database: 'postgres', ssl: { rejectUnauthorized: false },
})

// Códigos TUSS REAIS da UNIMED -> por nome de exame existente
const correcoes = {
  // MAMOGRAFIA
  'Mamografia Digital Bilateral': '40808041',
  // RAIO-X (estavam todos errados)
  'RX Seios da Face': '40801063',
  'RX Coluna Cervical': '40802019',
  'RX Coluna Dorsal': '40802035',
  'RX Coluna Lombar': '40802051',
  'RX Bacia / Quadril': '40804011',
  'RX Joelho': '40804054',
  'RX Mão / Punho': '40803120',
  'RX Ombro / Clavícula': '40803074',
  'RX Pé / Tornozelo': '40804089',
  'RX Tórax': '40805026',
  // TOMOGRAFIA (prefixo certo é 41001xxx)
  'TC Crânio': '41001010',
  'TC Encéfalo': '41001010',
  'TC Face / Seios da Face': '41001036',
  'TC Tórax': '41001079',
  'TC Abdome': '41001095',
  'TC Abdome e Pelve': '41001095',
  'TC Pelve Feminina': '41001095',
  'TC Pelve Masculina': '41001095',
  'TC Pescoço': '41001060',
  'TC Coluna Cervical': '41001125',
  'TC Coluna Dorsal': '41001125',
  'TC Coluna Lombar': '41001125',
  'TC Joelho': '41001141',
  'TC Ombro': '41001141',
  'TC Cotovelo / Antebraço': '41001141',
  'TC Punho / Mão': '41001141',
  'TC Tornozelo / Pé': '41001141',
  'TC Bacia / Quadril / Sacroilíacas': '41001141',
  'TC ATM (Articulação Temporomandibular)': '41001141',
  'Angio TC Coronárias': '41001230',
  'Angio TC Artérias (geral)': '41001168',
  'Angio TC Membros Superiores (Arterial/Venoso)': '41001168',
  // RESSONÂNCIA (prefixo certo é 41101xxx)
  'RM Crânio': '41101014',
  'RM Encéfalo': '41101014',
  'RM Coluna Cervical': '41101227',
  'RM Coluna Dorsal': '41101227',
  'RM Coluna Lombar': '41101227',
  'RM Joelho': '41101316',
  'RM Ombro': '41101316',
  'RM Quadril / Bacia': '41101278',
  'RM Sacroilíacas': '41101316',
  'RM Tornozelo / Pé': '41101316',
  'RM Punho / Mão': '41101316',
  'RM Cotovelo / Antebraço': '41101316',
  'RM Pelve Feminina': '41101189',
  'RM Pelve Masculina': '41101189',
  'RM Multiparamétrica de Próstata': '41101189',
  'RM Abdome': '41101170',
  'RM Tórax': '41101120',
  'RM Pescoço': '41101111',
  'RM Mamas': '41101162',
  'RM Coração': '41101138',
  'RM Plexo Braquial': '41101243',
  'RM ATM (Articulação Temporomandibular)': '41101103',
  // ULTRASSOM (prefixo certo é 40901xxx)
  'US Abdome Total': '40901122',
  'US Abdome Superior': '40901130',
  'US Abdome Inferior Feminino': '40901181',
  'US Abdome Inferior Masculino': '40901173',
  'US Mamas e Axilas': '40901114',
  'US Tireoide': '40901203',
  'US Órgãos Superficiais': '40901203',
  'US Bolsa Escrotal': '40901203',
  'US Glândulas Salivares': '40901203',
  'US Parede Abdominal': '40901203',
  'US Transcraniano / Transfontanela': '40901203',
  'US Próstata Abdominal': '40901750',
  'US Aparelho Urinário': '40901769',
  'US Articular (por articulação)': '40901220',
  'US Estruturas Superficiais': '40901211',
  'US Derma (Pele/Subcutâneo)': '40901211',
  'US Pelve Feminina (Transvaginal)': '40901300',
  'US Transvaginal com Doppler': '40901300',
  'US Obstétrico Simples': '40901238',
  'US Obstétrico com Doppler': '40901246',
  'US Obstétrico 1º Trimestre (Endovaginal)': '40901297',
  'US Obstétrico Perfil Biofísico Fetal': '40901238',
  'US Doppler de Carótidas e Vertebrais': '40901360',
  'US Doppler Arterial de Membros Inferiores': '40901475',
  'US Doppler Venoso de Membros Inferiores': '40901483',
  'US Doppler de Membros Superiores': '40901386',
}

// Novos exames de RX que faltavam (UNIMED) - feitos no CDI Treze de Maio
const novosRX = [
  ['RX Adenoides ou Cavum', '40801128'],
  ['RX Costelas (por hemitórax)', '40803031'],
  ['RX Clavícula', '40803040'],
  ['RX Cotovelo', '40803090'],
  ['RX Antebraço', '40803104'],
  ['RX Punho', '40803112'],
  ['RX Mão ou Quirodáctilo', '40803120'],
  ['RX Mãos e Punhos para Idade Óssea', '40803139'],
  ['RX Patela', '40804062'],
  ['RX Perna', '40804070'],
  ['RX Calcâneo', '40804100'],
  ['RX Panorâmica dos Membros Inferiores', '40804127'],
  ['RX Abdome Simples', '40808017'],
  ['Densitometria Óssea (coluna e fêmur)', '40808130'],
]

await c.connect()
try {
  let atualizados = 0, naoEncontrados = []
  for (const [nome, code] of Object.entries(correcoes)) {
    const r = await c.query(`update exames set codigo_tuss = $1 where nome = $2`, [code, nome])
    if (r.rowCount > 0) atualizados += r.rowCount
    else naoEncontrados.push(nome)
  }
  console.log('Codigos corrigidos:', atualizados)
  if (naoEncontrados.length) console.log('NAO encontrados (verificar nome):', naoEncontrados.join(' | '))

  let inseridos = 0
  for (const [nome, code] of novosRX) {
    const ex = await c.query(`select 1 from exames where nome = $1`, [nome])
    if (ex.rowCount === 0) {
      await c.query(
        `insert into exames (nome, categoria, codigo_tuss, preparo, unidades, requer_sedacao)
         values ($1, 'Raio-X', $2, 'Sem preparo especial. Retirar objetos metálicos da região.', ARRAY['CDI Treze de Maio'], false)`,
        [nome, code]
      )
      inseridos++
    }
  }
  console.log('Novos RX inseridos:', inseridos)

  const tot = await c.query(`select count(*)::int n from exames`)
  console.log('TOTAL de exames agora:', tot.rows[0].n)
} finally { await c.end() }
