import os
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.patches as patches
from matplotlib.patches import FancyBboxPatch, Ellipse, Rectangle, Polygon
import numpy as np

FIGURES_DIR = r"C:\Users\Abinson Babu\Desktop\ieee-sb-portal\docs\figures"
os.makedirs(FIGURES_DIR, exist_ok=True)

# -------------------------------------------------------------
# Helper: Draw Stick Figure for UML Actor
# -------------------------------------------------------------
def draw_actor(ax, x, y, name, scale=1.0):
    head_radius = 0.22 * scale
    ax.add_patch(plt.Circle((x, y + 0.65 * scale), head_radius, fill=True, color='#0F172A', ec='#0F172A', lw=1.5))
    # Torso
    ax.plot([x, x], [y + 0.43 * scale, y - 0.1 * scale], color='#0F172A', lw=2.2)
    # Arms
    ax.plot([x - 0.35 * scale, x + 0.35 * scale], [y + 0.25 * scale, y + 0.25 * scale], color='#0F172A', lw=2.2)
    # Legs
    ax.plot([x, x - 0.3 * scale], [y - 0.1 * scale, y - 0.65 * scale], color='#0F172A', lw=2.2)
    ax.plot([x, x + 0.3 * scale], [y - 0.1 * scale, y - 0.65 * scale], color='#0F172A', lw=2.2)
    # Actor Label
    ax.text(x, y - 0.95 * scale, name, ha='center', va='top', fontsize=10, fontweight='bold', color='#0F172A')

# -------------------------------------------------------------
# 1. GENERATE USE CASE DIAGRAM
# -------------------------------------------------------------
def generate_use_case_diagram():
    fig, ax = plt.subplots(figsize=(13.5, 12), dpi=300)
    ax.set_xlim(0, 14)
    ax.set_ylim(0, 15)
    ax.axis('off')

    # Background Box (System Boundary)
    boundary = FancyBboxPatch((2.6, 0.6), 8.8, 13.8, boxstyle="round,pad=0.1,rounding_size=0.2",
                              facecolor='#F8FAFC', edgecolor='#0284C7', linewidth=2.5, linestyle='-')
    ax.add_patch(boundary)

    # Boundary Header
    ax.text(7.0, 14.1, "SYSTEM BOUNDARY: IEEE SB SNGCE PORTAL", ha='center', va='center',
            fontsize=12, fontweight='bold', color='#0369A1',
            bbox=dict(boxstyle="square,pad=0.4", facecolor='#E0F2FE', edgecolor='#0284C7', lw=1.2))

    # Actors Left
    draw_actor(ax, 1.2, 11.8, "Public Visitor\n(Prospective / Guest)", scale=0.7)
    draw_actor(ax, 1.2, 5.5, "Student Member\n(Registered)", scale=0.7)

    # Actors Right
    draw_actor(ax, 12.8, 10.5, "Chapter Officer\n(ExeCom Lead)", scale=0.7)
    draw_actor(ax, 12.8, 4.5, "Chapter / Super Admin\n(Administrator)", scale=0.7)

    # Use Cases: list of (x, y, text, id_code)
    use_cases = [
        # Public
        (7.0, 13.2, "Browse Chapters & Public Events", "UC01"),
        (7.0, 12.1, "Verify Certificate Authenticity", "UC02"),
        # Member & Auth
        (7.0, 11.0, "Register & Authenticate (JWT)", "UC03"),
        (7.0, 9.9, "Register for Event & Pay (UPI)", "UC04"),
        (7.0, 8.8, "Scan Dynamic QR for Attendance", "UC05"),
        (7.0, 7.7, "Download Cryptographic PDF Certificate", "UC06"),
        (7.0, 6.6, "Submit Chapter Join Request", "UC07"),
        # Officer
        (7.0, 5.5, "Manage Chapter Task Register", "UC08"),
        (7.0, 4.4, "Upload & Moderate Gallery Photos", "UC09"),
        (7.0, 3.3, "Generate Live Event Attendance QR", "UC10"),
        # Admin
        (7.0, 2.2, "Create & Publish Events / Budgets", "UC11"),
        (7.0, 1.1, "Audit System Logs & User Privileges", "UC12"),
    ]

    uc_centers = {}
    for (x, y, title, code) in use_cases:
        oval = FancyBboxPatch((x - 2.4, y - 0.38), 4.8, 0.76,
                              boxstyle="round,pad=0.08,rounding_size=0.38",
                              facecolor='#FFFFFF', edgecolor='#0F172A', linewidth=1.4)
        ax.add_patch(oval)
        ax.text(x, y + 0.08, title, ha='center', va='center', fontsize=9.2, fontweight='bold', color='#0F172A')
        ax.text(x, y - 0.22, f"[{code}]", ha='center', va='center', fontsize=7.5, color='#64748B', fontweight='semibold')
        uc_centers[code] = (x, y)

    # Connector lines
    def connect(actor_pos, uc_pos, color='#334155', lw=1.2, ls='-'):
        ax.plot([actor_pos[0], uc_pos[0]], [actor_pos[1], uc_pos[1]], color=color, lw=lw, ls=ls, zorder=1)

    # Public connections
    connect((1.8, 11.8), (4.6, 13.2))
    connect((1.8, 11.8), (4.6, 12.1))
    connect((1.8, 11.8), (4.6, 11.0))

    # Member connections
    connect((1.8, 5.5), (4.6, 11.0))
    connect((1.8, 5.5), (4.6, 9.9))
    connect((1.8, 5.5), (4.6, 8.8))
    connect((1.8, 5.5), (4.6, 7.7))
    connect((1.8, 5.5), (4.6, 6.6))

    # ExeCom Officer connections
    connect((12.2, 10.5), (9.4, 8.8))
    connect((12.2, 10.5), (9.4, 5.5))
    connect((12.2, 10.5), (9.4, 4.4))
    connect((12.2, 10.5), (9.4, 3.3))

    # Admin connections
    connect((12.2, 4.5), (9.4, 4.4))
    connect((12.2, 4.5), (9.4, 3.3))
    connect((12.2, 4.5), (9.4, 2.2))
    connect((12.2, 4.5), (9.4, 1.1))

    # Title Caption
    ax.text(7.0, 14.8, "Figure 1.4: Complete UML Use Case Diagram of IEEE SB SNGCE Portal",
            ha='center', va='center', fontsize=12, fontweight='bold', color='#0F172A')

    plt.tight_layout()
    out_file = os.path.join(FIGURES_DIR, "figure_1_4_use_case.png")
    plt.savefig(out_file, dpi=300, bbox_inches='tight')
    plt.close()
    print("Generated:", out_file)

