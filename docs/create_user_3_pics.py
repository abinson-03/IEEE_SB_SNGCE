import os
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.patches as patches
from matplotlib.patches import FancyBboxPatch, Rectangle
import numpy as np

OUTPUT_DIR = r"C:\Users\Abinson Babu\Desktop\ieee-sb-portal\docs\edited_figures"
DOWNLOADS_DIR = r"C:\Users\Abinson Babu\Downloads\ieee-sb-portal\docs\edited_figures"
os.makedirs(OUTPUT_DIR, exist_ok=True)
os.makedirs(DOWNLOADS_DIR, exist_ok=True)

plt.rcParams['font.family'] = 'sans-serif'
plt.rcParams['font.sans-serif'] = ['DejaVu Sans', 'Arial', 'Helvetica']

# ==============================================================================
# PIC 1: Figure 3.1 - Story Point Distribution Chart
# ==============================================================================
def generate_pic1_story_points():
    fig, ax = plt.subplots(figsize=(9, 4.5), dpi=300)
    
    # Story points categories and values
    categories = ['2 SP', '3 SP', '5 SP', '8 SP']
    counts = [4, 6, 5, 1]
    x = np.arange(len(categories))
    width = 0.52

    # Draw Bars
    bars = ax.bar(x, counts, width, color='#3B82F6', edgecolor='#2563EB', linewidth=1.2, zorder=3)

    # Add count labels above bars
    for bar in bars:
        height = bar.get_height()
        ax.annotate(f'{height}',
                    xy=(bar.get_x() + bar.get_width() / 2, height),
                    xytext=(0, 4),
                    textcoords="offset points",
                    ha='center', va='bottom',
                    fontsize=10.5, color='#1E293B', fontweight='bold')

    # Titles matching sample
    ax.text(0.04, 1.15, "Number of User Stories by Story Point Estimate",
            transform=ax.transAxes, fontsize=12, fontweight='bold', color='#0F172A')
    ax.text(0.04, 1.05, "Distribution of the 16 planned IEEE SB SNGCE Portal user stories.",
            transform=ax.transAxes, fontsize=9.2, color='#64748B')

    # Y-axis styling
    ax.set_ylabel("Number of User Stories", fontsize=9.5, color='#334155', labelpad=8)
    ax.set_ylim(0, 8.5)
    ax.set_yticks([0, 2, 4, 6, 8])

    # X-axis styling
    ax.set_xlabel("Story Point Estimate", fontsize=9.5, color='#334155', labelpad=8)
    ax.set_xticks(x)
    ax.set_xticklabels(categories, fontsize=9.5, color='#1E293B', fontweight='semibold')

    # Grid lines
    ax.grid(axis='y', linestyle='--', alpha=0.5, color='#E2E8F0', zorder=0)

    # Spines
    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)
    ax.spines['left'].set_color('#94A3B8')
    ax.spines['bottom'].set_color('#94A3B8')

    # Caption beneath
    plt.figtext(0.5, 0.02, "Figure 3.1: Distribution of User Stories by Story Point Estimate",
                ha='center', fontsize=9.5, fontstyle='italic', color='#1E293B')

    plt.tight_layout(rect=[0, 0.06, 1, 0.95])
    
    out1 = os.path.join(OUTPUT_DIR, "Figure_3_1_Story_Point_Distribution.png")
    out1_dl = os.path.join(DOWNLOADS_DIR, "Figure_3_1_Story_Point_Distribution.png")
    plt.savefig(out1, dpi=300, bbox_inches='tight')
    plt.savefig(out1_dl, dpi=300, bbox_inches='tight')
    plt.close()
    print("Generated Pic 1:", out1)

