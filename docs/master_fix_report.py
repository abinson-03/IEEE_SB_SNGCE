import os
import re
import shutil
import zipfile
from PIL import Image

SRC_DOCX = r"C:\Users\Abinson Babu\.gemini\antigravity\brain\18c1487f-ab35-4cae-a538-c21dfac065a0\.user_uploaded\media_1792596558882_0f1ebc8d.docx"
BUILD_DIR = r"C:\Users\Abinson Babu\Desktop\ieee-sb-portal\docs\build_abinson_perfect"
FIGURES_DIR = r"C:\Users\Abinson Babu\Desktop\ieee-sb-portal\docs\figures"

OUT_DESKTOP = r"C:\Users\Abinson Babu\Desktop\ieee-sb-portal\docs\PROJECT_REPORT.docx"
OUT_DOWNLOADS = r"C:\Users\Abinson Babu\Downloads\ieee-sb-portal\docs\PROJECT_REPORT_UPDATED.docx"
OUT_ARTIFACT = r"C:\Users\Abinson Babu\.gemini\antigravity\brain\18c1487f-ab35-4cae-a538-c21dfac065a0\PROJECT_REPORT.docx"

if os.path.exists(BUILD_DIR):
    shutil.rmtree(BUILD_DIR)
os.makedirs(BUILD_DIR, exist_ok=True)

UNPACK_DIR = os.path.join(BUILD_DIR, "unpacked")
with zipfile.ZipFile(SRC_DOCX, 'r') as z:
    z.extractall(UNPACK_DIR)

print("Unpacked docx archive.")

# -------------------------------------------------------------
# 1. REPLACE IMAGE FILES IN word/media/
# -------------------------------------------------------------
media_dir = os.path.join(UNPACK_DIR, 'word', 'media')

# Map of images in word/media to our generated crisp figures
IMAGE_MAP = {
    'image8.png': os.path.join(FIGURES_DIR, "figure_1_4_use_case.png"),
    'image6.png': os.path.join(FIGURES_DIR, "figure_4_1_architecture.png"),
    'image11.png': os.path.join(FIGURES_DIR, "figure_4_2_er_diagram.png"),
    'image14.png': os.path.join(FIGURES_DIR, "figure_4_5_burndown_chart.png"),
    'image7.png': os.path.join(FIGURES_DIR, "figure_5_3_sequence_diagram.png"),
    'image9.png': os.path.join(FIGURES_DIR, "figure_8_1_git_workflow.png"),
    'image5.png': os.path.join(FIGURES_DIR, "figure_4_1_architecture.png"),
}

image_ratios = {}
for img_name, fig_path in IMAGE_MAP.items():
    dest = os.path.join(media_dir, img_name)
    if os.path.exists(fig_path):
        shutil.copy2(fig_path, dest)
        im = Image.open(dest)
        image_ratios[img_name] = im.height / im.width
        print(f"  Replaced {img_name}: size={im.size}, ratio={image_ratios[img_name]:.4f}")

# -------------------------------------------------------------
# 2. UPDATE word/_rels/document.xml.rels TO MAP rIds TO IMAGES
# -------------------------------------------------------------
rels_path = os.path.join(UNPACK_DIR, 'word', '_rels', 'document.xml.rels')
with open(rels_path, 'r', encoding='utf-8') as f:
    rels_xml = f.read()

rId_to_image = {}
for m in re.finditer(r'<Relationship Id="(rId\d+)"[^>]+Target="media/([^"]+)"', rels_xml):
    rId_to_image[m.group(1)] = m.group(2)

print("Found rId mappings:", rId_to_image)

# -------------------------------------------------------------
# 3. UPDATE word/document.xml: EXTENTS & TEXT REPLACEMENTS
# -------------------------------------------------------------
doc_xml_path = os.path.join(UNPACK_DIR, 'word', 'document.xml')
with open(doc_xml_path, 'r', encoding='utf-8') as f:
    xml = f.read()

# Fix image extents in XML so Word never distorts them
# Printable width in EMUs for 5.8 inches: 5303520 (1 in = 914400 EMUs)
TARGET_CX = 5303520

