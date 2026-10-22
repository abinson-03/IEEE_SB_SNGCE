import docx
import shutil
import os
import zipfile

INPUT_DOCX = r"C:\Users\Abinson Babu\.gemini\antigravity\brain\18c1487f-ab35-4cae-a538-c21dfac065a0\.user_uploaded\media_1792596558882_0f1ebc8d.docx"
TEMP_DIR = r"C:\Users\Abinson Babu\Desktop\ieee-sb-portal\docs\docx_temp"
FIGURES_DIR = r"C:\Users\Abinson Babu\Desktop\ieee-sb-portal\docs\figures"
OUTPUT_DOCX = r"C:\Users\Abinson Babu\Desktop\ieee-sb-portal\docs\PROJECT_REPORT.docx"
DOWNLOADS_DOCX = r"C:\Users\Abinson Babu\Downloads\ieee-sb-portal\docs\PROJECT_REPORT.docx"
ARTIFACT_DOCX = r"C:\Users\Abinson Babu\.gemini\antigravity\brain\18c1487f-ab35-4cae-a538-c21dfac065a0\PROJECT_REPORT.docx"

# 1. First let's inspect the exact abstract replacement text
ABSTRACT_P1 = (
    "The IEEE Student Branch at SNGCE encompasses multiple technical affinity groups and society chapters, "
    "including the Computer Society (CS), Computational Intelligence Society (CIS), Signal Processing Society (SPS), "
    "and Women in Engineering (WIE). Managing chapter-specific memberships, cross-chapter event calendars, attendee registrations, "
    "fee reconciliation with UPI payment proofs, physical attendance check-ins, certificate issuance, and executive task tracking "
    "has historically relied on fragmented manual tools such as static spreadsheets, social media groups, and generic forms. "
    "This fragmentation leads to administrative delays, duplicate registrations, unverified attendance records, manual errors in "
    "certificate generation, and poor institutional transparency."
)

ABSTRACT_P2 = (
    "To overcome these operational challenges, the IEEE SB SNGCE Portal was conceptualized, designed, and engineered as an integrated, "
    "centralized web platform built on the MERN technology stack (MongoDB, Express.js, React.js 19, and Node.js). The portal delivers "
    "a rigorous Role-Based Access Control (RBAC) hierarchy spanning five distinct roles: Public Guests, Student Members, Chapter ExeCom Officers, "
    "Chapter Administrators, and Super Administrators. The system features an interactive public portal showcasing upcoming events and society hubs, "
    "a dynamic event registration engine supporting UPI transaction proof uploads, live camera-driven QR attendance check-ins, automated "
    "cryptographically verifiable PDF certificates generated server-side via PDFKit, and real-time email dispatch via Nodemailer Gmail SMTP."
)

ABSTRACT_P3 = (
    "The application incorporates administrative workspaces for ExeCom duty assignments, chapter task kanban registers, official notice boards, "
    "moderated event photo galleries with geolocation metadata, and complete system audit logs tracking user activity. Developed under an agile "
    "Scrum framework across seven focused sprints, the architecture enforces robust input sanitization, JWT bearer token security, bcrypt password "
    "hashing, responsive Tailwind CSS interface styling, and scalable MongoDB schema design. Comprehensive acceptance testing and burn-down "
    "monitoring validate that the IEEE SB SNGCE Portal significantly reduces administrative overhead, eliminates certificate fraud, and establishes "
    "a unified digital infrastructure for institutional event governance."
)

print("Abstract prepared.")
