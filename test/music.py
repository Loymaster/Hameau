import os; ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__))) + '/'
"""Musique enregistrée : démarrage, tonalité des sons du jeu, changement de saison, repli si le graphe audio est muet, repli si les fichiers manquent."""
import sys, json, os, shutil
from playwright.sync_api import sync_playwright
OUT=ROOT+'out/'
def run(label, args, prep=None):
    with sync_playwright() as p:
        b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox','--autoplay-policy=no-user-gesture-required']+args)
        pg=b.new_page(viewport={'width':390,'height':844}); logs=[]; pg.on('pageerror',lambda e: logs.append(str(e)))
        pg.goto('file://'+OUT+'index.html'); pg.wait_for_timeout(600); pg.click('#bstart'); st=lambda: pg.evaluate('SFX.music()')
        print('—',label)
        for t in (1.5,4,5,5):
            pg.wait_for_timeout(int(t*1000)); print('   ',json.dumps(st(),ensure_ascii=False))
        if prep=='saison':
            pg.evaluate("window.__s=SFX.season; SFX.season=()=>{}; window.__s('hiver')")
            for t in (2,3,4,6): pg.wait_for_timeout(t*1000); print('    hiver demandé →',json.dumps(st(),ensure_ascii=False))
            pg.evaluate("SFX.setVol('music',0.2)"); pg.wait_for_timeout(400); print('    volume musique 0.2 : ok ; muet :', pg.evaluate("(SFX.setMute(true), SFX.muted)")); pg.evaluate("SFX.setMute(false)")
        print('    erreurs', logs); b.close()
which=sys.argv[1] if len(sys.argv)>1 else 'tout'
if which in ('tout','normal'): run('cas normal (même origine)', ['--allow-file-access-from-files'], 'saison')
if which in ('tout','muet'): run('graphe audio muet (origine différente) → lecture directe', [])
if which in ('tout','absent'):
    os.rename(OUT+'music', OUT+'music_off')
    try: run('fichiers absents → phrases composées par le jeu', ['--allow-file-access-from-files'])
    finally: os.rename(OUT+'music_off', OUT+'music')
