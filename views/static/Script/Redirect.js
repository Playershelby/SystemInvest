// ==========================================
// Funções de Redirecionamento
// ==========================================

/**
 * Inicia o carregamento e processamento
 */
function ShowAlerta() {
    startLoading();
}

/**
 * Inicia o indicador de carregamento e faz fetch para processar
 */
function startLoading() {
    const loadingElement = document.getElementById('loading');
    if (loadingElement) {
        loadingElement.style.display = 'block';
    }
    
    fetch('/user/process')
        .then(response => {
            if (!response.ok) {
                throw new Error(`Erro HTTP! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (loadingElement) {
                loadingElement.style.display = 'none';
            }
            
            if (typeof showMessage === 'function') {
                showMessage(data.message || 'Processamento concluído!', 'success');
            }
            
            setTimeout(redirect, 3000);
        })
        .catch(error => {
            console.error('Error:', error);
            if (loadingElement) {
                loadingElement.style.display = 'none';
            }
            
            if (typeof showMessage === 'function') {
                showMessage('Ocorreu um erro durante o processamento.', 'error');
            }
        });
}

/**
 * Redireciona para a página inicial
 */
function redirect() {
    window.location.href = '/';
}

/**
 * Inicializa o processo ao carregar a página
 */
window.onload = ShowAlerta;

/**
 * Validador de força de senha para redPassword
 */
document.addEventListener('DOMContentLoaded', function () {
    const passwordInput = document.getElementById('password');
    const confirmInput = document.getElementById('confirm_password');
    const confirmChecklist = document.getElementById('confirmPasswordChecklist');
    const matchRule = document.getElementById('matchPasswordRule');

    const requirements = {
        length: /.{8,}/,
        uppercase: /[A-Z]/,
        lowercase: /[a-z]/,
        number: /[0-9]/,
        special: /[!@#$%&*]/
    };

    function checkMatch() {
        if (confirmInput && confirmInput.value.length > 0) {
            if (confirmChecklist) confirmChecklist.style.display = 'flex';
            const icon = matchRule ? matchRule.querySelector('.check-icon') : null;
            if (icon) {
                if (passwordInput && passwordInput.value === confirmInput.value) {
                    matchRule.classList.add('valid');
                    icon.textContent = '✓';
                } else {
                    matchRule.classList.remove('valid');
                    icon.textContent = '✗';
                }
            }
        } else if (confirmChecklist) {
            confirmChecklist.style.display = 'none';
        }
    }

    if (passwordInput) {
        passwordInput.addEventListener('input', function () {
            const password = this.value;
            for (const [rule, regex] of Object.entries(requirements)) {
                const item = document.querySelector(`.check-item[data-rule="${rule}"]`);
                if (item) {
                    const icon = item.querySelector('.check-icon');
                    if (regex.test(password)) {
                        item.classList.add('valid');
                        icon.textContent = '✓';
                    } else {
                        item.classList.remove('valid');
                        icon.textContent = '✗';
                    }
                }
            }
            checkMatch();
        });
    }

    if (confirmInput) {
        confirmInput.addEventListener('input', checkMatch);
    }
});
