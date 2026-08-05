// ==========================================
// Funções de Pagamento e Validação de Cartão
// ==========================================

/**
 * Formata o número do cartão em grupos de 4 dígitos
 * @param {HTMLInputElement} input - Input do número do cartão
 */
function formatarCartao(input) {
    let value = input.value.replace(/\D/g, '');
    value = value.replace(/(\d{4})(?=\d)/g, '$1 ');
    input.value = value.substring(0, 19);

    const preview = document.querySelector('.card-number-preview');
    if (preview) {
        preview.textContent = value || '•••• •••• •••• ••••';
    }
}

/**
 * Formata a data de validade (MM/AA)
 * @param {HTMLInputElement} input - Input da data de validade
 */
function formatarValidade(input) {
    let value = input.value.replace(/\D/g, '');
    if (value.length >= 2) {
        value = value.substring(0, 2) + '/' + value.substring(2, 4);
    }
    input.value = value;
    const preview = document.getElementById('preview-validade');
    if (preview) {
        preview.textContent = value || 'MM/AA';
    }
}

/**
 * Formata o CPF (XXX.XXX.XXX-XX)
 * @param {HTMLInputElement} input - Input do CPF
 */
function formatarCPF(input) {
    let value = input.value.replace(/\D/g, '');
    value = value.replace(/(\d{3})(\d)/, '$1.$2');
    value = value.replace(/(\d{3})(\d)/, '$1.$2');
    value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    input.value = value;
}

/**
 * Algoritmo Luhn para validação de número de cartão
 * @param {string} num - Número do cartão
 * @returns {boolean} Cartão válido
 */
function luhnCheck(num) {
    const digits = num.replace(/\s+/g, '');
    if (digits.length === 0) return false;
    let sum = 0;
    let shouldDouble = false;

    for (let i = digits.length - 1; i >= 0; i--) {
        let d = parseInt(digits.charAt(i), 10);
        if (shouldDouble) {
            d *= 2;
            if (d > 9) d -= 9;
        }
        sum += d;
        shouldDouble = !shouldDouble;
    }
    return (sum % 10) === 0;
}

/**
 * Valida se a data de validade ainda está vigente
 * @param {string} str - Data em formato MM/AA
 * @returns {boolean} Data válida e no futuro
 */
function validadeValida(str) {
    if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(str)) return false;
    const [mes, ano] = str.split('/');
    const agora = new Date();
    const mesNum = parseInt(mes, 10);
    const anoNum = parseInt('20' + ano, 10);

    const exp = new Date(anoNum, mesNum);
    return exp > agora;
}

/**
 * Inicializa validação do formulário de pagamento
 */
