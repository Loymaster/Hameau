import os; ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__))) + '/'
import json
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox','--autoplay-policy=no-user-gesture-required'])
    pg=b.new_page(viewport={'width':390,'height':844}); logs=[]
    pg.on('pageerror',lambda e: logs.append(str(e))); pg.on('console',lambda m: logs.append(m.text) if m.type=='error' else None)
    pg.goto('file://'+ROOT+'out/index.html'); pg.wait_for_timeout(500)
    print('avant geste : prêt =', pg.evaluate('SFX.ready'))
    pg.click('#bplay'); pg.wait_for_timeout(400)
    print('après geste : prêt =', pg.evaluate('SFX.ready'), '| muet =', pg.evaluate('SFX.muted'))
    sc={'jour':{}, 'nuit':{'night':1}, 'orage':{'rain':1,'flood':1}, 'gel':{'frost':1}}
    for k,v in sc.items(): print('ambiance', k, pg.evaluate('(s)=>SFX.measure(6,s,[])', v))
    for layer in ['river','trickle','wind','rain','fire']:
        print('  nappe', layer, pg.evaluate('(l)=>SFX.measure(4,{night:1,rain:1,flood:1,only:l},[])', layer))
    res={}
    for n in pg.evaluate('SFX.names()'): res[n]=pg.evaluate('(n)=>SFX.measure(2.5,{ambientOff:1},[n])', n)
    for n,v in res.items(): print('  %-8s crête %.3f  rms %.4f' % (n, v['peak'], v['rms']))
    print('mélange chargé', pg.evaluate("SFX.measure(6,{night:0.3,rain:1,flood:1},['built','food','hammer','chop','fall','thunder','eat','star'])"))
    print('erreurs', logs)
    b.close()
