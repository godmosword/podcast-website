# 美術審 L7：Landing 首段橫版左上補遠景——用同一套 hero-parallax 黏土 props（不生圖）。
# v2（設計審後）：遠景一律比原圖中景灌木更淡更霧（haze 拉高、飽和 ≤1.0、摩天輪 blur 1.4）；
# 底部淡出改成垂直漸層×群組兩端橫向 taper 再整張高斯模糊，消掉齊頭霧線；整組右移 25px 離開氣球區、
# 摩天輪 250→225 拉開與右側主輪的尺度差。
#   python3 compose-distant-park.py <原稿.jpg> <l1-props.webp> <l2-props.webp> <輸出.jpg>
import sys
from PIL import Image, ImageFilter, ImageEnhance, ImageDraw, ImageChops
src,l1p,l2p,out=sys.argv[1:5]; SKY=(250,239,221)
base=Image.open(src).convert('RGBA')
l1=Image.open(l1p).convert('RGBA'); l2=Image.open(l2p).convert('RGBA')
def piece(sheet,x0,x1,y0,y1): return sheet.crop((x0,y0,x1,y1))
def haze(img,amount,blur,sat):
    rgb=img.convert('RGB'); a=img.split()[3]
    rgb=Image.blend(rgb,Image.new('RGB',rgb.size,SKY),amount)
    rgb=ImageEnhance.Color(rgb).enhance(sat)
    return Image.merge('RGBA',(*rgb.split(),a)).filter(ImageFilter.GaussianBlur(blur))
def put(c,img,x,base_y,h):
    s=h/img.height; img=img.resize((round(img.width*s),h),Image.LANCZOS); c.alpha_composite(img,(x,base_y-h))
wheel=piece(l1,120,317,4,264); tree_big=piece(l1,1178,1317,62,264); tree_pair=piece(l1,1673,1800,131,264)
bush=piece(l2,120,298,80,217); bush2=piece(l2,532,685,77,217)
layer=Image.new('RGBA',base.size,(0,0,0,0)); H=428; DX=25
put(layer, haze(wheel,0.36,1.4,0.9), 165, H, 225)
put(layer, haze(tree_big,0.34,0.7,0.98), 308+DX, H, 168)
put(layer, haze(tree_pair,0.34,0.7,0.98), 418+DX, H-2, 130)
for i,(x,h) in enumerate([(180,66),(255,74),(335,68),(412,74)]):
    put(layer, haze(bush if i%2==0 else bush2,0.28,0.5,1.0), x+DX, H+22, h)
# 底部淡出（設計審 #2）：垂直 H-70 → H+60 線性到 0，再乘上群組左右兩端的橫向 taper，
# 整張 mask 高斯模糊 16px——不再是一條齊頭霧線，而是群組底部各自沒入地面霧氣。
fade=Image.new('L',base.size,255); d=ImageDraw.Draw(fade); top,bot=H-70,H+60
for y in range(top,bot+1): d.line([(0,y),(base.width,y)],fill=int(255*(1-(y-top)/(bot-top))))
d.rectangle([0,bot,base.width,base.height],fill=0)
taper=Image.new('L',base.size,0); dt=ImageDraw.Draw(taper)
for x in range(140,600):
    v=255 if 190<=x<=540 else int(255*((x-140)/50 if x<190 else (600-x)/60))
    dt.line([(x,0),(x,base.height)],fill=v)
fade=ImageChops.multiply(fade,taper).filter(ImageFilter.GaussianBlur(16))
layer.putalpha(ImageChops.multiply(layer.split()[3],fade))
ImageDraw.Draw(layer).rectangle([40,330,165,440],fill=(0,0,0,0))  # 氣球區保留原圖
c=base.copy(); c.alpha_composite(layer); c.convert('RGB').save(out,quality=88)
print("wrote",out)
