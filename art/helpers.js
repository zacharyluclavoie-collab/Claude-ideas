/* ---- extra helpers for the bulk food sprites (shares scope with genart.js) ---- */
const hx=h=>{h=h.replace("#","");if(h.length===3)h=h.split("").map(x=>x+x).join("");return[parseInt(h.slice(0,2),16),parseInt(h.slice(2,4),16),parseInt(h.slice(4,6),16)]};
const toHex=(r,g,b)=>"#"+[r,g,b].map(v=>Math.max(0,Math.min(255,Math.round(v))).toString(16).padStart(2,"0")).join("");
const mix=(a,b,t)=>{const A=hx(a),B=hx(b);return toHex(A[0]+(B[0]-A[0])*t,A[1]+(B[1]-A[1])*t,A[2]+(B[2]-A[2])*t)};
const lite=(a,t)=>mix(a,"#ffffff",t),dark=(a,t)=>mix(a,"#1a1030",t);
const toon=(c,a,y0,y1)=>(!a||a[0]!=="#")?a:lg(c,0,y0,0,y1,[[0,lite(a,.38)],[.5,a],[1,dark(a,.3)]]);
const toonD=(c,a,x0,y0,x1,y1)=>(!a||a[0]!=="#")?a:lg(c,x0,y0,x1,y1,[[0,lite(a,.4)],[.5,a],[1,dark(a,.3)]]);
const rnd=seed=>{let a=seed|0;return()=>{a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}};
/* toon-shaded primitives: base colour in, light-to-dark gradient out */
const E=(c,x,y,rx,ry,a,lw,rot)=>{c.beginPath();c.ellipse(x,y,rx,ry,rot||0,0,T);FS(c,toon(c,a,y-ry,y+ry),lw)};
const R=(c,x,y,w,h,r,a,lw)=>{rr(c,x,y,w,h,r,toon(c,a,y,y+h),lw)};
const Pg=(c,p,a,lw)=>{let lo=1e9,hi=-1e9;p.forEach(q=>{lo=Math.min(lo,q[1]);hi=Math.max(hi,q[1])});poly(c,p,toon(c,a,lo,hi),lw)};
const Bz=(c,fn,a,y0,y1,lw)=>{c.beginPath();fn(c);FS(c,toon(c,a,y0,y1),lw)};
const face=(c,x,y,s,look)=>{eyes(c,x-30*s,x+30*s,y,12*s,look||0);smile(c,x,y+26*s,16*s,14*s,Math.max(6,8*s));cheeks(c,x-52*s,x+52*s,y+22*s,12*s)};
const faceS=(c,x,y,s)=>{[-1,1].forEach(k=>{c.beginPath();c.arc(x+k*28*s,y,9*s,Math.PI*1.1,Math.PI*1.9);c.lineWidth=Math.max(6,8*s);c.strokeStyle=OL;c.lineCap="round";c.stroke()});smile(c,x,y+18*s,14*s,12*s,Math.max(6,8*s));cheeks(c,x-50*s,x+50*s,y+14*s,11*s)};
const starP=(c,x,y,R1,R2,n,rot)=>{c.beginPath();for(let i=0;i<n*2;i++){const a=(rot||-Math.PI/2)+i*Math.PI/n,r=i%2?R2:R1;c.lineTo(x+Math.cos(a)*r,y+Math.sin(a)*r)}c.closePath()};
const heartP=(c,x,y,s)=>{c.beginPath();c.moveTo(x,y+s*.55);c.bezierCurveTo(x-s*1.1,y-s*.1,x-s*.55,y-s*.9,x,y-s*.3);c.bezierCurveTo(x+s*.55,y-s*.9,x+s*1.1,y-s*.1,x,y+s*.55);c.closePath()};
const drop=(c,x,y,w,h)=>{c.beginPath();c.moveTo(x,y-h);c.bezierCurveTo(x+w*.2,y-h*.4,x+w,y-h*.1,x+w*.8,y+h*.35);c.bezierCurveTo(x+w*.6,y+h*.9,x-w*.6,y+h*.9,x-w*.8,y+h*.35);c.bezierCurveTo(x-w,y-h*.1,x-w*.2,y-h*.4,x,y-h);c.closePath()};
const smooth=(c,pts,closed)=>{const n=pts.length;c.moveTo(pts[0][0],pts[0][1]);for(let i=0;i<(closed?n:n-1);i++){const p0=pts[(i-1+n)%n],p1=pts[i],p2=pts[(i+1)%n],p3=pts[(i+2)%n];
  const a=closed||i>0?p0:p1,d=closed||i<n-2?p3:p2;c.bezierCurveTo(p1[0]+(p2[0]-a[0])/6,p1[1]+(p2[1]-a[1])/6,p2[0]-(d[0]-p1[0])/6,p2[1]-(d[1]-p1[1])/6,p2[0],p2[1])}if(closed)c.closePath()};
const stroke2=(c,fn,w,col,lw)=>{c.lineCap="round";c.lineJoin="round";c.beginPath();fn(c);c.lineWidth=w+(lw==null?16:lw);c.strokeStyle=OL;c.stroke();c.lineWidth=w;c.strokeStyle=col;c.stroke()};
const sprinkles=(c,fn,n,seed,cols)=>{const r=rnd(seed);c.save();c.beginPath();fn(c);c.clip();for(let i=0;i<n;i++){const x=40+r()*430,y=40+r()*430;c.save();c.translate(x,y);c.rotate(r()*3.14);c.beginPath();c.moveTo(-9,0);c.lineTo(9,0);c.lineWidth=7;c.lineCap="round";c.strokeStyle=cols[i%cols.length];c.stroke();c.restore()}c.restore()};
const dots=(c,pts,r,col,lw)=>pts.forEach(p=>{c.beginPath();c.arc(p[0],p[1],r,0,T);FS(c,col,lw==null?0:lw)});
const shine=(c,x,y,rx,ry,rot)=>gloss(c,x,y,rx,ry,rot==null?-.6:rot,.75);
const clipEll=(c,x,y,rx,ry,fn)=>{c.save();c.beginPath();c.ellipse(x,y,rx,ry,0,0,T);c.clip();fn();c.restore()};
const clipPath=(c,pathFn,fn)=>{c.save();c.beginPath();pathFn(c);c.clip();fn();c.restore()};
