"""Edge-aware cleanup + upscale for small cartoon sprites.
Usage: python3 art/upscale.py in_dir out_dir [scale]
Flattens compression noise, keeps the dark outline crisp and makes a smooth silhouette."""
import sys, os
import numpy as np, cv2   # pip install opencv-python-headless numpy pillow
from PIL import Image

def smoothstep(a,b,x):
    t=np.clip((x-a)/(b-a),0,1);return t*t*(3-2*t)

def bleed(rgb,alpha):
    """fill transparent pixels with nearby opaque colour so scaling does not drag in black/grey fringes"""
    m=(alpha>200).astype(np.uint8)
    out=rgb.copy()
    for _ in range(6):
        k=cv2.dilate(out*m[...,None],np.ones((3,3),np.uint8))
        cnt=cv2.dilate(m,np.ones((3,3),np.uint8))
        grow=(cnt>0)&(m==0)
        # average of opaque neighbours
        s=cv2.boxFilter((out*m[...,None]).astype(np.float32),-1,(3,3),normalize=False)
        c=cv2.boxFilter(m.astype(np.float32),-1,(3,3),normalize=False)
        avg=(s/np.maximum(c,1)[...,None]).astype(np.uint8)
        out[grow]=avg[grow];m=(m|grow.astype(np.uint8))
    return out

def upscale(im,scale=4,outline=(29,36,22)):
    im=im.convert('RGBA');a=np.array(im)
    rgb=a[...,:3].copy();al=a[...,3]
    rgb=bleed(rgb,al)
    h,w=al.shape
    H,W=h*scale,w*scale
    big=cv2.resize(rgb,(W,H),interpolation=cv2.INTER_LANCZOS4)
    ab=cv2.resize(al,(W,H),interpolation=cv2.INTER_CUBIC).astype(np.float32)/255
    # crisp, smooth silhouette
    ab=cv2.GaussianBlur(ab,(0,0),scale*0.32)
    ab=smoothstep(0.55,0.70,ab)
    # flatten noise but keep edges
    big=cv2.bilateralFilter(big,9,14,8)
    big=cv2.medianBlur(big,5)
    big=cv2.bilateralFilter(big,9,10,8)
    # crisp the dark outlines: pull dark pixels toward the outline colour with a hard-ish ramp
    f=big.astype(np.float32)
    lum=0.299*f[...,0]+0.587*f[...,1]+0.114*f[...,2]
    w_=smoothstep(58,92,lum)[...,None]
    f=np.array(outline,np.float32)*(1-w_)+f*w_
    # unsharp mask for interior detail
    bl=cv2.GaussianBlur(f,(0,0),scale*0.9)
    f=np.clip(f+0.35*(f-bl),0,255)
    out=np.dstack([f.astype(np.uint8),(ab*255).astype(np.uint8)])
    return Image.fromarray(out,'RGBA')


if __name__=='__main__':
    src,dst=sys.argv[1],sys.argv[2];sc=int(sys.argv[3]) if len(sys.argv)>3 else 3
    os.makedirs(dst,exist_ok=True)
    for f in sorted(os.listdir(src)):
        if f.lower().endswith('.png'):
            upscale(Image.open(os.path.join(src,f)),sc).save(os.path.join(dst,f));print(f)
