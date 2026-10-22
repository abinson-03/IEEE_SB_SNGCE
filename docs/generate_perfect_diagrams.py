import os
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.patches as patches
from matplotlib.patches import FancyBboxPatch, Ellipse, Polygon
import numpy as np

FIGURES_DIR = r"C:\Users\Abinson Babu\Desktop\ieee-sb-portal\docs\figures"
os.makedirs(FIGURES_DIR, exist_ok=True)

# Set global matplotlib font properties for maximum clarity
plt.rcParams['font.family'] = 'sans-serif'
plt.rcParams['font.sans-serif'] = ['DejaVu Sans', 'Arial', 'Helvetica']
plt.rcParams['axes.edgecolor'] = '#334155'
plt.rcParams['axes.linewidth'] = 1.2

# -------------------------------------------------------------
# 1. CRISP USE CASE DIAGRAM (Aspect ratio ~ 1.4 : 1)
# -------------------------------------------------------------
def generate_use_case_diagram():
    fig, ax = plt.subplots(figsize=(11, 8.5), dpi=300)
    ax.set_xlim(0, 11)
    ax.set_ylim(0, 8.5)
    ax.axis('off')

    # Draw Actor
    def draw_stick_actor(x, y, name, role):
        # Head
        ax.add_patch(plt.Circle((x, y + 0.42), 0.16, facecolor='#0F172A', edgecolor='#0F172A', lw=1.5, zorder=4))
        # Body
        ax.plot([x, x], [y + 0.26, y - 0.12], color='#0F172A', lw=2.2, zorder=4)
        # Arms
        ax.plot([x - 0.25, x + 0.25], [y + 0.14, y + 0.14], color='#0F172A', lw=2.2, zorder=4)
        # Legs
        ax.plot([x, x - 0.22], [y - 0.12, y - 0.45], color='#0F172A', lw=2.2, zorder=4)
        ax.plot([x, x + 0.22], [y - 0.12, y - 0.45], color='#0F172A', lw=2.2, zorder=4)
        # Label
        ax.text(x, y - 0.65, name, ha='center', va='top', fontsize=9.5, fontweight='bold', color='#0F172A')
        ax.text(x, y - 0.85, role, ha='center', va='top', fontsize=8.0, color='#475569')

    # Boundary Box
    boundary = FancyBboxPatch((2.2, 0.5), 6.6, 7.5, boxstyle="round,pad=0.08,rounding_size=0.15",
                              facecolor='#F8FAFC', edgecolor='#00629B', linewidth=2.5)
    ax.add_patch(boundary)

    # Header
    ax.text(5.5, 7.7, "SYSTEM BOUNDARY: IEEE SB SNGCE PORTAL", ha='center', va='center',
            fontsize=11.5, fontweight='bold', color='#00629B',
            bbox=dict(boxstyle="round,pad=0.35,rounding_size=0.1", facecolor='#E0F2FE', edgecolor='#00629B', lw=1.5))

    # Actors
    draw_stick_actor(1.1, 6.2, "Public Visitor", "(Prospective / Guest)")
    draw_stick_actor(1.1, 2.6, "Student Member", "(Registered Student)")

    draw_stick_actor(9.9, 6.0, "ExeCom Officer", "(Chapter Executive)")
    draw_stick_actor(9.9, 2.4, "Chapter / Admin", "(Administrator)")

    # 10 Clear Use Cases
    cases = [
        (5.5, 7.0, "Browse Society Portfolios & Events", "UC01"),
        (5.5, 6.3, "User Registration & JWT Login", "UC02"),
        (5.5, 5.6, "Register for Event with UPI Proof", "UC03"),
        (5.5, 4.9, "Dynamic QR Attendance Check-In", "UC04"),
        (5.5, 4.2, "Download Cryptographic PDF Certificate", "UC05"),
        (5.5, 3.5, "Apply for Chapter Membership", "UC06"),
        (5.5, 2.8, "Manage Duty Tasks & Kanban", "UC07"),
        (5.5, 2.1, "Moderate Event Photo Gallery", "UC08"),
        (5.5, 1.4, "Create & Publish Events / Budgets", "UC09"),
        (5.5, 0.7, "Audit System Logs & Permissions", "UC10"),
    ]

    for (x, y, label, code) in cases:
        oval = FancyBboxPatch((x - 2.1, y - 0.26), 4.2, 0.52,
                              boxstyle="round,pad=0.05,rounding_size=0.26",
                              facecolor='#FFFFFF', edgecolor='#1E293B', linewidth=1.5, zorder=3)
        ax.add_patch(oval)
        ax.text(x, y + 0.04, label, ha='center', va='center', fontsize=8.8, fontweight='bold', color='#0F172A', zorder=4)
        ax.text(x, y - 0.16, f"[{code}]", ha='center', va='center', fontsize=7.2, color='#0284C7', fontweight='bold', zorder=4)

    # Connections
    def connect(p1, p2):
        ax.plot([p1[0], p2[0]], [p1[1], p2[1]], color='#475569', lw=1.3, zorder=2)

    # Public Visitor
    connect((1.5, 6.2), (3.4, 7.0))
    connect((1.5, 6.2), (3.4, 6.3))

    # Student Member
    connect((1.5, 2.6), (3.4, 6.3))
    connect((1.5, 2.6), (3.4, 5.6))
    connect((1.5, 2.6), (3.4, 4.9))
    connect((1.5, 2.6), (3.4, 4.2))
    connect((1.5, 2.6), (3.4, 3.5))

    # ExeCom Officer
    connect((9.5, 6.0), (7.6, 4.9))
    connect((9.5, 6.0), (7.6, 2.8))
    connect((9.5, 6.0), (7.6, 2.1))

    # Chapter / Super Admin
    connect((9.5, 2.4), (7.6, 2.1))
    connect((9.5, 2.4), (7.6, 1.4))
    connect((9.5, 2.4), (7.6, 0.7))

    ax.text(5.5, 8.25, "Figure 1.4: Complete UML Use Case Diagram of IEEE SB SNGCE Portal",
            ha='center', va='center', fontsize=11, fontweight='bold', color='#0F172A')

    plt.tight_layout()
    out = os.path.join(FIGURES_DIR, "figure_1_4_use_case.png")
    plt.savefig(out, dpi=300, bbox_inches='tight')
    plt.close()
    print("Generated:", out)

