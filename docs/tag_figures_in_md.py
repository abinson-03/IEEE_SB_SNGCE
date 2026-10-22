import os

MD_PATH = r"C:\Users\Abinson Babu\Desktop\ieee-sb-portal\docs\PROJECT_REPORT.md"
with open(MD_PATH, "r", encoding="utf-8") as f:
    text = f.read()

# 1. Figure 1.4 in Chapter 1
if "[INSERT_FIGURE: figure_1_4_use_case.png" not in text:
    target = "4. **Super Admin**: Overrules administrative roles, audits platform operations via immutable audit logs, manages system configuration, and possesses disaster recovery authorization."
    replacement = target + "\n\n[INSERT_FIGURE: figure_1_4_use_case.png | Figure 1.4: Complete UML Use Case Diagram of IEEE SB SNGCE Portal]"
    text = text.replace(target, replacement)

# 2. Figure 4.1 in Chapter 4
if "[INSERT_FIGURE: figure_4_1_architecture.png" not in text:
    target = "The IEEE SB SNGCE Portal is designed using a decoupled Four-Tier Service-Oriented Web Architecture following the MERN (MongoDB, Express.js, React.js 19, Node.js) technology stack. Each architectural tier maintains isolated concerns, decoupled interfaces, and strict boundary validation."
    replacement = target + "\n\n[INSERT_FIGURE: figure_4_1_architecture.png | Figure 4.1: 4-Tier MERN Architecture Diagram of IEEE SB SNGCE Portal]"
    text = text.replace(target, replacement)

# 3. Figure 4.2 in Chapter 4
if "[INSERT_FIGURE: figure_4_2_er_diagram.png" not in text:
    target = "### 4.4 LOGICAL DATA MODEL (ER CONCEPT)\n\nThe database tier is implemented on MongoDB Community Server / MongoDB Atlas, managed through Mongoose Object Data Modeling (ODM). The system data model comprises eight primary document collections, establishing bidirectional referential integrity through ObjectId references and embedded subdocuments."
    replacement = target + "\n\n[INSERT_FIGURE: figure_4_2_er_diagram.png | Figure 4.2: Entity-Relationship (ER) Diagram (Chen Notation) of IEEE SB SNGCE Portal]"
    text = text.replace(target, replacement)

# 4. Figure 5.3 in Chapter 5
if "[INSERT_FIGURE: figure_5_3_sequence_diagram.png" not in text:
    target = "### 5.4 SPRINT 4 – DYNAMIC QR ATTENDANCE & AUTOMATED CERTIFICATES"
    replacement = target + "\n\n[INSERT_FIGURE: figure_5_3_sequence_diagram.png | Figure 5.3: UML Sequence Diagram - Event Registration, Attendance & Certificate Issuance]"
    text = text.replace(target, replacement)

# 5. Figure 4.5 / 6.1 in Chapter 6
if "[INSERT_FIGURE: figure_4_5_burndown_chart.png" not in text:
    target = "### 6.2 CUMULATIVE PRODUCT BURNDOWN\n\nThe cumulative product burndown monitors the aggregate burn-rate across all 56 planned story points (140 total team velocity units across 7 sprints)."
    replacement = target + "\n\n[INSERT_FIGURE: figure_4_5_burndown_chart.png | Figure 6.1: Cumulative Product Burndown Chart for IEEE SB SNGCE Portal]"
    text = text.replace(target, replacement)

# 6. Figure 8.1 in Chapter 8
if "[INSERT_FIGURE: figure_8_1_git_workflow.png" not in text:
    target = "### 8.2 BRANCHING STRATEGY & COMMIT CONVENTIONS\n\nThe project adopts a streamlined Git-Flow branching strategy tailored for Agile Scrum cadence:"
    replacement = target + "\n\n[INSERT_FIGURE: figure_8_1_git_workflow.png | Figure 8.1: Git Feature-Branching and Sprint Release Model]"
    text = text.replace(target, replacement)

with open(MD_PATH, "w", encoding="utf-8") as f:
    f.write(text)

print("Inserted all 6 figure tags into PROJECT_REPORT.md.")
