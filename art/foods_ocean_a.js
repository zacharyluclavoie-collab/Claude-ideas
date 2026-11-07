/* fish template: faces right, centred */
const FISHB=(c,body,fin,o)=>{o=o||{};const L=o.L||170,Hh=o.H||108,cx=o.cx||256,cy=o.cy||256;
  Pg(c,[[cx-L+14,cy],[cx-L-72,cy-Hh*.7],[cx-L-44,cy],[cx-L-72,cy+Hh*.7]],fin,14);
  if(!o.nofin)Pg(c,[[cx-30,cy-Hh+14],[cx+30,cy-Hh-62],[cx+84,cy-Hh+18]],fin,12);
  Pg(c,[[cx-10,cy+Hh-14],[cx+30,cy+Hh+40],[cx+70,cy+Hh-14]],fin,12);
  E(c,cx,cy,L,Hh,body,16);
  if(o.stripes)clipEll(c,cx,cy,L,Hh,()=>{o.stripes.forEach(x=>{c.fillStyle="#fff";c.fillRect(cx+x-18,cy-Hh,36,Hh*2);c.fillStyle=OL;c.fillRect(cx+x-24,cy-Hh,7,Hh*2);c.fillRect(cx+x+17,cy-Hh,7,Hh*2)})});
  E(c,cx,cy,L,Hh,null,16);
  ell(c,cx+L*.56,cy-Hh*.16,24,26,"#fff",9);ell(c,cx+L*.6,cy-Hh*.12,12,14,OL,0);gloss(c,cx+L*.58,cy-Hh*.2,5,6,0,.95);
  smile(c,cx+L*.74,cy+Hh*.28,16,10,7);gloss(c,cx-L*.3,cy-Hh*.45,L*.34,Hh*.14,-.1,.55)};
