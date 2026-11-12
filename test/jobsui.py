import os; ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__))) + '/'
"""python3 test/jobsui.py <préfixe> [graine] : en survie, ouvre « Métiers », fixe deux postes, vérifie que la journée les suit"""
import sys, json
from playwright.sync_api import sync_playwright
OUT=ROOT+'out/'
pre = sys.argv[1]; seed = sys.argv[2] if len(sys.argv) > 2 else None
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox','--allow-file-access-from-files'])
    pg=b.new_page(viewport={'width':390,'height':844},device_scale_factor=2); logs=[]
    pg.on('pageerror',lambda e: logs.append(str(e))); pg.on('console',lambda m: logs.append(m.text) if m.type=='error' and 'ERR_' not in m.text else None)
    pg.add_init_script('window.HQ_LOCK=1;'+(f'window.SEED={seed};' if seed else ''))
    pg.goto('file://'+OUT+'index.html'); (os.path.exists('/tmp/fonts/fonts.css') and pg.add_style_tag(path='/tmp/fonts/fonts.css')); pg.wait_for_timeout(1500)
    pg.click('#bstart'); pg.wait_for_timeout(3200); pg.click('[data-go=play]'); pg.wait_for_timeout(900); pg.click('[data-go=survival]'); pg.wait_for_timeout(1100); pg.click('#bsurv'); pg.wait_for_timeout(2600)
    def day(pick_first=True):
        ok=pg.locator('.card:not(.off)')
        if pick_first and ok.count(): ok.first.click(); pg.wait_for_timeout(350); pg.click('#bbuild')
        else: pg.click('#bskip')
        pg.wait_for_timeout(300); pg.click('#sp4')
        for i in range(900):
            pg.wait_for_timeout(100)
            if pg.locator('#bnext').count(): break
    state=lambda: pg.evaluate("({pins:GAME.st.pins||{},work:GAME.st.villagers.map(v=>v.name+':'+v.work),b:GAME.st.buildings.map(b=>b.id+':'+b.type)})")
    # jour 1 : aperçu, puis on envoie le premier cueilleur au bois mort
    pg.screenshot(path=f'{OUT}{pre}_1_matin.png')
    pg.click('#bjobs'); pg.wait_for_timeout(600); pg.screenshot(path=f'{OUT}{pre}_2_feuille.png')
    rows=pg.locator('.jrow'); print('lignes', rows.count(), '|', [rows.nth(i).inner_text().replace('\n',' / ') for i in range(rows.count())])
    rows.nth(0).click(); pg.wait_for_timeout(400); pg.screenshot(path=f'{OUT}{pre}_3_choix.png')
    print('choix', [o.replace('\n',' / ') for o in pg.locator('.jopt').all_inner_texts()])
    pg.click('.jopt[data-k="-1"]'); pg.wait_for_timeout(400)
    # le troisième villageois prend la cueillette (id du premier bâtiment à postes)
    bid=pg.evaluate("GAME.st.buildings.find(b=>SIM.BT[b.type].posts).id")
    pg.locator('.jrow').nth(2).click(); pg.wait_for_timeout(300); pg.click(f'.jopt[data-k="{bid}"]'); pg.wait_for_timeout(400); pg.screenshot(path=f'{OUT}{pre}_4_apres.png')
    print('après', [pg.locator('.jrow').nth(i).inner_text().replace('\n',' / ') for i in range(4)])
    want=pg.evaluate("(()=>{const J=SIM.survJobs(GAME.st,GAME.mourners());return J.work})()"); pins=state()['pins']
    pg.click('#jok'); pg.wait_for_timeout(300); print('feuille fermée', pg.locator('.sheet').count()==0, '| cartes toujours là', pg.locator('.card').count())
    day(False); got=pg.evaluate("GAME.plan.end.villagers.map(v=>v.work)"); print('vœux', pins, '| aperçu', want, '| journée', got, '| conforme', all(want[str(i)]==got[i] for i in range(len(got))))
    print('bois gagné', pg.evaluate("GAME.plan.sum.got"))
    pg.screenshot(path=f'{OUT}{pre}_5_bilan.png'); pg.click('#bnext'); pg.wait_for_timeout(2600)
    # jour 2 : les vœux tiennent ; on bâtit, puis « tout laisser faire »
    pg.click('#bjobs'); pg.wait_for_timeout(500); print('jour 2', [pg.locator('.jrow').nth(i).inner_text().replace('\n',' / ') for i in range(4)])
    pg.click('#jok'); day(True); print('jour 2 fin', state()); pg.click('#bnext'); pg.wait_for_timeout(2600)
    pg.click('#bjobs'); pg.wait_for_timeout(500); pg.locator('.jrow').nth(1).click(); pg.wait_for_timeout(300); pg.screenshot(path=f'{OUT}{pre}_6_jour3.png')
    print('jour 3 choix', [o.replace('\n',' / ') for o in pg.locator('.jopt').all_inner_texts()])
    pg.click('#jauto'); pg.wait_for_timeout(300); print('tout laisser faire →', state()['pins'], [pg.locator('.jrow').nth(i).inner_text().replace('\n',' / ') for i in range(4)])
    print('erreurs', logs); b.close()
