import os
import shutil

workspace = r"c:\Users\BRAYAN RICARDO\Downloads\PANADERIA EL NUEVO MILENIO"
brain_dir = r"C:\Users\BRAYAN RICARDO\.gemini\antigravity-ide\brain\27c93a3b-1252-4c3d-9db7-bf5f8b45b5db"

assets_dir = os.path.join(workspace, "assets")
img_dir = os.path.join(assets_dir, "images")
os.makedirs(img_dir, exist_ok=True)

# Copy generated hero & logo
for f in os.listdir(brain_dir):
    if f.startswith("bakery_hero_banner") and f.endswith(".jpg"):
        shutil.copy(os.path.join(brain_dir, f), os.path.join(assets_dir, "hero-banner.jpg"))
        print("Copied hero-banner.jpg")
    if f.startswith("bakery_logo") and f.endswith(".jpg"):
        shutil.copy(os.path.join(brain_dir, f), os.path.join(assets_dir, "logo.png"))
        print("Copied logo.png")

# Map product images to clean names for easy usage
image_mapping = {
    "WhatsApp Image 2026-08-24 at 9.01.03 PM (1).jpeg": "vitrina-panes.jpg",
    "WhatsApp Image 2026-08-24 at 9.01.03 PM (2).jpeg": "galletas-estrellitas.jpg",
    "WhatsApp Image 2026-08-24 at 9.01.03 PM (3).jpeg": "polvorones-rojos.jpg",
    "WhatsApp Image 2026-08-24 at 9.01.03 PM.jpeg": "pan-casero-dorado.jpg",
    "WhatsApp Image 2026-08-24 at 9.01.03 PM (4).jpeg": "paquete-pan-queso.jpg",
    "WhatsApp Image 2026-08-24 at 9.01.04 PM (7).jpeg": "torta-chocolate-supremo.jpg",
    "WhatsApp Image 2026-08-24 at 9.01.04 PM (8).jpeg": "torta-frutal-milenio.jpg",
    "WhatsApp Image 2026-08-24 at 9.01.04 PM (6).jpeg": "torta-celeste-ganache.jpg",
    "WhatsApp Image 2026-08-24 at 9.01.04 PM.jpeg": "torta-frutos-rojos-merengue.jpg",
    "WhatsApp Image 2026-08-24 at 9.01.04 PM (2).jpeg": "torta-cumpleanos-mamita.jpg",
    "WhatsApp Image 2026-08-24 at 9.01.04 PM (1).jpeg": "torta-fresas-kiwi.jpg",
    "WhatsApp Image 2026-08-24 at 9.01.04 PM (3).jpeg": "torta-turquesa-frutas.jpg",
    "WhatsApp Image 2026-08-24 at 9.01.04 PM (4).jpeg": "torta-tematica-tiktok.jpg",
    "WhatsApp Image 2026-08-24 at 9.01.04 PM (5).jpeg": "torta-tematica-unicornio.jpg",
}

for src_name, dst_name in image_mapping.items():
    src_path = os.path.join(workspace, src_name)
    if os.path.exists(src_path):
        dst_path = os.path.join(img_dir, dst_name)
        shutil.copy(src_path, dst_path)
        print(f"Copied {src_name} -> {dst_name}")

print("Assets setup completed successfully!")
