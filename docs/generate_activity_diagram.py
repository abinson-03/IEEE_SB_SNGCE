import os
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.patches as patches
from matplotlib.patches import FancyBboxPatch, Polygon, Circle

FIG_DIR = r"C:\Users\Abinson Babu\Desktop\ieee-sb-portal\docs\figures"
EDITED_DIR = r"C:\Users\Abinson Babu\Desktop\ieee-sb-portal\docs\edited_figures"
ARTIFACT_DIR = r"C:\Users\Abinson Babu\.gemini\antigravity\brain\18c1487f-ab35-4cae-a538-c21dfac065a0"

for d in [FIG_DIR, EDITED_DIR]:
    os.makedirs(d, exist_ok=True)

fig, ax = plt.subplots(figsize=(16, 23.5), dpi=300)
ax.set_xlim(0, 16)
ax.set_ylim(0, 23.5)
ax.axis('off')

# Global styling
plt.rcParams['font.family'] = 'sans-serif'
plt.rcParams['font.sans-serif'] = ['DejaVu Sans', 'Arial', 'Helvetica']

# Background
fig.patch.set_facecolor('#FFFFFF')
ax.set_facecolor('#FFFFFF')

# Color palette
C_LANE1_BG = '#F8FAFC'
C_LANE2_BG = '#F0F9FF'
C_LANE3_BG = '#F0FDF4'

C_LANE1_BORDER = '#94A3B8'
C_LANE2_BORDER = '#0284C7'
C_LANE3_BORDER = '#16A34A'

C_ACT_BG = '#FFFFFF'
C_ACT_BORDER = '#00629B'
C_ACT_TEXT = '#0F172A'

C_DEC_BG = '#FEF3C7'
C_DEC_BORDER = '#D97706'
C_DEC_TEXT = '#78350F'

C_ARROW = '#334155'

# Title Header
ax.add_patch(FancyBboxPatch((0.5, 21.9), 15.0, 1.25, boxstyle='round,pad=0.08,rounding_size=0.15',
                            facecolor='#00629B', edgecolor='#004C78', lw=2.2))
ax.text(8.0, 22.68, 'UML ACTIVITY DIAGRAM: IEEE STUDENT BRANCH PORTAL', ha='center', va='center',
        fontsize=15.5, fontweight='bold', color='#FFFFFF')
ax.text(8.0, 22.28, 'End-to-End Operational Workflow: Event Registration, UPI Verification, Dynamic QR Attendance & Certificate Engine',
        ha='center', va='center', fontsize=9.8, color='#E0F2FE')
ax.text(8.0, 21.98, 'IEEE SB SNGCE  |  Candidate: Abinson Babu (Reg No: SNG25MCA-2002)  |  Guide: Dr. Anoopkumar M',
        ha='center', va='center', fontsize=8.8, fontstyle='italic', color='#BAE6FD')

# Draw Swimlanes (Y: 0.4 to 21.6)
lanes = [
    (0.5, 5.5, 'STUDENT MEMBER / PARTICIPANT', '#1E293B', C_LANE1_BG, C_LANE1_BORDER),
    (5.5, 10.5, 'IEEE SB PORTAL SYSTEM (MERN & DB)', '#00629B', C_LANE2_BG, C_LANE2_BORDER),
    (10.5, 15.5, 'EXECOM OFFICER / CHAPTER ADMIN', '#0F766E', C_LANE3_BG, C_LANE3_BORDER)
]

for x_min, x_max, title, header_col, bg_col, border_col in lanes:
    # Lane body
    ax.add_patch(patches.Rectangle((x_min, 0.4), x_max - x_min, 21.2, facecolor=bg_col, edgecolor=border_col, lw=1.2, zorder=1))
    # Lane header
    ax.add_patch(patches.Rectangle((x_min, 20.9), x_max - x_min, 0.7, facecolor=header_col, edgecolor=header_col, zorder=2))
    ax.text((x_min + x_max)/2, 21.25, title, ha='center', va='center', fontsize=10.5, fontweight='bold', color='#FFFFFF', zorder=3)

