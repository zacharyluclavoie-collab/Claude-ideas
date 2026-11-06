/* Sticker-style sprite generator: draws each sprite on a 512x512 canvas (thick dark outline, glossy fills, cute faces) */
const OL="#1d2416",T=Math.PI*2;
const lg=(c,x0,y0,x1,y1,st)=>{const g=c.createLinearGradient(x0,y0,x1,y1);st.forEach(s=>g.addColorStop(s[0],s[1]));return g};
const rg=(c,x,y,r0,r1,st,x2,y2)=>{const g=c.createRadialGradient(x,y,r0,x2==null?x:x2,y2==null?y:y2,r1);st.forEach(s=>g.addColorStop(s[0],s[1]));return g};
const FS=(c,fill,lw)=>{if(fill){c.fillStyle=fill;c.fill()}if(lw===0)return;c.lineWidth=lw==null?16:lw;c.strokeStyle=OL;c.lineJoin="round";c.lineCap="round";c.stroke()};
const ell=(c,x,y,rx,ry,fill,lw,rot)=>{c.beginPath();c.ellipse(x,y,rx,ry,rot||0,0,T);FS(c,fill,lw)};
const gloss=(c,x,y,rx,ry,rot,a)=>{c.beginPath();c.ellipse(x,y,rx,ry,rot||0,0,T);c.fillStyle="rgba(255,255,255,"+(a==null?.7:a)+")";c.fill()};
const poly=(c,p,fill,lw)=>{c.beginPath();p.forEach((q,i)=>i?c.lineTo(q[0],q[1]):c.moveTo(q[0],q[1]));c.closePath();FS(c,fill,lw)};
const rr=(c,x,y,w,h,r,fill,lw)=>{c.beginPath();c.moveTo(x+r,y);c.arcTo(x+w,y,x+w,y+h,r);c.arcTo(x+w,y+h,x,y+h,r);c.arcTo(x,y+h,x,y,r);c.arcTo(x,y,x+w,y,r);c.closePath();FS(c,fill,lw)};
const eyes=(c,x1,x2,y,r,look)=>{[x1,x2].forEach(x=>{ell(c,x,y,r,r*1.15,"#fff",Math.max(6,r*.28));ell(c,x+(look||0),y+r*.1,r*.55,r*.7,"#1d2416",0);gloss(c,x+(look||0)-r*.18,y-r*.15,r*.2,r*.22,0,.95)})};
const smile=(c,x,y,w,h,lw)=>{c.beginPath();c.moveTo(x-w,y);c.quadraticCurveTo(x,y+h,x+w,y);c.lineWidth=lw||10;c.strokeStyle=OL;c.lineCap="round";c.stroke()};
const cheeks=(c,x1,x2,y,r)=>{[x1,x2].forEach(x=>{c.beginPath();c.ellipse(x,y,r,r*.6,0,0,T);c.fillStyle="rgba(255,110,150,.55)";c.fill()})};
const sparkle=(c,x,y,r,fill)=>{c.beginPath();for(let i=0;i<8;i++){const a=i/8*T-Math.PI/2,rad=i%2?r*.28:r;c.lineTo(x+Math.cos(a)*rad,y+Math.sin(a)*rad)}c.closePath();FS(c,fill||"#fff6a0",8)};
const cloudPath=(c,x,y,s)=>{c.beginPath();c.arc(x-s*.9,y+s*.15,s*.62,Math.PI*.5,Math.PI*1.5);c.arc(x-s*.35,y-s*.35,s*.62,Math.PI,Math.PI*1.95);c.arc(x+s*.45,y-s*.2,s*.7,Math.PI*1.2,Math.PI*.1);c.arc(x+s*.95,y+s*.2,s*.5,Math.PI*1.5,Math.PI*.5);c.closePath()};

