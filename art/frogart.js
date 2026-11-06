/* Brand-new hero frog: 1000x790, three poses. Layered gradients, soft inner shading on whole silhouettes, rim light, glossy eyes. */
const OL="#1d2416",T=Math.PI*2,W=1000,H=790;
const G={hi:"#bcff4a",l:"#8cf02a",m:"#5cd01c",d:"#37a016",dd:"#237810",bl:"#fff8d2",bd:"#f1d98a"};
const lg=(c,x0,y0,x1,y1,st)=>{const g=c.createLinearGradient(x0,y0,x1,y1);st.forEach(s=>g.addColorStop(s[0],s[1]));return g};
const rgd=(c,x,y,r0,x2,y2,r1,st)=>{const g=c.createRadialGradient(x,y,r0,x2,y2,r1);st.forEach(s=>g.addColorStop(s[0],s[1]));return g};
const E=(x,y,rx,ry,rot)=>{const p=new Path2D();p.ellipse(x,y,rx,ry,rot||0,0,T);return p};
const P=fn=>{const p=new Path2D();fn(p);return p};
function layer(fillStyle,u,blur,dx,dy){ // a soft mask layer limited to silhouette u
  const o=document.createElement("canvas");o.width=W;o.height=H;const g=o.getContext("2d");
  g.fillStyle=fillStyle;g.fillRect(0,0,W,H);g.globalCompositeOperation="destination-out";g.filter="blur("+blur+"px)";g.translate(dx||0,dy||0);g.fill(u);return o}
/* union of shapes with one clean outer outline and whole-body shading */
function union(c,paths,fill,lw,shade){
  const u=new Path2D();paths.forEach(p=>u.addPath(p));
  c.save();c.lineJoin="round";c.lineCap="round";c.strokeStyle=OL;c.lineWidth=lw*2;c.stroke(u);c.fillStyle=fill;c.fill(u);
  if(shade){c.save();c.clip(u);
    c.drawImage(layer("rgba(22,84,10,.55)",u,26),0,0);
    c.drawImage(layer("rgba(225,255,140,.42)",u,12,26,30),0,0);
    c.restore()}
  c.restore();return u}
function glossE(c,x,y,rx,ry,rot,a,blur){c.save();if(blur)c.filter="blur("+blur+"px)";c.beginPath();c.ellipse(x,y,rx,ry,rot||0,0,T);c.fillStyle="rgba(255,255,255,"+a+")";c.fill();c.restore()}
function blush(c,x,y,rx,ry,a){c.save();c.translate(x,y);c.scale(1,ry/rx);const g=c.createRadialGradient(0,0,0,0,0,rx);g.addColorStop(0,"rgba(255,170,190,"+a+")");g.addColorStop(.6,"rgba(255,120,160,"+a*.55+")");g.addColorStop(1,"rgba(255,120,160,0)");c.fillStyle=g;c.beginPath();c.arc(0,0,rx,0,T);c.fill();c.restore()}
function spot(c,x,y,r,a){c.save();c.beginPath();c.ellipse(x,y,r,r*.8,0,0,T);c.fillStyle="rgba(40,110,20,"+a+")";c.fill();c.beginPath();c.ellipse(x-r*.25,y-r*.3,r*.4,r*.26,0,0,T);c.fillStyle="rgba(255,255,255,.16)";c.fill();c.restore()}

