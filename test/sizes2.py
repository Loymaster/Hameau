import os; ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__))) + '/'
from playwright.sync_api import sync_playwright
OUT=ROOT+'out/'
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
    for w,h in [(390,690),(390,844)]:
        pg=b.new_page(viewport={'width':w,'height':h},device_scale_factor=1.5)
        logs=[]; pg.on('pageerror',lambda e: logs.append(str(e)))
        pg.add_init_script('window.HQ_LOCK=1'); pg.goto('file://'+OUT+'index.html'); pg.wait_for_timeout(600)
        pg.click('#bplay'); pg.click('[data-ch=c1]'); pg.wait_for_timeout(200); pg.click('#bgo'); pg.wait_for_timeout(400)
        pg.click('#cskip'); pg.wait_for_timeout(1500)
        pg.screenshot(path=f'{OUT}m_{w}x{h}.png'); print(w,h,logs)
        pg.click('.card[data-type=bucheron]'); pg.click('#bbuild'); pg.click('#sp4')
        for i in range(200):
            pg.wait_for_timeout(150)
            if pg.evaluate('GAME.t')>=14.4: break
        pg.click('#sp0'); pg.wait_for_timeout(300)
        pg.screenshot(path=f'{OUT}w_{w}x{h}.png')
        pg.close()
    b.close()
