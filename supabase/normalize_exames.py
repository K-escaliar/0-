# -*- coding: utf-8 -*-
"""Mescla as 3 secoes do PDF por codigo, normaliza nome/categoria/preparo e anexa precos.
Saida: catalogo_exames.json (lista unica de exames com 3 valores por plano).
"""
import json, re, sys

d = json.load(open('exames_pdf.json', encoding='utf-8'))
P = {e['codigo']: e for e in d['particular']}
U1 = {e['codigo']: e for e in d['unimed279']}
U2 = {e['codigo']: e for e in d['unimed_completa']}
codigos = list(dict.fromkeys(list(P) + list(U1) + list(U2)))  # mantem ordem, P primeiro

# ---- categoria por nome (prioridade) e fallback por prefixo do codigo ----
def categoria(nome, cod):
    n = nome.upper()
    if 'MAMOGRAF' in n: return 'Mamografia'
    if 'TOMOSSINTESE' in n or 'TOMOSSÍNTESE' in n: return 'Tomossíntese'
    if 'ANGIORESSON' in n or 'RESSONANC' in n or n.startswith('RM '): return 'Ressonância'
    if 'ANGIO TC' in n or 'ANGIOTOMOGRAF' in n or 'TOMOGRAF' in n or n.startswith('TC '): return 'Tomografia'
    if 'RAIO X' in n or 'RAIO-X' in n or n.startswith('RX ') or 'ESCANOMETRIA' in n: return 'Raio-X'
    if 'ULTRASSON' in n or 'ULTRASSOM' in n or n.startswith('US ') or 'DOPPLER' in n or 'ECOGRAF' in n: return 'Ultrassom'
    pref = cod[:2]
    return {'US': 'Ultrassom', 'DO': 'Ultrassom', 'RX': 'Raio-X', 'RM': 'Ressonância',
            'TC': 'Tomografia', 'MA': 'Mamografia'}.get(pref,
           {'ANRM': 'Ressonância', 'ANTC': 'Tomografia'}.get(cod[:4], 'Outros'))

# ---- normalizacao de nome: Title Case + acentos de termos medicos comuns ----
ACENTOS = {
    'ANGIORESSONANCIA': 'Angiorressonância', 'ANGIOTOMOGRAFIA': 'Angiotomografia',
    'RESSONANCIA': 'Ressonância', 'TOMOGRAFIA': 'Tomografia', 'ULTRASSONOGRAFIA': 'Ultrassonografia',
    'MAMOGRAFIA': 'Mamografia', 'TOMOSSINTESE': 'Tomossíntese', 'ARTERIA': 'Artéria',
    'AORTA': 'Aorta', 'TORACICA': 'Torácica', 'TORAX': 'Tórax', 'ABDOMINAL': 'Abdominal',
    'ABDOME': 'Abdome', 'ANTEBRACO': 'Antebraço', 'BRACO': 'Braço', 'CRANIO': 'Crânio',
    'CRANIANA': 'Craniana', 'JOELHO': 'Joelho', 'PELVE': 'Pelve', 'PELVICA': 'Pélvica',
    'PROSTATA': 'Próstata', 'TIREOIDE': 'Tireoide', 'CAROTIDAS': 'Carótidas',
    'COLUNA': 'Coluna', 'CERVICAL': 'Cervical', 'TORACOLOMBAR': 'Toracolombar',
    'ORGAOS': 'Órgãos', 'SUPERFICIAIS': 'Superficiais', 'OBSTETRICO': 'Obstétrico',
    'OBSTETRICA': 'Obstétrica', 'TRANSVAGINAL': 'Transvaginal', 'GLANDULAS': 'Glândulas',
    'SALIVARES': 'Salivares', 'SACROILIACAS': 'Sacroilíacas', 'SACRO': 'Sacro',
    'ARTICULACAO': 'Articulação', 'MANDIBULAR': 'Mandibular', 'CALCANEO': 'Calcâneo',
    'CALCIO': 'Cálcio', 'CORONARIAS': 'Coronárias', 'CORACAO': 'Coração',
    'ESOFAGO': 'Esôfago', 'ESTOMAGO': 'Estômago', 'INTESTINO': 'Intestino',
    'PESCOCO': 'Pescoço', 'BACIA': 'Bacia', 'OMBRO': 'Ombro', 'PUNHO': 'Punho',
    'COTOVELO': 'Cotovelo', 'TORNOZELO': 'Tornozelo', 'QUADRIL': 'Quadril',
    'MUSCULOESQUELETICO': 'Musculoesquelético', 'PROXIMAL': 'Proximal', 'DISTAL': 'Distal',
    'VENOSA': 'Venosa', 'ARTERIAL': 'Arterial', 'MEMBRO': 'Membro', 'MEMBROS': 'Membros',
    'SUPERIOR': 'Superior', 'INFERIOR': 'Inferior', 'DIREITO': 'Direito', 'ESQUERDO': 'Esquerdo',
    'DIREITA': 'Direita', 'ESQUERDA': 'Esquerda', 'BILATERAL': 'Bilateral', 'CONTRASTE': 'Contraste',
    'FACE': 'Face', 'SEIOS': 'Seios', 'OSSOS': 'Ossos', 'PE': 'Pé', 'MAO': 'Mão', 'MAOS': 'Mãos',
    'REGIAO': 'Região', 'ABDOMINAIS': 'Abdominais', 'RENAL': 'Renal', 'RINS': 'Rins',
    'VIAS': 'Vias', 'URINARIAS': 'Urinárias', 'BEXIGA': 'Bexiga', 'PERINEO': 'Períneo',
    'MAMA': 'Mama', 'MAMAS': 'Mamas', 'AXILA': 'Axila', 'AXILAS': 'Axilas',
    'TRANSFONTANELA': 'Transfontanela', 'TRANSCRANIANO': 'Transcraniano',
}
SIGLAS = {'TC', 'RM', 'RX', 'US', 'ATM', 'TUSS', 'DE', 'DA', 'DO', 'DOS', 'DAS', 'E', 'COM', 'SEM'}
MINUSC = {'de', 'da', 'do', 'dos', 'das', 'e', 'com', 'sem', 'por'}

