import os
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import numpy as np

# Set directories
out_docs = r"C:\Users\Abinson Babu\Desktop\ieee-sb-portal\docs\burndown_chart.png"
out_downloads = r"C:\Users\Abinson Babu\Downloads\burndown_chart.png"
out_fig = r"C:\Users\Abinson Babu\Desktop\ieee-sb-portal\docs\figures\figure_4_5_burndown_chart.png"
out_artifact = r"C:\Users\Abinson Babu\.gemini\antigravity\brain\18c1487f-ab35-4cae-a538-c21dfac065a0\burndown_chart.png"

# Data from Table 6.10
sprints = ['Project\nStart', 'Sprint 1', 'Sprint 2', 'Sprint 3', 'Sprint 4', 'Sprint 5', 'Sprint 6', 'Sprint 7']
x = np.arange(len(sprints))

planned = [74, 65, 54, 44, 37, 23, 9, 0]
actual  = [74, 65, 56, 46, 39, 25, 11, 0]

fig, ax = plt.subplots(figsize=(10, 6.2), dpi=300)

# Background and font
fig.patch.set_facecolor('#FFFFFF')
ax.set_facecolor('#FAFAFA')

plt.rcParams['font.family'] = 'sans-serif'
plt.rcParams['font.sans-serif'] = ['DejaVu Sans', 'Arial', 'Segoe UI']

# Grid
ax.grid(True, linestyle='--', alpha=0.6, color='#CBD5E1', zorder=1)

# Plot Planned Remaining line
ax.plot(x, planned, color='#0284C7', linestyle='--', linewidth=2.5, marker='s', markersize=8,
        label='Planned Remaining (hrs)', zorder=4)

# Plot Actual Remaining line
ax.plot(x, actual, color='#EA580C', linestyle='-', linewidth=2.8, marker='o', markersize=8,
        label='Actual Remaining (hrs)', zorder=5)

# Value annotations
for i, (p, a) in enumerate(zip(planned, actual)):
    if i == 0:
        ax.annotate(f"{a}h", (x[i], a), textcoords="offset points", xytext=(0, 12),
                    ha='center', fontsize=9, fontweight='bold', color='#1E293B',
                    bbox=dict(boxstyle="round,pad=0.2", facecolor="#FFFFFF", edgecolor="#CBD5E1", lw=0.8), zorder=6)
    elif i == 1:
        ax.annotate(f"{a}h", (x[i], a), textcoords="offset points", xytext=(0, 12),
                    ha='center', fontsize=9, fontweight='bold', color='#1E293B',
                    bbox=dict(boxstyle="round,pad=0.2", facecolor="#FFFFFF", edgecolor="#CBD5E1", lw=0.8), zorder=6)
    elif i == len(sprints) - 1:
        ax.annotate(f"{a}h", (x[i], a), textcoords="offset points", xytext=(0, 12),
                    ha='center', fontsize=9, fontweight='bold', color='#16A34A',
                    bbox=dict(boxstyle="round,pad=0.2", facecolor="#DCFCE7", edgecolor="#16A34A", lw=0.8), zorder=6)
    else:
        # Planned text
        ax.annotate(f"{p}h", (x[i], p), textcoords="offset points", xytext=(-14, -14),
                    ha='center', fontsize=8.5, fontweight='bold', color='#0284C7',
                    bbox=dict(boxstyle="round,pad=0.15", facecolor="#E0F2FE", edgecolor="#0284C7", lw=0.6), zorder=6)
        # Actual text
        ax.annotate(f"{a}h", (x[i], a), textcoords="offset points", xytext=(14, 10),
                    ha='center', fontsize=8.5, fontweight='bold', color='#EA580C',
                    bbox=dict(boxstyle="round,pad=0.15", facecolor="#FFEDD5", edgecolor="#EA580C", lw=0.6), zorder=6)

# Axes styling
ax.set_xticks(x)
ax.set_xticklabels(sprints, fontsize=9.5, fontweight='bold', color='#1E293B')
ax.set_ylim(-2, 84)
ax.set_ylabel('Remaining Effort (Hours)', fontsize=11, fontweight='bold', color='#0F172A', labelpad=10)
ax.set_xlabel('Project Sprints & Milestones', fontsize=11, fontweight='bold', color='#0F172A', labelpad=10)

# Title & Metadata
ax.set_title('Figure 6.1: Product Burndown Monitoring Across Seven Sprints (74 hrs)\n'
             'IEEE SB SNGCE Portal  |  Candidate: Abinson Babu (SNG25MCA-2002)  |  Guide: Dr. Anoopkumar M',
             fontsize=11.5, fontweight='bold', color='#0F172A', pad=15)

# Legend
legend = ax.legend(loc='upper right', frameon=True, fontsize=10, facecolor='#FFFFFF', edgecolor='#94A3B8')
legend.get_frame().set_linewidth(1.2)

# Spines
for spine in ax.spines.values():
    spine.set_color('#94A3B8')
    spine.set_linewidth(1.2)

plt.tight_layout()

# Save in all locations
for path in [out_docs, out_downloads, out_fig, out_artifact]:
    plt.savefig(path, dpi=300, bbox_inches='tight')

print("Burndown chart generated successfully!")