Object.assign(ART,{
urchin(c){
  c.strokeStyle=OL;c.lineCap="round";for(let i=0;i<22;i++){const a=i/22*T;c.beginPath();c.moveTo(256+Math.cos(a)*120,256+Math.sin(a)*120);c.lineTo(256+Math.cos(a)*220,256+Math.sin(a)*220);c.lineWidth=20;c.strokeStyle=OL;c.stroke();c.lineWidth=11;c.strokeStyle="#7a3ad6";c.stroke()}
  E(c,256,256,148,148,"#9a5ae6",18);shine(c,196,196,40,16,-.7);face(c,256,268,1)},
shrimp(c){
  const sp=p=>{p.moveTo(340,150);p.bezierCurveTo(450,200,440,360,330,400);p.bezierCurveTo(250,430,170,400,130,350)};
  Pg(c,[[130,350],[50,310],[70,360],[40,420],[110,400]],"#ff8a6a",12);
  stroke2(c,sp,92,"#ff8a6a",18);
  c.save();c.lineCap="round";c.strokeStyle="rgba(150,40,20,.4)";c.lineWidth=8;[[430,230,470,220],[440,290,480,300],[400,350,432,372],[330,398,332,432],[260,408,250,440]].forEach(l=>{c.beginPath();c.moveTo(l[0],l[1]);c.lineTo(l[2],l[3]);c.stroke()});
  c.beginPath();c.moveTo(340,150);c.bezierCurveTo(450,200,440,360,330,400);c.lineWidth=20;c.strokeStyle="rgba(255,255,255,.28)";c.translate(-14,-8);c.stroke();c.restore();
  E(c,310,140,76,64,"#ff6a4a",16);
  c.strokeStyle=OL;c.lineWidth=7;c.lineCap="round";[[330,92,400,30],[300,86,330,16]].forEach(l=>{c.beginPath();c.moveTo(l[0],l[1]);c.lineTo(l[2],l[3]);c.stroke()});
  ell(c,326,128,21,23,"#fff",8);ell(c,333,132,10,12,OL,0);smile(c,350,172,14,10,7);shine(c,270,108,24,9,-.5)},
clownfish(c){FISHB(c,"#ff8a1f","#ff6a10",{stripes:[-60,40]})},
conch(c){
  c.beginPath();c.moveTo(70,380);c.bezierCurveTo(60,150,300,40,430,150);c.bezierCurveTo(470,300,330,450,170,430);c.bezierCurveTo(130,420,90,410,70,380);c.closePath();FS(c,lg(c,0,60,0,440,[[0,"#ffe6d0"],[.5,"#ffb89a"],[1,"#e8806a"]]),18);
  c.save();c.clip();c.strokeStyle="rgba(150,60,40,.5)";c.lineWidth=8;c.lineCap="round";c.beginPath();for(let t=0;t<9;t+=.1){const r=8+t*20;c.lineTo(330+Math.cos(t)*r*1.1,210+Math.sin(t)*r*.9)}c.stroke();c.restore();
  E(c,180,390,92,46,"#ff9aa8",12,-.3);shine(c,180,140,56,12,-.5)},
pearl(c){
  c.beginPath();c.moveTo(60,330);c.bezierCurveTo(60,460,190,490,256,490);c.bezierCurveTo(322,490,452,460,452,330);c.closePath();FS(c,toon(c,"#ffb3d1",330,490),16);
  c.strokeStyle="rgba(190,80,120,.5)";c.lineWidth=8;c.lineCap="round";[110,160,210,256,302,352,402].forEach((x,i)=>{c.beginPath();c.moveTo(256+(x-256)*.2,340);c.lineTo(x,i%2?458:470);c.stroke()});
  E(c,256,260,150,150,"#ffffff",16);clipEll(c,256,260,150,150,()=>{c.fillStyle="rgba(180,220,255,.45)";c.beginPath();c.ellipse(300,320,150,120,0,0,T);c.fill();c.fillStyle="rgba(255,190,230,.35)";c.beginPath();c.ellipse(200,330,110,90,0,0,T);c.fill()});
  E(c,256,260,150,150,null,16);shine(c,200,200,40,22,-.7);sparkle(c,420,110,38);sparkle(c,90,150,24,"#fff")},
seahorse(c){
  const sp=p=>{p.moveTo(300,130);p.bezierCurveTo(200,150,160,260,250,300);p.bezierCurveTo(330,340,300,420,230,440);p.bezierCurveTo(160,460,140,400,180,380)};
  stroke2(c,sp,70,"#ffc83a",18);
  c.save();c.beginPath();sp(c);c.lineWidth=70;c.strokeStyle="rgba(0,0,0,0)";c.restore();
  Pg(c,[[330,250],[430,230],[400,300],[440,340],[340,320]],"#ff9a1f",12);
  E(c,310,128,64,56,"#ffc83a",16,-.2);Pg(c,[[360,120],[470,130],[470,168],[366,160]],"#ffc83a",14);
  Pg(c,[[250,80],[290,40],[300,100]],"#ff9a1f",10);
  ell(c,312,116,19,21,"#fff",8);ell(c,318,120,9,11,OL,0);cheeks(c,330,330,152,10);
  c.strokeStyle="rgba(150,80,0,.4)";c.lineWidth=7;c.lineCap="round";[[210,230],[255,300],[258,360]].forEach(p=>{c.beginPath();c.moveTo(p[0]-30,p[1]);c.lineTo(p[0]+30,p[1]+8);c.stroke()});shine(c,290,100,20,8,-.5)},
angelfish(c){
  Pg(c,[[130,256],[40,160],[70,256],[40,352]],"#ffd23d",14);
  Pg(c,[[220,150],[300,10],[340,160]],"#ffd23d",12);Pg(c,[[220,362],[300,502],[340,352]],"#ffd23d",12);
  E(c,270,256,140,170,"#fff2a0",16,0);
  clipEll(c,270,256,140,170,()=>{[170,250,330].forEach(x=>{c.fillStyle=OL;c.fillRect(x-12,60,24,400)});c.fillStyle="rgba(255,180,0,.3)";c.fillRect(130,256,300,170)});
  E(c,270,256,140,170,null,16);ell(c,348,222,24,26,"#fff",9);ell(c,354,226,12,14,OL,0);smile(c,380,290,14,10,7);shine(c,230,150,30,14,-.7)},
coral(c){
  const br=(x,y,pts,w,col)=>stroke2(c,p=>{p.moveTo(x,y);pts.forEach(q=>p.quadraticCurveTo(q[0],q[1],q[2],q[3]))},w,col,14);
  br(256,470,[[256,350,256,250],[290,180,340,130]],66,"#ff6a8a");br(256,350,[[210,310,170,230],[150,200,120,150]],56,"#ff6a8a");br(256,300,[[320,280,380,230],[400,200,420,140]],50,"#ff8aa0");
  br(150,470,[[130,400,90,340],[80,310,70,260]],42,"#ff9ac0");br(380,470,[[400,420,440,380],[460,350,470,300]],40,"#ff9ac0");
  [[340,130],[120,150],[420,140],[256,250],[70,260],[470,300]].forEach(p=>E(c,p[0],p[1],28,24,"#ffc0d0",10));
  shine(c,236,300,10,70,.1)},
anemone(c){
  E(c,256,440,110,50,"#9a5aa8",16);R(c,166,300,180,140,40,"#b070c0",16);
  for(let i=0;i<9;i++){const x=166+i*22.5,tip=x+(i-4)*16;stroke2(c,p=>{p.moveTo(x,310);p.quadraticCurveTo(x+(i%2?-34:34),210,tip,110+Math.abs(i-4)*14)},26,i%2?"#ff7ab8":"#ff9ad0",12);E(c,tip,104+Math.abs(i-4)*14,17,17,"#ffe0f0",8)}
  face(c,256,370,.9)},
pufferfish(c){
  const r=rnd(3);for(let i=0;i<18;i++){const a=i/18*T;Pg(c,[[256+Math.cos(a-.12)*140,266+Math.sin(a-.12)*140],[256+Math.cos(a)*204,266+Math.sin(a)*204],[256+Math.cos(a+.12)*140,266+Math.sin(a+.12)*140]],"#ffcf3a",10)}
  Pg(c,[[130,270],[50,210],[70,270],[50,330]],"#ff9a1f",12);
  E(c,256,266,150,138,"#ffd84a",16);E(c,256,330,110,64,"#fff6c8",0);
  ell(c,326,230,28,30,"#fff",9);ell(c,334,234,14,16,OL,0);gloss(c,330,224,6,7,0,.95);
  ell(c,372,300,22,16,"#ff8ab0",8);cheeks(c,330,330,278,12);gloss(c,200,200,46,16,-.5,.65)},
turtle(c){
  [[100,330],[400,330],[130,430],[380,430]].forEach(p=>E(c,p[0],p[1],54,34,"#8ad06a",14,p[0]<250?-.5:.5));
  E(c,430,260,64,54,"#a0dc7a",16);ell(c,448,250,12,14,OL,0);smile(c,458,282,14,9,6);
  Pg(c,[[60,330],[30,350],[70,350]],"#8ad06a",10);
  c.beginPath();c.moveTo(70,360);c.bezierCurveTo(70,120,440,120,440,360);c.quadraticCurveTo(256,400,70,360);c.closePath();FS(c,toon(c,"#5aa83a",130,380),18);
  clipPath(c,p=>{p.moveTo(70,360);p.bezierCurveTo(70,120,440,120,440,360);p.quadraticCurveTo(256,400,70,360);p.closePath()},()=>{c.strokeStyle="rgba(30,80,20,.6)";c.lineWidth=9;[[256,200,256,360],[150,240,360,240],[110,300,400,300],[190,170,150,330],[320,170,360,330]].forEach(l=>{c.beginPath();c.moveTo(l[0],l[1]);c.lineTo(l[2],l[3]);c.stroke()});c.fillStyle="rgba(255,255,255,.18)";c.fillRect(100,140,120,40)});
  shine(c,170,190,44,12,-.6)},
kelp(c){
  [[150,"#3fae4a",150,250],[256,"#4fc255",90,420],[360,"#3fae4a",170,300]].forEach(a=>{stroke2(c,p=>{p.moveTo(a[0],490);for(let y=490;y>a[2];y-=60)p.quadraticCurveTo(a[0]+(y%120?40:-40),y-30,a[0],y-60)},22,a[1],12);
    for(let y=470;y>a[2]+40;y-=70){E(c,a[0]+(y%140?46:-46),y-20,44,18,a[1],10,(y%140?-.5:.5))}});
  shine(c,256,200,6,60,.1)},
eel(c){
  const sp=p=>{p.moveTo(70,380);p.bezierCurveTo(120,260,200,470,270,340);p.bezierCurveTo(330,230,360,330,400,220)};
  stroke2(c,sp,66,"#4fb87a",18);
  c.save();c.lineCap="round";c.beginPath();sp(c);c.lineWidth=18;c.strokeStyle="rgba(255,255,255,.28)";c.translate(-6,-12);c.stroke();c.restore();
  [[120,330],[190,420],[270,340],[340,290]].forEach(p=>E(c,p[0],p[1],11,8,"#2f8a56",5));
  E(c,410,190,70,56,"#4fb87a",16,-.3);c.beginPath();c.moveTo(440,196);c.lineTo(500,230);c.lineWidth=0;
  Pg(c,[[430,206],[490,240],[440,236]],"#7a1f2a",10);ell(c,420,168,19,21,"#fff",8);ell(c,426,172,9,11,OL,0)},
squid(c){
  [[160,330],[210,340],[256,344],[302,340],[352,330]].forEach((p,i)=>stroke2(c,q=>{q.moveTo(p[0],300);q.quadraticCurveTo(p[0]+(i-2)*14,400,p[0]+(i-2)*30+(i%2?-18:18),480)},26,"#ff7ab0",12));
  Pg(c,[[190,150],[130,60],[256,20],[382,60],[322,150]],"#ff5a98",14);
  E(c,256,230,126,150,"#ff7ab0",16);
  Pg(c,[[140,170],[60,210],[150,250]],"#ff9ad0",12);Pg(c,[[372,170],[452,210],[362,250]],"#ff9ad0",12);
  face(c,256,240,1);shine(c,206,150,30,14,-.7)},
anchor(c){
  const gr="#9aa6bc";
  stroke2(c,p=>{p.moveTo(256,150);p.lineTo(256,430)},44,gr,16);
  stroke2(c,p=>{p.moveTo(176,200);p.lineTo(336,200)},36,gr,16);
  stroke2(c,p=>{p.moveTo(90,330);p.quadraticCurveTo(110,470,256,462);p.quadraticCurveTo(402,470,422,330)},40,gr,16);
  Pg(c,[[60,300],[120,320],[96,370]],gr,12);Pg(c,[[452,300],[392,320],[416,370]],gr,12);
  c.beginPath();c.arc(256,96,50,0,T);c.lineWidth=40;c.strokeStyle=OL;c.stroke();c.lineWidth=22;c.strokeStyle=gr;c.stroke();
  gloss(c,246,300,8,90,0,.5)},
pirateship(c){
  stroke2(c,p=>{p.moveTo(256,350);p.lineTo(256,30)},18,"#8a5a2a",10);stroke2(c,p=>{p.moveTo(380,350);p.lineTo(380,100)},14,"#8a5a2a",8);
  Pg(c,[[262,60],[262,300],[420,300],[420,160]],"#ffffff",14);Pg(c,[[250,90],[250,300],[110,300],[110,170]],"#ffffff",14);Pg(c,[[388,120],[388,300],[470,300],[470,200]],"#ffffff",12);
  c.fillStyle="#e8423f";c.fillRect(120,230,130,24);c.fillRect(272,236,140,24);Pg(c,[[256,30],[320,50],[256,70]],"#e8423f",8);
  c.beginPath();c.moveTo(40,330);c.lineTo(472,330);c.quadraticCurveTo(440,460,330,480);c.lineTo(180,480);c.quadraticCurveTo(70,460,40,330);c.closePath();FS(c,toon(c,"#9a5a2a",330,480),16);
  [140,230,320,400].forEach(x=>E(c,x,390,16,16,"#ffe58a",8));
  c.strokeStyle="rgba(255,255,255,.25)";c.lineWidth=8;c.beginPath();c.moveTo(70,350);c.lineTo(440,350);c.stroke()},
shipwheel(c){
  const br="#b07838";
  for(let i=0;i<8;i++){const a=i/8*T;stroke2(c,p=>{p.moveTo(256+Math.cos(a)*40,256+Math.sin(a)*40);p.lineTo(256+Math.cos(a)*236,256+Math.sin(a)*236)},34,br,12);E(c,256+Math.cos(a)*236,256+Math.sin(a)*236,28,28,"#8a5a22",12)}
  c.beginPath();c.arc(256,256,160,0,T);c.lineWidth=52;c.strokeStyle=OL;c.stroke();c.lineWidth=30;c.strokeStyle=toon(c,br,96,416);c.stroke();
  E(c,256,256,52,52,"#ffcf3a",14);shine(c,236,236,14,8,-.7)}
});
