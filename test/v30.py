import os; ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__))) + '/'
"""python3 test/v30.py <défi> <suite> [jours à photographier] : un défi des niveaux 10+ joué dans le navigateur ; « a+b » bâtit deux cartes le même jour."""
import sys
from playwright.sync_api import sync_playwright
OUT=ROOT+'out/'; cid=sys.argv[1]; seq=sys.argv[2].replace(' ','').split('>'); shots=[int(x) for x in (sys.argv[3] if len(sys.argv)>3 else '1,3').split(',')]
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox','--allow-file-access-from-files']); logs=[]
    pg=b.new_page(viewport={'width':390,'height':844},device_scale_factor=2)
    pg.on('pageerror',lambda e: logs.append((e.stack or str(e))[:300])); pg.on('console',lambda m: logs.append(m.text[:200]) if m.type=='error' and 'ERR_' not in m.text else None)
    pg.add_init_script("window.HQ_LOCK=1;try{localStorage.setItem('hameau.v2',JSON.stringify({stars:{c1:3},tuto:{c1:1,c2:1}}))}catch(e){}")
    pg.goto('file://'+OUT+'index.html'); (os.path.exists('/tmp/fonts/fonts.css') and pg.add_style_tag(path='/tmp/fonts/fonts.css')); pg.wait_for_timeout(1500)
    W=lambda t=1000: pg.wait_for_timeout(t); S=lambda n: pg.screenshot(path=OUT+'v30_'+cid+'_'+n+'.png')
    lvl=pg.evaluate(f"SIM.LEVELS.findIndex(l=>l.ch.includes('{cid}'))")
    pg.click('#bstart'); W(3300); pg.click('[data-go=play]'); W(); pg.click('[data-go=levels]'); W()
    for _ in range(lvl//5): pg.click('.tlink.more'); W(900)
    S('niveaux'); pg.click(f'[data-level="{lvl}"]'); W(); pg.click(f'[data-ch={cid}]'); W(); S('fiche'); pg.click('[data-tab=cards]'); W(400); S('fiche_cartes')
    pg.click('#bgo'); W(2500)
    for d,c in enumerate(seq, start=1):
        W(1200)
        if c!='-':
            for t in c.split('+'): pg.click(f'.card[data-type={t}]'); W(350)
            if d in shots: S(f'j{d}_matin')
            pg.click('#bbuild')
        else:
            if d in shots: S(f'j{d}_matin')
            pg.click('#bskip')
        W(300); pg.click('#sp4'); shot=0
        for i in range(1500):
            W(100); t=pg.evaluate('GAME.t')
            if d in shots and shot==0 and 11<t<12.5: S(f'j{d}_midi'); shot=1
            if d in shots and shot==1 and 16.6<t<17.4: S(f'j{d}_soir'); shot=2
            if pg.locator('#bnext').count(): break
        print('jour',d,c,'|',pg.inner_text('.sheet h2'),'|',' / '.join(x for x in pg.locator('.sheet .journal li, .sheet li').all_inner_texts()[:4])[:230])
        if d in shots: S(f'j{d}_bilan')
        pg.click('#bnext'); W(2000)
    W(1500); S('fin'); print('fin :', pg.inner_text('.sheet')[:200].replace('\n',' | ')); print('erreurs', logs); b.close()