# Helper Drawing Functions
def draw_action(x, y, text, w=4.0, h=0.68, bg='#FFFFFF', border='#00629B', text_col='#0F172A', fs=8.5, bold=False):
    ax.add_patch(FancyBboxPatch((x - w/2, y - h/2), w, h, boxstyle='round,pad=0.06,rounding_size=0.12',
                                facecolor=bg, edgecolor=border, lw=1.5, zorder=4))
    fontweight = 'bold' if bold else 'normal'
    ax.text(x, y, text, ha='center', va='center', fontsize=fs, fontweight=fontweight, color=text_col, zorder=5)

def draw_decision(x, y, text, w=1.9, h=0.82, bg='#FEF3C7', border='#D97706', text_col='#78350F', fs=7.8):
    poly = Polygon([[x, y + h/2], [x + w/2, y], [x, y - h/2], [x - w/2, y]],
                   closed=True, facecolor=bg, edgecolor=border, lw=1.5, zorder=4)
    ax.add_patch(poly)
    ax.text(x, y, text, ha='center', va='center', fontsize=fs, fontweight='bold', color=text_col, zorder=5)

def draw_start_node(x, y):
    ax.add_patch(Circle((x, y), 0.22, facecolor='#0F172A', edgecolor='#334155', lw=1.5, zorder=4))
    ax.text(x, y + 0.35, 'Start', ha='center', va='bottom', fontsize=8.5, fontweight='bold', color='#0F172A', zorder=5)

def draw_end_node(x, y, label='Activity Final'):
    ax.add_patch(Circle((x, y), 0.24, facecolor='#FFFFFF', edgecolor='#0F172A', lw=2.0, zorder=4))
    ax.add_patch(Circle((x, y), 0.14, facecolor='#0F172A', edgecolor='#0F172A', lw=1.0, zorder=5))
    if label:
        ax.text(x, y - 0.36, label, ha='center', va='top', fontsize=8.0, fontweight='bold', color='#0F172A', zorder=5)

def draw_bar(x, y, w=4.2, h=0.11, label=''):
    ax.add_patch(patches.Rectangle((x - w/2, y - h/2), w, h, facecolor='#0F172A', edgecolor='#0F172A', zorder=4))
    if label:
        ax.text(x + w/2 + 0.15, y, label, ha='left', va='center', fontsize=7.5, fontstyle='italic', color='#475569', zorder=5)

def draw_arrow(points, label='', label_pos=None, label_side='right', color=C_ARROW, lw=1.5):
    for i in range(len(points) - 1):
        x1, y1 = points[i]
        x2, y2 = points[i+1]
        is_last = (i == len(points) - 2)
        if is_last:
            ax.annotate('', xy=(x2, y2), xytext=(x1, y1),
                        arrowprops=dict(arrowstyle='->,head_width=0.32,head_length=0.42', color=color, lw=lw,
                                        shrinkA=0, shrinkB=0), zorder=3)
        else:
            ax.plot([x1, x2], [y1, y2], color=color, lw=lw, zorder=3)
    if label and label_pos:
        lx, ly = label_pos
        ha = 'left' if label_side == 'right' else ('right' if label_side == 'left' else 'center')
        ax.text(lx, ly, label, ha=ha, va='center', fontsize=7.5, fontweight='bold', color='#92400E',
                bbox=dict(boxstyle='round,pad=0.2', facecolor='#FEF3C7', edgecolor='#F59E0B', lw=0.8), zorder=6)

# ==================== STEP 1: INITIAL STATE & EVENT BROWSING ====================
draw_start_node(3.0, 20.3)
draw_arrow([(3.0, 20.08), (3.0, 19.55)])
draw_action(3.0, 19.2, 'Browse IEEE SB Events &\nFilter by Society Chapter (CS, CIS, SPS, WIE)', w=4.2, h=0.68)

# ==================== STEP 2: REGISTRATION SUBMISSION ====================
draw_arrow([(3.0, 18.86), (3.0, 18.3)])
draw_action(3.0, 17.95, 'Fill Registration Form with IEEE Details\n& Submit Application', w=4.2, h=0.68)

# Flow to System
draw_arrow([(5.1, 17.95), (5.9, 17.95)])
draw_action(8.0, 17.95, 'Receive Payload, Validate Inputs\n& Check Available Seat Quota', w=4.2, h=0.68)

# ==================== STEP 3: CAPACITY CHECK ====================
draw_arrow([(8.0, 17.61), (8.0, 17.1)])
draw_decision(8.0, 16.7, 'Seats\nAvailable?', w=2.0, h=0.82)

