"""Prepare curated public photos without changing their proportions. Review outputs before use."""
import json, os, urllib.request
from pathlib import Path
from PIL import Image, ImageDraw, ImageChops
os.environ['U2NET_HOME']=str(Path('.cache/rembg').resolve())
from rembg import remove, new_session
picks=json.loads(Path('scripts/photo-picks.json').read_text())
session=new_session('isnet-general-use', providers=['CPUExecutionProvider'])
Path('.cache/photo-cutouts').mkdir(exist_ok=True)
masks=json.loads(Path('scripts/photo-masks.json').read_text())
pinned=json.loads(Path('scripts/photo-sources.json').read_text()) if Path('scripts/photo-sources.json').exists() else []
selections=[]
for mid,index in picks.items():
    saved=next((p for p in pinned if p['id']==mid and p['index']==index),None)
    if saved:
        data={'name':saved['name']}; photo={k:v for k,v in saved.items() if k not in ('id','name','cutout')}
    else:
        data=json.loads(Path(f'.cache/blog-photos/{mid}.json').read_text())
        photo=next(p for p in data['photos'] if p['index']==index)
    if not Path(photo['raw']).exists():
        Path(photo['raw']).parent.mkdir(parents=True,exist_ok=True)
        urllib.request.urlretrieve(photo['url'],photo['raw'])
    out=Path(f'.cache/photo-cutouts/{mid}.png')
    receipt=out.with_suffix('.source')
    if not out.exists() or not receipt.exists() or receipt.read_text()!=photo['url']:
        im=Image.open(photo['raw']).convert('RGB'); im.thumbnail((1600,1600))
        remove(im,session=session).save(out)
        receipt.write_text(photo['url'])
    if mid in masks:
        im=Image.open(out);m=masks[mid];mask=Image.new('L',im.size);ImageDraw.Draw(mask).polygon([(x/m['size'][0]*im.width,y/m['size'][1]*im.height) for x,y in m['points']],fill=255);im.putalpha(ImageChops.multiply(im.getchannel('A'),mask));im.save(out)
    selections.append(dict(id=mid,name=data['name'],**photo,cutout=str(out)))
    print(mid,flush=True)
Path('scripts/photo-sources.json').write_text(json.dumps(selections,ensure_ascii=False,indent=2))
sheet=Image.new('RGB',(9*160,3*230),'#e4f4fc');d=ImageDraw.Draw(sheet)
for i,s in enumerate(selections):
    im=Image.open(s['cutout']);bbox=im.getchannel('A').point(lambda a:255 if a>40 else 0).getbbox();im=im.crop(bbox);im.thumbnail((150,205))
    x=i%9*160;y=i//9*230;sheet.paste(im,(x+(160-im.width)//2,y),im);d.text((x+5,y+210),s['id'],fill='black')
sheet.save('.cache/photo-cutouts/review.jpg')
