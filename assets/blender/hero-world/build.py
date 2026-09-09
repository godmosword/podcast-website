"""重建原創微型樂園（v3 定稿）。Blender 4.5 LTS：blender -b --python assets/blender/hero-world/build.py

這支腳本是上線資產唯一的來源：v3 的色彩、roughness、暖窗自發光、接觸陰影
（COLOR_0）與地面高低差都在這裡定義，不再由任何後製腳本改寫既有 GLB。
輸出 raw GLB 後由 `npm run optimize:hero-world` 產生 public/models/hero-world/v3。

可選參數（`blender -b --python build.py -- --preview`）：另外算一張 Cycles 預覽圖
到 export/preview.png。上線 poster 由 scripts/render-hero-posters.mjs 以正式 R3F
場景輸出，Cycles 圖只是編輯來源的參考，不進 public/，也不覆蓋 v2 的既有 master。
"""
import bpy, json, math, os, random, sys
from hashlib import sha256
from mathutils import Vector
from pathlib import Path
ROOT = Path(__file__).resolve().parents[3]
OUT = ROOT / 'assets/blender/hero-world/export'
PROD = ROOT / 'public/models/hero-world/v3'
RENDER_PREVIEW = '--preview' in sys.argv
OUT.mkdir(parents=True, exist_ok=True)
PROD.mkdir(parents=True, exist_ok=True)
# The scene is currently authored without stochastic geometry, but keeping a
# documented seed makes future procedural additions reproducible.
BUILD_SEED = 20260906
random.seed(BUILD_SEED)
bpy.context.scene['build_seed'] = BUILD_SEED
bpy.context.scene['blender_version'] = '.'.join(str(v) for v in bpy.app.version)
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
for item in list(bpy.data.materials): bpy.data.materials.remove(item)
M = {}
# 色值在線性色彩空間；柔霧陶土質感不依賴 Blender 專屬材質節點。
# v3 定稿的世界色與 roughness。這組數值原本由 scripts/polish-hero-world.mjs 在
# 匯出後改寫 GLB，現在回到唯一來源，讓 v3 可以從 .blend／build.py 乾淨重建。
WORLD_PALETTE = dict(
    sand=(.43,.29,.19), grass=(.30,.43,.26), road=(.43,.34,.26), ivory=(.83,.76,.61),
    cream=(.72,.57,.38), red=(.58,.14,.095), pink=(.72,.33,.28), blue=(.10,.30,.32),
    sky=(.30,.52,.53), yellow=(.85,.53,.17), wood=(.25,.14,.08), leaf=(.26,.42,.29),
    mint=(.16,.32,.22), paving=(.61,.47,.33), warmglass=(.94,.49,.13), dark=(.025,.037,.03),
    # 小紅的車殼與屋瓦不共用同一個紅。定裝照（public/characters/小紅賽車.jpg）
    # 是飽和正紅，而 `red` 是赭紅——共用時車子會變成鮭魚色，認不出是同一台車。
    car_red=(.80,.022,.012), car_white=(.95,.93,.88), car_eye=(.03,.13,.55))
# 有了程序式環境光（components/landing/hero-world/WorldEnvironment.tsx）之後，
# roughness 的差異才真的看得出來。舊表七個值全擠在 .58–.96、其餘一律 .86，
# 等於整個世界同一種表面。這裡把「軟陶土（車殼、屋瓦）」與「粗糙地面」拉開，
# 玻璃另外一段——地面維持高 roughness，否則島會反光成塑膠。
WORLD_ROUGHNESS = {'red':.62,'car_red':.5,'car_white':.72,'car_eye':.45,'pink':.66,'cream':.78,'ivory':.84,'leaf':.9,'grass':.95,
                   'sand':.96,'paving':.94,'road':.96,'warmglass':.4,'sky':.32,'mint':.9,
                   'yellow':.7,'blue':.62,'wood':.9,'dark':.75}
# 摩天輪吊艙與輪胎維持原本的明亮玩具色，和世界的霧面色分開；v3 的美術定稿
# 刻意讓這兩組並存（吊艙是場景裡唯一的高彩度節奏）。
TOY_PALETTE = dict(
    cabin_blue=((.10,.38,.48),.84), cabin_yellow=((.95,.59,.13),.84),
    cabin_mint=((.19,.40,.22),.84), cabin_red=((.78,.115,.07),.72),
    cabin_wood=((.32,.16,.07),.88), wheel_tire=((.065,.078,.07),.84),
    wheel_cream=((.83,.65,.40),.84), wheel_red=((.78,.115,.07),.72))

