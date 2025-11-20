from pathlib import Path
path=Path('src/components/MapSelector.jsx')
text=path.read_text(encoding='utf-8')
idx=text.rfind('  );')
print(idx)
print(text[idx-50:idx+10])