# -------------------------------------------------------------
# 2. CRISP ER DIAGRAM (Chen Notation, Blue Entities, Gold Diamonds)
# -------------------------------------------------------------
def generate_er_diagram():
    fig, ax = plt.subplots(figsize=(12, 8.5), dpi=300)
    ax.set_xlim(0, 12)
    ax.set_ylim(0, 8.5)
    ax.axis('off')

    # Entity Box (Academic Blue)
    def draw_entity(x, y, w, h, name):
        box = FancyBboxPatch((x - w/2, y - h/2), w, h, boxstyle="square,pad=0.0",
                             facecolor='#0284C7', edgecolor='#0369A1', linewidth=2.0, zorder=3)
        ax.add_patch(box)
        ax.text(x, y, name, ha='center', va='center', fontsize=10, fontweight='bold', color='#FFFFFF', zorder=4)

    # Relationship Diamond
    def draw_diamond(x, y, s, name):
        pts = [[x, y + s], [x + s * 1.35, y], [x, y - s], [x - s * 1.35, y]]
        poly = Polygon(pts, closed=True, facecolor='#FEF3C7', edgecolor='#D97706', linewidth=1.8, zorder=3)
        ax.add_patch(poly)
        ax.text(x, y, name, ha='center', va='center', fontsize=8.2, fontweight='bold', color='#92400E', zorder=4)

    # Attribute Oval
    def draw_attr(x, y, w, h, name, is_key=False):
        oval = Ellipse((x, y), w, h, facecolor='#F1F5F9' if not is_key else '#FEF3C7',
                       edgecolor='#64748B' if not is_key else '#B45309', linewidth=1.4, zorder=3)
        ax.add_patch(oval)
        ax.text(x, y, name, ha='center', va='center', fontsize=7.6,
                fontweight='bold' if is_key else 'normal',
                color='#78350F' if is_key else '#1E293B', zorder=4)

    def link(p1, p2, label=None, label_pos=0.5):
        ax.plot([p1[0], p2[0]], [p1[1], p2[1]], color='#64748B', lw=1.5, zorder=2)
        if label:
            lx = p1[0] + (p2[0] - p1[0]) * label_pos
            ly = p1[1] + (p2[1] - p1[1]) * label_pos
            ax.text(lx, ly, label, fontsize=9, fontweight='bold', color='#00629B',
                    bbox=dict(boxstyle="square,pad=0.15", facecolor='white', edgecolor='none', alpha=0.9), zorder=4)

    # Main Entities
    draw_entity(3.0, 6.8, 2.2, 0.8, "USER")
    draw_entity(9.0, 6.8, 2.2, 0.8, "UNIT (CHAPTER)")
    draw_entity(9.0, 4.0, 2.2, 0.8, "EVENT")
    draw_entity(3.0, 4.0, 2.2, 0.8, "OFFICER_TASK")
    draw_entity(6.0, 1.5, 2.2, 0.8, "CERTIFICATE")
    draw_entity(9.0, 1.5, 2.2, 0.8, "EVENT_PHOTO")
    draw_entity(3.0, 1.5, 2.2, 0.8, "AUDIT_LOG")

    # Diamonds & Links
    # USER - UNIT
    draw_diamond(6.0, 6.8, 0.38, "MEMBER_OF")
    link((3.0, 6.8), (5.5, 6.8), "M")
    link((6.5, 6.8), (9.0, 6.8), "N")

    # UNIT - EVENT
    draw_diamond(9.0, 5.4, 0.38, "ORGANIZES")
    link((9.0, 6.8), (9.0, 5.8), "1")
    link((9.0, 5.0), (9.0, 4.0), "M")

    # USER - EVENT
    draw_diamond(6.0, 5.4, 0.38, "REGISTERS")
    link((3.0, 6.8), (5.5, 5.4), "M")
    link((6.5, 5.4), (9.0, 4.0), "N")

    # USER - OFFICER_TASK
    draw_diamond(3.0, 5.4, 0.38, "ASSIGNED_TO")
    link((3.0, 6.8), (3.0, 5.8), "1")
    link((3.0, 5.0), (3.0, 4.0), "M")

    # EVENT - CERTIFICATE
    draw_diamond(7.5, 2.8, 0.38, "ISSUES")
    link((9.0, 4.0), (7.8, 2.9), "1")
    link((7.2, 2.7), (6.0, 1.5), "M")

    # USER - CERTIFICATE
    draw_diamond(4.5, 2.8, 0.38, "RECEIVES")
    link((3.0, 6.8), (4.2, 2.9), "1")
    link((4.8, 2.7), (6.0, 1.5), "M")

    # EVENT - EVENT_PHOTO
    draw_diamond(9.0, 2.8, 0.38, "CONTAINS")
    link((9.0, 4.0), (9.0, 3.2), "1")
    link((9.0, 2.4), (9.0, 1.5), "M")

    # USER - AUDIT_LOG
    draw_diamond(3.0, 2.8, 0.38, "LOGS")
    link((3.0, 4.0), (3.0, 3.2), "1")
    link((3.0, 2.4), (3.0, 1.5), "M")

    # Attributes (USER)
    draw_attr(1.3, 7.8, 1.4, 0.45, "_id (PK)", is_key=True)
    link((1.3, 7.55), (2.3, 7.1))
    draw_attr(3.0, 8.0, 1.4, 0.45, "name")
    link((3.0, 7.75), (3.0, 7.2))
    draw_attr(4.7, 7.8, 1.4, 0.45, "email (UQ)", is_key=True)
    link((4.5, 7.55), (3.7, 7.1))

    # Attributes (UNIT)
    draw_attr(10.7, 7.8, 1.4, 0.45, "_id (PK)", is_key=True)
    link((10.5, 7.55), (9.7, 7.1))
    draw_attr(9.0, 8.0, 1.4, 0.45, "code (CS/CIS)")
    link((9.0, 7.75), (9.0, 7.2))
    draw_attr(7.3, 7.8, 1.4, 0.45, "name")
    link((7.5, 7.55), (8.3, 7.1))

    # Attributes (EVENT)
    draw_attr(10.8, 4.5, 1.4, 0.45, "_id (PK)", is_key=True)
    link((10.5, 4.4), (9.8, 4.2))
    draw_attr(10.8, 3.8, 1.4, 0.45, "title & date")
    link((10.5, 3.9), (9.8, 4.0))

    # Attributes (CERTIFICATE)
    draw_attr(6.0, 0.4, 1.8, 0.45, "certificateId (UQ)", is_key=True)
    link((6.0, 0.65), (6.0, 1.1))

    ax.text(6.0, 8.25, "Figure 4.2: Entity-Relationship (ER) Diagram (Chen Notation) of IEEE SB SNGCE Portal",
            ha='center', va='center', fontsize=11, fontweight='bold', color='#0F172A')

    plt.tight_layout()
    out = os.path.join(FIGURES_DIR, "figure_4_2_er_diagram.png")
    plt.savefig(out, dpi=300, bbox_inches='tight')
    plt.close()
    print("Generated:", out)