function frog(c,pose){
  c.clearRect(0,0,W,H);c.save();c.translate(500,H-6);c.scale(.93,.93);c.translate(-500,-(H-6)-8);c.lineJoin="round";c.lineCap="round";
  const body=lg(c,0,180,0,760,[[0,G.l],[.5,G.m],[1,G.d]]);
  /* hind legs and feet */
  [-1,1].forEach(s=>{const cx=500+s*300;
    union(c,[E(cx+s*22,738,128,46)],lg(c,0,690,0,785,[[0,G.m],[1,G.dd]]),13,false);
    [-1,0,1].forEach(k=>union(c,[E(cx+s*(124+k*56),752+Math.abs(k)*6,38,30)],lg(c,0,720,0,785,[[0,G.m],[1,G.dd]]),11,false));
    union(c,[E(cx+s*22,606,170,126,s*-.35)],rgd(c,cx-s*40,545,10,cx,610,230,[[0,G.l],[.55,G.m],[1,G.d]]),14,true);
    glossE(c,cx-s*30,538,62,24,s*-.5,.4,5)});
  /* torso */
  union(c,[E(500,596,296,168)],body,15,true);
  /* belly */
  c.save();c.beginPath();c.ellipse(500,646,200,108,0,0,T);c.fillStyle=lg(c,0,540,0,760,[[0,G.bl],[1,G.bd]]);c.fill();c.lineWidth=7;c.strokeStyle="rgba(150,110,30,.45)";c.stroke();
  c.clip();c.strokeStyle="rgba(150,110,30,.16)";c.lineWidth=7;for(let k=1;k<4;k++){c.beginPath();c.ellipse(500,630+k*20,176-k*14,70,0,.25,Math.PI-.25);c.stroke()}
  glossE(c,430,598,110,20,-.1,.55,4);c.restore();
  /* front arms and hands */
  [-1,1].forEach(s=>{const x=500+s*170;
    const arm=P(p=>{p.moveTo(x-s*40,548);p.quadraticCurveTo(x-s*74,640,x-s*40,716);p.lineTo(x+s*42,714);p.quadraticCurveTo(x+s*72,630,x+s*38,548);p.closePath()});
    union(c,[arm],lg(c,x-70,0,x+70,0,[[s>0?1:0,G.m],[s>0?0:1,G.l]]),13,false);
    [-1,0,1].forEach(k=>union(c,[E(x+k*40+s*2,742,28,24)],G.m,10,false));
    union(c,[E(x,716,62,34)],lg(c,0,690,0,745,[[0,G.m],[1,G.d]]),12,false)});
  /* head with eye bumps (and puffed cheeks when chewing) */
  const heads=[E(500,336,380,214),E(322,170,116,110),E(678,170,116,110)];
  if(pose==="chew")heads.push(E(176,408,116,100),E(824,408,116,100));
  union(c,heads,rgd(c,380,150,20,500,380,540,[[0,G.hi],[.35,G.l],[.75,G.m],[1,G.d]]),16,true);
  /* freckles */
  [[262,296,22],[740,296,20],[412,250,14],[598,246,16],[214,364,13],[788,360,14],[500,214,12]].forEach(p=>spot(c,p[0],p[1],p[2],.3));
  [[300,590,18],[700,594,16],[236,624,12],[770,632,12]].forEach(p=>spot(c,p[0],p[1],p[2],.26));
  /* eyes */
  [-1,1].forEach(s=>{const x=500+s*178,y=172;
    if(pose==="chew"){c.beginPath();c.arc(x,y+16,62,Math.PI*1.12,Math.PI*1.88);c.lineWidth=20;c.strokeStyle=OL;c.stroke();return}
    c.beginPath();c.ellipse(x,y,86,92,0,0,T);c.fillStyle=rgd(c,x-20,y-30,10,x,y,100,[[0,"#ffffff"],[1,"#e6eedc"]]);c.fill();c.lineWidth=13;c.strokeStyle=OL;c.stroke();
    c.save();c.beginPath();c.ellipse(x,y,86,92,0,0,T);c.clip();
    c.beginPath();c.ellipse(x+s*4,y+14,56,62,0,0,T);c.fillStyle=rgd(c,x-8,y-8,6,x+s*4,y+14,66,[[0,"#4a5a3a"],[.35,"#1d2416"],[1,"#080c06"]]);c.fill();
    c.fillStyle="rgba(30,100,15,.26)";c.fillRect(x-100,y-100,200,60);
    c.restore();
    c.beginPath();c.arc(x-20,y-22,23,0,T);c.fillStyle="#fff";c.fill();
    c.beginPath();c.arc(x+22,y+40,10,0,T);c.fillStyle="rgba(255,255,255,.9)";c.fill();
    c.beginPath();c.arc(x+s*10-4,y+16,6,0,T);c.fillStyle="rgba(255,255,255,.35)";c.fill()});
  /* nostrils + cheeks */
  [-1,1].forEach(s=>{c.beginPath();c.ellipse(500+s*34,296,9,6,0,0,T);c.fillStyle="rgba(24,70,10,.65)";c.fill()});
  blush(c,236,398,72,44,.85);blush(c,764,398,72,44,.85);
  if(pose==="chew"){blush(c,160,424,60,46,.85);blush(c,840,424,60,46,.85)}
  /* mouth */
  if(pose==="open"){
    c.beginPath();c.moveTo(300,388);c.quadraticCurveTo(500,326,700,388);c.quadraticCurveTo(690,590,500,602);c.quadraticCurveTo(310,590,300,388);c.closePath();
    c.fillStyle=lg(c,0,360,0,600,[[0,"#8a1f3a"],[1,"#3e0a1a"]]);c.fill();c.lineWidth=14;c.strokeStyle=OL;c.stroke();
    c.save();c.clip();c.beginPath();c.ellipse(500,604,190,98,0,0,T);c.fillStyle=lg(c,0,510,0,630,[[0,"#ff7aa6"],[1,"#e83f78"]]);c.fill();c.lineWidth=10;c.strokeStyle="rgba(120,10,50,.55)";c.stroke();
    c.beginPath();c.moveTo(500,540);c.lineTo(500,594);c.lineWidth=8;c.strokeStyle="rgba(150,20,60,.55)";c.stroke();
    glossE(c,440,556,60,12,-.15,.55,3);c.restore();
  }else if(pose==="chew"){
    c.beginPath();c.moveTo(372,414);c.quadraticCurveTo(436,456,500,418);c.quadraticCurveTo(564,456,628,414);c.lineWidth=15;c.strokeStyle=OL;c.stroke()
  }else{
    c.beginPath();c.moveTo(330,402);c.quadraticCurveTo(500,512,670,402);c.lineWidth=15;c.strokeStyle=OL;c.stroke();
    c.beginPath();c.moveTo(330,402);c.lineTo(312,386);c.moveTo(670,402);c.lineTo(688,386);c.lineWidth=11;c.stroke()
  }
  c.restore()
}
module.exports={frog};
