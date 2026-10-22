import os
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.patches import FancyBboxPatch, Rectangle
import numpy as np

FIGURES_DIR = r"C:\Users\Abinson Babu\Desktop\ieee-sb-portal\docs\figures"
os.makedirs(FIGURES_DIR, exist_ok=True)

# -------------------------------------------------------------
# 5. GENERATE BURN DOWN CHART (Sprints 1 to 7)
# -------------------------------------------------------------
def generate_burndown_chart():
    fig, ax = plt.subplots(figsize=(12, 7), dpi=300)

    sprints = ['Sprint 0\n(Planning)', 'Sprint 1\n(Auth/RBAC)', 'Sprint 2\n(Unit Hubs)',
               'Sprint 3\n(Events/UPI)', 'Sprint 4\n(QR Attend)', 'Sprint 5\n(Certificates)',
               'Sprint 6\n(Gallery/Tasks)', 'Sprint 7\n(Review/Audit)']
    x = np.arange(len(sprints))

    # 140 Story points total
    ideal_points = [140, 120, 100, 80, 60, 40, 20, 0]
    actual_points = [140, 122, 98, 82, 58, 36, 18, 0]

    # Plot Ideal Line
    ax.plot(x, ideal_points, color='#94A3B8', linestyle='--', linewidth=2.5, marker='s',
            label='Ideal Burndown (Linear velocity)')

    # Plot Actual Line
    ax.plot(x, actual_points, color='#0284C7', linestyle='-', linewidth=3.0, marker='o',
            markersize=8, markerfacecolor='#0369A1', label='Actual Burndown (Completed Story Points)')

    # Fill between
    ax.fill_between(x, actual_points, color='#E0F2FE', alpha=0.4)

    # Annotate points
    for i, txt in enumerate(actual_points):
        ax.annotate(f"{txt} pts", (x[i], actual_points[i] + 4), ha='center', fontsize=9,
                    fontweight='bold', color='#0369A1')

    ax.set_title("Product Burndown Chart Across Seven Sprints (140 Story Points Total)",
                 fontsize=13, fontweight='bold', color='#0F172A', pad=15)
    ax.set_xlabel("Scrum Sprints Timeline", fontsize=11, fontweight='bold', color='#334155', labelpad=10)
    ax.set_ylabel("Remaining Story Points", fontsize=11, fontweight='bold', color='#334155', labelpad=10)
    ax.set_xticks(x)
    ax.set_xticklabels(sprints, fontsize=9.5)
    ax.set_ylim(-5, 160)
    ax.grid(True, linestyle=':', alpha=0.6)
    ax.legend(loc='upper right', frameon=True, fontsize=10)

    # Caption text
    plt.figtext(0.5, 0.01, "Figure 4.5: Scrum Burndown Chart for IEEE SB SNGCE Portal",
               ha='center', fontsize=11, fontweight='bold', color='#0F172A')

    plt.tight_layout(rect=[0, 0.05, 1, 1])
    out_file = os.path.join(FIGURES_DIR, "figure_4_5_burndown_chart.png")
    plt.savefig(out_file, dpi=300, bbox_inches='tight')
    plt.close()
    print("Generated:", out_file)

# -------------------------------------------------------------
# 6. GENERATE SEQUENCE DIAGRAM
# -------------------------------------------------------------
def generate_sequence_diagram():
    fig, ax = plt.subplots(figsize=(14, 11), dpi=300)
    ax.set_xlim(0, 15)
    ax.set_ylim(0, 13)
    ax.axis('off')

    actors = [
        ("Student / Attendee", 1.8),
        ("React.js Frontend", 5.0),
        ("Express.js API", 8.2),
        ("MongoDB Database", 11.4),
        ("Gmail / PDF Service", 13.8)
    ]

    # Draw Actor boxes at top and bottom
    for name, x in actors:
        # Top box
        box = FancyBboxPatch((x - 1.2, 11.5), 2.4, 0.8, boxstyle="round,pad=0.05,rounding_size=0.1",
                             facecolor='#0284C7', edgecolor='#0369A1', lw=1.5)
        ax.add_patch(box)
        ax.text(x, 11.9, name, ha='center', va='center', fontsize=9.5, fontweight='bold', color='#FFFFFF')

        # Lifeline
        ax.plot([x, x], [11.5, 1.2], color='#94A3B8', linestyle='--', lw=1.5, zorder=0)

        # Bottom box
        box_b = FancyBboxPatch((x - 1.2, 0.4), 2.4, 0.8, boxstyle="round,pad=0.05,rounding_size=0.1",
                               facecolor='#0284C7', edgecolor='#0369A1', lw=1.5)
        ax.add_patch(box_b)
        ax.text(x, 0.8, name, ha='center', va='center', fontsize=9.5, fontweight='bold', color='#FFFFFF')

    # Sequence Messages
    # (y, from_x, to_x, label, is_return, is_async)
    messages = [
        (10.7, 1.8, 5.0, "1: Click Register & Enter UPI Ref", False),
        (10.0, 5.0, 8.2, "2: POST /api/events/:id/register (JWT)", False),
        (9.3, 8.2, 11.4, "3: Store Registration & Payment Status", False),
        (8.6, 11.4, 8.2, "4: Registration Record Saved", True),
        (7.9, 8.2, 5.0, "5: 201 Created (QR Ticket Generated)", True),
        (7.2, 5.0, 1.8, "6: Display Registration QR Code", True),
        (6.4, 1.8, 5.0, "7: Present QR at Venue (Check-in)", False),
        (5.7, 5.0, 8.2, "8: POST /api/attendance/scan (qrToken)", False),
        (5.0, 8.2, 11.4, "9: Update Attendance Record: Present", False),
        (4.3, 8.2, 13.8, "10: Trigger Certificate Pipeline", False),
        (3.6, 13.8, 11.4, "11: Save Certificate ID (IEEE-SNGCE-XXXX)", False),
        (2.9, 13.8, 1.8, "12: Email PDF Certificate via Gmail SMTP", True),
        (2.1, 5.0, 1.8, "13: Attendance Verified (Green Banner)", True)
    ]

    for y, x1, x2, msg, is_return in messages:
        # Message line
        style = '--' if is_return else '-'
        color = '#15803D' if is_return else '#0F172A'
        ax.annotate('', xy=(x2, y), xytext=(x1, y),
                    arrowprops=dict(arrowstyle='->' if not is_return else '->',
                                    color=color, lw=1.8, linestyle=style))
        # Label
        mid_x = (x1 + x2) / 2
        ax.text(mid_x, y + 0.16, msg, ha='center', va='bottom', fontsize=8.2,
                fontweight='semibold', color=color,
                bbox=dict(boxstyle="square,pad=0.15", facecolor='white', edgecolor='none', alpha=0.9))

    ax.text(7.5, 12.6, "Figure 5.3: UML Sequence Diagram - Event Registration, Attendance & Certificate Issuance",
            ha='center', va='center', fontsize=12, fontweight='bold', color='#0F172A')

    plt.tight_layout()
    out_file = os.path.join(FIGURES_DIR, "figure_5_3_sequence_diagram.png")
    plt.savefig(out_file, dpi=300, bbox_inches='tight')
    plt.close()
    print("Generated:", out_file)

if __name__ == "__main__":
    generate_burndown_chart()
    generate_sequence_diagram()
    print("All additional diagrams generated successfully!")
