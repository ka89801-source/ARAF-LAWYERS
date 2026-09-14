"""Build both published entry points from the shared source files."""
from pathlib import Path

ROOT = Path(__file__).resolve().parent
SCRIPTS = (
    "data.js", "core.js", "app.js", "views-cases.js",
    "views-work.js", "views-biz.js", "navigation.js",
)
template = (ROOT / "index.src.html").read_text(encoding="utf-8")
css = (ROOT / "styles.css").read_text(encoding="utf-8")
js = "\n".join((ROOT / name).read_text(encoding="utf-8") for name in SCRIPTS)
output = template.replace("/*CSS*/", css).replace("/*JS*/", js)
for name in ("index.html", "araf-lawyers.html"):
    (ROOT / name).write_text(output, encoding="utf-8")
# Keep the original dist output available to existing preview workflows.
(ROOT / "dist").mkdir(exist_ok=True)
(ROOT / "dist" / "index.html").write_text(output, encoding="utf-8")
print(f"Built {len(output):,} characters per entry point.")
