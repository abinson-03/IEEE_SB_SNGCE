from PIL import Image
import numpy as np

im1 = Image.open(r"C:\Users\Abinson Babu\.gemini\antigravity\brain\18c1487f-ab35-4cae-a538-c21dfac065a0\.user_uploaded\media_1792595148956_2f76dc60.jpg")
im2 = Image.open(r"C:\Users\Abinson Babu\.gemini\antigravity\brain\18c1487f-ab35-4cae-a538-c21dfac065a0\.user_uploaded\media_1792595148959_763085a5.jpg")

print("im1 size:", im1.size)
print("im2 size:", im2.size)

# Sample some pixel colors
arr1 = np.array(im1)
arr2 = np.array(im2)
print("arr1 mean color:", arr1.mean(axis=(0, 1)))
print("arr2 mean color:", arr2.mean(axis=(0, 1)))