def mat(name, color, roughness):
    m = bpy.data.materials.new(name); m.diffuse_color = (*color, 1)
    m.use_nodes = True
    p = m.node_tree.nodes.get('Principled BSDF'); p.inputs['Base Color'].default_value = (*color, 1)
    p.inputs['Roughness'].default_value = roughness
    p.inputs['Metallic'].default_value = 0
    M[name] = m
    return m
for n,c in WORLD_PALETTE.items(): mat(n,c,WORLD_ROUGHNESS.get(n,.86))
for n,(c,r) in TOY_PALETTE.items(): mat(n,c,r)
# 暖窗：低強度自發光，不新增 realtime light；strength 1 讓 glTF emissiveFactor
# 就是這個顏色本身。
p=M['warmglass'].node_tree.nodes['Principled BSDF']
p.inputs['Emission Color'].default_value=(.27,.10,.018,1)
p.inputs['Emission Strength'].default_value=1
current = 'Environment'
def finish(o,n,m):
    o.name=n; o.data.materials.append(M[m]); o['part']=current
    for p in o.data.polygons: p.use_smooth=True
    return o
def ball(n,p,s,m,segments=16):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=segments,ring_count=8,location=p)
    o=bpy.context.object; o.scale=s
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    return finish(o,n,m)
def box(n,p,s,m,bevel=.12):
    bpy.ops.mesh.primitive_cube_add(size=1,location=p); o=bpy.context.object; o.scale=s
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    if bevel:
        mod=o.modifiers.new('Soft clay edges','BEVEL');mod.width=bevel;mod.segments=2
        bpy.context.view_layer.objects.active=o;bpy.ops.object.modifier_apply(modifier=mod.name)
        mod=o.modifiers.new('Weighted normals','WEIGHTED_NORMAL');bpy.ops.object.modifier_apply(modifier=mod.name)
    return finish(o,n,m)
def rod(n,a,b,r,m,vertices=12):
    d=Vector(b)-Vector(a)
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices,radius=r,depth=d.length,location=(Vector(a)+Vector(b))/2)
    o=bpy.context.object;o.rotation_euler=d.to_track_quat('Z','Y').to_euler()
    bpy.ops.object.transform_apply(location=False,rotation=True,scale=True)
    return finish(o,n,m)
def tube(n,pts,r,m):
    curve=bpy.data.curves.new(n,'CURVE');curve.dimensions='3D';curve.resolution_u=1;curve.bevel_depth=r;curve.bevel_resolution=2
    sp=curve.splines.new('POLY');sp.points.add(len(pts)-1)
    for p,co in zip(sp.points,pts): p.co=(*co,1)
    o=bpy.data.objects.new(n,curve);bpy.context.collection.objects.link(o)
    bpy.ops.object.select_all(action='DESELECT');o.select_set(True);bpy.context.view_layer.objects.active=o;bpy.ops.object.convert(target='MESH')
    return finish(bpy.context.object,n,m)
def ringroad():
    verts=[]; faces=[]; steps=96
    for i in range(steps):
        t=2*math.pi*i/steps
        for rx,ry in [(4.55,3.05),(3.40,1.90)]:verts.append((rx*math.sin(t),ry*math.cos(t),.25))
    for i in range(steps):
        j=(i+1)%steps;faces.append((i*2,j*2,j*2+1,i*2+1))
    mesh=bpy.data.meshes.new('Loop road');mesh.from_pydata(verts,[],faces);mesh.update()
    o=bpy.data.objects.new('Loop road',mesh);bpy.context.collection.objects.link(o);finish(o,'Loop road','road')

def action_fcurves(action):
    # Blender 4.5 LTS exposes Action.fcurves directly. Blender 4.4+ slotted
    # actions moved them into layers→strips→channelbags and 5.x removed the
    # legacy attribute, so read whichever the running build provides.
    legacy=getattr(action,'fcurves',None)
    if legacy is not None:return list(legacy)
    curves=[]
    for layer in getattr(action,'layers',[]):
        for strip in getattr(layer,'strips',[]):
            for bag in getattr(strip,'channelbags',[]):
                curves.extend(bag.fcurves)
    return curves

