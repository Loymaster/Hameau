import os; ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__))) + '/'
import sys, json
from playwright.sync_api import sync_playwright
shots=json.loads(sys.argv[1])
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
    pg=b.new_page(viewport={'width':390,'height':844},device_scale_factor=2)
    logs=[]
    pg.on('console',lambda m: logs.append(m.text) if m.type in('error','warning') else None)
    pg.on('pageerror',lambda e: logs.append('PAGEERROR '+str(e)))
    pg.goto('file://'+ROOT+'test/scene.html')
    for name,picks,hour in shots:
        t=pg.evaluate('([p,h])=>shot(p,h)',[picks,hour])
        pg.screenshot(path=ROOT+f'out/{name}.png')
        print(name,'t=',round(t,2))
    print('errs',pg.evaluate('errs'),logs[:8])
    b.close()
