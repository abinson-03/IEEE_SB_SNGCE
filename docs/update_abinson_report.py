import os
import re
import shutil
import zipfile
from PIL import Image
import docx

SRC_DOCX = r"C:\Users\Abinson Babu\.gemini\antigravity\brain\18c1487f-ab35-4cae-a538-c21dfac065a0\.user_uploaded\media_1792596558882_0f1ebc8d.docx"
BUILD_DIR = r"C:\Users\Abinson Babu\Desktop\ieee-sb-portal\docs\build_abinson"
FIGURES_DIR = r"C:\Users\Abinson Babu\Desktop\ieee-sb-portal\docs\figures"

OUT_DESKTOP = r"C:\Users\Abinson Babu\Desktop\ieee-sb-portal\docs\PROJECT_REPORT.docx"
OUT_DOWNLOADS = r"C:\Users\Abinson Babu\Downloads\ieee-sb-portal\docs\PROJECT_REPORT.docx"
OUT_ARTIFACT = r"C:\Users\Abinson Babu\.gemini\antigravity\brain\18c1487f-ab35-4cae-a538-c21dfac065a0\PROJECT_REPORT.docx"

os.makedirs(BUILD_DIR, exist_ok=True)
STAGE_DOCX = os.path.join(BUILD_DIR, "stage1.docx")
shutil.copy2(SRC_DOCX, STAGE_DOCX)

doc = docx.Document(STAGE_DOCX)

# -----------------------------------------------------------------
# 1. FIX FRONT MATTER (Certificate & Acknowledgement)
# -----------------------------------------------------------------
print("Processing Front Matter...")
for p in doc.paragraphs[:80]:
    if "SNG24MCA-2002" in p.text:
        p.text = p.text.replace("SNG24MCA-2002", "SNG25MCA-2002")
        print("  Fixed reg number in Certificate")
    if "blockchain technology, smart contract security" in p.text:
        p.text = p.text.replace(
            "blockchain technology, smart contract security, vulnerability analysis, and software development",
            "modern full-stack web engineering, MERN architecture, role-based access control, cryptographic verification, and institutional event automation"
        )
        print("  Fixed Acknowledgement paragraph")

# -----------------------------------------------------------------
# 2. REPLACE ABSTRACT (Paragraphs 80, 81, 82, 83)
# -----------------------------------------------------------------
print("Processing Abstract...")
abstract_p1 = (
    "The IEEE Student Branch at SNGCE (IEEE SB SNGCE) comprises multiple technical society chapters "
    "and affinity groups, including the Computer Society (CS), Computational Intelligence Society (CIS), "
    "Signal Processing Society (SPS), and Women in Engineering (WIE). Efficiently administering these units—spanning "
    "cross-chapter event planning, participant registrations, UPI fee reconciliation, physical attendance verification, "
    "automated certificate generation, and executive duty tracking—has historically relied on disjointed manual workflows. "
    "Such fragmentation causes administrative overhead, registration duplications, attendance discrepancies, delays in "
    "certificate issuance, and limited institutional visibility."
)

abstract_p2 = (
    "To solve these operational challenges, the IEEE SB SNGCE Portal was conceptualized, architected, and engineered "
    "as an integrated web platform leveraging the MERN technology stack (MongoDB, Express.js, React.js 19, and Node.js). "
    "The portal implements a secure Role-Based Access Control (RBAC) hierarchy accommodating five distinct user tiers: "
    "Public Visitors, Registered Student Members, Chapter ExeCom Officers, Chapter Administrators, and Super Administrators. "
    "Core capabilities include an interactive public showcase of chapter activities, an automated event registration engine with "
    "UPI payment screenshot proof submission, camera-based dynamic QR code scanning for attendance validation, automated server-side "
    "PDF certificate generation via PDFKit with cryptographic verification IDs, and transactional email notifications powered by Nodemailer Gmail SMTP."
)

