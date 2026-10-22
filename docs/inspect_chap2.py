import docx

doc = docx.Document(r"C:\Users\Abinson Babu\.gemini\antigravity\brain\18c1487f-ab35-4cae-a538-c21dfac065a0\.user_uploaded\media_1792596558882_0f1ebc8d.docx")

print("Checking Chapter 2 user stories:")
for i in range(585, 680):
    t = doc.paragraphs[i].text.strip()
    if t.startswith("2.") or "US" in t or "User Story" in t:
        print(f"[{i}] {t[:80]}")
