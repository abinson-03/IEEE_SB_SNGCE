import docx

doc = docx.Document(r"C:\Users\Abinson Babu\.gemini\antigravity\brain\18c1487f-ab35-4cae-a538-c21dfac065a0\.user_uploaded\media_1792596558882_0f1ebc8d.docx")

for i in range(477, 515):
    t = doc.paragraphs[i].text.strip()
    if t:
        print(f"[{i}] {t}")