# [No] -> Full Alert -> Terminate (Offset horizontally to avoid collision)
draw_arrow([(7.0, 16.7), (4.7, 16.7)], label='[No]', label_pos=(5.8, 16.9), label_side='center')
draw_action(2.8, 16.7, 'Display "Registration Full"\nAlert & Waitlist Notification', w=3.6, h=0.58, border='#DC2626')
draw_arrow([(1.0, 16.7), (0.8, 16.7), (0.8, 15.8), (1.0, 15.8)])
draw_end_node(1.3, 15.8, label='Full (Closed)')

# [Yes] -> Fee Check
draw_arrow([(8.0, 16.29), (8.0, 15.65)], label='[Yes]', label_pos=(8.4, 15.95), label_side='right')
draw_decision(8.0, 15.2, 'Is Event\nPaid?', w=2.0, h=0.82)

# ==================== STEP 4: PAYMENT BRANCH ====================
# [Paid] -> Student Pays via UPI
draw_arrow([(7.0, 15.2), (5.1, 15.2)], label='[Paid]', label_pos=(6.0, 15.4), label_side='center')
draw_action(3.0, 14.9, 'Transfer Fee via UPI Gateway,\nCapture UTR & Upload Screenshot', w=4.2, h=0.68)

# Upload proof to backend
draw_arrow([(3.0, 14.56), (3.0, 13.9), (5.9, 13.9)])
draw_action(7.6, 13.9, 'Save Payment Transaction &\nMark Registration as PENDING', w=3.4, h=0.65)

# Push to ExeCom Console
draw_arrow([(9.3, 13.9), (10.9, 13.9)])
draw_action(13.0, 13.9, 'Review Transaction ID, UTR &\nVerify Bank Credit in ExeCom Panel', w=4.2, h=0.65)

# ExeCom Decision
draw_arrow([(13.0, 13.575), (13.0, 12.9)])
draw_decision(13.0, 12.5, 'Payment\nValid?', w=2.0, h=0.82)

# [Invalid] -> Reject
draw_arrow([(12.0, 12.5), (9.8, 12.5)], label='[Invalid]', label_pos=(11.0, 12.7), label_side='center')
draw_action(7.6, 12.5, 'Update Status = REJECTED\n& Dispatch Email Notification', w=3.8, h=0.6, border='#DC2626')
draw_arrow([(5.7, 12.5), (4.7, 12.5)])
draw_action(2.8, 12.5, 'Display Rejection Reason\n& Helpdesk Support Info', w=3.6, h=0.6, border='#DC2626')
draw_arrow([(1.0, 12.5), (0.8, 12.5), (0.8, 11.6), (1.0, 11.6)])
draw_end_node(1.3, 11.6, label='Terminated')

# [Valid] -> ExeCom Approves
draw_arrow([(13.0, 12.09), (13.0, 11.4)], label='[Valid]', label_pos=(13.4, 11.75), label_side='right')
draw_action(13.0, 11.0, 'Approve Registration &\nAuthorize Seat in Chapter Console', w=4.2, h=0.65)

# Connect ExeCom Approval to Seat Confirmation in System
draw_arrow([(10.9, 11.0), (9.8, 11.0), (9.8, 10.35), (9.7, 10.35)])

# [Free] from Decision 2 curves cleanly around the right side of Lane 2
draw_arrow([(9.0, 15.2), (10.0, 15.2), (10.0, 10.35), (9.7, 10.35)], label='[Free]', label_pos=(10.3, 14.6), label_side='right')

# ==================== STEP 5: SEAT CONFIRMATION & QR PASS ====================
draw_action(7.6, 10.0, 'Confirm Seat Registration,\nGenerate Dynamic QR Pass & Dispatch Email', w=4.2, h=0.7, bold=True)

# Dispatch to Student
draw_arrow([(5.5, 10.0), (5.1, 10.0)])
draw_action(3.0, 10.0, 'Receive Encrypted QR Pass\nin Student Dashboard & Email Inbox', w=4.2, h=0.68)

# ==================== STEP 6: EVENT DAY & VENUE CHECK-IN ====================
draw_arrow([(3.0, 9.66), (3.0, 8.85)])
draw_action(3.0, 8.5, 'Present Unique QR Pass\nat Venue Registration Desk', w=4.2, h=0.68)