# -------------------------------------------------------------
# 3. CRISP ARCHITECTURE DIAGRAM (Stacked Clean 4 Tiers)
# -------------------------------------------------------------
def generate_architecture_diagram():
    fig, ax = plt.subplots(figsize=(11, 8.0), dpi=300)
    ax.set_xlim(0, 11)
    ax.set_ylim(0, 8.0)
    ax.axis('off')

    tiers = [
        ("TIER 1: PRESENTATION LAYER (CLIENT SPA)", 6.1, 1.4, '#EFF6FF', '#1D4ED8',
         ["React.js 19 SPA (Vite/CRA)", "Tailwind CSS Design System", "Lucide React UI Icons",
          "HTML5 QR Scanner (Camera)", "Interactive Canvas Cert Viewer", "Axios Interceptors & JWT Storage"]),

        ("TIER 2: API ROUTING & SECURITY GATEWAY (EXPRESS.JS)", 4.2, 1.4, '#F0FDF4', '#15803D',
         ["Express.js HTTP Router", "JWT Auth & Bearer Middleware", "RBAC Verification Guards",
          "Multer Multipart (Photo/Proof)", "CORS & Helmet Headers", "Rate Limiter & Input Sanitizer"]),

        ("TIER 3: BUSINESS LOGIC & APPLICATION SERVICES", 2.3, 1.4, '#FEFCE8', '#B45309',
         ["Event Lifecycle Controller", "QR Attendance Service", "PDFKit Certificate Engine",
          "Nodemailer Gmail SMTP", "Task & Duty Kanban Engine", "Audit Trail & Activity Logger"]),

        ("TIER 4: PERSISTENCE & DATA STORAGE LAYER", 0.4, 1.4, '#F8FAFC', '#475569',
         ["MongoDB Database (Collections)", "Mongoose ODM & Schemas", "Disk: /uploads/gallery",
          "Disk: /uploads/certs", "Disk: /uploads/avatars", "Disk: /uploads/receipts"])
    ]

    for title, y, h, bg, border, items in tiers:
        box = FancyBboxPatch((0.8, y), 9.4, h, boxstyle="round,pad=0.06,rounding_size=0.12",
                             facecolor=bg, edgecolor=border, linewidth=1.8)
        ax.add_patch(box)
        ax.text(1.0, y + h - 0.22, title, fontsize=9.8, fontweight='bold', color=border)

        for idx, item in enumerate(items):
            col = idx % 3
            row = idx // 3
            cx = 1.0 + col * 3.0
            cy = y + h - 0.55 - row * 0.42
            cbox = FancyBboxPatch((cx, cy - 0.14), 2.8, 0.32, boxstyle="round,pad=0.03,rounding_size=0.06",
                                  facecolor='#FFFFFF', edgecolor=border, linewidth=0.9)
            ax.add_patch(cbox)
            ax.text(cx + 1.4, cy + 0.02, item, ha='center', va='center', fontsize=7.8, fontweight='semibold', color='#0F172A')

    # Connecting arrows
    for y_arr in [6.05, 4.15, 2.25]:
        ax.annotate('', xy=(5.5, y_arr), xytext=(5.5, y_arr - 0.45),
                    arrowprops=dict(arrowstyle='<->', color='#00629B', lw=2.0))
        ax.text(5.65, y_arr - 0.22, "JSON / REST API / Mongoose Query", fontsize=7.6, color='#00629B', fontweight='bold')

    ax.text(5.5, 7.8, "Figure 4.1: 4-Tier MERN Architecture Diagram of IEEE SB SNGCE Portal",
            ha='center', va='center', fontsize=11, fontweight='bold', color='#0F172A')

    plt.tight_layout()
    out = os.path.join(FIGURES_DIR, "figure_4_1_architecture.png")
    plt.savefig(out, dpi=300, bbox_inches='tight')
    plt.close()
    print("Generated:", out)

