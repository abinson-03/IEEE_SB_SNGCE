with open(r"C:\Users\Abinson Babu\Desktop\ieee-sb-portal\docs\PROJECT_REPORT.md", "r", encoding="utf-8") as f:
    lines = f.readlines()

for i, l in enumerate(lines):
    if any(k in l for k in ["### 1.4", "### 4.3", "### 4.4", "### 6.1", "### 6.2", "### 8.1", "### 8.2"]):
        print(f"[{i}] {l.strip()}")
        for j in range(i, min(len(lines), i + 6)):
            print(f"   [{j}] {lines[j].strip()[:80]}")
