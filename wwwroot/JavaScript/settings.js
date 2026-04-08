const DEFAULTS = {
    '--bg':           '#1a1a2e',
    '--surface':      '#16213e',
    '--border':       '#0f3460',
    '--accent':       '#e94560',
    '--accent-text':  '#ffffff',
    '--text':         '#e0e0e0',
    '--success':      '#27ae60',
};

const PICKERS = [
    { variable: '--bg',      id: 'pickerBg'      },
    { variable: '--surface', id: 'pickerSurface'  },
    { variable: '--border',  id: 'pickerBorder'   },
    { variable: '--accent',       id: 'pickerAccent'      },
    { variable: '--accent-text',  id: 'pickerAccentText'  },
    { variable: '--text',         id: 'pickerText'        },
    { variable: '--success', id: 'pickerSuccess'  },
];

function applyTheme(theme) {
    for (const [variable, value] of Object.entries(theme)) {
        document.documentElement.style.setProperty(variable, value);
    }
}

function loadTheme() {
    try {
        const saved = localStorage.getItem('theme');
        return saved ? { ...DEFAULTS, ...JSON.parse(saved) } : { ...DEFAULTS };
    } catch {
        return { ...DEFAULTS };
    }
}

function saveTheme(theme) {
    localStorage.setItem('theme', JSON.stringify(theme));
}

function syncPickers(theme) {
    for (const { variable, id } of PICKERS) {
        const el = document.getElementById(id);
        if (el) el.value = theme[variable];
    }
}

// Apply saved theme (the inline <head> script already did this before paint,
// but we re-apply here so the module's in-memory state matches the DOM).
applyTheme(loadTheme());

const overlay = document.getElementById('settingsOverlay');

document.getElementById('settingsBtn')?.addEventListener('click', () => {
    syncPickers(loadTheme());
    overlay.classList.add('open');
});

document.getElementById('settingsCloseBtn')?.addEventListener('click', () => {
    overlay.classList.remove('open');
});

// Close on backdrop click
overlay?.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.classList.remove('open');
});

document.getElementById('settingsResetBtn')?.addEventListener('click', () => {
    saveTheme(DEFAULTS);
    applyTheme(DEFAULTS);
    syncPickers(DEFAULTS);
});

// Live preview as the user drags the color picker
for (const { variable, id } of PICKERS) {
    document.getElementById(id)?.addEventListener('input', (e) => {
        const theme = loadTheme();
        theme[variable] = e.target.value;
        saveTheme(theme);
        applyTheme(theme);
    });
}
