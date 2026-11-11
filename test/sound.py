import os; ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__))) + '/'
"""Rend hors ligne la page tournée et trois ambiances (jour, nuit, orage), mesure leurs niveaux et dessine leurs spectrogrammes."""
import numpy as np, json
from PIL import Image
from playwright.sync_api import sync_playwright
def spec(x, sr, N=1024, H=256, fmax=8000, hpx=220):
    w=np.hanning(N); fr=[np.abs(np.fft.rfft(x[i:i+N]*w)) for i in range(0,len(x)-N,H)]; S=np.array(fr).T; S=S[:int(fmax/(sr/2)*S.shape[0])]
    D=20*np.log10(S/32767/N*4+1e-9); D=np.clip((D+110)/70,0,1)[::-1]; im=Image.fromarray((D*255).astype(np.uint8)).resize((min(1500,max(300,S.shape[1])),hpx)); return im, D
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox','--autoplay-policy=no-user-gesture-required','--allow-file-access-from-files'])
    pg=b.new_page(viewport={'width':390,'height':844}); pg.goto('file://'+ROOT+'out/index.html'); pg.wait_for_timeout(600); pg.click('#bstart'); pg.wait_for_timeout(1200)
    R=lambda sec,scene,names: pg.evaluate('([s,c,n])=>SFX.measure(s,c,n)',[sec,scene,names])
    ims=[]
    r=R(1.2,{'ambientOff':1,'data':1},['page']); x=np.array(r['data'],float); sr=22050
    hi=np.array([np.abs(np.fft.rfft(x[i:i+512]*np.hanning(512)))[93:].sum()/ (np.abs(np.fft.rfft(x[i:i+512]*np.hanning(512))).sum()+1e-9) for i in range(0,len(x)-512,256)])
    env=np.array([np.sqrt((x[i:i+256]**2).mean())/32767 for i in range(0,len(x)-256,256)])
    print('page : crête %.3f rms %.4f | part au-dessus de 4 kHz : max %.0f %% | enveloppe max à %.2f s, son fini à %.2f s'%(r['peak'],r['rms'],100*hi[env[:len(hi)]>env.max()*0.1].max(),(env.argmax()*256/sr)-0.3,(np.where(env>env.max()*0.05)[0][-1]*256/sr)-0.3))
    ims.append(spec(x,sr)[0])
    for lab,sc in [('jour',{}),('nuit',{'night':1}),('orage',{'rain':1,'flood':1})]:
        r=R(40,dict(sc,life=1,data=1),[]); x=np.array(r['data'],float); beds=R(40,dict(sc),[])
        e=np.array([np.sqrt((x[i:i+2205]**2).mean())/32767 for i in range(0,len(x)-2205,2205)]); db=20*np.log10(e+1e-9)
        print('%-5s : tout rms %.4f (nappes seules %.4f) | niveau par 0,1 s : 10e centile %.0f dB, médiane %.0f dB, 95e %.0f dB | crête %.3f'%(lab,r['rms'],beds['rms'],np.percentile(db,10),np.median(db),np.percentile(db,95),r['peak']))
        ims.append(spec(x,sr)[0])
    W=max(i.width for i in ims); out=Image.new('L',(W,sum(i.height for i in ims)+6*len(ims)),255); y=0
    for i in ims: out.paste(i,(0,y)); y+=i.height+6
    out.save(ROOT+'out/sons.png'); print(out.size); b.close()