# -------------------------------------------------------------
# 2. GENERATE ER DIAGRAM (Chen Notation / Academic Blue Style)
# -------------------------------------------------------------
def generate_er_diagram():
    fig, ax = plt.subplots(figsize=(15, 12), dpi=300)
    ax.set_xlim(0, 15)
    ax.set_ylim(0, 13)
    ax.axis('off')

    # Draw Entity Rectangle (Chen notation: Blue rectangle)
    def draw_entity(x, y, w, h, name):
        box = FancyBboxPatch((x - w/2, y - h/2), w, h, boxstyle="square,pad=0.0",
                             facecolor='#0284C7', edgecolor='#0369A1', linewidth=2.0)
        ax.add_patch(box)
        ax.text(x, y, name, ha='center', va='center', fontsize=10.5, fontweight='bold', color='#FFFFFF')

    # Draw Relationship Diamond
    def draw_relationship(x, y, size, name):
        pts = [[x, y + size], [x + size * 1.35, y], [x, y - size], [x - size * 1.35, y]]
        poly = Polygon(pts, closed=True, facecolor='#F8FAFC', edgecolor='#D97706', linewidth=2.0)
        ax.add_patch(poly)
        ax.text(x, y, name, ha='center', va='center', fontsize=8.5, fontweight='bold', color='#92400E')

    # Draw Attribute Oval
    def draw_attr(x, y, w, h, name, is_key=False):
        oval = Ellipse((x, y), w, h, facecolor='#FEF3C7' if is_key else '#F1F5F9',
                       edgecolor='#B45309' if is_key else '#64748B', linewidth=1.4)
        ax.add_patch(oval)
        text_obj = ax.text(x, y, name, ha='center', va='center', fontsize=7.5,
                           fontweight='bold' if is_key else 'normal',
                           color='#78350F' if is_key else '#1E293B')
        if is_key:
            # Underline key attributes
            text_obj.set_fontweight('bold')

    def link(p1, p2, label=None, label_pos=0.5, color='#475569'):
        ax.plot([p1[0], p2[0]], [p1[1], p2[1]], color=color, lw=1.5, zorder=1)
        if label:
            lx = p1[0] + (p2[0] - p1[0]) * label_pos
            ly = p1[1] + (p2[1] - p1[1]) * label_pos
            ax.text(lx, ly, label, fontsize=9, fontweight='bold', color='#0284C7',
                    bbox=dict(boxstyle="square,pad=0.15", facecolor='white', edgecolor='none'))

    # Entities Placement
    # Top Row: USER, UNIT
    draw_entity(3.5, 10.0, 2.2, 0.9, "USER")
    draw_entity(11.5, 10.0, 2.2, 0.9, "UNIT (CHAPTER)")

    # Relationship between USER and UNIT: "Belongs_To" / "Member_Of"
    draw_relationship(7.5, 10.0, 0.45, "MEMBER_OF")
    link((3.5, 10.0), (6.8, 10.0), "M")
    link((8.2, 10.0), (11.5, 10.0), "N")

    # Middle Row: EVENT, OFFICER_TASK
    draw_entity(11.5, 6.0, 2.2, 0.9, "EVENT")
    draw_entity(3.5, 6.0, 2.2, 0.9, "OFFICER_TASK")

    # UNIT organizes EVENT
    draw_relationship(11.5, 8.0, 0.45, "ORGANIZES")
    link((11.5, 10.0), (11.5, 8.5), "1")
    link((11.5, 7.5), (11.5, 6.0), "M")

    # USER assigned OFFICER_TASK
    draw_relationship(3.5, 8.0, 0.45, "ASSIGNED_TO")
    link((3.5, 10.0), (3.5, 8.5), "1")
    link((3.5, 7.5), (3.5, 6.0), "M")

    # USER registers for EVENT
    draw_relationship(7.5, 6.0, 0.45, "REGISTERS")
    link((3.5, 10.0), (6.8, 6.4), "M")
    link((8.2, 6.0), (11.5, 6.0), "N")

    # Bottom Row: CERTIFICATE, EVENT_PHOTO, AUDIT_LOG
    draw_entity(11.5, 2.0, 2.2, 0.9, "EVENT_PHOTO")
    draw_entity(7.5, 2.0, 2.2, 0.9, "CERTIFICATE")
    draw_entity(3.5, 2.0, 2.2, 0.9, "AUDIT_LOG")

    # EVENT contains EVENT_PHOTO
    draw_relationship(11.5, 4.0, 0.45, "CONTAINS")
    link((11.5, 6.0), (11.5, 4.5), "1")
    link((11.5, 3.5), (11.5, 2.0), "M")

    # EVENT issues CERTIFICATE
    draw_relationship(9.5, 4.0, 0.45, "ISSUES")
    link((11.5, 6.0), (9.8, 4.4), "1")
    link((9.2, 3.6), (7.5, 2.0), "M")

    # USER receives CERTIFICATE
    draw_relationship(5.5, 4.0, 0.45, "RECEIVES")
    link((3.5, 10.0), (5.2, 4.4), "1")
    link((5.8, 3.6), (7.5, 2.0), "M")

    # USER logs AUDIT_LOG
    draw_relationship(3.5, 4.0, 0.45, "GENERATES")
    link((3.5, 6.0), (3.5, 4.5), "1")
    link((3.5, 3.5), (3.5, 2.0), "M")

    # USER Attributes (Ovals around USER)
    draw_attr(1.5, 11.8, 1.4, 0.5, "_id (PK)", is_key=True)
    link((1.5, 11.5), (2.8, 10.4))

    draw_attr(3.5, 12.0, 1.4, 0.5, "name")
    link((3.5, 11.7), (3.5, 10.5))

    draw_attr(5.2, 11.8, 1.4, 0.5, "email (UQ)", is_key=True)
    link((5.0, 11.5), (4.2, 10.4))

    draw_attr(1.2, 10.5, 1.4, 0.5, "password")
    link((1.9, 10.5), (2.4, 10.1))

    draw_attr(1.2, 9.4, 1.4, 0.5, "globalRole")
    link((1.9, 9.5), (2.4, 9.8))

    # UNIT Attributes
    draw_attr(13.8, 11.6, 1.4, 0.5, "_id (PK)", is_key=True)
    link((13.3, 11.4), (12.3, 10.4))

    draw_attr(11.5, 12.0, 1.4, 0.5, "code (CS/CIS..)")
    link((11.5, 11.7), (11.5, 10.5))

    draw_attr(9.6, 11.6, 1.4, 0.5, "name")
    link((10.1, 11.4), (10.7, 10.4))

    # EVENT Attributes
    draw_attr(13.8, 7.3, 1.4, 0.5, "_id (PK)", is_key=True)
    link((13.3, 7.1), (12.4, 6.4))

    draw_attr(13.8, 6.0, 1.4, 0.5, "title")
    link((13.1, 6.0), (12.6, 6.0))

    draw_attr(13.8, 4.8, 1.4, 0.5, "date & venue")
    link((13.3, 5.0), (12.4, 5.7))

    draw_attr(10.0, 7.3, 1.4, 0.5, "fee & upiId")
    link((10.4, 7.1), (11.0, 6.4))

    # CERTIFICATE Attributes
    draw_attr(7.5, 0.7, 1.6, 0.5, "certificateId (UQ)", is_key=True)
    link((7.5, 1.0), (7.5, 1.5))

    draw_attr(9.3, 1.0, 1.4, 0.5, "pdfPath")
    link((9.0, 1.2), (8.2, 1.7))

    draw_attr(5.7, 1.0, 1.4, 0.5, "issuedAt")
    link((6.0, 1.2), (6.8, 1.7))

    # Title Caption
    ax.text(7.5, 12.7, "Figure 4.2: Entity-Relationship (ER) Diagram (Chen Notation) of IEEE SB SNGCE Portal",
            ha='center', va='center', fontsize=12, fontweight='bold', color='#0F172A')

    plt.tight_layout()
    out_file = os.path.join(FIGURES_DIR, "figure_4_2_er_diagram.png")
    plt.savefig(out_file, dpi=300, bbox_inches='tight')
    plt.close()
    print("Generated:", out_file)

