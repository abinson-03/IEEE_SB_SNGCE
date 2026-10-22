import os
import re
import base64
import subprocess
import markdown

DOCS_DIR = r"C:\Users\Abinson Babu\Desktop\ieee-sb-portal\docs"
FIGURES_DIR = os.path.join(DOCS_DIR, "figures")
MD_PATH = os.path.join(DOCS_DIR, "PROJECT_REPORT.md")
HTML_PATH = os.path.join(DOCS_DIR, "report_with_figures_clean.html")
PDF_OUT = os.path.join(DOCS_DIR, "PROJECT_REPORT.pdf")
DOWNLOADS_DIR = r"C:\Users\Abinson Babu\Downloads\ieee-sb-portal\docs"
ARTIFACT_DIR = r"C:\Users\Abinson Babu\.gemini\antigravity\brain\18c1487f-ab35-4cae-a538-c21dfac065a0"
LOGO_PATH = os.path.join(DOCS_DIR, "build_abinson", "unpacked", "word", "media", "image1.jpg")

CHROME_PATH = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
if not os.path.exists(CHROME_PATH):
    CHROME_PATH = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"

def get_base64_img(img_path):
    if os.path.exists(img_path):
        with open(img_path, "rb") as f:
            encoded = base64.b64encode(f.read()).decode("utf-8")
            ext = os.path.splitext(img_path)[1].replace('.', '')
            if ext == 'jpg': ext = 'jpeg'
            return f"data:image/{ext};base64,{encoded}"
    return ""

img_logo = get_base64_img(LOGO_PATH)
img_usecase = get_base64_img(os.path.join(FIGURES_DIR, "figure_1_4_use_case.png"))
img_er = get_base64_img(os.path.join(FIGURES_DIR, "figure_4_2_er_diagram.png"))
img_arch = get_base64_img(os.path.join(FIGURES_DIR, "figure_4_1_architecture.png"))
img_burndown = get_base64_img(os.path.join(FIGURES_DIR, "figure_4_5_burndown_chart.png"))
img_sequence = get_base64_img(os.path.join(FIGURES_DIR, "figure_5_3_sequence_diagram.png"))
img_git = get_base64_img(os.path.join(FIGURES_DIR, "figure_8_1_git_workflow.png"))

with open(MD_PATH, "r", encoding="utf-8") as f:
    md_content = f.read()

# Replace college logo placeholder with HTML
if img_logo:
    md_content = md_content.replace(
        "[COLLEGE_LOGO_HERE]",
        f'<div style="text-align:center; margin:16px 0;"><img src="{img_logo}" style="width:140px; margin:0 auto; display:block;"></div>'
    )

# Replace figure tags with HTML images + centered bold captions
figure_html_map = {
    "figure_1_4_use_case.png": (img_usecase, "Figure 1.4: Complete UML Use Case Diagram of IEEE SB SNGCE Portal"),
    "figure_4_1_architecture.png": (img_arch, "Figure 4.1: 4-Tier MERN Architecture Diagram of IEEE SB SNGCE Portal"),
    "figure_4_2_er_diagram.png": (img_er, "Figure 4.2: Entity-Relationship (ER) Diagram (Chen Notation) of IEEE SB SNGCE Portal"),
    "figure_5_3_sequence_diagram.png": (img_sequence, "Figure 5.3: UML Sequence Diagram - Event Registration, Attendance & Certificate Issuance"),
    "figure_4_5_burndown_chart.png": (img_burndown, "Figure 6.1: Cumulative Product Burndown Chart for IEEE SB SNGCE Portal"),
    "figure_8_1_git_workflow.png": (img_git, "Figure 8.1: Git Feature-Branching and Sprint Release Model")
}

