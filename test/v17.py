import os; ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__))) + '/'
"""python3 test/v17.py : captures du sommaire, de la collection, des annonces empilées et de leurs définitions"""
from playwright.sync_api import sync_playwright
OUT=ROOT+'out/'
SAVE="{stars:{c1:3,c2:3,c3:2,c5:1,c9:2,c10:1},tuto:{c1:1,c2:1}}"
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox','--allow-file-access-from-files']); logs=[]
    def page(w,h,save=True):
        pg=b.new_page(viewport={'width':w,'height':h},device_scale_factor=2 if w<500 else 1)
        pg.on('pageerror',lambda e: logs.append((e.stack or str(e))[:500])); pg.on('console',lambda m: logs.append(m.text[:300]) if m.type=='error' and 'ERR_' not in m.text else None)
        pg.add_init_script("window.HQ_LOCK=1;window.SEED=5;"+("try{if(!localStorage.getItem('hameau.v2'))localStorage.setItem('hameau.v2',JSON.stringify("+SAVE+"))}catch(e){}" if save else ''))
        pg.goto('file://'+OUT+'index.html'); (os.path.exists('/tmp/fonts/fonts.css') and pg.add_style_tag(path='/tmp/fonts/fonts.css')); pg.wait_for_timeout(1500); return pg
    for w,h,n in ((1280,900,'bureau'),(390,700,'petit'),(412,915,'grand')):
        pg=page(w,h); pg.screenshot(path=OUT+'v17_titre_'+n+'.png'); r=pg.evaluate("(()=>{const a=document.querySelector('#app').getBoundingClientRect(),s=document.querySelector('#bstart').getBoundingClientRect();return [Math.round(a.top),Math.round(a.height),Math.round(s.bottom-a.top),innerHeight]})()"); print(n,'app haut/hauteur, bas du bouton, fenêtre',r); pg.close()
    pg=page(390,844); S=lambda n: pg.screenshot(path=OUT+'v17_'+n+'.png'); W=lambda t=1000: pg.wait_for_timeout(t)
    pg.click('#bstart'); W(3300); S('1_sommaire')
    pg.click('[data-go=collection]'); W(); S('3_collection'); pg.click('[data-go=cards]'); W(); S('4_batiments'); pg.click('[data-back]'); W()
    pg.click('[data-go=events]'); W(); S('5_evenements'); pg.click('[data-back]'); W(); pg.click('[data-go=jobs]'); W(); S('6_metiers'); pg.click('[data-back]'); W()
    pg.click('[data-go=resources]'); W(); S('6b_ressources'); pg.click('[data-back]'); W(); pg.click('[data-back]'); W()
    pg.click('[data-go=play]'); W(); S('2_jouer'); pg.click('[data-go=survival]'); W(); S('2b_survie'); pg.click('[data-back]'); W()
    pg.click('[data-go=levels]'); W(); pg.click('[data-level="2"]'); W(); pg.click('[data-ch=c10]'); W(); S('7_fiche_c10'); print('c10 :', [t.replace('\n',' ') for t in pg.locator('.evn').all_inner_texts()], '| pastilles', pg.evaluate("[...document.querySelectorAll('.fd')].map(f=>f.dataset.d+':'+f.querySelectorAll('.evc').length).join(' ')"))
    pg.locator('.fd[data-d="6"]').click(); W(400); S('7b_fiche_c10_def'); print('  déf. jour 6 :', pg.inner_text('.evbox')[:160].replace('\n',' | '))
    pg.click('[data-back]'); W(); pg.click('[data-back]'); W(); pg.click('[data-level="5"]'); W(); pg.click('[data-ch=c20]'); W(); pg.locator('.evn[data-d="5"]').click(); W(400); S('8_fiche_c20')
    pg.evaluate("document.querySelector('.page').scrollTop=400"); W(300); S('8b_fiche_c20_bas')
    # matin du jour 5 du défi 20 : deux annonces
    pg.click('#bgo'); W(2500)
    for d,c in enumerate(['-','etal','table','table']):
        W(1500); print('  jour',d+1,pg.evaluate("[...document.querySelectorAll('.card')].map(c=>c.dataset.type+':'+c.className).join(' ')+' | modal '+!document.querySelector('#modal').hidden"))
        if c!='-' and pg.locator(f'.card[data-type={c}]').count(): pg.click(f'.card[data-type={c}]'); W(300); pg.click('#bbuild')
        elif pg.locator('#bskip').count(): pg.click('#bskip')
        W(300); pg.click('#sp4')
        for i in range(900):
            W(100)
            if pg.locator('#bnext').count(): break
        pg.click('#bnext'); W(2500)
    S('9_matin_c20_j5'); print('matin j5 :', pg.inner_text('.evb'), '| largeur en-tête', pg.evaluate("document.querySelector('.mhead').scrollWidth+'/'+document.querySelector('.mhead').clientWidth"))
    pg.click('.evb'); W(500); S('9b_matin_def'); pg.click('#evok'); W(300)
    # survie : cinq annonces le même matin
    pg.goto('file://'+OUT+'index.html'); W(1500); pg.click('#bstart'); W(3300); pg.click('[data-go=play]'); W(); pg.click('[data-go=survival]'); W(); pg.click('#bsurv'); W(2600)
    pg.evaluate("GAME.st.ev=[{day:1,type:'storm',lv:2},{day:1,type:'wind',lv:1},{day:1,type:'rats',lv:1},{day:1,type:'frost',len:3,lv:2},{day:1,type:'wolves',lv:1},{day:2,type:'fire',lv:1},{day:2,type:'flood',lv:1},{day:3,type:'sick',lv:1,who:[]}]; GAME.on.morning()"); W(600); S('10_survie_5')
    print('survie :', pg.inner_text('.evb'), '| largeur en-tête', pg.evaluate("document.querySelector('.mhead').scrollWidth+'/'+document.querySelector('.mhead').clientWidth"), '| Métiers visible', pg.evaluate("(()=>{const r=document.querySelector('#bjobs').getBoundingClientRect();return r.right<=document.querySelector('#app').getBoundingClientRect().right})()"))
    pg.click('.evb'); W(500); S('10b_survie_def'); pg.click('#evok'); W(300); pg.click('#btnPause'); W(600); S('10c_survie_carnet')
    print('erreurs', logs); b.close()
