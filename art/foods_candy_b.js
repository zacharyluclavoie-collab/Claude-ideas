Object.assign(ART,{
gumdrop(c){
  c.beginPath();c.moveTo(80,410);c.bezierCurveTo(70,160,190,80,256,80);c.bezierCurveTo(322,80,442,160,432,410);c.quadraticCurveTo(256,450,80,410);c.closePath();FS(c,toon(c,"#ff6aa8",80,440),18);
  sprinkles(c,p=>{p.moveTo(80,410);p.bezierCurveTo(70,160,190,80,256,80);p.bezierCurveTo(322,80,442,160,432,410);p.quadraticCurveTo(256,450,80,410)},0,1,[]);
  const r=rnd(7);c.save();c.beginPath();c.moveTo(80,410);c.bezierCurveTo(70,160,190,80,256,80);c.bezierCurveTo(322,80,442,160,432,410);c.quadraticCurveTo(256,450,80,410);c.clip();for(let i=0;i<70;i++){c.beginPath();c.arc(90+r()*330,90+r()*340,4+r()*3,0,T);c.fillStyle="rgba(255,255,255,.75)";c.fill()}c.restore();
  shine(c,170,170,40,18,-.9);face(c,256,290,1.1)},
jellybean(c){
  [[190,350,122,76,"#ff5a5a",.45],[336,312,122,76,"#ffd23d",-.5],[256,186,128,78,"#7cdc4a",.08]].forEach(a=>{E(c,a[0],a[1],a[2],a[3],a[4],16,a[5]);gloss(c,a[0]-a[2]*.35,a[1]-a[3]*.35,a[2]*.3,a[3]*.16,a[5],.7)});
  face(c,256,196,.55)},
chocostrawberry(c){
  const body=p=>{p.moveTo(256,470);p.bezierCurveTo(60,330,100,150,256,170);p.bezierCurveTo(412,150,452,330,256,470)};
  c.beginPath();body(c);FS(c,toon(c,"#e8233a",150,470),18);
  clipPath(c,body,()=>{c.beginPath();c.moveTo(0,0);c.lineTo(512,0);c.lineTo(512,300);for(let x=512;x>=0;x-=48){c.quadraticCurveTo(x-12,340,x-24,300);c.quadraticCurveTo(x-36,260,x-48,300)}c.closePath();c.fillStyle=toon(c,"#6a3a1a",150,330);c.fill()});
  c.beginPath();body(c);FS(c,null,18);
  c.strokeStyle="#fff";c.lineWidth=9;c.lineCap="round";[[150,220,200,250],[230,200,290,240],[320,214,372,246]].forEach(l=>{c.beginPath();c.moveTo(l[0],l[1]);c.lineTo(l[2],l[3]);c.stroke()});
  Pg(c,[[256,182],[140,120],[210,150],[256,60],[302,150],[372,120]],"#4fb23a",14);shine(c,170,250,24,12,-.8);face(c,256,360,.8)},
muffin(c){
  c.beginPath();c.moveTo(120,300);c.lineTo(392,300);c.lineTo(350,462);c.lineTo(162,462);c.closePath();FS(c,toon(c,"#7ec8ff",300,462),16);
  c.strokeStyle="rgba(255,255,255,.7)";c.lineWidth=10;[160,210,256,302,352].forEach(x=>{c.beginPath();c.moveTo(x-8+(x-256)*.08,310);c.lineTo(x+(x-256)*.1,456);c.stroke()});
  E(c,256,230,210,128,"#d9a05b",18);E(c,256,180,150,70,"#e8b66a",12);
  [[160,210],[256,160],[340,220],[210,260],[300,270]].forEach(p=>E(c,p[0],p[1],20,14,"#5a3418",7,.4));
  shine(c,170,160,50,14,-.5)},
eclair(c){
  R(c,66,230,380,120,60,"#e8b66a",16);R(c,80,290,352,50,25,"#fff0c0",12);
  R(c,66,160,380,110,54,"#6a3a1a",16);
  c.strokeStyle="#fff";c.lineWidth=11;c.lineCap="round";c.beginPath();c.moveTo(110,210);c.lineTo(160,180);c.lineTo(210,220);c.lineTo(260,180);c.lineTo(310,220);c.lineTo(360,180);c.lineTo(410,210);c.stroke();
  shine(c,150,190,44,10,0);face(c,256,326,.8)},
cinnamonroll(c){
  E(c,256,282,214,170,"#e0a050",18);
  const sp=p=>{for(let t=0;t<14;t+=.15){const r=14+t*13;p.lineTo(256+Math.cos(t)*r*1.15,276+Math.sin(t)*r*.88)}};
  c.save();c.beginPath();c.ellipse(256,282,214,170,0,0,T);c.clip();c.beginPath();sp(c);c.lineWidth=22;c.strokeStyle="#9a5a22";c.lineCap="round";c.stroke();c.beginPath();sp(c);c.lineWidth=8;c.strokeStyle="rgba(255,220,160,.7)";c.stroke();c.restore();
  c.save();c.beginPath();c.ellipse(256,282,214,170,0,0,T);c.clip();c.strokeStyle="#fff";c.lineWidth=14;c.lineCap="round";[[130,150,200,220],[230,120,260,200],[330,140,372,214],[180,360,246,320],[300,380,360,330]].forEach(l=>{c.beginPath();c.moveTo(l[0],l[1]);c.lineTo(l[2],l[3]);c.stroke()});c.restore();
  E(c,256,282,214,170,null,18);shine(c,150,190,40,12,-.6);face(c,256,296,.7)},
honeypot(c){
  c.beginPath();c.moveTo(130,200);c.bezierCurveTo(40,300,80,450,256,460);c.bezierCurveTo(432,450,472,300,382,200);c.closePath();FS(c,toon(c,"#e8a828",200,460),18);
  E(c,256,196,134,40,"#ffcf3a",14);
  Bz(c,p=>{p.moveTo(150,196);p.quadraticCurveTo(160,260,176,236);p.quadraticCurveTo(190,300,210,226);p.lineTo(300,226);p.quadraticCurveTo(320,320,338,230);p.quadraticCurveTo(350,270,362,198);p.closePath()},"#ffb300",196,320,10);
  R(c,176,300,160,86,18,"#fff6d0",10);drop(c,256,340,24,22);c.fillStyle="#ffb300";c.fill();
  E(c,256,150,30,30,"#e8a828",0);shine(c,150,320,18,56,.2)},
popcorn(c){
  [[150,150,52],[256,110,58],[360,150,52],[206,190,50],[310,190,50],[256,170,52],[110,208,44],[404,208,44]].forEach(p=>{E(c,p[0],p[1],p[2],p[2]*.9,"#fff3c4",12);E(c,p[0]+p[2]*.2,p[1]+p[2]*.25,p[2]*.45,p[2]*.35,"#ffd870",0)});
  c.beginPath();c.moveTo(110,230);c.lineTo(402,230);c.lineTo(366,466);c.lineTo(146,466);c.closePath();FS(c,"#ffffff",16);
  clipPath(c,p=>{p.moveTo(110,230);p.lineTo(402,230);p.lineTo(366,466);p.lineTo(146,466);p.closePath()},()=>{c.fillStyle=toon(c,"#e8423f",230,466);for(let i=0;i<5;i++){c.beginPath();c.moveTo(110+i*58,230);c.lineTo(110+i*58+29,230);c.lineTo(146+i*44+22,466);c.lineTo(146+i*44-6,466);c.fill()}});
  c.beginPath();c.moveTo(110,230);c.lineTo(402,230);c.lineTo(366,466);c.lineTo(146,466);c.closePath();FS(c,null,16);face(c,256,350,.9)},
croissant(c){
  const segs=[[-170,60,76,.0],[-10,60,76,.0],[-130,92,100,0],[-50,92,100,0],[-90,112,130,0]];
  segs.forEach((a,k)=>{const ang=a[0]*Math.PI/180,cx=256+Math.cos(ang)*185,cy=372+Math.sin(ang)*205;c.save();c.translate(cx,cy);c.rotate(ang+Math.PI/2);E(c,0,0,a[1],a[2],k<2?"#d98f30":k<4?"#e8a640":"#f0b650",16);
    c.strokeStyle="rgba(150,80,10,.35)";c.lineWidth=7;c.lineCap="round";c.beginPath();c.moveTo(-a[1]*.5,-a[2]*.4);c.quadraticCurveTo(0,-a[2]*.1,a[1]*.5,-a[2]*.4);c.stroke();c.beginPath();c.moveTo(-a[1]*.55,a[2]*.1);c.quadraticCurveTo(0,a[2]*.35,a[1]*.55,a[2]*.1);c.stroke();c.restore()});
  shine(c,226,130,34,11,-.15);face(c,256,176,.62)},
pudding(c){
  E(c,256,440,196,40,"#ffffff",14);
  c.beginPath();c.moveTo(130,430);c.lineTo(160,200);c.quadraticCurveTo(256,150,352,200);c.lineTo(382,430);c.quadraticCurveTo(256,470,130,430);c.closePath();FS(c,toon(c,"#ffe08a",180,460),16);
  c.beginPath();c.moveTo(160,200);c.quadraticCurveTo(256,150,352,200);c.quadraticCurveTo(340,250,310,236);c.quadraticCurveTo(290,290,262,238);c.quadraticCurveTo(230,300,206,240);c.quadraticCurveTo(176,260,160,200);c.closePath();FS(c,toon(c,"#8a4a1a",150,290),12);
  E(c,256,160,24,22,"#e8233a",9);shine(c,196,330,16,60,.1);face(c,256,350,.85)},
bubbletea(c){
  stroke2(c,p=>{p.moveTo(300,170);p.lineTo(350,40)},26,"#ff8ec4",12);
  c.beginPath();c.moveTo(130,160);c.lineTo(382,160);c.lineTo(350,466);c.quadraticCurveTo(256,490,162,466);c.closePath();FS(c,"rgba(235,248,255,.8)",16);
  clipPath(c,p=>{p.moveTo(136,200);p.lineTo(376,200);p.lineTo(348,462);p.quadraticCurveTo(256,486,164,462);p.closePath()},()=>{c.fillStyle=lg(c,0,200,0,480,[[0,"#d8a878"],[1,"#8a5a3a"]]);c.fillRect(100,200,320,300)});
  [[190,440],[240,448],[290,444],[340,436],[215,410],[270,414],[320,408]].forEach(p=>E(c,p[0],p[1],20,20,"#2a1810",7));
  Bz(c,p=>{p.moveTo(118,160);p.bezierCurveTo(118,100,190,70,256,70);p.bezierCurveTo(322,70,394,100,394,160);p.closePath()},"#ffffff",70,160,14);
  gloss(c,160,320,14,80,.1,.6);face(c,256,306,.95)},
weddingcake(c){
  R(c,60,350,392,120,34,"#ffffff",16);R(c,106,236,300,120,30,"#fff2f8",16);R(c,156,134,200,110,28,"#ffffff",16);
  [[60,350],[106,236],[156,134]].forEach((a,i)=>{const w=[392,300,200][i];c.strokeStyle="#ff8ec4";c.lineWidth=12;c.lineCap="round";c.beginPath();c.moveTo(a[0]+16,a[1]+34);for(let x=a[0]+16;x<a[0]+w-16;x+=30)c.quadraticCurveTo(x+15,a[1]+54,x+30,a[1]+34);c.stroke()});
  dots(c,[[110,420],[170,420],[256,420],[340,420],[400,420],[160,300],[256,306],[352,300]],10,"#ffd0e6",6);
  heartP(c,256,98,36);FS(c,toon(c,"#ff5d8f",60,140),12);face(c,256,194,.6)}
});