# -------------------------------------------------------------
# 3. GENERATE MERN ARCHITECTURE DIAGRAM
# -------------------------------------------------------------
def generate_architecture_diagram():
    fig, ax = plt.subplots(figsize=(13, 10), dpi=300)
    ax.set_xlim(0, 14)
    ax.set_ylim(0, 11)
    ax.axis('off')

    layers = [
        ("TIER 1: PRESENTATION LAYER (CLIENT SPA)", 8.8, 1.8, '#EFF6FF', '#1D4ED8',
         ["React.js 19 SPA (Vite/CRA)", "Tailwind CSS & IEEE Styling", "Lucide React UI Icons",
          "HTML5 QR Scanner (Camera)", "Interactive Canvas Cert Viewer", "Axios Interceptors & JWT Storage"]),

        ("TIER 2: API ROUTING & SECURITY GATEWAY (EXPRESS.JS)", 6.2, 1.8, '#F0FDF4', '#15803D',
         ["Express.js HTTP Router", "JWT Auth & Bearer Middleware", "RBAC Role Verification Guards",
          "Multer Multipart (Photo/Proof)", "CORS & Helmet Security Headers", "Rate Limiter & Input Sanitizer"]),

        ("TIER 3: BUSINESS LOGIC & APPLICATION SERVICES", 3.6, 1.8, '#FEFCE8', '#A16207',
         ["Event Lifecycle Controller", "QR Code Generation Service", "PDFKit Certificate Engine",
          "Nodemailer Gmail SMTP Service", "Task & Duty Management Engine", "Audit Trail & Activity Logger"]),

        ("TIER 4: PERSISTENCE & DATA STORAGE LAYER", 1.0, 1.8, '#F8FAFC', '#475569',
         ["MongoDB Database (Collections)", "Mongoose ODM & Schemas", "Disk Storage: /uploads/gallery",
          "Disk Storage: /uploads/certs", "Disk Storage: /uploads/avatars", "Disk Storage: /uploads/receipts"])
    ]

    for title, y, h, bg, border, items in layers:
        box = FancyBboxPatch((1.0, y), 12.0, h, boxstyle="round,pad=0.08,rounding_size=0.15",
                             facecolor=bg, edgecolor=border, linewidth=2.0)
        ax.add_patch(box)
        ax.text(1.3, y + h - 0.28, title, fontsize=11, fontweight='bold', color=border)

        # Draw components inside layer
        for idx, item in enumerate(items):
            col = idx % 3
            row = idx // 3
            cx = 1.4 + col * 3.8
            cy = y + h - 0.7 - row * 0.55
            cbox = FancyBboxPatch((cx, cy - 0.18), 3.6, 0.42, boxstyle="round,pad=0.04,rounding_size=0.08",
                                  facecolor='#FFFFFF', edgecolor=border, linewidth=1.0)
            ax.add_patch(cbox)
            ax.text(cx + 1.8, cy + 0.03, item, ha='center', va='center', fontsize=8.8, fontweight='medium', color='#0F172A')

    # Draw vertical bi-directional arrows between layers
    for y_arr in [8.7, 6.1, 3.5]:
        ax.annotate('', xy=(7.0, y_arr), xytext=(7.0, y_arr - 0.6),
                    arrowprops=dict(arrowstyle='<->', color='#0284C7', lw=2.5))
        ax.text(7.2, y_arr - 0.3, "JSON / REST API / Mongoose Query", fontsize=8.5, color='#0284C7', fontweight='bold')

    ax.text(7.0, 10.7, "Figure 4.1: 4-Tier MERN Architecture Diagram of IEEE SB SNGCE Portal",
            ha='center', va='center', fontsize=12, fontweight='bold', color='#0F172A')

    plt.tight_layout()
    out_file = os.path.join(FIGURES_DIR, "figure_4_1_architecture.png")
    plt.savefig(out_file, dpi=300, bbox_inches='tight')
    plt.close()
    print("Generated:", out_file)

