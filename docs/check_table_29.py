import docx

doc = docx.Document(r"C:\Users\Abinson Babu\Desktop\ieee-sb-portal\docs\build_abinson\stage2.docx")

tbl = doc.tables[29]
print("Table 29 rows:")
for r in tbl.rows:
    row_txt = [c.text.strip().replace('\n', ' ') for c in r.cells]
    print(" | ".join(row_txt))
