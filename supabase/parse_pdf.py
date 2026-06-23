"""Parse a tabela de exames do PDF em JSON estruturado.
Colunas por posicao X: Codigo(<95) | Nome(95-278) | TUSS(279-340) | Valor(341-399) | Preparo(>=400)
3 secoes: Particular (p1-19), Unimed 279 (p20-25), Unimed Completa (p26-46).
Agrupa palavras em linhas logicas por tolerancia vertical (a 1a linha do preparo fica ~1px
acima da linha do codigo, entao precisa ser fundida na mesma linha logica).
"""
import pdfplumber, json, re, sys

SRC = r'C:\Users\kauee\Downloads\1782226047181_Tabela_Exames.pdf'

SECOES = [
    ('particular', 0, 18),
    ('unimed279', 19, 24),
    ('unimed_completa', 25, 45),
]

COD_MAX, NOME_MAX, TUSS_MAX, VALOR_MAX = 95, 278, 340, 399
SKIP_COD = {'TABELA', 'EXAMES', 'GERAL'}
CODE_RE = re.compile(r'^[A-Z0-9]{5,10}$')

def col(x0):
    if x0 < COD_MAX: return 'cod'
    if x0 < NOME_MAX: return 'nome'
    if x0 < TUSS_MAX: return 'tuss'
    if x0 < VALOR_MAX: return 'valor'
    return 'prep'

def clean(s):
    s = re.sub(r'[–—]', '-', s)
    return re.sub(r'\s+', ' ', s).strip()

def cluster_lines(words, tol=5):
    ws = sorted(words, key=lambda w: w['top'])
    lines, cur, base = [], [], None
    for w in ws:
        if base is None or abs(w['top'] - base) <= tol:
            cur.append(w)
            if base is None: base = w['top']
        else:
            lines.append(cur); cur = [w]; base = w['top']
    if cur: lines.append(cur)
    return lines

def parse_section(pdf, p0, p1):
    exames = []
    cur = None
    for pi in range(p0, p1 + 1):
        page = pdf.pages[pi]
        words = page.extract_words(use_text_flow=False, keep_blank_chars=False)
        for line in cluster_lines(words):
            row = sorted(line, key=lambda w: w['x0'])
            buckets = {'cod': [], 'nome': [], 'tuss': [], 'valor': [], 'prep': []}
            for w in row:
                buckets[col(w['x0'])].append(w['text'])
            cod = clean(' '.join(buckets['cod']))
            nome = clean(' '.join(buckets['nome']))
            tuss = clean(' '.join(buckets['tuss']))
            valor = clean(' '.join(buckets['valor']))
            prep = clean(' '.join(buckets['prep']))
            # cabecalho da tabela
            if 'TUSS' in tuss + valor and 'Preparo' in prep:
                continue
            is_code = CODE_RE.match(cod) and cod not in SKIP_COD and nome
            if is_code:
                if cur: exames.append(cur)
                cur = {'codigo': cod, 'nome': nome, 'tuss': tuss, 'valor': valor, 'preparo': prep}
            elif cur:
                if nome: cur['nome'] += ' ' + nome
                if tuss and not cur['tuss']: cur['tuss'] = tuss
                if valor and not cur['valor']: cur['valor'] = valor
                if prep: cur['preparo'] = (cur['preparo'] + ' ' + prep).strip()
    if cur: exames.append(cur)
    for e in exames:
        e['nome'] = clean(e['nome'])
        e['preparo'] = clean(e['preparo'])
        t = clean(e['tuss'])
        e['tuss'] = t if re.search(r'\d', t) else None
        e['valor'] = e['valor'] if (e['valor'] and 'R$' in e['valor']) else None
    return exames

def main():
    out = {}
    with pdfplumber.open(SRC) as pdf:
        for nome, p0, p1 in SECOES:
            ex = parse_section(pdf, p0, p1)
            out[nome] = ex
            print(f'{nome}: {len(ex)} exames', file=sys.stderr)
    dst = r'C:\Users\kauee\OneDrive\Área de Trabalho\Code\cdi-system\supabase\exames_pdf.json'
    with open(dst, 'w', encoding='utf-8') as f:
        json.dump(out, f, ensure_ascii=False, indent=1)

if __name__ == '__main__':
    main()