def merge(part):
    # 靜態幾何依共用材質合併；重複樹另輸出供瀏覽器 InstancedMesh 使用。
    for material in M.values():
        objects=[o for o in bpy.context.scene.objects if o.type=='MESH' and o.get('part')==part and o.data.materials[0]==material]
        if not objects:continue
        bpy.ops.object.select_all(action='DESELECT')
        for o in objects:o.select_set(True)
        bpy.context.view_layer.objects.active=objects[0];bpy.ops.object.join();objects[0].name=f'{part}_{material.name}'
        bpy.context.scene.cursor.location=(0,0,0);bpy.ops.object.origin_set(type='ORIGIN_CURSOR')

# v3 的接觸陰影：以世界座標寫進 COLOR_0（線性），在 glTF 裡就是 baseColor 的
# 乘數。這是廣義的手繪暗部，不是 ray-baked AO；沒有濃淡變化的面不建立屬性，
# 免得每個網格都背一組全白的頂點色。
CONTACT_SHADE = {
    # 故事屋落在草地上的一片柔和暗部。
    'grass': lambda x,y,z: 1-.13*math.exp(-(((x+1.6)/1.5)**2+((.65-y)/1.4)**2)),
    # 屋身自下而上收乾，屋簷再壓一階。
    'ivory': lambda x,y,z: (1-.11*math.exp(-max(0,z-.25)*2.5)-(.06 if z>1.7 else 0)) if (z>.45 and x<-.45 and y>-.15) else 1,
    # 樹冠底部暗、頂部亮。
    'leaf': lambda x,y,z: .86+.14*min(1,max(0,(z-.55)/1.05)),
    # 紅色量體（書封屋頂）給極輕微的高度提亮。
    'red': lambda x,y,z: .94+.06*min(1,max(0,z/2.4)),
    # 車殼獨立一條：車身矮，用整個世界的高度尺度會幾乎沒有效果。
    'car_red': lambda x,y,z: .90+.10*min(1,max(0,z/1.1)),
}
CONTACT_ATTRIBUTE = 'Contact'

def bake_contact_colors(obj):
    mesh=obj.data
    if not mesh.materials or CONTACT_ATTRIBUTE in mesh.color_attributes: return
    shade=CONTACT_SHADE.get(mesh.materials[0].name)
    # 屋身的暗部只屬於環境模組；小紅的米色（擋風玻璃、車頭線）不套用。
    if shade is None or (mesh.materials[0].name=='ivory' and not obj.name.startswith('Environment')): return
    matrix=obj.matrix_world
    values=[shade(*(matrix @ v.co)) for v in mesh.vertices]
    if min(values)>1-1e-6: return
    layer=mesh.color_attributes.new(name=CONTACT_ATTRIBUTE,type='FLOAT_COLOR',domain='POINT')
    for i,value in enumerate(values): layer.data[i].color=(value,value,value,1)
    index=mesh.color_attributes.find(CONTACT_ATTRIBUTE)
    mesh.color_attributes.active_color_index=index
    mesh.color_attributes.render_color_index=index

def prepare_for_export(objects):
    for o in objects:
        if o.type!='MESH': continue
        bake_contact_colors(o)
        # 沒有任何貼圖，UV 只會變成匯出後要再刪一次的死重量。
        while o.data.uv_layers: o.data.uv_layers.remove(o.data.uv_layers[0])

def export(part,filename):
    bpy.ops.object.select_all(action='DESELECT')
    selected=[]
    for o in bpy.context.scene.objects:
        if o.get('part')==part or (part=='Environment' and o.get('part')=='Ferris'):
            o.select_set(True);selected.append(o)
    prepare_for_export(selected)
    bpy.ops.export_scene.gltf(filepath=str(OUT/filename),export_format='GLB',use_selection=True,export_cameras=False,export_lights=False,export_animations=True,export_animation_mode='NLA_TRACKS',export_force_sampling=False,export_extras=False,export_yup=True,export_vertex_color='NAME',export_vertex_color_name=CONTACT_ATTRIBUTE,export_all_vertex_colors=False)

def semantic_root(name, part, children):
    """Create an identity semantic root without changing child world poses."""
    root=bpy.data.objects.new(name,None);bpy.context.collection.objects.link(root);root['part']=part
    root.location=(0,0,0);root.rotation_euler=(0,0,0);root.scale=(1,1,1)
    for child in children:
        matrix=child.matrix_world.copy();child.parent=root;child.matrix_world=matrix
    return root

