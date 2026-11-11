const SIM=require('../src/sim.js');const map=SIM.makeMap();
function pack(seq,seed){const st={buildings:[],cut:[]};const r=SIM.rngOf(seed);const out=[];
 for(const t of seq){const b=SIM.placeBuilding(st,map,t,r);if(!b){out.push(t+':✗');continue}b.type=t;st.buildings.push(b);out.push(t[0]+b.x+','+b.y)}
 return {st,out}}
const a=pack(['cabane','cabane','cabane','cabane','cabane','cabane','cueillette','cabane','cabane','cueillette','potager','cueillette','cabane','bucheron','potager','cueillette','cabane','cabane'],3);
console.log(a.out.join(' '));
// plan ASCII
const g=[];for(let y=260;y<700;y+=8){let row='';for(let x=32;x<352;x+=4){let c='.';if(Math.hypot(x-192,y-436)<14)c='F';if(x>226&&x<284&&y>470&&y<500)c='S';for(const b of a.st.buildings)if(x>=b.x&&x<b.x+b.w&&y>=b.y&&y<b.y+b.h)c=b.type[0]==='c'&&b.type[1]==='a'?'#':b.type[0].toUpperCase();for(const t of map.trees)if(Math.hypot(t.x-x,t.y-y)<t.r*0.7)c='t';row+=c}g.push(row)}
console.log(g.join('\n'));
