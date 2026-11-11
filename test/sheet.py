import os; ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__))) + '/'
import sys
from PIL import Image
out=sys.argv[1]; names=sys.argv[2:]
ims=[Image.open(ROOT+'out/'+n+'.png') for n in names]
W=sum(i.width for i in ims); H=max(i.height for i in ims)
o=Image.new('RGB',(W,H)); x=0
for i in ims: o.paste(i,(x,0)); x+=i.width
k=min(1, 1900/W); o=o.resize((int(W*k),int(H*k))); o.save(ROOT+'out/'+out+'.png')