# ExeCom scans
draw_arrow([(5.1, 8.5), (10.9, 8.5)])
draw_action(13.0, 8.5, 'Scan Attendee QR Token\nvia ExeCom Officer Camera App', w=4.2, h=0.68)

# Validate with Backend
draw_arrow([(13.0, 8.16), (13.0, 7.45), (10.1, 7.45)])
draw_action(8.0, 7.45, 'Decrypt Cryptographic Token &\nVerify Against Database Record', w=4.2, h=0.65)

# Check QR validity
draw_arrow([(8.0, 7.125), (8.0, 6.5)])
draw_decision(8.0, 6.1, 'QR Token\nValid?', w=2.0, h=0.82)

# [Invalid / Duplicate] -> Alert ExeCom
draw_arrow([(9.0, 6.1), (10.9, 6.1)], label='[Invalid]', label_pos=(10.0, 6.3), label_side='center')
draw_action(13.0, 6.1, 'Display "Invalid / Already Scanned"\nSecurity Alert on Scanner', w=4.2, h=0.6, border='#DC2626')
draw_arrow([(13.0, 5.8), (13.0, 5.25)])
draw_end_node(13.0, 4.95, label='Entry Denied')

# [Valid] -> Mark Attendance
draw_arrow([(8.0, 5.69), (8.0, 5.05)], label='[Valid]', label_pos=(8.4, 5.35), label_side='right')
draw_action(8.0, 4.7, 'Mark Attendance = PRESENT,\nRecord Check-In Time & Trigger Pipeline', w=4.4, h=0.68, bold=True)

# ==================== STEP 7: FORK (PARALLEL OPERATIONS) ====================
draw_arrow([(8.0, 4.36), (8.0, 3.95)])
draw_bar(8.0, 3.9, w=4.4, h=0.1, label='Fork (Parallel Execution)')

# Branch 1: Audit Log
draw_arrow([(6.6, 3.85), (6.6, 3.35)])
draw_action(6.6, 3.05, 'Write Chapter Activity\nto Immutable Audit Log', w=2.6, h=0.55, fs=7.5)

# Branch 2: Certificate Generation Engine
draw_arrow([(9.4, 3.85), (9.4, 3.35)])
draw_action(9.4, 3.05, 'Execute PDFKit Vector Engine\n(Unique ID + SHA-256 Hash)', w=2.8, h=0.55, fs=7.5)

# Join Bar
draw_arrow([(6.6, 2.775), (6.6, 2.35), (7.0, 2.35)])
draw_arrow([(9.4, 2.775), (9.4, 2.35), (9.0, 2.35)])
draw_bar(8.0, 2.35, w=4.4, h=0.1, label='Join')

# Output from Join: Store in DB and Mail
draw_arrow([(8.0, 2.3), (8.0, 1.8)])
draw_action(8.0, 1.5, 'Store Certificate in MongoDB &\nDispatch Instant PDF via Gmail SMTP', w=4.4, h=0.65, bold=True)

# ==================== STEP 8: PUBLIC VERIFICATION & FINAL NODE ====================
# Flow left to student
draw_arrow([(5.8, 1.5), (5.1, 1.5)])
draw_action(3.0, 1.5, 'Download Verified Certificate &\nValidate via Public Verification Portal', w=4.2, h=0.65, bold=True)

# Complete Final Node
draw_arrow([(3.0, 1.175), (3.0, 0.75)])
draw_end_node(3.0, 0.5, label='Activity Completed (Success)')

# Save figure in all target locations
out_fig = os.path.join(FIG_DIR, 'activity_diagram.png')
out_edited = os.path.join(EDITED_DIR, 'activity_diagram.png')
out_artifact = os.path.join(ARTIFACT_DIR, 'activity_diagram.png')

plt.tight_layout()
plt.savefig(out_fig, dpi=300, bbox_inches='tight')
plt.savefig(out_edited, dpi=300, bbox_inches='tight')
plt.savefig(out_artifact, dpi=300, bbox_inches='tight')

print('Activity Diagram successfully generated:')
print('  -', out_fig)
print('  -', out_edited)
print('  -', out_artifact)
