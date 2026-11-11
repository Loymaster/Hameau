import os; ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__))) + '/'
from playwright.sync_api import sync_playwright
OUT=ROOT+'out/'
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox','--allow-file-access-from-files'])
    pg=b.new_page(viewport={'width':390,'height':844},device_scale_factor=2); logs=[]
    pg.on('pageerror',lambda e: logs.append(str(e))); pg.on('console',lambda m: logs.append(m.text) if m.type=='error' and 'ERR_' not in m.text else None)
    pg.add_init_script('window.HQ_LOCK=1;window.SEED=21;try{localStorage.setItem("hameau.v2",JSON.stringify({tuto:{c1:true,c2:true}}))}catch(e){}')
    pg.goto('file://'+OUT+'index.html'); (os.path.exists('/tmp/fonts/fonts.css') and pg.add_style_tag(path='/tmp/fonts/fonts.css')); pg.wait_for_timeout(900)
    pg.evaluate("UI.startChallenge('c2')"); mx=0; seen=[]; shots=0
    def watch(ms, tag):
        global mx, shots
        for i in range(ms//250):
            pg.wait_for_timeout(250)
            t=pg.evaluate("[...document.querySelectorAll('.sb')].map(e=>e.textContent)")
            mx=max(mx,len(t))
            for x in t:
                if x not in seen:
                    seen.append(x)
                    if shots<7 and (len(t)==2 or shots<2): shots+=1; pg.screenshot(path=f'{OUT}b_{shots}_{tag}.png')
    seq=['cabanon','-','bucheron','-','-']   # un chemin qui laisse des gens sans toit ni repas
    for d,pick in enumerate(seq,1):
        watch(9000,'matin%d'%d)
        if d==2:
            pg.click('.sb', timeout=3000) if pg.locator('.sb').count() else pg.click('.vb >> nth=1'); pg.wait_for_timeout(400); pg.screenshot(path=OUT+'b_carnet.png'); print('carnet :', pg.inner_text('#icar').replace('\n',' | ')[:230]); pg.click('#insp .x')
        if pick=='-': pg.click('#bskip')
        else: pg.click(f'.card[data-type={pick}]'); pg.wait_for_timeout(300); pg.click('#bbuild')
        pg.wait_for_timeout(300); pg.click('#sp2')
        for i in range(300):
            watch(500,'jour%d'%d)
            if pg.locator('#bnext').count(): break
        print('jour',d,'|',pg.inner_text('.sheet h2'),'| amours :',pg.evaluate('Object.keys(GAME.mind.love).length/2'))
        pg.click('#bnext'); pg.wait_for_timeout(600)
        if pg.locator('.bigstars').count(): break
    pg.wait_for_timeout(800)
    print('bulles simultanées au maximum :', mx, '| phrases entendues :', len(seen))
    for x in seen[:14]: print('  ·', x)
    print('erreurs', logs); b.close()
