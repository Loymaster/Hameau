import os; ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__))) + '/'
"""Contraste réel des icônes posées sur l'image : on masque le contenu du haut et du bas (les voiles restent), puis on mesure le fond le plus clair derrière chaque rangée."""
import numpy as np, io, re
from PIL import Image
from playwright.sync_api import sync_playwright
def lin(c): c=c/255; return np.where(c<=0.03928,c/12.92,((c+0.055)/1.055)**2.4)
L=lambda a: 0.2126*lin(a[...,0])+0.7152*lin(a[...,1])+0.0722*lin(a[...,2])
css=open(ROOT+'src/style.css').read(); light=dict(re.findall(r'--k-(\w+):(#\w{6})', re.search(r'\.hud,\.bottom,\.card \.cc,\.daytitle\{([^}]*)\}',css).group(1)))
hl=lambda h: float(L(np.array([[int(h[i:i+2],16) for i in (1,3,5)]],float))[0])
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox','--allow-file-access-from-files'])
    pg=b.new_page(viewport={'width':390,'height':844}); pg.add_init_script('window.HQ_LOCK=1;window.SEED=7;')
    pg.goto('file://'+ROOT+'out/index.html'); pg.wait_for_timeout(1200); pg.click('#bstart'); pg.wait_for_timeout(2600)
    pg.click('[data-go=play]'); pg.wait_for_timeout(900); pg.click('[data-go=levels]'); pg.wait_for_timeout(900); pg.click('[data-level="2"]'); pg.wait_for_timeout(900); pg.click('[data-ch=c9]'); pg.wait_for_timeout(900); pg.click('#bgo'); pg.wait_for_timeout(1500)
    pg.click('#bskip'); pg.wait_for_timeout(300); pg.click('#sp4')
    worst={}
    for hour in (7.2, 13, 18.5, 23):
        for i in range(600):
            if pg.evaluate('GAME.t')>=hour: break
            pg.wait_for_timeout(100)
        pg.evaluate('GAME.paused=true'); pg.wait_for_timeout(250)
        rows={k:pg.evaluate("s=>{const r=document.querySelector(s).getBoundingClientRect();return [r.left,r.top,r.right,r.bottom]}",s) for k,s in {'ressources':'#res','jalons':'.track','vitesse':'.speed','carnet':'#btnPause'}.items()}
        pg.add_style_tag(content='#hud>*,#bottom>*,#bubbles{visibility:hidden!important}'); pg.wait_for_timeout(150)
        a=np.array(Image.open(io.BytesIO(pg.screenshot())).convert('RGB'),float)
        pg.evaluate("document.head.lastElementChild.remove(); GAME.paused=false")
        for k,(x0,y0,x1,y1) in rows.items():
            m=float(L(a[int(y0):int(y1)+1,int(x0):int(x1)+1]).max()); worst[k]=max(worst.get(k,0),m); print('%4.1f h | %-10s | fond le plus clair %.3f'%(hour,k,m))
    b.close()
print('\nPire fond par rangée, et contraste des teintes claires dessus :')
for k,m in worst.items(): print('%-10s %.3f |'%(k,m),' '.join('%s %.1f'%(n,(hl(c)+.05)/(m+.05)) for n,c in light.items()))
print('plus faible contraste :', '%.2f'%min((hl(c)+.05)/(m+.05) for m in worst.values() for c in light.values()))