# 扁平橢圓陶土底座及同心道路。餅乾底座壓在草地下方，避免中央從草皮冒出來。
ball('Island biscuit',(0,0,-.325),(5.65,4.0,.55),'sand',48)
ball('Meadow',(0,0,-.05),(5.6,3.96,.35),'grass',48)
ringroad()
for i in range(36):
    t=i*math.tau/36
    o=box('Road dash',(3.98*math.sin(t),2.48*math.cos(t),.265),(.06,.25,.016),'ivory',.022)
    o.rotation_euler.z=-t-math.pi/2
# 故事屋：開放書本形屋頂，圓門和藍色窗。
box('Story house',(-1.6,.9,1.07),(2.0,1.65,1.75),'ivory',.18)
for side in [-1,1]:
    o=box('Book roof',(-1.6+side*.56,.9,2.11),(1.36,2.1,.24),'red',.09);o.rotation_euler.y=side*.45
    o=box('Book pages',(-1.6+side*.56,.9,2.0),(1.28,2.0,.1),'cream',.035);o.rotation_euler.y=side*.45
rod('Spine',(-1.6,-.17,2.40),(-1.6,1.96,2.40),.13,'red')
box('Door',(-1.6,.058,.70),(.53,.06,.94),'blue',.23)
ball('Door knob',(-1.42,-.002,.67),(.055,.04,.055),'yellow')
for x in [-2.23,-.96]:
    box('Window frame',(x,.045,1.35),(.46,.06,.58),'cream',.15)
    box('Warm window',(x,.001,1.35),(.34,.055,.44),'warmglass',.10)
    rod('Window cross',(x,-.035,1.14),(x,-.035,1.56),.022,'ivory')
box('Doorstep',(-1.6,-.24,.34),(.8,.45,.16),'cream',.07)
box('Chimney',(-2.2,1.5,2.25),(.3,.35,.8),'pink',.06)
# 明確的橢圓故事前庭與通向環路的石階；保留草地留白。
ball('Courtyard rim',(-1.35,-.80,.23),(1.19,.81,.055),'cream',32)
# 前庭鋪面略高於外框，門前的鋪地才有厚度。
ball('Courtyard clay',(-1.35,-.80,.302),(1.09,.72,.035),'paving',32)
for i in range(3):
    o=box('Path stone',(-1.22+i*.09,-1.43-i*.22,.29),(.49,.18,.055),'ivory',.045)
    o.rotation_euler.z=-.06+i*.035
# 屋側小書本，讓「故事」主題可從形狀辨認。
for i,col in enumerate(['blue','yellow','pink']):
    o=box('Little book',(-2.9,.4+i*.16,.48),(.52,.13,.60),col,.025);o.rotation_euler.y=-.1+i*.12
# 慢轉摩天輪保留軸心；車廂由瀏覽器反轉補償保持直立。
cx,cy,cz=1.65,1.35,2.08
for x in [cx-.75,cx+.75]:rod('Wheel support',(x,cy-.1,.27),(cx,cy,cz),.10,'wood')
ball('Wheel hub',(cx,cy-.14,cz),(.23,.13,.23),'yellow')
current='FerrisRotor'
pts=[(cx+1.26*math.cos(i*math.tau/64),cy,cz+1.26*math.sin(i*math.tau/64)) for i in range(65)]
tube('Ferris rim',pts,.075,'pink')
for i in range(8):
    a=i*math.tau/8;x=cx+1.26*math.cos(a);z=cz+1.26*math.sin(a)
    rod('Spoke',(cx,cy,cz),(x,cy,z),.035,'cream')
merge('FerrisRotor')
rotor=bpy.data.objects.new('FerrisRotor',None);bpy.context.collection.objects.link(rotor)
rotor.location=(cx,cy,cz);rotor['part']='Ferris'
bpy.context.view_layer.update()
for o in [o for o in bpy.context.scene.objects if o.get('part')=='FerrisRotor']:
    matrix=o.matrix_world.copy();o.parent=rotor;o.matrix_world=matrix;o['part']='Ferris'