# -------------------------------------------------------------
# 4. GENERATE REPOSITORY & SPRINT WORKFLOW DIAGRAM
# -------------------------------------------------------------
def generate_git_workflow():
    fig, ax = plt.subplots(figsize=(13, 8), dpi=300)
    ax.set_xlim(0, 14)
    ax.set_ylim(0, 8.5)
    ax.axis('off')

    # Main Branch
    ax.plot([1.5, 12.5], [6.5, 6.5], color='#1E293B', lw=3.0, zorder=1)
    ax.text(0.8, 6.5, "main", ha='center', va='center', fontsize=11, fontweight='bold', color='#1E293B')

    # Develop Branch
    ax.plot([2.5, 12.5], [4.5, 4.5], color='#0284C7', lw=3.0, zorder=1)
    ax.text(1.8, 4.5, "develop", ha='center', va='center', fontsize=11, fontweight='bold', color='#0284C7')

    # Sprint Branches
    sprints = [
        ("sprint-1: Foundation & RBAC", 3.0, 2.5),
        ("sprint-2: Unit Hubs & ExeCom", 4.8, 2.5),
        ("sprint-3: Event Lifecycle & UPI", 6.6, 2.5),
        ("sprint-4: QR Attendance", 8.4, 2.5),
        ("sprint-5: Automated Certs", 10.2, 2.5),
    ]

    for title, x, y in sprints:
        # Commit on develop
        ax.plot([x, x], [4.5, 3.0], color='#D97706', lw=1.8, linestyle='--')
        ax.scatter([x], [4.5], color='#0284C7', s=120, zorder=3)
        ax.scatter([x], [3.0], color='#D97706', s=90, zorder=3)

        box = FancyBboxPatch((x - 0.8, y - 0.7), 1.6, 0.9, boxstyle="round,pad=0.05,rounding_size=0.1",
                             facecolor='#FEF3C7', edgecolor='#D97706', lw=1.2)
        ax.add_patch(box)
        ax.text(x, y - 0.25, title.split(':')[0], ha='center', va='center', fontsize=8.5, fontweight='bold', color='#92400E')
        ax.text(x, y - 0.5, title.split(':')[1], ha='center', va='center', fontsize=7.2, color='#78350F')

        # Merge back to develop
        ax.plot([x, x + 0.6], [3.0, 4.5], color='#16A34A', lw=1.8, linestyle='-')
        ax.scatter([x + 0.6], [4.5], color='#16A34A', s=100, zorder=3)

    # Releases to main
    for rel_x, tag in [(5.5, "v1.0-RC1"), (9.5, "v2.0-RC2"), (12.0, "v3.0-Production")]:
        ax.plot([rel_x, rel_x], [4.5, 6.5], color='#1E293B', lw=2.0, linestyle='-')
        ax.scatter([rel_x], [6.5], color='#1E293B', s=140, zorder=4)
        ax.text(rel_x, 7.0, tag, ha='center', va='center', fontsize=8.8, fontweight='bold', color='#1E293B',
                bbox=dict(boxstyle="square,pad=0.2", facecolor='#F1F5F9', edgecolor='#94A3B8'))

    ax.text(7.0, 8.0, "Figure 8.1: Git Feature-Branching and Sprint Release Model for IEEE SB SNGCE Portal",
            ha='center', va='center', fontsize=12, fontweight='bold', color='#0F172A')

    plt.tight_layout()
    out_file = os.path.join(FIGURES_DIR, "figure_8_1_git_workflow.png")
    plt.savefig(out_file, dpi=300, bbox_inches='tight')
    plt.close()
    print("Generated:", out_file)

if __name__ == "__main__":
    generate_use_case_diagram()
    generate_er_diagram()
    generate_architecture_diagram()
    generate_git_workflow()
    print("All diagrams generated successfully!")
