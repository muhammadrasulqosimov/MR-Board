export function initTheme() {
    const saved = localStorage.getItem('mr_theme');
    if (saved) document.body.setAttribute('data-theme', saved);
    else {
        const dark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        document.body.setAttribute('data-theme', dark ? 'dark' : 'light');
    }
}

export function setTheme(mode) {
    if (mode === 'auto') {
        localStorage.removeItem('mr_theme');
        const dark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        document.body.setAttribute('data-theme', dark ? 'dark' : 'light');
    } else {
        localStorage.setItem('mr_theme', mode);
        document.body.setAttribute('data-theme', mode);
    }
}
