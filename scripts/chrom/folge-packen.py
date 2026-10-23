# Wandelt die gerenderte Bildfolge (PNG) in WebP mit Transparenz um und legt sie unter public/bilder/chrom/folge ab.
# Aufruf aus dem Projektordner: python scripts/chrom/folge-packen.py
import pathlib
from PIL import Image

quelle = pathlib.Path('scripts/chrom/folge')
ziel = pathlib.Path('public/bilder/chrom/folge')
ziel.mkdir(parents=True, exist_ok=True)
summe = 0
for png in sorted(quelle.glob('*.png')):
    aus = ziel / (png.stem + '.webp')
    Image.open(png).save(aus, 'WEBP', quality=72, method=6, alpha_quality=80)
    summe += aus.stat().st_size
print(f'{len(list(ziel.glob("*.webp")))} Dateien, {summe / 1024:.0f} KB')
