"""Exporte le carrousel en images : 8 PNG carrés (1080x1080, rendus x2 pour la
netteté) + un PDF concaténé prêt à publier.

Rend directement le fichier share/carousel.html via un navigateur headless
(Playwright), donc le résultat est identique au design HTML, sans le bricolage
« imprimer en PDF » de Chrome.

Prérequis (une seule fois) :
    pip install playwright pillow
    python -m playwright install chromium

Lancement :
    python share/export_carousel.py

Sortie :
    share/png/slide-01.png ... slide-08.png
    share/carousel.pdf
"""

from pathlib import Path

from PIL import Image
from playwright.sync_api import sync_playwright

HERE = Path(__file__).parent
SRC = (HERE / "carousel.html").resolve().as_uri()
OUT_PNG = HERE / "png"
OUT_PNG.mkdir(exist_ok=True)
OUT_PDF = HERE / "carousel.pdf"


def _launch(p):
    """Sur poste d'entreprise, le chromium téléchargé par Playwright peut être bloqué
    (spawn UNKNOWN). On tente d'abord Edge puis Chrome du système (signés, autorisés),
    et en dernier recours le chromium de Playwright."""
    for channel in ("msedge", "chrome"):
        try:
            return p.chromium.launch(channel=channel)
        except Exception as e:  # noqa: BLE001
            print(f"[skip] canal {channel} indisponible ({type(e).__name__})")
    return p.chromium.launch()


def main() -> None:
    pngs: list[Path] = []
    with sync_playwright() as p:
        browser = _launch(p)
        # x2 pour un rendu net (2160x2160) ; LinkedIn redimensionne sans souci.
        page = browser.new_page(viewport={"width": 1200, "height": 1200}, device_scale_factor=2)
        page.goto(SRC)
        page.wait_for_timeout(400)  # laisse les polices se charger
        slides = page.query_selector_all(".slide")
        for i, slide in enumerate(slides, 1):
            path = OUT_PNG / f"slide-{i:02d}.png"
            slide.screenshot(path=str(path))
            pngs.append(path)
            print(f"[PNG]  {path.name}")
        browser.close()

    imgs = [Image.open(p).convert("RGB") for p in pngs]
    imgs[0].save(OUT_PDF, save_all=True, append_images=imgs[1:], resolution=150.0)
    print(f"[PDF]  {OUT_PDF.name} ({len(imgs)} pages)")


if __name__ == "__main__":
    main()