for i in range(8):
    a=i*math.tau/8;x=cx+1.26*math.cos(a);z=cz+1.26*math.sin(a)
    current=f'Gondola{i}'
    rod('Cabin hanger',(x,cy,z),(x,cy,z-.21),.027,'cabin_wood')
    box('Gondola',(x,cy,z-.30),(.38,.39,.26),['cabin_blue','cabin_yellow','cabin_mint','cabin_red'][i%4],.09)
    pivot=bpy.data.objects.new(f'GondolaPivot{i}',None);bpy.context.collection.objects.link(pivot)
    pivot.parent=rotor;pivot.location=(x-cx,0,z-cz);pivot['part']='Ferris'
    bpy.context.view_layer.update()
    for o in [o for o in bpy.context.scene.objects if o.get('part')==current]:
        matrix=o.matrix_world.copy();o.parent=pivot;o.matrix_world=matrix;o['part']='Ferris'
current='Environment'
# 歡迎拱門在道路後段，旗幟及護欄。
for x in [-.64,.64]:rod('Gate post',(x,2.49,.25),(x,2.49,1.49),.10,'wood')
box('Welcome arch',(0,2.49,1.48),(1.53,.22,.42),'yellow',.18)
for x in [-.64,.64]:
    rod('Flagpole',(x,2.49,1.60),(x,2.49,2.1),.025,'wood')
    mesh=bpy.data.meshes.new('Pennant');mesh.from_pydata([(x,2.49,2.1),(x+.37,2.49,1.98),(x,2.49,1.87)],[],[(0,1,2)]);mesh.update()
    o=bpy.data.objects.new('Pennant',mesh);bpy.context.collection.objects.link(o);finish(o,'Pennant','red')
for i in range(5):
    x=2.8+i*.35;y=-1.1
    box('Fence post',(x,y,.56),(.095,.10,.6),'ivory',.04)
rod('Fence rail',(2.8,-1.1,.7),(4.2,-1.1,.7),.045,'cream')
# 前景花圃與石塊，所有靜態小物同材質合併。
for x,y,s in [(-4,-1.3,.4),(-3.9,1.5,.6),(3.7,1.7,.5),(2.8,-2.9,.4),(-2.9,-2.9,.3)]:
    ball('Shrub',(x,y,.32),(s,s*.75,s*.75),'mint')
    for j in range(3):ball('Flower',(x+(j-1)*.18,y-.22,.52),(.10,.09,.10),'yellow' if j%2 else 'pink',12)
for x,y in [(-4.8,.4),(4.7,-.5),(.8,-3.4),(-.2,-3.4)]:ball('Pebble',(x,y,.25),(.18,.12,.10),'cream',12)
merge('Environment')
# Keep a stable root and explicit Ferris semantic names in the editable source.
for o in bpy.context.scene.objects:
    if o.get('part')=='Ferris' and o.name.startswith('FerrisRotor_'):
        o.name=o.name.replace('FerrisRotor_','RimAndSpokes_')
env_children=[o for o in bpy.context.scene.objects if o.get('part') in ('Environment','Ferris') and o.parent is None]
semantic_root('Environment','Environment',env_children)
export('Environment','environment.raw.glb')
# 原點樹模型：兩種共用材質，可由 R3F 實例化。
current='Tree'
rod('Trunk',(0,0,0),(0,0,1.1),.10,'wood')
ball('Crown',(0,0,1.15),(.50,.45,.65),'leaf')
ball('Crown lobe',(.24,0,1.28),(.33,.33,.42),'leaf')
merge('Tree')
for o in bpy.context.scene.objects:
    if o.get('part')=='Tree' and o.name.startswith('Tree_wood'): o.name='Trunk'
    if o.get('part')=='Tree' and o.name.startswith('Tree_leaf'): o.name='Crown'
tree_children=[o for o in bpy.context.scene.objects if o.get('part')=='Tree' and o.parent is None]
semantic_root('Tree','Tree',tree_children)
export('Tree','tree.raw.glb')
for o in [o for o in bpy.context.scene.objects if o.get('part')=='Tree']:o.hide_render=True;o.hide_set(True)
# 小紅：自製圓車身、米色眼眶、藍窗、奶油輪轂與兩條車頭線。
current='Vehicle'
# 平面定裝照（public/characters/小紅賽車.jpg）的比例比這裡短胖、車頂更圓。
# 車身縮短加高、bevel 加大，才不會像一塊長方積木。
box('Body',(0,0,.48),(1.06,1.52,.56),'car_red',.26)
box('Cabin',(0,.14,.86),(.92,.80,.60),'car_red',.26)
box('Windshield',(0,-.274,.90),(.72,.08,.39),'ivory',.13)
for x in [-.23,.23]:
    # 眼睛原本 Y 只有 .035，等於貼在車頭上的貼紙。加厚成真的突出來的
    # googly eye，並讓瞳孔與高光跟著往外，側面才看得出立體。
    ball('Eye white',(x,-.300,.92),(.152,.080,.172),'car_white')
    ball('Eye',(x,-.330,.918),(.104,.070,.120),'car_eye')
    ball('Pupil',(x+.010,-.366,.921),(.062,.052,.076),'dark')
    ball('Eye glint',(x-.026,-.392,.960),(.030,.020,.034),'car_white',12)
    ball('Headlight',(x*1.6,-.745,.48),(.095,.047,.095),'yellow')
    box('Hood stripe',(x*.33,-.515,.746),(.057,.39,.024),'ivory',.016)
