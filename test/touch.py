import os; ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__))) + '/'
from playwright.sync_api import sync_playwright
OUT=ROOT+'out/'
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
    pg=b.new_page(viewport={'width':390,'height':844},device_scale_factor=2); logs=[]
    pg.on('pageerror',lambda e: logs.append(str(e))); pg.on('console',lambda m: logs.append(m.text) if m.type=='error' else None)
    pg.add_init_script('window.HQ_LOCK=1'); pg.goto('file://'+OUT+'index.html'); pg.wait_for_timeout(1200)
    pg.screenshot(path=OUT+'t_menu.png')
    pg.click('#bsnd'); print('muet après clic :', pg.evaluate('SFX.muted')); pg.click('#bsnd'); print('muet après 2e clic :', pg.evaluate('SFX.muted'))
    pg.click('#bplay'); pg.click('[data-ch=c2]'); pg.wait_for_timeout(300); pg.screenshot(path=OUT+'t_fiche2.png'); pg.click('#bgo'); pg.wait_for_timeout(900)
    print('tutoriel au défi 2 :', pg.locator('#coach:not([hidden])').count())
    pg.click('.fd.ev >> nth=0'); pg.wait_for_timeout(200); print('frise →', pg.inner_text('#mhint'))
    pg.screenshot(path=OUT+'t_matin2.png')
    pg.click('.card[data-type=potager]'); pg.click('#bbuild'); pg.wait_for_timeout(400); pg.click('#sp2')
    for i in range(80):
        pg.wait_for_timeout(120)
        if pg.evaluate('GAME.t')>=10.4: break
    pg.click('#sp0')
    def tap(x,y,name):
        s=pg.evaluate('([x,y])=>R.w2s(x,y)',[x,y]); pg.mouse.click(s['x'],s['y']); pg.wait_for_timeout(350)
        print(name,'→ fiche :', pg.locator('#insp:not([hidden])').count(), (pg.inner_text('#insp b') if pg.locator('#insp:not([hidden])').count() else ''))
    m=pg.evaluate('({f:GAME.map.fire,b:GAME.map.bank(60,0),t:GAME.map.trees.find(t=>t.x>30&&t.x<350&&t.y>650&&t.y<740),h:GAME.st.buildings[0],c:GAME.st.buildings.find(b=>b.type=="cueillette")})')
    tap(m['f']['x'],m['f']['y']-4,'feu'); tap(m['b']['x'],m['b']['y'],'rivière'); tap(m['t']['x'],m['t']['y'],'arbre')
    tap(m['h']['x']+18,m['h']['y']+15,'cabane'); pg.screenshot(path=OUT+'t_cabane.png'); tap(m['c']['x']+30,m['c']['y']+20,'hutte'); pg.screenshot(path=OUT+'t_hutte.png')
    pg.click('.vb >> nth=2'); pg.wait_for_timeout(300); print('villageois →', pg.inner_text('#insp .tx')); pg.screenshot(path=OUT+'t_vill.png')
    pg.click('#btnPause'); pg.wait_for_timeout(300); pg.screenshot(path=OUT+'t_pause.png'); pg.click('#presume')
    pg.click('.fd.ev >> nth=0'); pg.wait_for_timeout(300); print('frise (jour) →', pg.inner_text('#msg'))
    print('erreurs', logs); b.close()