# -------------------------------------------------------------
# 4. CRISP SEQUENCE DIAGRAM (Event Registration to Certificate)
# -------------------------------------------------------------
def generate_sequence_diagram():
    fig, ax = plt.subplots(figsize=(11, 7.5), dpi=300)
    ax.set_xlim(0, 11)
    ax.set_ylim(0, 7.5)
    ax.axis('off')

    actors = [
        ("Student / Member", 1.2),
        ("React.js SPA", 3.4),
        ("Express.js API", 5.6),
        ("MongoDB Database", 7.8),
        ("Gmail / PDFKit", 9.8)
    ]

    for name, x in actors:
        # Top Box
        box = FancyBboxPatch((x - 0.9, 6.7), 1.8, 0.5, boxstyle="round,pad=0.04,rounding_size=0.08",
                             facecolor='#0284C7', edgecolor='#0369A1', lw=1.4)
        ax.add_patch(box)
        ax.text(x, 6.95, name, ha='center', va='center', fontsize=8.2, fontweight='bold', color='#FFFFFF')

        # Lifeline
        ax.plot([x, x], [6.7, 0.8], color='#94A3B8', linestyle='--', lw=1.4, zorder=0)

        # Bottom Box
        box_b = FancyBboxPatch((x - 0.9, 0.3), 1.8, 0.5, boxstyle="round,pad=0.04,rounding_size=0.08",
                               facecolor='#0284C7', edgecolor='#0369A1', lw=1.4)
        ax.add_patch(box_b)
        ax.text(x, 0.55, name, ha='center', va='center', fontsize=8.2, fontweight='bold', color='#FFFFFF')

    # Sequence Messages
    steps = [
        (6.2, 1.2, 3.4, "1: Click Register & Attach UPI Proof", False),
        (5.7, 3.4, 5.6, "2: POST /api/events/:id/register", False),
        (5.2, 5.6, 7.8, "3: Store Registration & Payment Status", False),
        (4.7, 7.8, 5.6, "4: Registration Record Saved", True),
        (4.2, 5.6, 3.4, "5: 201 Created (Dynamic QR Ticket Issued)", True),
        (3.6, 1.2, 5.6, "6: Scan QR at Venue (POST /api/attendance/scan)", False),
        (3.1, 5.6, 7.8, "7: Mark Attendance Status: Present", False),
        (2.6, 5.6, 9.8, "8: Trigger PDFKit Certificate Engine", False),
        (2.1, 9.8, 7.8, "9: Save Cryptographic Certificate ID", False),
        (1.6, 9.8, 1.2, "10: Email Signed Certificate PDF via Gmail SMTP", True),
        (1.1, 3.4, 1.2, "11: Display Verified Attendance Badge", True)
    ]

    for y, x1, x2, msg, is_return in steps:
        style = '--' if is_return else '-'
        color = '#15803D' if is_return else '#0F172A'
        ax.annotate('', xy=(x2, y), xytext=(x1, y),
                    arrowprops=dict(arrowstyle='->', color=color, lw=1.5, linestyle=style))
        mid_x = (x1 + x2) / 2
        ax.text(mid_x, y + 0.1, msg, ha='center', va='bottom', fontsize=7.2, fontweight='semibold', color=color,
                bbox=dict(boxstyle="square,pad=0.12", facecolor='white', edgecolor='none', alpha=0.9))

    ax.text(5.5, 7.3, "Figure 5.3: UML Sequence Diagram - Event Registration, Attendance & Certificate Issuance",
            ha='center', va='center', fontsize=11, fontweight='bold', color='#0F172A')

    plt.tight_layout()
    out = os.path.join(FIGURES_DIR, "figure_5_3_sequence_diagram.png")
    plt.savefig(out, dpi=300, bbox_inches='tight')
    plt.close()
    print("Generated:", out)

