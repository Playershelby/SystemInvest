// ==========================================
// Funções Comuns Globais
// ==========================================

/**
 * Sistema Global de Som para Notificações Flash
 */
document.addEventListener('DOMContentLoaded', function () {
    const hasFlashMessage = document.querySelector('.flash-container');
    if (hasFlashMessage) {
        try {
            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            
            osc.type = 'sine';
            osc.frequency.setValueAtTime(800, audioCtx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(1200, audioCtx.currentTime + 0.1);
            
            gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
            gainNode.gain.linearRampToValueAtTime(0.4, audioCtx.currentTime + 0.05);
            gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.6);
            
            osc.connect(gainNode);
            gainNode.connect(audioCtx.destination);
            
            osc.start();
            osc.stop(audioCtx.currentTime + 0.6);
        } catch (e) {
            console.log('Notificação silenciosa (interaja mais com a tela para habilitar autoplay na sessão)');
        }
    }
});

/**
 * Sistema Global de Toast Notifications
 */
function showToast(type, title, message) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const icons = {
        'info': 'fas fa-info-circle',
        'success': 'fas fa-check-double',
        'error': 'fas fa-exclamation-triangle'
    };

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.style.position = 'relative';
    toast.innerHTML = `
        <div class="toast-icon">
            <i class="${icons[type] || 'fas fa-info-circle'}"></i>
        </div>
        <div class="toast-body">
            <div class="toast-title">${title}</div>
            <p class="toast-message">${message}</p>
        </div>
        <div class="toast-progress">
            <div class="toast-progress-bar"></div>
        </div>
    `;

    // Click to dismiss early
    toast.addEventListener('click', () => {
        toast.style.animation = 'slideOutRight 0.3s ease-in-out forwards';
        setTimeout(() => toast.remove(), 300);
    });

    container.appendChild(toast);

    // Auto-dismiss after 5 seconds
    setTimeout(() => {
        if (toast.parentNode) {
            toast.style.animation = 'slideOutRight 0.3s ease-in-out forwards';
            setTimeout(() => toast.remove(), 300);
        }
    }, 5000);
}

/**
 * Alterna a visibilidade genérica de campo de senha
 */
function toggleVisibility(inputId, iconElement) {
    const input = document.getElementById(inputId);
    if (!input) return;

    if (input.type === 'password') {
        input.type = 'text';
        iconElement.classList.remove('fa-eye');
        iconElement.classList.add('fa-eye-slash');
    } else {
        input.type = 'password';
        iconElement.classList.remove('fa-eye-slash');
        iconElement.classList.add('fa-eye');
    }
}

/**
 * Função auxiliar para mostrar mensagens (compatibilidade com redirect)
 */
function showMessage(message, type) {
    console.log(`[${type.toUpperCase()}] ${message}`);
    // Poderia integrar com showToast se necessário
}

/**
 * Função para guardar o dashboard atual no localStorage
 */
function saveDashboardLocation(location) {
    localStorage.setItem('last_dashboard', location);
}

/**
 * Função para obter o dashboard salvo
 */
function getDashboardLocation() {
    return localStorage.getItem('last_dashboard') || '';
}

/**
 * Função para determinar qual dashboard abrir baseado no histórico
 */
function getDestinationDashboard() {
    const lastDashboard = getDashboardLocation();
    
    if (lastDashboard.includes('dashagencia')) {
        return '/user/dashagencia';
    } else if (lastDashboard.includes('dashboard')) {
        return '/user/dashboard';
    }
    
    return '/user/dashboard';
}

/**
 * Redireciona para a página de relatórios gerais
 */
function abrirRelatorios(e) {
    e.preventDefault();
    const btn = e.currentTarget;
    btn.style.transform = 'scale(0.95)';
    saveDashboardLocation('dashagencia');
    setTimeout(() => {
        btn.style.transform = 'translateY(-2px)';
        window.location.href = '/user/relatorios_agencia';
    }, 150);
}

/**
 * Ajusta o botão de voltar nas páginas de configurações
 */
document.addEventListener('DOMContentLoaded', function () {
    const btnBack = document.getElementById('btn-back');
    if (btnBack) {
        const lastDashboard = getDashboardLocation();
        let destino = '/user/settings';

        if (lastDashboard.includes('dashagencia')) {
            destino = '/user/dashagencia';
        } else if (lastDashboard.includes('dashboard')) {
            destino = '/user/dashboard';
        }

        btnBack.addEventListener('click', function (e) {
            e.preventDefault();
            window.location.href = destino;
        });
    }
});

/**
 * Delay global de navegação (5s) com loader
 */
document.addEventListener('DOMContentLoaded', function () {
    const PAGE_DELAY_MS = 5000;
    const loader = document.getElementById('page-loader');

    function showPageLoader() {
        if (!loader) return;
        loader.classList.remove('hidden');
        loader.setAttribute('aria-hidden', 'false');
    }

    function shouldHandleLink(anchor) {
        if (!anchor) return false;
        if (anchor.target === '_blank') return false;
        if (anchor.hasAttribute('download')) return false;
        const href = anchor.getAttribute('href');
        if (!href) return false;
        if (href.startsWith('#')) return false;
        if (href.startsWith('javascript:')) return false;
        if (href.startsWith('mailto:') || href.startsWith('tel:')) return false;
        return true;
    }

    // Intercepta links internos
    document.addEventListener('click', function (e) {
        const anchor = e.target.closest('a');
        if (!shouldHandleLink(anchor)) return;

        const url = new URL(anchor.href, window.location.origin);
        const isSameOrigin = url.origin === window.location.origin;

        if (!isSameOrigin) return;

        e.preventDefault();
        showPageLoader();

        setTimeout(() => {
            window.location.href = url.href;
        }, PAGE_DELAY_MS);
    });

    // Intercepta submit de forms
    document.addEventListener('submit', function (e) {
        const form = e.target;
        if (!(form instanceof HTMLFormElement)) return;

        // Evita loop em submissões já tratadas
        if (form.dataset.delayHandled === 'true') return;

        e.preventDefault();
        form.dataset.delayHandled = 'true';
        showPageLoader();

        setTimeout(() => {
            form.submit();
        }, PAGE_DELAY_MS);
    });
});
