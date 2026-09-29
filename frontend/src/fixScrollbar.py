with open(r'C:\coding\codes\project\apne-hath-crafts-main\frontend\src\styles.css', 'a', encoding='utf-8') as f:
    f.write('''
/* --- Scrollbar Customization --- */
html, body {
  scrollbar-gutter: stable; /* Prevent UI shifting when scrollbar appears */
}

/* Thin Scrollbar for Webkit */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
::-webkit-scrollbar-track {
  background: transparent;
}
::-webkit-scrollbar-thumb {
  background-color: var(--color-border);
  border-radius: 10px;
}
::-webkit-scrollbar-thumb:hover {
  background-color: var(--color-muted-foreground);
}

/* For Firefox */
* {
  scrollbar-width: thin;
  scrollbar-color: var(--color-border) transparent;
}
''')