for x in [-.456,.456]:
    box('Side window',(x,.2,.89),(.037,.54,.31),'sky',.12)
    ball('Mirror',(x*1.14,-.25,.76),(.11,.10,.085),'car_red')
box('Bumper',(0,-.715,.29),(.92,.15,.13),'blue',.06)
# 嘴角埋進車頭、嘴心落在保險桿前緣：線徑 .026＋色票 dark 遠看會塌成一根橫桿，
# 加粗到 .036、嘴角由 ±.17 拉到 ±.21，才讀得出是嘴。
tube('Smile',[(-.21,-.755,.47),(-.12,-.782,.395),(0,-.791,.375),(.12,-.782,.395),(.21,-.755,.47)],.036,'dark')
# 車門號碼「2」：canon 的主要自有識別（定裝照為白圓底藍字）。圓底做成扁球而不是
# 平面圓盤，才貼得住 Body 的 .26 bevel 圓角側面；數字用 tube 沿折線描出。兩側各自
# 鏡射 y，讓左右從車外看都正讀。DIGIT_TWO 是相對圓心的 (dy,dz) 偏移。
BADGE = (.538, -.02, .47)
DIGIT_TWO = [(-.070,.075),(-.045,.115),(0,.122),(.045,.108),(.062,.075),
             (.050,.035),(0,-.015),(-.045,-.065),(-.068,-.102),(.068,-.102)]
for side in [-1, 1]:
    bx, by, bz = BADGE[0]*side, BADGE[1], BADGE[2]
    ball('Door badge',(bx,by,bz),(.028,.20,.20),'car_white')
    tube('Door number',[(bx+.030*side, by+dy*side, bz+dz) for dy,dz in DIGIT_TWO],.013,'blue')
box('Spoiler',(0,.78,.86),(1.12,.22,.11),'car_red',.055)
for x in [-.34,.34]:box('Spoiler stem',(x,.73,.71),(.06,.08,.22),'car_red',.025)
merge('Vehicle')
# 四個模組化輪子各自保留原點；Drive 只包含輪軸旋轉。
for i,(x,y) in enumerate([(-.51,-.48),(.51,-.48),(-.51,.5),(.51,.5)]):
    current=f'Wheel{i}'
    rod('Tire',(x-.10,y,.28),(x+.10,y,.28),.275,'wheel_tire',20)
    side=1 if x>0 else -1
    rod('Hub',(x+side*.095,y,.28),(x+side*.112,y,.28),.16,'wheel_cream',16)
    rod('Hub center',(x+side*.113,y,.28),(x+side*.122,y,.28),.068,'wheel_red',12)
    pieces=[o for o in bpy.context.scene.objects if o.get('part')==current]
    bpy.ops.object.select_all(action='DESELECT')
    for o in pieces:o.select_set(True)
    bpy.context.view_layer.objects.active=pieces[0];bpy.ops.object.join();wheel=pieces[0];wheel.name=f'Wheel_{i}'
    bpy.context.scene.cursor.location=(x,y,.28);bpy.ops.object.origin_set(type='ORIGIN_CURSOR');wheel['part']='Vehicle'
    wheel.rotation_euler=(0,0,0);wheel.keyframe_insert(data_path='rotation_euler',index=0,frame=1)
    wheel.rotation_euler.x=math.tau;wheel.keyframe_insert(data_path='rotation_euler',index=0,frame=49)
    action=wheel.animation_data.action;action.name=f'DriveWheel{i}'
    for fc in action_fcurves(action):
        for k in fc.keyframe_points:k.interpolation='LINEAR'
    track=wheel.animation_data.nla_tracks.new();track.name='Drive';track.strips.new('Drive',1,action);wheel.animation_data.action=None
