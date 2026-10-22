import os
from PIL import Image

p1 = r"C:\Users\Abinson Babu\.gemini\antigravity\brain\18c1487f-ab35-4cae-a538-c21dfac065a0\.user_uploaded\media_1792595148956_2f76dc60.jpg"
p2 = r"C:\Users\Abinson Babu\.gemini\antigravity\brain\18c1487f-ab35-4cae-a538-c21dfac065a0\.user_uploaded\media_1792595148959_763085a5.jpg"

for p in [p1, p2]:
    im = Image.open(p)
    print(p, im.size, im.mode)