def fix_truncado(nome):
    nome = re.sub(r' D$', ' DIREITO', nome)
    nome = re.sub(r' E$', ' ESQUERDO', nome)
    return nome

def norm_nome(nome):
    nome = fix_truncado(nome.strip())
    out = []
    for i, w in enumerate(nome.split()):
        wu = w.upper()
        if wu in ACENTOS:
            out.append(ACENTOS[wu])
        elif wu in ('TC', 'RM', 'RX', 'US', 'ATM'):
            out.append(wu)
        elif w.lower() in MINUSC and i > 0:
            out.append(w.lower())
        elif re.match(r'^[IVX]+$', wu) and len(wu) <= 3:  # romanos
            out.append(wu)
        else:
            out.append(w.capitalize())
    return ' '.join(out)

# ---- preparo: limpeza de typos + antecedencia por categoria ----
TYPOS = {
    'anteirores': 'anteriores', 'anterirores': 'anteriores', 'necessario': 'necessário',
    'medico': 'médico', 'jejum': 'jejum', 'umido': 'úmido', 'dispositivo': 'dispositivo',
    'metalico': 'metálico', 'necessrio': 'necessário', 'horario': 'horário',
}
def antecedencia_min(cat):
    return {'Ultrassom': 15, 'Ressonância': 30, 'Tomografia': 15}.get(cat)

def norm_preparo(prep, cat):
    if not prep: return None
    p = prep.strip().strip('-').strip()
    if not p or p in ('.', '-'):
        return None  # sem preparo especifico
    for a, b in TYPOS.items():
        p = re.sub(r'\b' + a + r'\b', b, p, flags=re.IGNORECASE)
    # antecedencia: substituir "X minutos de antecedencia" pelo tempo da categoria
    mins = antecedencia_min(cat)
    if mins:
        p = re.sub(r'\d+\s*minutos\s+de\s+anteced[eê]ncia',
                   f'{mins} minutos de antecedência', p, flags=re.IGNORECASE)
    p = re.sub(r'\s+', ' ', p).strip()
    p = p[0].upper() + p[1:] if p else p  # primeira letra maiuscula
    if p and not p.endswith('.'):
        p += '.'
    return p

def parse_valor(v):
    if not v: return None
    m = re.search(r'R\$\s*([\d\.]+,\d{2})', v)
    if not m: return None
    return m.group(1)  # mantem formato BR como string

catalog = []
for cod in codigos:
    src = P.get(cod) or U2.get(cod) or U1.get(cod)
    nome_orig = src['nome']
    cat = categoria(nome_orig, cod)
    # preparo: pegar o mais longo/completo entre as secoes
    preps = [s['preparo'] for s in (P.get(cod), U1.get(cod), U2.get(cod)) if s and s.get('preparo')]
    prep = max(preps, key=len) if preps else None
    # TUSS so existe na tabela Unimed Completa
    tuss = (U2.get(cod) or {}).get('tuss') or (U1.get(cod) or {}).get('tuss')
    catalog.append({
        'codigo': cod,
        'nome': norm_nome(nome_orig),
        'nome_original': nome_orig,
        'categoria': cat,
        'codigo_tuss': tuss,
        'preparo': norm_preparo(prep, cat),
        'valor_particular': parse_valor(P.get(cod, {}).get('valor')),
        'valor_unimed279': parse_valor(U1.get(cod, {}).get('valor')),
        'valor_unimed_completa': parse_valor(U2.get(cod, {}).get('valor')),
    })

json.dump(catalog, open('catalogo_exames.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)

from collections import Counter
print('Total exames:', len(catalog), file=sys.stderr)
print('Por categoria:', Counter(e['categoria'] for e in catalog).most_common(), file=sys.stderr)
print('Sem preparo:', sum(1 for e in catalog if not e['preparo']), file=sys.stderr)
print('Categoria Outros:', [e['nome'] for e in catalog if e['categoria'] == 'Outros'][:30], file=sys.stderr)
