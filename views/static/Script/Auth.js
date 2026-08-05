// ==========================================
// Funções de Autenticação
// ==========================================

/**
 * Alterna a visibilidade da senha no login
 */
function mostrarSenha() {
    var inputPass = document.getElementById('password_login');
    var btnShowPass = document.getElementById('btn-senha');

    if (inputPass.type === 'password') {
        inputPass.setAttribute('type', 'text');
        btnShowPass.classList.replace('bi-eye', 'bi-eye-slash');
    } else {
        inputPass.setAttribute('type', 'password');
        btnShowPass.classList.replace('bi-eye-slash', 'bi-eye');
    }
}

/**
 * Alterna a visibilidade genérica de campo de senha
 * @param {string} inputId - ID do input
 * @param {HTMLElement} iconElement - Elemento do ícone para alternar classes
 */
function toggleVisibility(inputId, iconElement) {
    const input = document.getElementById(inputId);
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
 * Fechador de mensagens Flash
 */
function closeFlash(element) {
    const container = element.closest('.flash-container');
    if (container) {
        container.style.display = 'none';
    }
}

/**
 * Fechar automaticamente mensagens flash após 3 segundos
 */
document.addEventListener('DOMContentLoaded', function () {
    setTimeout(function () {
        let flashContainers = document.querySelectorAll('.flash-container');
        flashContainers.forEach(function (container) {
            container.style.display = 'none';
        });
    }, 3000);

    setTimeout(function () {
        let flashMessages = document.querySelectorAll('.flash-message');
        flashMessages.forEach(function (message) {
            message.style.display = 'none';
        });
    }, 3000);
});
