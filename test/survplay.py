import os; ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__))) + '/'
"""python3 test/survplay.py <jours> <préfixe> [graine] : joue les premiers jours d'une survie dans Chrome sans tête (première carte payable)"""
import sys
from playwright.sync_api import sync_playwright
OUT=ROOT+'out/'
N, pre = int(sys.argv[1]), sys.argv[2]; seed = sys.argv[3] if len(sys.argv) > 3 else None
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox','--allow-file-access-from-files'])
    pg=b.new_page(viewport={'width':390,'height':844},device_scale_factor=2); logs=[]
    pg.on('pageerror',lambda e: logs.append(str(e))); pg.on('console',lambda m: logs.append(m.text) if m.type=='error' and 'ERR_' not in m.text else None)
    pg.add_init_script('window.HQ_LOCK=1;'+(f'window.SEED={seed};' if seed else ''))
    pg.goto('file://'+OUT+'index.html'); (os.path.exists('/tmp/fonts/fonts.css') and pg.add_style_tag(path='/tmp/fonts/fonts.css')); pg.wait_for_timeout(1500)
    pg.click('#bstart'); pg.wait_for_timeout(3200)
    pg.click('[data-go=play]'); pg.wait_for_timeout(900); pg.click('[data-go=survival]'); pg.wait_for_timeout(1100); pg.screenshot(path=f'{OUT}{pre}_page.png')
    print('page :', pg.inner_text('.note >> nth=0')[:140])
    pg.click('#bsurv'); pg.wait_for_timeout(1500)
    for d in range(1, N + 1):
        pg.wait_for_timeout(1400)
        st=pg.evaluate("({v:GAME.alive().length,f:GAME.st.food,w:GAME.st.wood,b:GAME.st.buildings.map(b=>b.type),c:[...document.querySelectorAll('.card')].map(c=>c.dataset.type+(c.classList.contains('off')?'(x)':''))})")
        if d == 1: pg.screenshot(path=f'{OUT}{pre}_j1_matin.png')
        ok=pg.locator('.card:not(.off)')
        if ok.count():
            ok.first.click(); pg.wait_for_timeout(350); pg.click('#bbuild')
        elif pg.locator('#bskip').count(): pg.click('#bskip')
        pg.wait_for_timeout(300); pg.click('#sp4')
        for i in range(900):
            pg.wait_for_timeout(100)
            t=pg.evaluate('GAME.t')
            if d == 1 and 21.5 < t < 21.9 and not i % 3: pg.screenshot(path=f'{OUT}{pre}_j1_nuit.png')
            if pg.locator('#bnext').count() or pg.locator('#eagain').count(): break
        print('jour', d, st, '|', pg.inner_text('.sheet h2') if pg.locator('.sheet h2').count() else '')
        if d == 1: pg.screenshot(path=f'{OUT}{pre}_j1_bilan.png')
        if pg.locator('#eagain').count(): print('fin de partie'); break
        pg.click('#bnext')
    print('erreurs', logs); b.close()
