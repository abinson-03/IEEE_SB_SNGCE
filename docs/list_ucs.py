import docx

doc = docx.Document(r"C:\Users\Abinson Babu\.gemini\antigravity\brain\18c1487f-ab35-4cae-a538-c21dfac065a0\.user_uploaded\media_1792596558882_0f1ebc8d.docx")

ucs = []
for i in range(600, 1080):
    t = doc.paragraphs[i].text.strip()
    if "USE CASE UC-" in t.upper():
        ucs.append((i, t))

for u in ucs:
    print(f"[{u[0]}] {u[1]}")