# -------------------------------------------------------------
# 5. CRISP BURNDOWN CHART
# -------------------------------------------------------------
def generate_burndown_chart():
    fig, ax = plt.subplots(figsize=(10, 6.0), dpi=300)

    sprints = ['Sprint 0\n(Planning)', 'Sprint 1\n(Auth/RBAC)', 'Sprint 2\n(Unit Hubs)',
               'Sprint 3\n(Events/UPI)', 'Sprint 4\n(QR Attend)', 'Sprint 5\n(Certificates)',
               'Sprint 6\n(Gallery/Tasks)', 'Sprint 7\n(Review/Audit)']
    x = np.arange(len(sprints))

    ideal_points = [140, 120, 100, 80, 60, 40, 20, 0]
    actual_points = [140, 122, 98, 82, 58, 36, 18, 0]

    ax.plot(x, ideal_points, color='#94A3B8', linestyle='--', linewidth=2.2, marker='s',
            label='Ideal Burndown (Linear velocity: 20 pts/sprint)')
    ax.plot(x, actual_points, color='#00629B', linestyle='-', linewidth=2.8, marker='o',
            markersize=7, markerfacecolor='#0369A1', label='Actual Burndown (Story Points Remaining)')

    ax.fill_between(x, actual_points, color='#E0F2FE', alpha=0.45)

    for i, txt in enumerate(actual_points):
        ax.annotate(f"{txt} pts", (x[i], actual_points[i] + 4), ha='center', fontsize=8.5,
                    fontweight='bold', color='#00629B')

    ax.set_title("Product Burndown Chart Across Seven Sprints (140 Story Points Total)",
                 fontsize=11.5, fontweight='bold', color='#0F172A', pad=12)
    ax.set_xlabel("Scrum Sprints Timeline", fontsize=10, fontweight='bold', color='#334155', labelpad=8)
    ax.set_ylabel("Remaining Story Points", fontsize=10, fontweight='bold', color='#334155', labelpad=8)
    ax.set_xticks(x)
    ax.set_xticklabels(sprints, fontsize=8.5)
    ax.set_ylim(-5, 160)
    ax.grid(True, linestyle=':', alpha=0.6)
    ax.legend(loc='upper right', frameon=True, fontsize=9)

    plt.figtext(0.5, 0.02, "Figure 4.5: Scrum Burndown Chart for IEEE SB SNGCE Portal",
               ha='center', fontsize=10.5, fontweight='bold', color='#0F172A')

    plt.tight_layout(rect=[0, 0.05, 1, 1])
    out = os.path.join(FIGURES_DIR, "figure_4_5_burndown_chart.png")
    plt.savefig(out, dpi=300, bbox_inches='tight')
    plt.close()
    print("Generated:", out)

