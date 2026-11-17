import os; ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__))) + '/'
"""python3 test/tuto.py : le tutoriel de la manufacture. Chaque élément de production est expliqué le premier matin où il se présente, puis plus jamais."""
import sys, json
from playwright.sync_api import sync_playwright
OUT = ROOT + 'out/'
with sync_playwright() as p:
    b = p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox', '--allow-file-access-from-files']); logs = []
    pg = b.new_page(viewport={'width': 390, 'height': 844}, device_scale_factor=2)
    pg.on('pageerror', lambda e: logs.append((e.stack or str(e))[:300]))
    pg.add_init_script("window.HQ_LOCK=1;if(!sessionStorage.getItem('k')){sessionStorage.setItem('k','1');try{localStorage.setItem('hameau.v2',JSON.stringify({stars:{c1:3},tuto:{c1:1,c2:1}}))}catch(e){}}")
    pg.goto('file://' + OUT + 'index.html'); (os.path.exists('/tmp/fonts/fonts.css') and pg.add_style_tag(path='/tmp/fonts/fonts.css')); pg.wait_for_timeout(1500)
    pg.click('#bstart'); pg.wait_for_timeout(3300)
    bad = 0
    def run(cid, shot=None):
        pg.evaluate(f"UI.startChallenge('{cid}')"); pg.wait_for_timeout(2600); steps = []
        for i in range(20):
            if pg.evaluate("document.querySelector('.bub') ? 1 : 0") == 0: break
            t = pg.evaluate("document.querySelector('.bub p').innerText"); spot = pg.evaluate("(() => { const s = document.querySelector('.spot'); if (!s) return null; const r = s.getBoundingClientRect(); return [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)]; })()")
            bub = pg.evaluate("(() => { const r = document.querySelector('.bub').getBoundingClientRect(); return [Math.round(r.top), Math.round(r.bottom)]; })()")
            steps.append((t, spot, bub))
            if shot and i == shot[0]: pg.screenshot(path=OUT + 'tuto_' + cid + '_' + str(i) + '.png')
            pg.click('#cnext'); pg.wait_for_timeout(350)
        return steps
    for cid, shot in [('c33', (0,)), ('c34', (1,)), ('c35', None), ('c36', (0,)), ('c37', None), ('c38', None), ('c40', None), ('c41', (1,))]:
        st = run(cid, shot); print(cid, ':', len(st), 'étapes')
        for t, spot, bub in st:
            off = bub[0] < 0 or bub[1] > 844 or (spot and (spot[2] < 20 or spot[3] < 10))
            if off: bad += 1
            print('    ', 'HORS CADRE' if off else '', spot, bub, '|', t[:110])
        again = run(cid); print('     de nouveau :', len(again), 'étape(s)'); bad += len(again)
        if not st: bad += 1
    print('tuto gardé :', pg.evaluate("Object.keys(JSON.parse(localStorage.getItem('hameau.v2')).tuto).join(' ')"))
    print('ERREURS' if logs or bad else 'ok', logs[:3], bad)