document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('cartao-form');
    if (!form) return;

    form.addEventListener('submit', function (e) {
        const dadosNovoCartao = document.getElementById('dados-novo-cartao');
        const btnUsarSalvo = document.getElementById('btn-usar-salvo');

        if (dadosNovoCartao && dadosNovoCartao.style.display === 'none' && this.dataset.usandoSalvo !== 'true') {
            e.preventDefault();
            if (btnUsarSalvo) btnUsarSalvo.click();
            return;
        }

        if (this.dataset.usandoSalvo === 'true') {
            return;
        }

        const alerts = document.querySelectorAll('.alert-client');
        alerts.forEach(a => a.remove());

        const nome = document.getElementById('nome_cartao')?.value.trim() || '';
        const numero = document.getElementById('numero_cartao')?.value.trim() || '';
        const cpf = document.getElementById('cpf')?.value.trim() || '';
        const validade = document.getElementById('validade')?.value.trim() || '';
        const cvc = document.getElementById('cvc')?.value.trim() || '';
        const valor = document.getElementById('valor')?.value.trim() || '';

        let erros = [];

        if (!valor || parseFloat(valor) <= 0) {
            erros.push('Por favor, informe um valor válido para o pagamento.');
        }

        if (!nome) {
            erros.push('O nome gravado no cartão é obrigatório.');
        }

        if (!cpf || !/^\d{3}\.\d{3}\.\d{3}\-\d{2}$/.test(cpf)) {
            erros.push('CPF do titular inválido ou não preenchido.');
        }

        if (!luhnCheck(numero)) {
            erros.push('Número do cartão inválido (falha no algoritmo Luhn).');
        }

        if (!validadeValida(validade)) {
            erros.push('Data de validade inválida ou já expirou.');
        }

        if (!/^\d{3,4}$/.test(cvc)) {
            erros.push('CVC deve conter 3 ou 4 dígitos.');
        }

        if (erros.length) {
            e.preventDefault();
            const container = document.querySelector('.pagamentos-header');
            if (container) {
                erros.forEach(msg => {
                    const div = document.createElement('div');
                    div.className = 'alert alert-danger alert-client';
                    div.innerHTML = '<i class="bi bi-exclamation-circle"></i> ' + msg;
                    container.appendChild(div);
                });
            }
        }
    });

    /**
     * Lógica de uso de cartão salvo
     */
    const btnUsarSalvo = document.getElementById('btn-usar-salvo');
    if (btnUsarSalvo) {
        btnUsarSalvo.addEventListener('click', function () {
            const valorInput = document.getElementById('valor');
            if (!valorInput || !valorInput.value) {
                alert('Por favor, informe primeiro o valor que deseja pagar!');
                valorInput?.focus();
                return;
            }

            const numeroInput = document.getElementById('numero_cartao');
            const nomeInput = document.getElementById('nome_cartao');
            const validadeInput = document.getElementById('validade');
            const cvcInput = document.getElementById('cvc');
            const cpfInput = document.getElementById('cpf');

            if (numeroInput) numeroInput.value = numeroInput.dataset.savedNumber || '';
            if (nomeInput) nomeInput.value = nomeInput.dataset.savedName || '';
            if (validadeInput) validadeInput.value = validadeInput.dataset.savedValidade || '';
            if (cvcInput) cvcInput.value = '000';
            if (cpfInput) cpfInput.value = cpfInput.dataset.savedCpf || '';

            form.dataset.usandoSalvo = 'true';
            form.submit();
        });
    }

    /**
     * Toggle para mostrar formulário de novo cartão
     */
    const btnMostrar = document.getElementById('btn-mostrar-form-normal');
    if (btnMostrar) {
        btnMostrar.addEventListener('click', function () {
            const dadosNovoCartao = document.getElementById('dados-novo-cartao');
            const btnPagarNormal = document.getElementById('btn-pagar-normal');
            const containerSalvar = document.getElementById('container-salvar-cartao');

            if (dadosNovoCartao) dadosNovoCartao.style.display = 'block';
            if (btnUsarSalvo) btnUsarSalvo.style.display = 'none';
            this.style.display = 'none';
            if (btnPagarNormal) btnPagarNormal.style.display = 'flex';
            if (containerSalvar) containerSalvar.style.display = 'flex';

            const cartaoSecoaoTopo = document.getElementById('cartao-secao-topo');
            if (cartaoSecoaoTopo) cartaoSecoaoTopo.style.display = 'none';
        });
    }

    /**
     * Toggle para voltar ao cartão salvo
     */
    const btnVoltar = document.getElementById('btn-voltar-cartao-salvo');
    if (btnVoltar) {
        btnVoltar.addEventListener('click', function () {
            const dadosNovoCartao = document.getElementById('dados-novo-cartao');
            const btnPagarNormal = document.getElementById('btn-pagar-normal');
            const containerSalvar = document.getElementById('container-salvar-cartao');
            const cartaoSecoaoTopo = document.getElementById('cartao-secao-topo');

            if (dadosNovoCartao) dadosNovoCartao.style.display = 'none';
            if (btnUsarSalvo) btnUsarSalvo.style.display = 'flex';
            if (btnMostrar) btnMostrar.style.display = 'block';
            if (btnPagarNormal) btnPagarNormal.style.display = 'none';
            if (containerSalvar) containerSalvar.style.display = 'none';
            if (cartaoSecoaoTopo) cartaoSecoaoTopo.style.display = 'block';

            // Limpa os campos
            if (numeroInput) numeroInput.value = '';
            if (nomeInput) nomeInput.value = '';
            if (validadeInput) validadeInput.value = '';
            if (cvcInput) cvcInput.value = '';
            if (cpfInput) cpfInput.value = '';
        });
    }
});
