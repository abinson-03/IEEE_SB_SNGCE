import zipfile
import os
from PIL import Image

docx_path = r"C:\Users\Abinson Babu\.gemini\antigravity\brain\18c1487f-ab35-4cae-a538-c21dfac065a0\.user_uploaded\media_1792596558882_0f1ebc8d.docx"
out_dir = r"C:\Users\Abinson Babu\Desktop\ieee-sb-portal\docs\docx_temp_images"
os.makedirs(out_dir, exist_ok=True)

with zipfile.ZipFile(docx_path, 'r') as z:
    for f in z.namelist():
        if f.startswith('word/media/'):
            z.extract(f, out_dir)

for f in sorted(os.listdir(os.path.join(out_dir, 'word', 'media'))):
    p = os.path.join(out_dir, 'word', 'media', f)
    im = Image.open(p)
    print(f"{f:15} | Size: {im.size} | Mode: {im.mode}")
