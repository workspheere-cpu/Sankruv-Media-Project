"""One-off helper: converts the page templates in src/pages/*.html into React components (react/src/pages/*.jsx).
Tokens such as {{reasons}} become {t.reasons}; App.jsx supplies them."""
import re, json, sys
from pathlib import Path
ROOT = Path(__file__).resolve().parent.parent
REN = {'class': 'className', 'for': 'htmlFor', 'tabindex': 'tabIndex', 'autocomplete': 'autoComplete', 'maxlength': 'maxLength',
       'novalidate': 'noValidate', 'inputmode': 'inputMode', 'datetime': 'dateTime', 'rows': 'rows', 'checked': 'defaultChecked'}
INJECT = {'projects': ('<section className="work"', '{t.video_wall}\n\n'), 'index': ('<section className="hs"', '{t.showreel}\n\n')}

def attr(m):
    name, val = m.group(1), m.group(2)
    name = REN.get(name, name)
    if name == 'style':
        obj = {k.strip(): v.strip() for k, v in (x.split(':', 1) for x in val.split(';') if x.strip())}
        return f' style={{{json.dumps(obj)}}}'
    if name == 'href' and not re.match(r'^(#|https?:|tel:|mailto:|\{\{)', val):
        val = '{{root}}' + val
    if '{{' in val:
        if re.fullmatch(r'\{\{\w+\}\}', val): return f' {name}={{t.{val[2:-2]}}}'
        return f' {name}={{`' + re.sub(r'\{\{(\w+)\}\}', r'${t.\1}', val) + '`}'
    return f' {name}="{val}"'

def convert(name):
    raw = (ROOT / 'src/pages' / f'{name}.html').read_text()
    m = re.match(r'<!--(.*?)-->\s*', raw, re.S)
    meta = dict(re.findall(r'^\s*(\w+):\s*(.*)$', m.group(1), re.M))
    body = re.sub(r'<!--.*?-->', '', raw[m.end():], flags=re.S)
    body = re.sub(r'<(div class="prose")>\s*\{\{p_body\}\}', r'<\1><t.Body />', body)
    body = re.sub(r'\s([a-zA-Z][\w-]*)="([^"]*)"', attr, body)
    body = re.sub(r'<(br|hr|img|input)((?:\s[^<>]*?)?)\s*/?>', r'<\1\2 />', body)
    body = re.sub(r'\{\{(\w+)\}\}', r'{t.\1}', body)
    if name in INJECT:
        mark, add = INJECT[name]; assert mark in body; body = body.replace(mark, add + mark, 1)
    fn = 'Page' + re.sub(r'\W', '', name.title())
    out = (f'/* Generated from src/pages/{name}.html by tools/html2jsx.py, then maintained here. */\n'
           f'export const meta = {json.dumps(meta, ensure_ascii=False)};\n\nexport default function {fn}({{ t }}) {{\n  return (\n    <>\n{body.rstrip()}\n    </>\n  );\n}}\n')
    (ROOT / 'react/src/pages' / f'{name.lstrip("_")}.jsx').write_text(out)

for n in ['index', 'services', 'projects', 'about', 'blog', 'contact', '404', '_service', '_post']:
    convert(n)
print('ok')