abstract_p3 = (
    "The system also provides dedicated workspaces for chapter executive officers to manage task backlogs, oversee officer "
    "duty assignments, publish official notices, curate event photo galleries with geolocation tags, and review system audit trails. "
    "Developed under the Scrum agile framework across seven iterative sprints, the platform enforces input validation, bcrypt password "
    "hashing, JWT authentication, and responsive Tailwind CSS user interfaces. Comprehensive unit, integration, and user acceptance "
    "testing confirm that the IEEE SB SNGCE Portal significantly reduces administrative effort, prevents certificate tampering, and "
    "provides a dependable digital backbone for student branch operations."
)

if len(doc.paragraphs) > 83 and "ChainGuard" in doc.paragraphs[80].text:
    doc.paragraphs[80].text = abstract_p1
    doc.paragraphs[81].text = abstract_p2
    doc.paragraphs[82].text = abstract_p3
    doc.paragraphs[83].text = ""
    print("  Abstract successfully replaced with IEEE SB SNGCE Portal content")

# -----------------------------------------------------------------
# 3. COMPREHENSIVE TEXT & TABLE REPLACEMENTS (From Abstract to End)
# -----------------------------------------------------------------
print("Performing contextual terminology replacements...")

# Replacement dictionary ordered from longest/most specific to shortest
REPLACEMENTS = [
    ("ChainGuard Sandbox – Smart Contract Vulnerability Detection and Security Analysis", "IEEE SB SNGCE Portal – Automated Event, Chapter & Member Management System"),
    ("ChainGuard Sandbox - Smart Contract Security Testing and Analysis Platform", "IEEE SB SNGCE Portal - Automated Event, Chapter & Member Management System"),
    ("ChainGuard Sandbox", "IEEE SB SNGCE Portal"),
    ("ChainGuard", "IEEE SB Portal"),
    ("chainguard", "ieee-sb-portal"),
    ("smart contract vulnerability detection and security analysis", "IEEE student branch and chapter event management"),
    ("smart contract security analysis", "IEEE chapter and event management"),
    ("smart contract security", "IEEE portal security and access control"),
    ("smart contracts", "chapter events and registrations"),
    ("smart contract", "chapter event and registration"),
    ("Solidity smart contracts", "IEEE chapter events and registrations"),
    ("Solidity smart contract", "IEEE chapter event and registration"),
    ("Solidity code", "MERN application code"),
    ("Solidity", "React and Node.js"),
    ("solc-js", "PDFKit Engine"),
    ("Hardhat blockchain sandbox", "Node.js and Express.js runtime"),
    ("Hardhat", "Node.js/Express.js"),
    ("Ethers.js", "Mongoose ODM"),
    ("Reentrancy, Integer Overflow/Underflow, and Access Control Bypass", "Unauthorized Event Registration, Concurrent Limit Exceeded, and Privilege Escalation"),
    ("Reentrancy", "Unauthorized Registration"),
    ("Integer Overflow/Underflow", "Registration Quota Overflow"),
    ("Access Control Bypass", "Privilege Escalation"),
    ("gas profiling", "performance monitoring and query optimization"),
    ("gas consumption", "system response time and database query latency"),
    ("gas usage", "database query performance"),
    ("gas optimization", "database query indexing and caching"),
    ("attack simulation", "event registration lifecycle simulation"),
    ("attack simulations", "automated event workflows"),
    ("attack visualization", "real-time attendance and registration analytics"),
    ("Monaco Editor", "Interactive Event & Certificate Viewer"),
    ("Solidity Code Editor", "Event Management & QR Scanner Dashboard"),
    ("Solidity Source File Upload", "Event Banner & Photo Gallery Upload"),
    ("local blockchain environment", "local full-stack MERN runtime"),
    ("local blockchain", "MongoDB database"),
    ("blockchain environment", "cloud-ready web environment"),
    ("blockchain technology", "full-stack web technology"),
    ("blockchain", "portal"),
    # Safeguard: Remove any accidental NSB / STB occurrences
    ("NSB", "IEEE SB SNGCE"),
    ("nsb", "ieee-sb"),
    ("STB12345", "IEEE SB SNGCE"),
    ("STB", "Student Branch"),
]