# ==============================================================================
# PIC 2: Figure 4.3 - Conceptual Data Model of IEEE SB SNGCE Portal
# ==============================================================================
def generate_pic2_data_model():
    fig, ax = plt.subplots(figsize=(11, 7.5), dpi=300)
    ax.set_xlim(0, 11)
    ax.set_ylim(0, 7.5)
    ax.axis('off')

    def draw_box(x, y, w, h, title, fields, bg='#DCFCE7', border='#16A34A', title_color='#065F46'):
        # Outer box
        rect = FancyBboxPatch((x - w/2, y - h/2), w, h, boxstyle="square,pad=0.0",
                              facecolor=bg, edgecolor=border, linewidth=1.5, zorder=2)
        ax.add_patch(rect)
        # Title bar divider line
        title_y = y + h/2 - 0.4
        ax.plot([x - w/2, x + w/2], [title_y, title_y], color=border, lw=1.2, zorder=3)
        # Title text
        ax.text(x, y + h/2 - 0.22, title, ha='center', va='center',
                fontsize=9.5, fontweight='bold', color=title_color, zorder=4)
        # Field lines
        for idx, f in enumerate(fields):
            fy = title_y - 0.22 - idx * 0.22
            ax.text(x - w/2 + 0.15, fy, f, ha='left', va='center',
                    fontsize=8.0, color='#1E293B', zorder=4)

    def draw_connector(p1, p2, label="1:N"):
        ax.plot([p1[0], p2[0]], [p1[1], p2[1]], color='#1D4ED8', lw=1.3, zorder=1)
        mid_x = (p1[0] + p2[0]) / 2
        mid_y = (p1[1] + p2[1]) / 2
        ax.text(mid_x + 0.15, mid_y, label, fontsize=8.0, fontweight='bold', color='#1D4ED8',
                bbox=dict(boxstyle="square,pad=0.1", facecolor='white', edgecolor='none', alpha=0.9), zorder=3)

    # 1. Root Box: UNIT (CHAPTER) - Blue Box
    unit_fields = ["unit_id (PK)", "unit_name", "code (CS/CIS/SPS/WIE)", "description", "created_at"]
    draw_box(5.5, 6.4, 2.2, 1.4, "UNIT (CHAPTER)", unit_fields,
             bg='#E0F2FE', border='#0284C7', title_color='#0369A1')

    # 2. Left Child: EVENT (Green Box)
    event_fields = ["event_id (PK)", "unit_id (FK)", "title", "date_venue", "fee_structure", "created_at"]
    draw_box(2.8, 4.4, 2.2, 1.4, "EVENT", event_fields,
             bg='#DCFCE7', border='#16A34A', title_color='#065F46')

    # 3. Right Child: OFFICER TASK (Green Box)
    task_fields = ["task_id (PK)", "unit_id (FK)", "assigned_to (FK)", "title", "priority", "status"]
    draw_box(8.2, 4.4, 2.2, 1.4, "OFFICER TASK", task_fields,
             bg='#DCFCE7', border='#16A34A', title_color='#065F46')

    # Connect UNIT to EVENT and OFFICER TASK
    draw_connector((4.4, 6.0), (3.6, 5.1), "1:N")
    draw_connector((6.6, 6.0), (7.4, 5.1), "1:N")

    # 4. Under EVENT: 3 children
    # 4a. EVENT REGISTRATION
    reg_fields = ["reg_id (PK)", "event_id (FK)", "user_id (FK)", "payment_status", "upi_ref", "registered_at"]
    draw_box(1.5, 2.0, 2.2, 1.4, "EVENT REGISTRATION", reg_fields,
             bg='#DCFCE7', border='#16A34A', title_color='#065F46')

    # 4b. ATTENDANCE RECORD
    att_fields = ["attendance_id (PK)", "event_id (FK)", "user_id (FK)", "qr_token", "checkin_time", "status"]
    draw_box(4.5, 2.0, 2.2, 1.4, "ATTENDANCE RECORD", att_fields,
             bg='#DCFCE7', border='#16A34A', title_color='#065F46')

    # 4c. EVENT PHOTO
    photo_fields = ["photo_id (PK)", "event_id (FK)", "uploaded_by (FK)", "url", "is_cover", "uploaded_at"]
    draw_box(7.5, 2.0, 2.2, 1.4, "EVENT PHOTO", photo_fields,
             bg='#DCFCE7', border='#16A34A', title_color='#065F46')

    # Connect EVENT to its 3 sub-records
    draw_connector((2.0, 3.7), (1.5, 2.7), "1:N")
    draw_connector((2.8, 3.7), (4.5, 2.7), "1:N")
    draw_connector((3.6, 3.7), (7.5, 2.7), "1:N")

    # 5. Under ATTENDANCE RECORD: CERTIFICATE RECORD
    cert_fields = ["cert_id (PK)", "attendance_id (FK)", "user_id (FK)", "certificate_id", "pdf_path", "issued_at"]
    draw_box(4.5, 0.45, 2.2, 1.35, "CERTIFICATE RECORD", cert_fields,
             bg='#DCFCE7', border='#16A34A', title_color='#065F46')

    # Connect ATTENDANCE to CERTIFICATE
    draw_connector((4.5, 1.3), (4.5, 1.15), "1:N")

    # Caption
    plt.figtext(0.5, 0.01, "Figure 4.3: Conceptual Data Model of IEEE SB SNGCE Portal",
                ha='center', fontsize=10, fontstyle='italic', color='#1E293B')

    plt.tight_layout(rect=[0, 0.03, 1, 1])
    out2 = os.path.join(OUTPUT_DIR, "Figure_4_3_Conceptual_Data_Model.png")
    out2_dl = os.path.join(DOWNLOADS_DIR, "Figure_4_3_Conceptual_Data_Model.png")
    plt.savefig(out2, dpi=300, bbox_inches='tight')
    plt.savefig(out2_dl, dpi=300, bbox_inches='tight')
    plt.close()
    print("Generated Pic 2:", out2)

