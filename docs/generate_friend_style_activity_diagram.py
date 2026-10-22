import os
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.patches as patches
from matplotlib.patches import FancyBboxPatch, Polygon

# Dimensions matching friend's aspect ratio (860 x 1024)
W = 860
H = 1024

fig, ax = plt.subplots(figsize=(8.6, 10.24), dpi=300)
ax.set_xlim(0, W)
ax.set_ylim(H, 0) # Top-down coordinates (0 at top, 1024 at bottom)
ax.axis('off')

# Pure white background
fig.patch.set_facecolor('#FFFFFF')
ax.set_facecolor('#FFFFFF')

plt.rcParams['font.family'] = 'sans-serif'
plt.rcParams['font.sans-serif'] = ['DejaVu Sans', 'Arial', 'Helvetica', 'Segoe UI']

# Colors matching friend's diagram exactly
C_START_FILL = '#C7F0C7'
C_START_BORDER = '#2E7D32'

C_BLUE_FILL = '#D0E2FF'
C_BLUE_BORDER = '#2563EB'

C_PURPLE_FILL = '#E4DCFD'
C_PURPLE_BORDER = '#7C3AED'

C_SUB_PURPLE_FILL = '#E4DCFD'
C_SUB_PURPLE_BORDER = '#7C3AED'

C_DIAMOND_FILL = '#FEE9BE'
C_DIAMOND_BORDER = '#D97706'

C_RED_FILL = '#FCD5D5'
C_RED_BORDER = '#DC2626'

C_LINE = '#111827'

# Drawing primitives
def draw_capsule(cx, cy, w, h, text, fill=C_START_FILL, border=C_START_BORDER):
    box = FancyBboxPatch((cx - w/2, cy - h/2), w, h,
                         boxstyle=f"round,pad=0,rounding_size={h/2}",
                         facecolor=fill, edgecolor=border, lw=1.8, zorder=4)
    ax.add_patch(box)
    ax.text(cx, cy, text, ha='center', va='center', fontsize=9.5, fontweight='bold',
            color='#111827', zorder=5)

def draw_box(cx, cy, w, h, text, fill=C_BLUE_FILL, border=C_BLUE_BORDER, fs=8.2, bold=True):
    box = FancyBboxPatch((cx - w/2, cy - h/2), w, h,
                         boxstyle="round,pad=0,rounding_size=6",
                         facecolor=fill, edgecolor=border, lw=1.6, zorder=4)
    ax.add_patch(box)
    weight = 'bold' if bold else 'normal'
    ax.text(cx, cy, text, ha='center', va='center', fontsize=fs, fontweight=weight,
            color='#111827', zorder=5)

def draw_diamond(cx, cy, w, h, text, fill=C_DIAMOND_FILL, border=C_DIAMOND_BORDER, fs=8.0):
    poly = Polygon([[cx, cy - h/2], [cx + w/2, cy], [cx, cy + h/2], [cx - w/2, cy]],
                   closed=True, facecolor=fill, edgecolor=border, lw=1.6, zorder=4)
    ax.add_patch(poly)
    ax.text(cx, cy, text, ha='center', va='center', fontsize=fs, fontweight='bold',
            color='#111827', zorder=5)

def draw_arrow(x1, y1, x2, y2, color=C_LINE, lw=1.4):
    ax.annotate('', xy=(x2, y2), xytext=(x1, y1),
                arrowprops=dict(arrowstyle='->,head_width=0.22,head_length=0.35',
                                color=color, lw=lw, shrinkA=0, shrinkB=0), zorder=3)

def draw_line(x1, y1, x2, y2, color=C_LINE, lw=1.4):
    ax.plot([x1, x2], [y1, y2], color=color, lw=lw, zorder=3)

# ================= TOP SEQUENTIAL SECTION =================
CX = 430

# 1. Start Node
draw_capsule(CX, 38, 96, 36, 'Start')

# Arrow Start -> Open Portal
draw_arrow(CX, 56, CX, 90)

# 2. Open Portal
draw_box(CX, 108, 250, 36, 'Open IEEE SB Portal', fs=9.0)
draw_arrow(CX, 126, CX, 155)

# 3. Display Landing Page
draw_box(CX, 173, 250, 36, 'Display Landing Page', fs=9.0)
draw_arrow(CX, 191, CX, 220)

# 4. User Login / Register
draw_box(CX, 238, 250, 36, 'User Login / Register', fs=9.0)
draw_arrow(CX, 256, CX, 285)

# 5. Display User Dashboard
draw_box(CX, 303, 250, 36, 'Display User Dashboard', fs=9.0)
draw_arrow(CX, 321, CX, 350)

# 6. Choose Action Diamond (generous width so text never crowds)
draw_diamond(CX, 380, 184, 52, 'Choose Action', fs=8.5)

# ================= 5 PARALLEL COLUMNS =================
# Column X centers
col_x = [115, 272, 430, 588, 745]
col_w = 126
col_h = 36

# From Choose Action (bottom tip at Y=406) -> Bus line at Y=432
draw_line(CX, 406, CX, 432)
draw_line(col_x[0], 432, col_x[4], 432)

# Drops to each column header
for x in col_x:
    draw_arrow(x, 432, x, 456)

# ---- ROW 1: Purple Column Headers (Y = 474) ----
headers = [
    'Event Register',
    'QR Check-In',
    'Certificates',
    'Chapter Hub',
    'Audit & Duties'
]
for x, t in zip(col_x, headers):
    draw_box(x, 474, col_w, col_h, t, fill=C_PURPLE_FILL, border=C_PURPLE_BORDER, fs=8.0)

