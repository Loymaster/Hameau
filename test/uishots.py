import os; ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__))) + '/'
"""Captures des endroits où vivent les icônes : options, niveaux, carnet personnel, carnet du défi, pastilles de manque, bilan."""
from playwright.sync_api import sync_playwright
OUT=ROOT+'out/'
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox','--allow-file-access-from-files'])
    pg=b.new_page(viewport={'width':390,'height':844},device_scale_factor=2); logs=[]
    pg.on('pageerror',lambda e: logs.append(str(e))); pg.on('console',lambda m: logs.append(m.text) if m.type=='error' and 'ERR_' not in m.text else None)
    pg.add_init_script('window.HQ_LOCK=1;window.SEED=11;')
    pg.goto('file://'+OUT+'index.html'); (os.path.exists('/tmp/fonts/fonts.css') and pg.add_style_tag(path='/tmp/fonts/fonts.css')); pg.wait_for_timeout(1200); pg.click('#bstart'); pg.wait_for_timeout(2700)
    pg.click('[data-go=options]'); pg.wait_for_timeout(1100); pg.screenshot(path=OUT+'u_options.png'); pg.click('[data-back]'); pg.wait_for_timeout(1100)
    pg.click('[data-go=play]'); pg.wait_for_timeout(900); pg.click('[data-go=levels]'); pg.wait_for_timeout(1100); pg.screenshot(path=OUT+'u_niveaux.png'); pg.click('[data-level="2"]'); pg.wait_for_timeout(1000); pg.click('[data-ch=c7]'); pg.wait_for_timeout(1000); pg.screenshot(path=OUT+'u_fiche.png'); pg.click('#bgo'); pg.wait_for_timeout(1500)
    def day(d, shots=()):
        pg.click('#bskip'); pg.wait_for_timeout(300); pg.click('#sp4')
        for i in range(900):
            pg.wait_for_timeout(100); t=pg.evaluate('GAME.t')
            for h,fn in shots:
                if t>=h and h not in done: done.add(h); fn()
            if pg.locator('#bnext').count(): break
    done=set()
    def carnet():
        pg.evaluate('GAME.paused=true'); pg.click('.vb >> nth=1'); pg.wait_for_timeout(500); pg.screenshot(path=OUT+'u_carnet.png'); pg.click('#insp .x'); pg.wait_for_timeout(200)
        pg.click('#btnPause'); pg.wait_for_timeout(600); pg.screenshot(path=OUT+'u_pause.png'); pg.click('#presume'); pg.wait_for_timeout(300); pg.click('#sp4')
    day(1, [(17.6, carnet)]); pg.wait_for_timeout(400); pg.click('#bnext')
    for d in (2,3):
        pg.wait_for_timeout(1200); done=set(); day(d); pg.wait_for_timeout(400); pg.screenshot(path=OUT+f'u_bilan{d}.png'); pg.click('#bnext')
    pg.wait_for_timeout(1200); done=set()
    def manque(): pg.evaluate('GAME.paused=true'); pg.wait_for_timeout(200); pg.screenshot(path=OUT+'u_manque.png'); pg.click('.vb >> nth=0'); pg.wait_for_timeout(400); pg.screenshot(path=OUT+'u_carnet2.png'); pg.click('#insp .x'); pg.evaluate('GAME.paused=false')
    day(4, [(12, manque)]); pg.wait_for_timeout(400); pg.screenshot(path=OUT+'u_bilan4.png')
    print('erreurs', logs); b.close()
