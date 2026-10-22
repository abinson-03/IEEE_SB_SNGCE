import docx
import re
from PIL import Image

doc = docx.Document(r"C:\Users\Abinson Babu\Desktop\ieee-sb-portal\docs\build_abinson\stage2.docx")
rels = doc.part.rels

for i, p in enumerate(doc.paragraphs):
    xml = p._p.xml
    if '<w:drawing>' in xml:
        embeds = re.findall(r'r:embed="([^"]+)"', xml)
        extents = re.findall(r'<wp:extent cx="(\d+)" cy="(\d+)"', xml)
        a_exts = re.findall(r'<a:ext cx="(\d+)" cy="(\d+)"', xml)
        target = [rels[r].target_ref for r in embeds if r in rels]
        print(f"P[{i}]: target={target} extent={extents} a_ext={a_exts}")