for fig_file, (b64, caption) in figure_html_map.items():
    tag_pattern = rf"\[INSERT_FIGURE:\s*{re.escape(fig_file)}\s*\|\s*[^\]]+\]"
    html_block = (
        f'<div style="text-align:center; margin:24px 0; page-break-inside:avoid;">'
        f'<img src="{b64}" style="max-width:95%; height:auto; border:1px solid #cbd5e1; border-radius:6px; box-shadow:0 4px 6px -1px rgba(0,0,0,0.08); margin:0 auto; display:block;">'
        f'<p style="font-size:10pt; font-weight:bold; color:#0F172A; margin-top:8px; text-align:center;">{caption}</p>'
        f'</div>'
    )
    md_content = re.sub(tag_pattern, html_block, md_content)

html_body = markdown.markdown(md_content, extensions=['tables', 'fenced_code'])

full_html = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>IEEE SB SNGCE Portal - Project Report</title>
<style>
  @page {{
    size: A4;
    margin: 25mm 20mm 25mm 25mm;
  }}
  body {{
    font-family: "Times New Roman", Times, serif;
    font-size: 12pt;
    line-height: 1.5;
    color: #111827;
    margin: 0;
    padding: 0;
    text-align: justify;
  }}
  h1 {{
    color: #004976;
    font-size: 18pt;
    text-align: center;
    page-break-before: always;
    margin-top: 24pt;
    margin-bottom: 14pt;
    border-bottom: 2px solid #004976;
    padding-bottom: 6pt;
  }}
  h2 {{
    color: #004976;
    font-size: 14pt;
    margin-top: 18pt;
    margin-bottom: 8pt;
  }}
  h3 {{
    color: #0F172A;
    font-size: 12.5pt;
    font-weight: bold;
    margin-top: 14pt;
    margin-bottom: 6pt;
  }}
  h4 {{
    color: #334155;
    font-size: 12pt;
    font-weight: bold;
    margin-top: 10pt;
    margin-bottom: 4pt;
  }}
  table {{
    width: 100%;
    border-collapse: collapse;
    margin: 14pt 0;
    font-size: 9.5pt;
    page-break-inside: avoid;
  }}
  th, td {{
    border: 1px solid #cbd5e1;
    padding: 6pt 8pt;
    text-align: left;
    vertical-align: top;
  }}
  th {{
    background-color: #004976;
    color: #ffffff;
    font-weight: bold;
  }}
  tr:nth-child(even) td {{
    background-color: #f8fafc;
  }}
  pre, code {{
    font-family: "Courier New", Courier, monospace;
    font-size: 9pt;
  }}
  pre {{
    background: #f8fafc;
    border: 1px solid #cbd5e1;
    border-left: 4px solid #004976;
    padding: 8pt 12pt;
    page-break-inside: avoid;
  }}
  hr {{
    border: none;
    border-top: 1px solid #e2e8f0;
    margin: 20pt 0;
  }}
</style>
</head>
<body>
{html_body}
</body>
</html>
"""

with open(HTML_PATH, "w", encoding="utf-8") as f:
    f.write(full_html)

print("Printing clean PDF using headless browser...")
cmd = [
    CHROME_PATH,
    "--headless=new",
    "--disable-gpu",
    f"--print-to-pdf={PDF_OUT}",
    "--no-pdf-header-footer",
    HTML_PATH
]
subprocess.run(cmd, check=True)
print(f"PDF successfully generated at {PDF_OUT} ({os.path.getsize(PDF_OUT)} bytes)")

# Deliver to Downloads & Artifacts
for dest_dir in [DOWNLOADS_DIR, ARTIFACT_DIR]:
    target = os.path.join(dest_dir, "PROJECT_REPORT.pdf")
    try:
        shutil.copy2(PDF_OUT, target)
        print(f"Copied to {target}")
    except Exception as e:
        alt = os.path.join(dest_dir, "PROJECT_REPORT_FINAL_SUBMISSION.pdf")
        shutil.copy2(PDF_OUT, alt)
        print(f"Copied to alternate: {alt}")
