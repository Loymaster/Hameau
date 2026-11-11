import os; ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__))) + '/'
from playwright.sync_api import sync_playwright
OUT=ROOT+'out/'
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox','--allow-file-access-from-files'])
    for w,h in [(360,640),(412,915),(1000,760)]:
        pg=b.new_page(viewport={'width':w,'height':h},device_scale_factor=2); logs=[]
        pg.on('pageerror',lambda e: logs.append(str(e)))
        pg.add_init_script('window.HQ_LOCK=1;window.SEED=11'); pg.goto('file://'+OUT+'index.html'); (os.path.exists('/tmp/fonts/fonts.css') and pg.add_style_tag(path='/tmp/fonts/fonts.css')); pg.wait_for_timeout(900)
        pg.evaluate("UI.startChallenge('c6')"); pg.wait_for_timeout(3300); pg.screenshot(path=f'{OUT}y_{w}.png')
        pg.click('.card[data-type=carriere]'); pg.wait_for_timeout(300); pg.click('#bbuild'); pg.click('#sp4'); pg.wait_for_timeout(5200); pg.screenshot(path=f'{OUT}z_{w}.png')
        ov=pg.evaluate("[...document.querySelectorAll('.vb,.res,.card,.jl,.speed')].filter(e=>{const r=e.getBoundingClientRect(),a=document.querySelector('#app').getBoundingClientRect();return r.left<a.left-1||r.right>a.right+1}).length")
        print(w,h,'t',round(pg.evaluate('GAME.t'),1),'éléments hors cadre :',ov,logs); pg.close()
    b.close()