def fix_extent(match):
    full_tag = match.group(0)
    # Check if this drawing contains an image from IMAGE_MAP
    for rId, img_name in rId_to_image.items():
        if img_name in image_ratios and f'r:embed="{rId}"' in full_tag:
            ratio = image_ratios[img_name]
            new_cx = TARGET_CX
            new_cy = int(TARGET_CX * ratio)
            # Replace wp:extent cx and cy
            full_tag = re.sub(r'<wp:extent cx="\d+" cy="\d+"', f'<wp:extent cx="{new_cx}" cy="{new_cy}"', full_tag)
            # Replace a:ext cx and cy
            full_tag = re.sub(r'<a:ext cx="\d+" cy="\d+"', f'<a:ext cx="{new_cx}" cy="{new_cy}"', full_tag)
            print(f"  Fixed extent for {img_name} ({rId}): {new_cx}x{new_cy}")
            break
    return full_tag

# Regex to match each <w:drawing>...</w:drawing> block
xml = re.sub(r'<w:drawing>.*?</w:drawing>', fix_extent, xml, flags=re.DOTALL)

# -------------------------------------------------------------
# 4. REMOVE ALL OCCURRENCES OF SANJAY, SHIJIL, PARTHIP
# -------------------------------------------------------------
# In paragraphs 239-250 (Team members):
xml = xml.replace("SANJAY S A", "ABINSON BABU")
xml = xml.replace("Sanjay S A", "Abinson Babu")
xml = xml.replace("Sanjay", "Abinson Babu")
xml = xml.replace("sanjay", "Abinson Babu")

xml = xml.replace("SHIJIL C B", "ABINSON BABU")
xml = xml.replace("Shijil C B", "Abinson Babu")
xml = xml.replace("Shijil", "Abinson Babu")
xml = xml.replace("shijil", "Abinson Babu")

xml = xml.replace("PARTHIP  SASIDHARAN", "ABINSON BABU")
xml = xml.replace("PARTHIP SASIDHARAN", "ABINSON BABU")
xml = xml.replace("Parthip Sasidharan", "Abinson Babu")
xml = xml.replace("Parthip", "Abinson Babu")
xml = xml.replace("parthip", "Abinson Babu")

# Fix duplicate "Abinson Babu, Abinson Babu, and Abinson Babu"
xml = re.sub(r'Abinson Babu,\s*Abinson Babu,\s*(?:and\s*)?Abinson Babu', 'Abinson Babu (Individual Project)', xml)
xml = re.sub(r'Abinson Babu,\s*Abinson Babu', 'Abinson Babu', xml)

# -------------------------------------------------------------
# 5. REMOVE ALL OCCURRENCES OF SANDBOX
# -------------------------------------------------------------
xml = xml.replace("ChainGuard Sandbox", "IEEE SB SNGCE Portal")
xml = xml.replace("Chainguard Sandbox", "IEEE SB SNGCE Portal")
xml = xml.replace("chainguard sandbox", "IEEE SB SNGCE Portal")
xml = xml.replace("ChainGuard", "IEEE SB SNGCE Portal")
xml = xml.replace("chainguard", "ieee-sb-portal")
xml = xml.replace("Sandbox", "Portal")
xml = xml.replace("sandbox", "portal")
xml = xml.replace("SANDBOX", "PORTAL")

# -------------------------------------------------------------
# 6. FIX CHAPTER 7 REPEAT -> CHAPTER 8
# -------------------------------------------------------------
# Find the second CHAPTER 7 which is GITHUB / VERSION CONTROL
xml = re.sub(
    r'(<w:t[^>]*>CHAPTER\s+7</w:t>.*?<w:t[^>]*>CHAPTER\s+7\.\s+GITHUB\s+/\s+VERSION\s+CONTROL</w:t>)',
    lambda m: m.group(1).replace('CHAPTER 7', 'CHAPTER 8', 2),
    xml,
    flags=re.DOTALL
)
# Also fix any single tags
xml = xml.replace("CHAPTER 7. GITHUB / VERSION CONTROL", "CHAPTER 8. GITHUB / VERSION CONTROL")
xml = xml.replace("CHAPTER 7. GITHUB/VERSION CONTROL", "CHAPTER 8. GITHUB/VERSION CONTROL")

