import docx

doc = docx.Document(r"C:\Users\Abinson Babu\.gemini\antigravity\brain\18c1487f-ab35-4cae-a538-c21dfac065a0\.user_uploaded\media_1792596558882_0f1ebc8d.docx")

sprints = []
for i in range(1440, 1780):
    t = doc.paragraphs[i].text.strip()
    if t.startswith("5.") and len(t) < 60:
        sprints.append((i, t))

for s in sprints:
    print(f"[{s[0]}] {s[1]}")
