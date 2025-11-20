from pathlib import Path
text=Path('src/components/MapSelector.jsx').read_text(encoding='utf-8')
needle='          <button'
start=text.index(needle)
print(text[start:start+400])