# -------------------------------------------------------------
# 7. FIX CERTIFICATE & FRONT MATTER
# -------------------------------------------------------------
xml = xml.replace("SNG24MCA-2002", "SNG25MCA-2002")

# Acknowledgement blockchain removal
xml = xml.replace(
    "blockchain technology, smart contract security, vulnerability analysis, and software development",
    "modern full-stack web engineering, MERN architecture, role-based access control, cryptographic verification, and institutional event automation"
)

# -------------------------------------------------------------
# 8. FIX TABLE 25 (Planning Poker Columns & Reasons)
# -------------------------------------------------------------
# In Planning poker header: replace Abinson Babu | Abinson Babu | Abinson Babu with:
# Round 1 (Dev) | Round 2 (Review) | Final Estimate
xml = xml.replace("Smart contract project data management", "Event and chapter membership management")
xml = xml.replace("React and Node.js editor and file handling", "Interactive chapter portfolio and event schedule")
xml = xml.replace("Compilation and error handling", "Dynamic QR attendance check-in workflow")
xml = xml.replace("Local portal deployment", "Secure event registration with UPI payment validation")
xml = xml.replace("Vulnerability simulation and validation", "Automated PDFKit certificate generation and email dispatch")

# -------------------------------------------------------------
# 9. GENERAL CLEANUP OF BLOCKCHAIN / HALLUCINATED TERMS
# -------------------------------------------------------------
xml = xml.replace("Solidity", "MERN Stack")
xml = xml.replace("solidity", "MERN stack")
xml = xml.replace("smart contracts", "chapter events and registrations")
xml = xml.replace("smart contract", "chapter event and registration")
xml = xml.replace("Smart contracts", "Chapter events and registrations")
xml = xml.replace("Smart contract", "Chapter event and registration")
xml = xml.replace("Hardhat", "Node.js/Express.js")
xml = xml.replace("solc-js", "PDFKit Engine")
xml = xml.replace("Ethers.js", "Mongoose ODM")
xml = xml.replace("Reentrancy", "Unauthorized Registration")
xml = xml.replace("reentrancy", "unauthorized registration")

# Ensure no NSB or STB appears
xml = xml.replace("NSB", "IEEE SB SNGCE")
xml = xml.replace("nsb", "ieee-sb")
xml = xml.replace("STB12345", "IEEE SB SNGCE")

# Write updated document.xml
with open(doc_xml_path, 'w', encoding='utf-8') as f:
    f.write(xml)

print("Updated word/document.xml with all fixes.")

# -------------------------------------------------------------
# 10. RE-PACK THE ARCHIVE
# -------------------------------------------------------------
STAGE_FINAL_DOCX = os.path.join(BUILD_DIR, "PROJECT_REPORT_FINAL.docx")
with zipfile.ZipFile(STAGE_FINAL_DOCX, 'w', zipfile.ZIP_DEFLATED) as z_out:
    for foldername, subfolders, filenames in os.walk(UNPACK_DIR):
        for filename in filenames:
            file_path = os.path.join(foldername, filename)
            arcname = os.path.relpath(file_path, UNPACK_DIR)
            z_out.write(file_path, arcname)

print("Re-packed final docx successfully.")

# Deliver to destinations
for dest in [OUT_DESKTOP, OUT_DOWNLOADS, OUT_ARTIFACT]:
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    try:
        shutil.copy2(STAGE_FINAL_DOCX, dest)
        print(f"Delivered: {dest} ({os.path.getsize(dest)} bytes)")
    except Exception as e:
        print(f"Could not copy directly to {dest}: {e}")
        alt = dest.replace(".docx", "_PERFECT.docx")
        shutil.copy2(STAGE_FINAL_DOCX, alt)
        print(f"Delivered to alternate: {alt}")

print("Master fix completed successfully!")