# Preserve Vehicle → Body → geometry and Vehicle → Wheel_i hierarchy. The
# identity wrappers keep all authored world transforms and let the runtime
# animate suspension/body independently from grounded wheels.
body_children=[o for o in bpy.context.scene.objects if o.get('part')=='Vehicle' and not o.name.startswith('Wheel_') and o.parent is None]
body=semantic_root('Body','Vehicle',body_children)
vehicle_children=[body,*[o for o in bpy.context.scene.objects if o.get('part')=='Vehicle' and o.name.startswith('Wheel_') and o.parent is None]]
semantic_root('Vehicle','Vehicle',vehicle_children)
bpy.context.scene.frame_set(1);export('Vehicle','little-red.raw.glb')
# 備用圖和可編輯來源：場景模型和燈光不一併發送到 GLB。
# Parent only the semantic Vehicle root so the saved .blend keeps its runtime
# hierarchy (Vehicle → Body/Wheel_i) intact.
vehicle_root=bpy.data.objects.get('Vehicle')
preview_car=bpy.data.objects.new('PreviewCar',None);bpy.context.collection.objects.link(preview_car)
if vehicle_root is not None:
    matrix=vehicle_root.matrix_world.copy();vehicle_root.parent=preview_car;vehicle_root.matrix_world=matrix
preview_car.location=(-1.90,-2.18,.27);preview_car.rotation_euler.z=1.24
TREE_PLACES=[(-4.35,.4,.95),(-3.9,2.1,1.05),(-2.8,2.95,.82),(-.7,3.28,.75),(3.65,2.2,.92),(4.7,.6,.85),(4.7,-.8,.65),(-4.6,-1.8,.64)]
for x,y,s in TREE_PLACES:
    tree_root=bpy.data.objects.get('Tree')
    tree_meshes=[o for o in tree_root.children if o.type=='MESH'] if tree_root is not None else []
    for proto in tree_meshes:
        o=proto.copy();o.data=proto.data;bpy.context.collection.objects.link(o);o.hide_render=False;o.hide_set(False);o.location=(x,y,.19);o.scale=(s,s,s);o['part']='PreviewTree'
scene=bpy.context.scene
scene.world.color=(.8,.8,.8)
scene.world.use_nodes=True;scene.world.node_tree.nodes['Background'].inputs[0].default_value=(.78,.85,1,1);scene.world.node_tree.nodes['Background'].inputs[1].default_value=.6
bpy.ops.object.light_add(type='AREA',location=(-3,-5,10));bpy.context.object.data.energy=1600;bpy.context.object.data.shape='DISK';bpy.context.object.data.size=7
bpy.ops.object.camera_add(location=(7,-12,10));cam=bpy.context.object;cam.rotation_euler=(Vector((0,0,.6))-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.type='ORTHO';cam.data.ortho_scale=14;scene.camera=cam
scene.render.engine='CYCLES';scene.cycles.samples=32;scene.cycles.use_denoising=True
scene.render.resolution_x=1400;scene.render.resolution_y=1000;scene.render.resolution_percentage=100
scene.render.film_transparent=True;scene.render.image_settings.file_format='PNG';scene.render.filepath=str(OUT/'preview.png')
scene.view_settings.view_transform='AgX'
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'assets/blender/hero-world/hero-world.blend'))
# 來源鏈證據：optimize 會把這份 build-info 併進 v3 的 asset report 與 manifest，
# 讓上線資產可以指回產生它的 Blender 版本、種子與這支腳本的雜湊。
BUILD_INFO = {
    'buildScript': 'assets/blender/hero-world/build.py',
    'buildScriptSha256': sha256(Path(__file__).read_bytes()).hexdigest(),
    'blenderSource': 'assets/blender/hero-world/hero-world.blend',
    'blender': bpy.app.version_string,
    'buildSeed': BUILD_SEED,
    'target': 'public/models/hero-world/v3',
    'rawExports': sorted(f.name for f in OUT.glob('*.raw.glb')),
}
(OUT/'build-info.json').write_text(json.dumps(BUILD_INFO,indent=2)+'\n')
if RENDER_PREVIEW: bpy.ops.render.render(write_still=True)
print(f'HERO_WORLD_EXPORT_COMPLETE seed={BUILD_SEED} blender={bpy.app.version_string} preview={RENDER_PREVIEW}')