# ==============================================================================
# PIC 3: Figure 1.4 - Wireframe of IEEE SB SNGCE Portal Dashboard
# ==============================================================================
def generate_pic3_wireframe():
    fig, ax = plt.subplots(figsize=(9, 7.5), dpi=300)
    ax.set_xlim(0, 9)
    ax.set_ylim(0, 7.5)
    ax.axis('off')

    # Outer Browser Window Frame
    frame = FancyBboxPatch((0.5, 0.5), 8.0, 6.7, boxstyle="round,pad=0.08,rounding_size=0.15",
                           facecolor='#FFFFFF', edgecolor='#60A5FA', linewidth=2.0)
    ax.add_patch(frame)

    # Top Navbar Header
    nav = FancyBboxPatch((0.5, 6.4), 8.0, 0.8, boxstyle="round,pad=0.08,rounding_size=0.1",
                         facecolor='#EFF6FF', edgecolor='#93C5FD', linewidth=1.5)
    ax.add_patch(nav)
    ax.text(0.8, 6.75, "IEEE SB SNGCE Portal", fontsize=11, fontweight='bold', color='#1E3A8A', va='center')
    ax.text(8.2, 6.75, "Dashboard | Chapters | Events | Gallery | Certificates",
            fontsize=8.2, color='#475569', ha='right', va='center')

    # 1. Top Card: Chapter Event & Member Workspace
    top_card = FancyBboxPatch((0.7, 5.0), 7.6, 1.15, boxstyle="round,pad=0.05,rounding_size=0.1",
                              facecolor='#F0F9FF', edgecolor='#BAE6FD', linewidth=1.2)
    ax.add_patch(top_card)
    ax.text(0.9, 5.85, "Chapter Event & Member Workspace", fontsize=10, fontweight='bold', color='#0369A1')
    ax.text(0.9, 5.55, "Manage society chapters, registrations, dynamic attendance and certificates",
            fontsize=7.8, color='#64748B')
    btn1 = FancyBboxPatch((0.9, 5.15), 1.8, 0.32, boxstyle="round,pad=0.04,rounding_size=0.06",
                          facecolor='#0284C7', edgecolor='#0369A1', lw=1.0)
    ax.add_patch(btn1)
    ax.text(1.8, 5.31, "+ New Event", ha='center', va='center', fontsize=8.0, fontweight='bold', color='#FFFFFF')

    # 2. Middle Left: Society Chapters Overview (Green card)
    left_card = FancyBboxPatch((0.7, 3.4), 3.65, 1.45, boxstyle="round,pad=0.05,rounding_size=0.1",
                               facecolor='#F0FDF4', edgecolor='#BBF7D0', linewidth=1.2)
    ax.add_patch(left_card)
    ax.text(0.9, 4.55, "Society Chapters Overview", fontsize=9.5, fontweight='bold', color='#15803D')
    ax.text(0.9, 4.25, "CS • CIS • SPS • WIE • SB Main", fontsize=7.8, color='#166534', fontweight='semibold')
    ax.text(0.9, 3.95, "Active Members: 240+ | Total Events: 18", fontsize=7.5, color='#475569')
    # Decorative lines
    for ly in [3.75, 3.55]:
        ax.plot([0.9, 3.8], [ly, ly], color='#86EFAC', lw=2.5)

    # 3. Middle Right: Attendance & QR Check-in (Orange/amber card)
    right_card = FancyBboxPatch((4.65, 3.4), 3.65, 1.45, boxstyle="round,pad=0.05,rounding_size=0.1",
                                facecolor='#FFFBEB', edgecolor='#FDE68A', linewidth=1.2)
    ax.add_patch(right_card)
    ax.text(4.85, 4.55, "Dynamic QR Attendance Console", fontsize=9.5, fontweight='bold', color='#B45309')
    for ly, w_val in [(4.25, 3.2), (4.05, 2.6), (3.85, 2.9)]:
        ax.plot([4.85, 4.85 + w_val], [ly, ly], color='#FCD34D', lw=2.5)
    btn2 = FancyBboxPatch((4.85, 3.5), 1.6, 0.28, boxstyle="round,pad=0.03,rounding_size=0.06",
                          facecolor='#D97706', edgecolor='#B45309', lw=1.0)
    ax.add_patch(btn2)
    ax.text(5.65, 3.64, "Scan QR Code", ha='center', va='center', fontsize=7.5, fontweight='bold', color='#FFFFFF')

    # 4. Lower Cards: 3 Mini Status Boxes (Purple/lavender)
    ax.text(0.7, 3.15, "Event Operations & Attendance Summary", fontsize=9.5, fontweight='bold', color='#1E293B')
    box_titles = ["Registration Turnout", "Attendance Verified", "Certificates Issued"]
    for idx, b_title in enumerate(box_titles):
        bx = 0.7 + idx * 2.6
        s_box = FancyBboxPatch((bx, 2.1), 2.4, 0.9, boxstyle="round,pad=0.04,rounding_size=0.08",
                               facecolor='#FAF5FF', edgecolor='#E9D5FF', linewidth=1.2)
        ax.add_patch(s_box)
        ax.text(bx + 0.15, 2.75, b_title, fontsize=8.0, fontweight='bold', color='#6B21A8')
        ax.plot([bx + 0.15, bx + 2.0], [2.45, 2.45], color='#D8B4FE', lw=2.5)
        ax.plot([bx + 0.15, bx + 1.5], [2.25, 2.25], color='#D8B4FE', lw=2.5)

    # 5. Bottom Card: Public Certificate Registry & Verification (Lavender card)
    bot_card = FancyBboxPatch((0.7, 0.7), 7.6, 1.15, boxstyle="round,pad=0.05,rounding_size=0.1",
                              facecolor='#F5F3FF', edgecolor='#DDD6FE', linewidth=1.2)
    ax.add_patch(bot_card)
    ax.text(0.9, 1.55, "Automated Certificate Engine & Public Verification",
            fontsize=9.5, fontweight='bold', color='#5B21B6')
    ax.text(0.9, 1.3, "Instant PDFKit cryptographic generation with real-time verification ID lookup",
            fontsize=7.8, color='#6B7280')
    btn3 = FancyBboxPatch((0.9, 0.85), 1.8, 0.3, boxstyle="round,pad=0.03,rounding_size=0.06",
                          facecolor='#6D28D9', edgecolor='#5B21B6', lw=1.0)
    ax.add_patch(btn3)
    ax.text(1.8, 1.0, "Verify Certificate", ha='center', va='center', fontsize=7.8, fontweight='bold', color='#FFFFFF')

    # Caption beneath
    plt.figtext(0.5, 0.02, "Figure 1.4: Illustrative Wireframe of the IEEE SB SNGCE Portal Dashboard",
                ha='center', fontsize=9.5, fontstyle='italic', color='#1E293B')

    plt.tight_layout(rect=[0, 0.04, 1, 1])
    out3 = os.path.join(OUTPUT_DIR, "Figure_1_4_Wireframe_Dashboard.png")
    out3_dl = os.path.join(DOWNLOADS_DIR, "Figure_1_4_Wireframe_Dashboard.png")
    plt.savefig(out3, dpi=300, bbox_inches='tight')
    plt.savefig(out3_dl, dpi=300, bbox_inches='tight')
    plt.close()
    print("Generated Pic 3:", out3)

if __name__ == "__main__":
    generate_pic1_story_points()
    generate_pic2_data_model()
    generate_pic3_wireframe()
    print("\nALL 3 PICS GENERATED PERFECTLY!")