def replace_in_text(text):
    for old, new in REPLACEMENTS:
        text = text.replace(old, new)
        text = text.replace(old.lower(), new.lower())
        text = text.replace(old.upper(), new.upper())
    return text

# Apply to paragraphs from paragraph 79 onwards
para_count = 0
for p in doc.paragraphs[79:]:
    original = p.text
    if any(k[0].lower() in original.lower() for k in REPLACEMENTS):
        p.text = replace_in_text(original)
        para_count += 1

print(f"  Updated text in {para_count} paragraphs")

# Apply to tables
table_cells_count = 0
for tbl in doc.tables:
    for row in tbl.rows:
        for cell in row.cells:
            original = cell.text
            if any(k[0].lower() in original.lower() for k in REPLACEMENTS):
                cell.text = replace_in_text(original)
                table_cells_count += 1

print(f"  Updated text in {table_cells_count} table cells")

STAGE2_DOCX = os.path.join(BUILD_DIR, "stage2.docx")
doc.save(STAGE2_DOCX)
print("Saved stage 2 docx.")

# -----------------------------------------------------------------
# 4. REPLACE FIGURES IN THE DOCX ZIP ARCHIVE
# -----------------------------------------------------------------
print("Replacing images in docx zip package...")

UNPACK_DIR = os.path.join(BUILD_DIR, "unpacked")
if os.path.exists(UNPACK_DIR):
    shutil.rmtree(UNPACK_DIR)
os.makedirs(UNPACK_DIR, exist_ok=True)

with zipfile.ZipFile(STAGE2_DOCX, 'r') as z:
    z.extractall(UNPACK_DIR)

media_dir = os.path.join(UNPACK_DIR, 'word', 'media')

# Mapping of old sample figures to our new generated figures
# image8.png = Use Case Diagram
# image6.png = Architecture Diagram
# image11.png = ER Diagram (Database Schema)
# image14.png = Burndown Chart
# image7.png = Sequence Diagram
# image9.png = Git Workflow Diagram
# image5.png = Wireframe / Architecture Overview

IMAGE_MAP = {
    'image8.png': os.path.join(FIGURES_DIR, "figure_1_4_use_case.png"),
    'image6.png': os.path.join(FIGURES_DIR, "figure_4_1_architecture.png"),
    'image11.png': os.path.join(FIGURES_DIR, "figure_4_2_er_diagram.png"),
    'image14.png': os.path.join(FIGURES_DIR, "figure_4_5_burndown_chart.png"),
    'image7.png': os.path.join(FIGURES_DIR, "figure_5_3_sequence_diagram.png"),
    'image9.png': os.path.join(FIGURES_DIR, "figure_8_1_git_workflow.png"),
    'image5.png': os.path.join(FIGURES_DIR, "figure_4_1_architecture.png"),
}

for img_name, new_file in IMAGE_MAP.items():
    dest_path = os.path.join(media_dir, img_name)
    if os.path.exists(dest_path) and os.path.exists(new_file):
        # Resize/convert if needed or copy directly
        shutil.copy2(new_file, dest_path)
        print(f"  Replaced {img_name} with {os.path.basename(new_file)}")

# Re-pack the zip into the final docx
STAGE3_DOCX = os.path.join(BUILD_DIR, "stage3.docx")
with zipfile.ZipFile(STAGE3_DOCX, 'w', zipfile.ZIP_DEFLATED) as z_out:
    for foldername, subfolders, filenames in os.walk(UNPACK_DIR):
        for filename in filenames:
            file_path = os.path.join(foldername, filename)
            arcname = os.path.relpath(file_path, UNPACK_DIR)
            z_out.write(file_path, arcname)

print("Re-packed final docx successfully.")

# Copy to final destinations
for dest in [OUT_DESKTOP, OUT_DOWNLOADS, OUT_ARTIFACT]:
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    shutil.copy2(STAGE3_DOCX, dest)
    print(f"Delivered: {dest} ({os.path.getsize(dest)} bytes)")

print("All tasks completed successfully!")
