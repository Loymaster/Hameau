import os; ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__))) + '/'
"""python3 test/play.py <défi> <séquence a,b,-,…> <préfixe> [heures des captures] [graine] : joue un défi en entier dans Chrome sans tête"""
import sys
from playwright.sync_api import sync_playwright
OUT=ROOT+'out/'
cid, seq, pre = sys.argv[1], sys.argv[2].split(','), sys.argv[3]
hours=[float(x) for x in sys.argv[4].split(',')] if len(sys.argv)>4 and sys.argv[4] else []
seed=sys.argv[5] if len(sys.argv)>5 else None
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox','--allow-file-access-from-files'])
    pg=b.new_page(viewport={'width':390,'height':844},device_scale_factor=2); logs=[]; n=[0]
    pg.on('pageerror',lambda e: logs.append(str(e))); pg.on('console',lambda m: logs.append(m.text) if m.type=='error' and 'ERR_' not in m.text else None)
    pg.add_init_script('window.HQ_LOCK=1;'+(f'window.SEED={seed};' if seed else ''))
    def shot(name):
        n[0]+=1; pg.screenshot(path=f'{OUT}{pre}_{n[0]:02d}_{name}.png')
    def coach():
        k=0
        while pg.locator('#coach:not([hidden]) #cnext').count() and k<12: pg.click('#cnext'); pg.wait_for_timeout(180); k+=1
        return k
    pg.goto('file://'+OUT+'index.html'); (os.path.exists('/tmp/fonts/fonts.css') and pg.add_style_tag(path='/tmp/fonts/fonts.css')); pg.wait_for_timeout(1500)
    import os
    if os.environ.get('PATCH'): pg.evaluate(open(os.environ['PATCH']).read())
    shot('titre')
    pg.click('#bstart'); pg.wait_for_timeout(900); shot('goutte'); pg.wait_for_timeout(1900); shot('sommaire')
    pg.click('[data-go=play]'); pg.wait_for_timeout(900); pg.click('[data-go=levels]'); pg.wait_for_timeout(300); shot('page_tourne'); pg.wait_for_timeout(700); shot('niveaux')
    lvl=pg.evaluate("(id)=>SIM.LEVELS.findIndex(l=>l.ch.includes(id))",cid)
    pg.click(f'[data-level="{lvl}"]'); pg.wait_for_timeout(900); shot('niveau')
    pg.click(f'[data-ch={cid}]'); pg.wait_for_timeout(900); shot('fiche')
    pg.click('.fd.ev >> nth=0'); pg.click('[data-tab=cards]'); pg.wait_for_timeout(300); shot('fiche_cartes'); pg.click('[data-tab=goals]'); pg.wait_for_timeout(300); shot('fiche_objectifs')
    pg.click('#bgo'); pg.wait_for_timeout(700)
    tut=0
    for d,pick in enumerate(seq, start=1):
        pg.wait_for_timeout(500)
        if d==1 and pg.locator('#coach:not([hidden])').count(): shot(f'j{d}_tuto')
        tut+=coach(); pg.wait_for_timeout(900); shot(f'j{d}_matin')
        if pick=='-':
            if pg.locator('#bskip').count(): pg.click('#bskip')
            else: pg.wait_for_timeout(2400)
        else:
            pg.click(f'.card[data-type={pick}]'); pg.wait_for_timeout(350)
            if d<=2: shot(f'j{d}_carte')
            pg.click('#bbuild')
        pg.wait_for_timeout(300); tut+=coach(); pg.click('#sp4'); todo=list(hours)
        for i in range(900):
            pg.wait_for_timeout(100)
            if pg.locator('#coach:not([hidden])').count():
                if d==1 and tut<9: shot(f'j{d}_bulle')
                tut+=coach(); continue
            t=pg.evaluate('GAME.t')
            if todo and t>=todo[0]: shot(f'j{d}_{todo.pop(0)}h')
            if pg.locator('#bnext').count(): break
        shot(f'j{d}_bilan'); print('jour',d,pick,'|',pg.inner_text('.sheet h2'),'| rejouer ?',pg.locator('#bretry').count()); pg.click('#bnext')
    pg.wait_for_timeout(1600); shot('fin')
    print('étoiles', pg.locator('.bigstars svg path[fill="#D99A2B"]').count(), '| vivants', pg.evaluate('GAME.alive().length'), '| bulles de tutoriel', tut)
    pg.click('#elist'); pg.wait_for_timeout(900); shot('apres')
    print('erreurs', logs); b.close()
