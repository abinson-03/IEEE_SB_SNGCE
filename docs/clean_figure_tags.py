import re

MD_PATH = r"C:\Users\Abinson Babu\Desktop\ieee-sb-portal\docs\PROJECT_REPORT.md"
with open(MD_PATH, "r", encoding="utf-8") as f:
    text = f.read()

# Remove all existing INSERT_FIGURE tags first
text = re.sub(r'\[INSERT_FIGURE:[^\]]+\]\n*', '', text)

# Now insert each figure exactly once at its proper location:

# 1. Figure 1.4: In Chapter 1 under "1.4 USE CASES & ACTOR MODEL"
uc_target = "4. **Super Admin**: Overrules administrative roles, audits platform operations via immutable audit logs, manages system configuration, and possesses disaster recovery authorization."
uc_replacement = uc_target + "\n\n[INSERT_FIGURE: figure_1_4_use_case.png | Figure 1.4: Complete UML Use Case Diagram of IEEE SB SNGCE Portal]"
text = text.replace(uc_target, uc_replacement)

# 2. Figure 4.1: In Chapter 4 under "4.3 ARCHITECTURAL OVERVIEW"
arch_target = "The application implements a clean **Four-Tier Architecture**:"
arch_replacement = arch_target + "\n\n[INSERT_FIGURE: figure_4_1_architecture.png | Figure 4.1: 4-Tier MERN Architecture Diagram of IEEE SB SNGCE Portal]"
text = text.replace(arch_target, arch_replacement)

# 3. Figure 4.2: In Chapter 4 under "4.4 LOGICAL DATA MODEL (ER CONCEPT)"
er_target = "### 4.4 LOGICAL DATA MODEL (ER CONCEPT)"
er_replacement = er_target + "\n\n[INSERT_FIGURE: figure_4_2_er_diagram.png | Figure 4.2: Entity-Relationship (ER) Diagram (Chen Notation) of IEEE SB SNGCE Portal]"
text = text.replace(er_target, er_replacement)

# 4. Figure 5.3: In Chapter 5 under Sprint 4
seq_target = "### 5.4 SPRINT 4 – DYNAMIC QR ATTENDANCE & AUTOMATED CERTIFICATES"
seq_replacement = seq_target + "\n\n[INSERT_FIGURE: figure_5_3_sequence_diagram.png | Figure 5.3: UML Sequence Diagram - Event Registration, Attendance & Certificate Issuance]"
text = text.replace(seq_target, seq_replacement)

# 5. Figure 6.1: In Chapter 6 under "6.2 CUMULATIVE PRODUCT BURNDOWN"
bd_target = "### 6.2 CUMULATIVE PRODUCT BURNDOWN"
bd_replacement = bd_target + "\n\n[INSERT_FIGURE: figure_4_5_burndown_chart.png | Figure 6.1: Cumulative Product Burndown Chart for IEEE SB SNGCE Portal]"
text = text.replace(bd_target, bd_replacement)

# 6. Figure 8.1: In Chapter 8 under "8.2 BRANCHING STRATEGY & COMMIT CONVENTIONS"
git_target = "### 8.2 BRANCHING STRATEGY & COMMIT CONVENTIONS"
git_replacement = "[INSERT_FIGURE: figure_8_1_git_workflow.png | Figure 8.1: Git Feature-Branching and Sprint Release Model]\n\n" + git_target
text = text.replace(git_target, git_replacement)

with open(MD_PATH, "w", encoding="utf-8") as f:
    f.write(text)

print("Properly tagged each of the 6 figures exactly once.")
