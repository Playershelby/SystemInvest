// ==========================================
// ThemeToggle.js - Alterna modo escuro/claro
// Requisitos:
// - Escuro: mantém cor padrão atual
// - Claro: muda o fundo da página para offwhite
// - Persistência via localStorage
// ==========================================

(function () {
  const STORAGE_KEY = 'theme_mode';
  const DARK_VALUE = 'dark';
  const LIGHT_VALUE = 'light';

  const getStoredMode = function () {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch (e) {
      return null;
    }
  };

  const saveMode = function (mode) {
    try {
      localStorage.setItem(STORAGE_KEY, mode);
    } catch (e) {
      // ignore
    }
  };

  const applyTheme = function (mode) {
    const { body } = document;
    if (!body) return;

    body.classList.remove('theme-light', 'theme-dark');
    if (mode === LIGHT_VALUE) {
      body.classList.add('theme-light');
    } else {
      body.classList.add('theme-dark');
    }
  };

  const ensureFallbackButton = function () {
    let btn = document.getElementById('btn-theme-toggle');
    if (!btn) {
      btn = document.createElement('button');
      btn.id = 'btn-theme-toggle';
      btn.className = 'theme-toggle-btn';
      btn.title = 'Alternar modo claro/escuro';
      btn.setAttribute('aria-label', 'Alternar modo claro/escuro');
      document.body.appendChild(btn);
    }
    return btn;
  };

  document.addEventListener('DOMContentLoaded', function () {
    const toggleCheckbox = document.querySelector('.toggle-switch .checkbox');
    const initialMode = getStoredMode() === LIGHT_VALUE ? LIGHT_VALUE : DARK_VALUE;

    applyTheme(initialMode);

    if (toggleCheckbox) {
      // checked = modo claro
      toggleCheckbox.checked = initialMode === LIGHT_VALUE;

      toggleCheckbox.addEventListener('change', function () {
        const nextMode = toggleCheckbox.checked ? LIGHT_VALUE : DARK_VALUE;
        saveMode(nextMode);
        applyTheme(nextMode);
      });

      return;
    }

    // Fallback para páginas sem o switch customizado
    const btn = ensureFallbackButton();
    btn.dataset.mode = initialMode;
    btn.setAttribute('aria-pressed', initialMode === LIGHT_VALUE ? 'true' : 'false');

    btn.addEventListener('click', function () {
      const currentMode = btn.dataset.mode || getStoredMode() || DARK_VALUE;
      const nextMode = currentMode === LIGHT_VALUE ? DARK_VALUE : LIGHT_VALUE;
      btn.dataset.mode = nextMode;
      btn.setAttribute('aria-pressed', nextMode === LIGHT_VALUE ? 'true' : 'false');
      saveMode(nextMode);
      applyTheme(nextMode);
    });
  });
})();
