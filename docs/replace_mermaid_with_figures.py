import re

MD_PATH = r"C:\Users\Abinson Babu\Desktop\ieee-sb-portal\docs\PROJECT_REPORT.md"
with open(MD_PATH, "r", encoding="utf-8") as f:
    text = f.read()

# 1. Figure 1.4 in Chapter 1
if "figure_1_4_use_case.png" not in text:
    pattern = r"(4\.\s*\*\*Super Admin\*\*:.*?recovery authorization\.)"
    replacement = r"\1\n\n[INSERT_FIGURE: figure_1_4_use_case.png | Figure 1.4: Complete UML Use Case Diagram of IEEE SB SNGCE Portal]"
    text = re.sub(pattern, replacement, text)

# 2. Figure 4.1 in Chapter 4 (Replace flowchart TD mermaid block)
text = re.sub(
    r"```mermaid\s+flowchart TD.*?```",
    "[INSERT_FIGURE: figure_4_1_architecture.png | Figure 4.1: 4-Tier MERN Architecture Diagram of IEEE SB SNGCE Portal]",
    text,
    flags=re.DOTALL
)

# 3. Figure 4.2 in Chapter 4 (Replace erDiagram mermaid block)
text = re.sub(
    r"```mermaid\s+erDiagram.*?```",
    "[INSERT_FIGURE: figure_4_2_er_diagram.png | Figure 4.2: Entity-Relationship (ER) Diagram (Chen Notation) of IEEE SB SNGCE Portal]",
    text,
    flags=re.DOTALL
)

# 4. Figure 6.1 in Chapter 6 (Replace xychart-beta mermaid block)
text = re.sub(
    r"```mermaid\s+xychart-beta.*?```",
    "[INSERT_FIGURE: figure_4_5_burndown_chart.png | Figure 6.1: Cumulative Product Burndown Chart for IEEE SB SNGCE Portal]",
    text,
    flags=re.DOTALL
)

# 5. Figure 8.1 in Chapter 8
if "figure_8_1_git_workflow.png" not in text:
    pattern = r"(### 8\.2 BRANCHING STRATEGY & COMMIT CONVENTIONS)"
    replacement = "[INSERT_FIGURE: figure_8_1_git_workflow.png | Figure 8.1: Git Feature-Branching and Sprint Release Model]\n\n\\1"
    text = re.sub(pattern, replacement, text)

with open(MD_PATH, "w", encoding="utf-8") as f:
    f.write(text)

print("Replaced all mermaid blocks with INSERT_FIGURE tags.")
