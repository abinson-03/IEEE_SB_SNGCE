import docx

doc = docx.Document(r"C:\Users\Abinson Babu\Desktop\ieee-sb-portal\docs\build_abinson\stage2.docx")

for i in range(2005, 2035):
    t = doc.paragraphs[i].text.strip()
    if t:
        print(f"[{i}] {t}")
