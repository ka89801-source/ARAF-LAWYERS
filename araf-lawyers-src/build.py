import pathlib
p=pathlib.Path('/home/claude/araf')
html=(p/'index.src.html').read_text()
css=(p/'styles.css').read_text()
js='\n'.join((p/f).read_text() for f in ['data.js','core.js','app.js','views-cases.js','views-work.js','views-biz.js'])
out=html.replace('/*CSS*/',css).replace('/*JS*/',js)
(p/'dist').mkdir(exist_ok=True)
(p/'dist'/'index.html').write_text(out)
print(len(out))
