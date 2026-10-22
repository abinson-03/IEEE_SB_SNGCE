import re

MD_PATH = r"C:\Users\Abinson Babu\Desktop\ieee-sb-portal\docs\PROJECT_REPORT.md"
with open(MD_PATH, "r", encoding="utf-8") as f:
    text = f.read()

# Replace flowchart LR in Chapter 1 with Figure 1.4
text = re.sub(
    r"```mermaid\s+flowchart LR.*?```",
    "[INSERT_FIGURE: figure_1_4_use_case.png | Figure 1.4: Complete UML Use Case Diagram of IEEE SB SNGCE Portal]",
    text,
    flags=re.DOTALL
)

with open(MD_PATH, "w", encoding="utf-8") as f:
    f.write(text)

print("Inserted Figure 1.4 in Chapter 1.")
