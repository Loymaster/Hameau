import os; ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__))) + '/'
"""python3 test/saveui.py : survie — une partie quittée en pleine journée puis au matin, et reprise, finit comme une partie jouée d'une traite"""
import sys, json
from playwright.sync_api import sync_playwright
OUT=ROOT+'out/'; SEED=sys.argv[1] if len(sys.argv)>1 else '777'
DIG="JSON.stringify({d:GAME.plan.end.day,f:GAME.plan.end.food,w:GAME.plan.end.wood,v:GAME.plan.end.villagers.map(v=>[v.name,v.alive,v.work,v.hunger,v.roofless]),b:GAME.plan.end.buildings.map(b=>b.type+'@'+b.x+','+b.y)})"
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox','--allow-file-access-from-files']); logs=[]
    def new():
        cx=b.new_context(viewport={'width':390,'height':844},device_scale_factor=2); pg=cx.new_page()
        pg.on('pageerror',lambda e: logs.append(str(e))); pg.on('console',lambda m: logs.append(m.text) if m.type=='error' and 'ERR_' not in m.text else None)
        pg.add_init_script(f'window.HQ_LOCK=1;window.SEED={SEED};'); return pg
    def boot(pg):
        pg.goto('file://'+OUT+'index.html'); (os.path.exists('/tmp/fonts/fonts.css') and pg.add_style_tag(path='/tmp/fonts/fonts.css')); pg.wait_for_timeout(1500)
        pg.click('#bstart'); pg.wait_for_timeout(3200); pg.click('[data-go=survival]'); pg.wait_for_timeout(1100)
    def pin(pg):  # le premier villageois au bois mort
        pg.click('#bjobs'); pg.wait_for_timeout(400); pg.locator('.jrow').nth(0).click(); pg.wait_for_timeout(300); pg.click('.jopt[data-k="-1"]'); pg.wait_for_timeout(300); pg.click('#jok'); pg.wait_for_timeout(200)
    def choose(pg):
        ok=pg.locator('.card:not(.off)'); t=ok.first.get_attribute('data-type') if ok.count() else None
        if ok.count(): ok.first.click(); pg.wait_for_timeout(350); pg.click('#bbuild')
        else: pg.click('#bskip')
        return t
    def finish(pg):
        pg.wait_for_timeout(300); pg.click('#sp4')
        for i in range(900):
            pg.wait_for_timeout(100)
            if pg.locator('#bnext').count(): break
        return pg.evaluate(DIG)
    cards=lambda pg: pg.evaluate("[...document.querySelectorAll('.card')].map(c=>c.dataset.type)")
    # A : d'une traite
    A=new(); boot(A); A.click('#bsurv'); A.wait_for_timeout(2600); ref=[]; picks=[]
    for d in (1,2,3):
        if d==2: pin(A)
        picks.append((cards(A), choose(A))); ref.append(finish(A)); A.click('#bnext'); A.wait_for_timeout(2600)
    print('A cartes/choix', picks)
    # B : quittée deux fois
    B=new(); boot(B); print('B page avant :', B.inner_text('.rec').replace('\n',' | ')); B.click('#bsurv'); B.wait_for_timeout(2600)
    choose(B); r1=finish(B); B.click('#bnext'); B.wait_for_timeout(2600)
    pin(B); t=choose(B); B.wait_for_timeout(300); B.click('#sp4'); B.wait_for_timeout(2500); print('B quitte en plein jour 2 à', round(B.evaluate('GAME.t'),1), 'h, choix', t)
    boot(B); print('B page au retour :', B.inner_text('.rec').replace('\n',' | '), '| boutons', B.locator('.page .acts button, .pleaf .acts button').all_inner_texts()); B.screenshot(path=OUT+'save_page.png')
    B.click('#bcont'); B.wait_for_timeout(1500); print('B reprise : phase', B.evaluate('GAME.phase'), 'jour', B.evaluate('GAME.st.day'), 'cartes à l’écran', B.locator('.card').count(), 'vœux', B.evaluate('JSON.stringify(GAME.st.pins)'))
    r2=finish(B); B.click('#bnext'); B.wait_for_timeout(2600)
    c3=cards(B); boot(B); B.click('#bcont'); B.wait_for_timeout(2600); print('B quitte au matin du jour 3 ; cartes avant', c3, 'après', cards(B), '| phase', B.evaluate('GAME.phase'))
    choose(B); r3=finish(B)
    print('jour 1 identique', r1==ref[0], '| jour 2 identique', r2==ref[1], '| jour 3 identique', r3==ref[2])
    # nouvelle partie : deux touchers
    boot(B); B.click('#bsurv'); B.wait_for_timeout(300); print('nouvelle partie, 1er toucher →', B.inner_text('#bsurv'), '| partie gardée', B.evaluate("!!JSON.parse(localStorage.getItem('hameau.v2')).surv"))
    B.click('#bsurv'); B.wait_for_timeout(2600); print('2e toucher → jour', B.evaluate('GAME.st.day'), 'phase', B.evaluate('GAME.phase'))
    print('erreurs', logs); b.close()