const ART={
blimp(c){
  poly(c,[[70,215],[18,120],[120,160],[150,215]],"#e8423f",16);poly(c,[[70,255],[18,350],[120,310],[150,255]],"#e8423f",16);
  c.save();c.beginPath();c.ellipse(268,235,225,112,0,0,T);c.clip();
  c.fillStyle=lg(c,0,120,0,350,[[0,"#ffffff"],[.55,"#dfe6f5"],[1,"#aab8d8"]]);c.fillRect(0,0,512,512);
  c.fillStyle=lg(c,0,205,0,265,[[0,"#ff7a6a"],[1,"#d8302f"]]);c.fillRect(0,205,512,60);
  c.restore();ell(c,268,235,225,112,null,16);
  gloss(c,200,170,95,22,-.12,.75);
  [[130,236],[190,236]].forEach(p=>sparkle(c,p[0],p[1],20,"#fff"));
  rr(c,205,338,120,62,22,lg(c,0,338,0,400,[[0,"#c98a4a"],[1,"#8a5a2a"]]),14);
  [235,265,295].forEach(x=>ell(c,x,368,12,13,"#bfe6ff",6));
  eyes(c,372,430,208,22,5);cheeks(c,350,452,246,14);smile(c,401,252,22,18,8);
  ell(c,52,235,14,46,"#c0c6d0",10)},
bolt(c){
  poly(c,[[300,20],[110,290],[225,290],[168,495],[400,200],[282,200],[360,20]],lg(c,100,20,400,495,[[0,"#fff6a0"],[.45,"#ffd52a"],[1,"#ff9d0a"]]),20);
  poly(c,[[290,70],[185,255],[245,255],[225,370]],"rgba(255,255,255,.55)",0);
  sparkle(c,78,120,34);sparkle(c,440,330,28);sparkle(c,420,90,20,"#fff")},
tornado(c){
  const cols=["#7f8ba2","#8f9bb2","#a0abc0","#b3bdd0","#c8d0de","#dde3ee"];
  for(let i=5;i>=0;i--){const cx=256+Math.sin(i*1.25)*16,y=92+i*68,rx=205-i*32,ry=46-i*3;ell(c,cx,y,rx,ry,lg(c,0,y-ry,0,y+ry,[[0,cols[i]],[1,cols[Math.max(0,i-1)]]]),14)}
  ell(c,256,92,205,46,null,0);gloss(c,170,80,70,12,-.1,.55);
  eyes(c,212,300,222,26,0);
  c.beginPath();c.moveTo(224,262);c.quadraticCurveTo(256,290,288,262);c.lineWidth=10;c.strokeStyle=OL;c.lineCap="round";c.stroke();
  c.strokeStyle="rgba(255,255,255,.6)";c.lineWidth=8;[[120,150],[390,250],[150,360]].forEach(p=>{c.beginPath();c.arc(p[0],p[1],40,3.4,5.4);c.stroke()})},
rainbow(c){
  const cs=["#e8423f","#ff9a1f","#ffd23d","#6cc83c","#3dbbff","#8a5ad6"];
  c.lineCap="butt";c.strokeStyle=OL;c.lineWidth=cs.length*32+26;c.beginPath();c.arc(256,380,106,Math.PI,T);c.stroke();
  cs.forEach((col,i)=>{c.strokeStyle=col;c.lineWidth=34;c.beginPath();c.arc(256,380,188-i*32,Math.PI,T);c.stroke()});
  c.lineCap="round";[[104,400],[408,400]].forEach(p=>{cloudPath(c,p[0],p[1],66);FS(c,lg(c,0,p[1]-80,0,p[1]+60,[[0,"#ffffff"],[1,"#cfe2ff"]]),16)});
  c.strokeStyle=OL;c.lineWidth=16;c.lineCap="butt";c.beginPath();c.moveTo(60,386);c.lineTo(452,386);c.stroke();gloss(c,138,232,34,9,-.7,.55)},
calendar(c){
  rr(c,52,86,408,372,40,lg(c,0,86,0,458,[[0,"#ffffff"],[1,"#e4e9f2"]]),16);
  c.save();rr(c,52,86,408,110,40,null,0);c.clip();c.fillStyle=lg(c,0,86,0,196,[[0,"#ff6a6a"],[1,"#d82a3a"]]);c.fillRect(40,70,432,140);c.restore();rr(c,52,86,408,372,40,null,16);
  c.beginPath();c.moveTo(52,196);c.lineTo(460,196);c.lineWidth=14;c.stroke();
  [150,330].forEach(x=>rr(c,x,44,36,84,16,lg(c,x,0,x+36,0,[[0,"#f2f4f8"],[1,"#aab2c0"]]),12));
  for(let r=0;r<3;r++)for(let k=0;k<4;k++){const x=92+k*92,y=228+r*72,hot=r===1&&k===2;rr(c,x,y,64,52,12,hot?"#ff6a9a":"#dfe5ee",hot?10:6)}
  gloss(c,150,130,60,12,0,.45)},
coffee(c){
  ell(c,256,418,210,46,lg(c,0,380,0,470,[[0,"#ffffff"],[1,"#c8d0de"]]),14);
  c.beginPath();c.arc(398,252,66,-1.5,1.5);c.lineWidth=40;c.strokeStyle=OL;c.lineCap="round";c.stroke();c.lineWidth=18;c.strokeStyle="#f4f6fb";c.stroke();
  c.beginPath();c.moveTo(96,170);c.lineTo(416,170);c.lineTo(386,372);c.quadraticCurveTo(256,420,126,372);c.closePath();FS(c,lg(c,96,0,416,0,[[0,"#ffffff"],[.6,"#eef1f8"],[1,"#c6cfe0"]]),16);
  ell(c,256,170,160,34,lg(c,0,140,0,200,[[0,"#8a5a3a"],[1,"#5a3a22"]]),14);
  c.beginPath();c.moveTo(256,196);c.bezierCurveTo(206,170,230,142,256,166);c.bezierCurveTo(282,142,306,170,256,196);c.fillStyle="#f6dcc0";c.fill();
  eyes(c,200,312,285,18,0);cheeks(c,172,340,318,14);smile(c,256,318,22,16,8);
  c.strokeStyle=OL;c.lineWidth=26;c.lineCap="round";[[196,96],[256,70],[316,96]].forEach((p,i)=>{c.beginPath();c.moveTo(p[0],130);c.bezierCurveTo(p[0]-36,110,p[0]+36,86,p[0],p[1]-30);c.stroke()});
  c.strokeStyle="#f4f6fb";c.lineWidth=12;[[196,96],[256,70],[316,96]].forEach(p=>{c.beginPath();c.moveTo(p[0],130);c.bezierCurveTo(p[0]-36,110,p[0]+36,86,p[0],p[1]-30);c.stroke()})},
cursor(c){
  poly(c,[[104,36],[104,408],[196,324],[262,466],[340,432],[274,296],[398,296]],lg(c,100,30,400,470,[[0,"#ffffff"],[1,"#d4dbe8"]]),22);
  poly(c,[[132,110],[132,330],[190,278]],"rgba(255,255,255,.0)",0);gloss(c,160,160,16,60,.1,.9);
  sparkle(c,408,86,52,"#ffe14a");sparkle(c,452,170,24,"#fff");sparkle(c,350,36,18,"#9fe0ff")},
fishbowl(c){
  ell(c,256,296,196,188,"rgba(210,240,255,.35)",0);
  c.save();c.beginPath();c.ellipse(256,296,196,188,0,0,T);c.clip();
  c.fillStyle=lg(c,0,170,0,484,[[0,"#8fe0ff"],[1,"#2f9fe0"]]);c.fillRect(0,170,512,330);
  c.fillStyle="#e8c47a";c.beginPath();c.ellipse(256,478,210,48,0,0,T);c.fill();
  [[150,462,16],[210,470,12],[300,466,18],[360,458,12]].forEach(p=>ell(c,p[0],p[1],p[2],p[2]*.7,"#c9a060",6));
  c.strokeStyle=OL;c.lineWidth=12;c.fillStyle="#3fae4a";c.beginPath();c.moveTo(396,470);c.quadraticCurveTo(370,390,410,340);c.quadraticCurveTo(430,400,418,470);c.closePath();c.fill();c.stroke();
  poly(c,[[190,300],[132,258],[132,350]],"#ff8a1f",12);ell(c,262,300,76,52,lg(c,0,248,0,352,[[0,"#ffb24a"],[1,"#ff6a14"]]),12);
  ell(c,302,288,13,14,"#fff",7);ell(c,306,290,7,8,OL,0);gloss(c,246,282,34,10,-.2,.6);
  [[330,214,14],[360,170,9],[322,150,6]].forEach(p=>{c.beginPath();c.arc(p[0],p[1],p[2],0,T);c.fillStyle="rgba(255,255,255,.5)";c.fill();c.lineWidth=5;c.strokeStyle="rgba(29,36,22,.5)";c.stroke()});
  c.restore();ell(c,256,296,196,188,null,16);
  rr(c,176,86,160,40,18,lg(c,0,86,0,126,[[0,"#e8f8ff"],[1,"#a8d4ec"]]),14);
  gloss(c,150,230,22,100,.3,.55)},
nightmoon(c){
  const R=200,cx=230,cy=262,d=120,r=170,x=(d*d+R*R-r*r)/(2*d),y=Math.sqrt(R*R-x*x),a=Math.atan2(y,x);
  c.beginPath();c.arc(cx,cy,R,a,-a,false);const b=Math.atan2(y,x-d);c.arc(cx+d,cy,r,-b,b,true);c.closePath();
  FS(c,rg(c,cx-80,cy-80,10,300,[[0,"#fff7b8"],[.6,"#ffd75a"],[1,"#f0a830"]]),18);
  c.beginPath();c.arc(150,248,22,.2,Math.PI-.2);c.lineWidth=11;c.strokeStyle=OL;c.stroke();
  c.beginPath();c.arc(170,330,28,.3,Math.PI-.3);c.stroke();cheeks(c,126,176,296,14);
  poly(c,[[92,126],[150,28],[256,86],[196,150]],"#4a5fd6",16);c.beginPath();c.moveTo(92,126);c.quadraticCurveTo(160,168,196,150);c.lineWidth=16;c.strokeStyle=OL;c.stroke();
  ell(c,150,30,26,26,"#fff",12);sparkle(c,396,120,40);sparkle(c,430,260,22,"#fff");sparkle(c,350,380,28,"#fff6a0")},
play(c){
  rr(c,34,100,444,312,84,lg(c,0,100,0,412,[[0,"#ff6a6a"],[.55,"#ee2f3a"],[1,"#c41a2a"]]),20);
  gloss(c,170,150,110,22,-.05,.55);
  c.beginPath();c.moveTo(206,170);c.lineTo(206,342);c.lineTo(350,256);c.closePath();c.lineJoin="round";c.lineWidth=40;c.strokeStyle=OL;c.stroke();c.fillStyle="#fff";c.fill();c.lineWidth=12;c.strokeStyle="#fff";c.stroke()},
pulsar(c){
  [[1,"top"],[-1,"bot"]].forEach(([s])=>{c.beginPath();c.moveTo(256,256);c.lineTo(256-70,256+s*-240);c.lineTo(256+70,256+s*-240);c.closePath();c.fillStyle=lg(c,0,256,0,256+s*-240,[[0,"rgba(200,245,255,.95)"],[1,"rgba(120,210,255,.25)"]]);c.fill();c.lineWidth=10;c.strokeStyle="rgba(29,36,22,.8)";c.stroke()});
  ell(c,256,256,110,110,rg(c,226,226,6,120,[[0,"#ffffff"],[.5,"#bfeaff"],[1,"#5aa8e8"]]),18);ell(c,256,256,64,64,"#fff",0);
  c.strokeStyle="rgba(120,200,255,.7)";c.lineWidth=8;[150,190].forEach(r=>{c.beginPath();c.arc(256,256,r,.6,1.5);c.stroke();c.beginPath();c.arc(256,256,r,3.7,4.6);c.stroke()});
  sparkle(c,90,110,30);sparkle(c,430,410,26,"#fff")},
wifi(c){
  c.lineCap="round";[[236,"#3dbbff"],[160,"#3dbbff"],[84,"#3dbbff"]].forEach(([r])=>{c.beginPath();c.arc(256,398,r,Math.PI*1.22,Math.PI*1.78);c.lineWidth=58;c.strokeStyle=OL;c.stroke()});
  [236,160,84].forEach(r=>{c.beginPath();c.arc(256,398,r,Math.PI*1.22,Math.PI*1.78);c.lineWidth=34;c.strokeStyle=lg(c,0,150,0,400,[[0,"#8fe0ff"],[1,"#2f9be8"]]);c.stroke()});
  ell(c,256,398,44,44,lg(c,0,360,0,440,[[0,"#8fe0ff"],[1,"#2f9be8"]]),18);gloss(c,244,384,16,10,-.4,.8)},
wormhole(c){
  ell(c,256,256,226,226,rg(c,256,256,10,230,[[0,"#06000f"],[.35,"#3a0a6a"],[.7,"#8a3fd6"],[1,"#d890ff"]]),20);
  c.lineCap="round";["#ff7ad5","#9fe0ff","#ffe14a","#ffffff"].forEach((col,k)=>{c.beginPath();for(let t=0;t<5.2;t+=.1){const rad=34+t*38+k*4,a=t*1.5+k*1.6;c.lineTo(256+Math.cos(a)*rad,256+Math.sin(a)*rad*.96)}c.strokeStyle=col;c.globalAlpha=.8;c.lineWidth=10-k;c.stroke();c.globalAlpha=1});
  ell(c,256,256,34,34,"#000",0);sparkle(c,120,110,26,"#fff");sparkle(c,400,390,22,"#fff6a0")},
crown(c){
  poly(c,[[46,380],[30,130],[160,250],[256,60],[352,250],[482,130],[466,380]],lg(c,0,60,0,380,[[0,"#fff08a"],[.5,"#ffcc33"],[1,"#e8960a"]]),20);
  rr(c,40,350,432,86,26,lg(c,0,350,0,436,[[0,"#ffd23d"],[1,"#d98a0b"]]),18);
  [[110,396,"#ff4a5a"],[256,396,"#3dbbff"],[402,396,"#4ed06a"]].forEach(([x,y,col])=>{ell(c,x,y,28,28,col,10);gloss(c,x-8,y-9,9,7,0,.9)});
  [[30,130],[256,60],[482,130]].forEach(p=>ell(c,p[0],p[1],24,24,"#fff",12));
  gloss(c,150,200,16,70,.5,.6);gloss(c,360,200,12,50,-.5,.5)},
heart(c){
  c.beginPath();c.moveTo(256,470);c.bezierCurveTo(30,300,60,70,256,170);c.bezierCurveTo(452,70,482,300,256,470);c.closePath();
  FS(c,lg(c,100,60,420,470,[[0,"#ff9ab8"],[.5,"#ff4a7a"],[1,"#d8204f"]]),20);gloss(c,150,170,44,26,-.7,.8);gloss(c,118,230,14,10,-.7,.7)},
tongueI(c){
  ell(c,170,300,130,98,lg(c,0,200,0,400,[[0,"#7a1a30"],[1,"#3a0a18"]]),18);
  c.beginPath();c.moveTo(190,300);c.bezierCurveTo(300,320,380,260,400,150);c.lineWidth=84;c.strokeStyle=OL;c.lineCap="round";c.stroke();c.lineWidth=54;c.strokeStyle="#ff5d8f";c.stroke();
  ell(c,400,140,56,56,"#ff3f7a",16);gloss(c,384,122,16,11,-.5,.8)},
tripleI(c){
  ell(c,110,310,92,70,lg(c,0,240,0,380,[[0,"#7a1a30"],[1,"#3a0a18"]]),16);
  [[400,90],[450,250],[400,420]].forEach(([x,y])=>{c.beginPath();c.moveTo(130,310);c.quadraticCurveTo(300,310,x,y);c.lineWidth=62;c.strokeStyle=OL;c.lineCap="round";c.stroke();c.lineWidth=36;c.strokeStyle="#ff5d8f";c.stroke();ell(c,x,y,40,40,"#ff3f7a",14)})},
mouthI(c){
  [150,362].forEach(x=>{ell(c,x,120,70,70,lg(c,0,50,0,190,[[0,"#a6e05c"],[1,"#5aa62a"]]),18)});
  ell(c,256,290,236,170,lg(c,0,120,0,460,[[0,"#a6e05c"],[1,"#5aa62a"]]),20);
  [150,362].forEach(x=>{ell(c,x,118,44,48,"#fff",12);ell(c,x+4,126,24,30,OL,0);gloss(c,x-4,112,8,10,0,.95)});
  c.beginPath();c.moveTo(70,300);c.quadraticCurveTo(256,250,442,300);c.quadraticCurveTo(420,440,256,448);c.quadraticCurveTo(92,440,70,300);c.closePath();FS(c,lg(c,0,260,0,450,[[0,"#7a1a30"],[1,"#3a0a18"]]),16);
  c.save();c.clip();ell(c,256,440,120,64,"#ff5d8f",14);gloss(c,226,418,34,10,-.2,.6);c.restore();
  gloss(c,140,236,70,14,-.2,.5);cheeks(c,58,454,360,20)}
};
module.exports={ART,names:Object.keys(ART)};
