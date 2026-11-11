import os; ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__))) + '/'
from playwright.sync_api import sync_playwright
OUT=ROOT+'out/'
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox','--allow-file-access-from-files'])
    pg=b.new_page(viewport={'width':390,'height':844},device_scale_factor=2); logs=[]
    pg.on('pageerror',lambda e: logs.append(str(e))); pg.on('console',lambda m: logs.append(m.text) if m.type=='error' and 'fonts.g' not in m.text and 'ERR_' not in m.text else None)
    pg.add_init_script('window.HQ_LOCK=1;window.SEED=7')
    pg.goto('file://'+OUT+'index.html'); (os.path.exists('/tmp/fonts/fonts.css') and pg.add_style_tag(path='/tmp/fonts/fonts.css')); pg.wait_for_timeout(1800)
    S=lambda n: pg.screenshot(path=OUT+'u_'+n+'.png')
    S('titre'); pg.click('#bopt'); pg.wait_for_timeout(500); S('options')
    pg.fill('#v_music','20'); pg.dispatch_event('#v_music','input'); pg.dispatch_event('#v_music','change'); print('musique →', pg.evaluate('SFX.vol.music'))
    for th in ['veillee','herbier']:
        pg.click(f'[data-theme={th}]'); pg.wait_for_timeout(300); S('options_'+th)
    pg.click('[data-back]'); pg.wait_for_timeout(600); print('retour titre :', pg.locator('#title:not([hidden])').count())
    pg.click('#bstart'); pg.wait_for_timeout(2600); S('sommaire_herbier')
    pg.click('[data-go=cards]'); pg.wait_for_timeout(900); S('cartes'); pg.click('[data-back]'); pg.wait_for_timeout(900)
    pg.click('[data-go=sandbox]'); pg.wait_for_timeout(900); S('bac'); pg.click('[data-back]'); pg.wait_for_timeout(900)
    pg.click('[data-go=levels]'); pg.wait_for_timeout(900); pg.click('[data-level="1"]'); pg.wait_for_timeout(900); S('niveau2')
    pg.click('[data-ch=c6]'); pg.wait_for_timeout(900); pg.click('[data-tab=cards]'); pg.wait_for_timeout(300); S('fiche6')
    pg.click('#bgo'); pg.wait_for_timeout(3200); S('jeu_herbier')
    pg.click('#btnPause'); pg.wait_for_timeout(500); pg.click('.sheet .fd.ev >> nth=0'); pg.wait_for_timeout(200); S('carnet'); pg.click('#pquit'); pg.wait_for_timeout(800); S('quitte')
    for th in ['veillee','carnet']:
        pg.evaluate(f"document.querySelector('#app').dataset.theme='{th}'"); pg.wait_for_timeout(200); S('niveau_'+th)
    print('erreurs', logs); b.close()