# Arrows from Row 1 to Row 2
for x in col_x:
    draw_arrow(x, 492, x, 532)

# ---- ROW 2: Sub-boxes (Y = 550) ----
row2_texts = [
    'UPI Payment',
    'Generate QR',
    'Verify Present',
    'Browse Chapters',
    'Duty Tasks'
]
for x, t in zip(col_x, row2_texts):
    draw_box(x, 550, col_w, col_h, t, fill=C_SUB_PURPLE_FILL, border=C_SUB_PURPLE_BORDER, fs=7.8)

# ---- ROW 3: Decisions & Actions (Y = 628) ----

# Col 1: Valid UTR? Diamond
draw_arrow(col_x[0], 568, col_x[0], 602)
draw_diamond(col_x[0], 628, 120, 48, 'Valid UTR?', fs=7.8)

# Col 1 Branches: Yes (left) & No (right)
# Left: Yes -> Confirm Seat
draw_line(col_x[0] - 60, 628, 62, 628)
draw_arrow(62, 628, 62, 696)
ax.text(48, 652, 'Yes', fontsize=8.5, fontweight='bold', color='#111827')
draw_box(62, 714, 76, 36, 'Confirm Seat', fill=C_BLUE_FILL, border=C_BLUE_BORDER, fs=7.5)

# Right: No -> Red Error
draw_line(col_x[0] + 60, 628, 168, 628)
draw_arrow(168, 628, 168, 696)
ax.text(174, 652, 'No', fontsize=8.5, fontweight='bold', color='#111827')
draw_box(168, 714, 76, 36, 'Red Error', fill=C_RED_FILL, border=C_RED_BORDER, fs=7.8)

# Col 2: Scan QR Pass
draw_arrow(col_x[1], 568, col_x[1], 610)
draw_box(col_x[1], 628, col_w, col_h, 'Scan QR Pass', fill=C_BLUE_FILL, border=C_BLUE_BORDER, fs=8.0)

# Col 3: Generate PDF
draw_arrow(col_x[2], 568, col_x[2], 610)
draw_box(col_x[2], 628, col_w, col_h, 'Generate PDF', fill=C_BLUE_FILL, border=C_BLUE_BORDER, fs=8.0)

# Col 4: Join Request
draw_arrow(col_x[3], 568, col_x[3], 610)
draw_box(col_x[3], 628, col_w, col_h, 'Join Request', fill=C_BLUE_FILL, border=C_BLUE_BORDER, fs=8.0)

# Col 5: Track Audit Logs
draw_arrow(col_x[4], 568, col_x[4], 610)
draw_box(col_x[4], 628, col_w, col_h, 'Audit Logs', fill=C_BLUE_FILL, border=C_BLUE_BORDER, fs=8.0)

# ---- ROW 4: Extra sub-step for Col 3 (Y = 714) ----
draw_arrow(col_x[2], 646, col_x[2], 696)
draw_box(col_x[2], 714, col_w, col_h, 'SHA-256 Hash', fill=C_BLUE_FILL, border=C_BLUE_BORDER, fs=8.0)

# ================= BOTTOM RE-CONVERGENCE =================
BUS_Y = 770

# Col 1 bottom lines: from Confirm Seat & Red Error
draw_line(62, 732, 62, 770)
draw_line(168, 732, 168, 770)

# Col 2 bottom line
draw_line(col_x[1], 646, col_x[1], 770)

# Col 3 bottom line
draw_line(col_x[2], 732, col_x[2], 770)

# Col 4 bottom line
draw_line(col_x[3], 646, col_x[3], 770)

# Col 5 bottom line
draw_line(col_x[4], 646, col_x[4], 770)

# Horizontal collection bus line covering all branches from x=62 to col_x[4]
draw_line(62, BUS_Y, col_x[4], BUS_Y)

# Arrow from collection bus to Continue Session? diamond
draw_arrow(CX, BUS_Y, CX, 804)

# Continue Session? Diamond (Y = 830, wider)
draw_diamond(CX, 830, 184, 52, 'Continue Session?', fs=8.2)

# Yes Arrow: right tip -> horizontal out -> vertical UP to Choose Action -> into right tip
draw_line(CX + 92, 830, 835, 830)
ax.text(CX + 98, 822, 'Yes', fontsize=8.5, fontweight='bold', color='#111827')
draw_line(835, 830, 835, 380)
draw_arrow(835, 380, CX + 92, 380)

# No Arrow: bottom tip -> End capsule
draw_arrow(CX, 856, CX, 922)
ax.text(CX + 14, 892, 'No', fontsize=8.5, fontweight='bold', color='#111827')

# End Node (Y = 940)
draw_capsule(CX, 940, 96, 36, 'End')

# Save outputs to all target locations
out_fig = r"C:\Users\Abinson Babu\Desktop\ieee-sb-portal\docs\figures\activity_diagram.png"
out_edited = r"C:\Users\Abinson Babu\Desktop\ieee-sb-portal\docs\edited_figures\activity_diagram.png"
out_artifact = r"C:\Users\Abinson Babu\.gemini\antigravity\brain\18c1487f-ab35-4cae-a538-c21dfac065a0\activity_diagram.png"
out_downloads = r"C:\Users\Abinson Babu\Downloads\activity_diagram.png"
out_docs = r"C:\Users\Abinson Babu\Desktop\ieee-sb-portal\docs\activity_diagram.png"

for p in [out_fig, out_edited, out_artifact, out_downloads, out_docs]:
    plt.savefig(p, dpi=300, bbox_inches='tight')

print("Perfection: Friend-style Activity Diagram updated!")
