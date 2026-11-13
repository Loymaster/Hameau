"""python3 build.py : assemble le jeu en une seule page.
  out/   copie de travail (essais, captures) — non suivie par git
  docs/  la page publiée par GitHub Pages"""
import base64, glob, os, shutil
ROOT = os.path.dirname(os.path.abspath(__file__)) + '/'
src = ROOT + 'src/'
tpl = open(src + 'index.tpl.html').read()
css = open(src + 'style.css').read().replace('/*LOGO*/', 'url("data:image/webp;base64,' + base64.b64encode(open(src + 'logo.webp', 'rb').read()).decode() + '")')
js = '\n'.join(open(src + f).read() for f in ['sim.js', 'mind.js', 'icons.js', 'art.js', 'audio.js', 'render.js', 'game.js', 'ui.js'])
js = js.replace("if (typeof module !== 'undefined') module.exports = SIM;", "")
assert '</script' not in js
page = tpl.replace('/*CSS*/', css).replace('/*JS*/', js)
for d in ('out/', 'docs/'):
    os.makedirs(ROOT + d + 'music', exist_ok=True)
    open(ROOT + d + 'index.html', 'w').write(page)
    for f in glob.glob(src + 'music/*.mp3'): shutil.copy(f, ROOT + d + 'music/')
print('index.html', len(page) // 1024, 'Ko')