# -------------------------------------------------------------
# 6. CRISP GIT WORKFLOW DIAGRAM
# -------------------------------------------------------------
def generate_git_workflow():
    fig, ax = plt.subplots(figsize=(10, 6.0), dpi=300)
    ax.set_xlim(0, 10)
    ax.set_ylim(0, 6.0)
    ax.axis('off')

    # Main Branch
    ax.plot([1.2, 9.2], [4.5, 4.5], color='#1E293B', lw=2.5, zorder=1)
    ax.text(0.6, 4.5, "main", ha='center', va='center', fontsize=10, fontweight='bold', color='#1E293B')

    # Develop Branch
    ax.plot([1.8, 9.2], [3.0, 3.0], color='#0284C7', lw=2.5, zorder=1)
    ax.text(1.2, 3.0, "develop", ha='center', va='center', fontsize=10, fontweight='bold', color='#0284C7')

    # Sprints
    sprints = [
        ("sprint-1: RBAC", 2.2),
        ("sprint-2: Unit Hubs", 3.5),
        ("sprint-3: Events/UPI", 4.8),
        ("sprint-4: QR Attend", 6.1),
        ("sprint-5: Certs", 7.4)
    ]

    for title, x in sprints:
        ax.plot([x, x], [3.0, 1.8], color='#D97706', lw=1.5, linestyle='--')
        ax.scatter([x], [3.0], color='#0284C7', s=80, zorder=3)
        ax.scatter([x], [1.8], color='#D97706', s=60, zorder=3)

        box = FancyBboxPatch((x - 0.55, 1.0), 1.1, 0.6, boxstyle="round,pad=0.03,rounding_size=0.06",
                             facecolor='#FEF3C7', edgecolor='#D97706', lw=1.0)
        ax.add_patch(box)
        ax.text(x, 1.3, title, ha='center', va='center', fontsize=6.8, fontweight='bold', color='#92400E')

        # Merge back
        ax.plot([x, x + 0.4], [1.8, 3.0], color='#16A34A', lw=1.5)
        ax.scatter([x + 0.4], [3.0], color='#16A34A', s=70, zorder=3)

    # Releases
    for rel_x, tag in [(4.0, "v1.0-RC"), (6.8, "v2.0-RC"), (8.8, "v3.0-Production")]:
        ax.plot([rel_x, rel_x], [3.0, 4.5], color='#1E293B', lw=1.8)
        ax.scatter([rel_x], [4.5], color='#1E293B', s=100, zorder=4)
        ax.text(rel_x, 5.0, tag, ha='center', va='center', fontsize=8.0, fontweight='bold', color='#1E293B',
                bbox=dict(boxstyle="square,pad=0.18", facecolor='#F1F5F9', edgecolor='#94A3B8'))

    ax.text(5.0, 5.7, "Figure 8.1: Git Feature-Branching and Sprint Release Model for IEEE SB SNGCE Portal",
            ha='center', va='center', fontsize=10.5, fontweight='bold', color='#0F172A')

    plt.tight_layout()
    out = os.path.join(FIGURES_DIR, "figure_8_1_git_workflow.png")
    plt.savefig(out, dpi=300, bbox_inches='tight')
    plt.close()
    print("Generated:", out)

if __name__ == "__main__":
    generate_use_case_diagram()
    generate_er_diagram()
    generate_architecture_diagram()
    generate_sequence_diagram()
    generate_burndown_chart()
    generate_git_workflow()
    print("All crisp diagrams generated successfully!")
