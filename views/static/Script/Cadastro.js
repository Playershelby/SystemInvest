// ==========================================
// Funções de Cadastro e Validação
// ==========================================

/**
 * Alterna a visibilidade de senha na página de cadastro
 */
function mostrarSenha() {
    var inputPass = document.getElementById('password');
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
 * Alterna a visibilidade de confirmação de senha
 */
function mostrarSenhaConfirm() {
    var inputPassConfirm = document.getElementById('passwordConfirm');
    var btnShowPassConfirm = document.getElementById('btn-senhaConfirm');

    if (inputPassConfirm.type === 'password') {
        inputPassConfirm.setAttribute('type', 'text');
        btnShowPassConfirm.classList.replace('bi-eye', 'bi-eye-slash');
    } else {
        inputPassConfirm.setAttribute('type', 'password');
        btnShowPassConfirm.classList.replace('bi-eye-slash', 'bi-eye');
    }
}

/**
 * Formata o tamanho de arquivo em formato legível
 * @param {number} bytes - Tamanho em bytes
 * @returns {string} Tamanho formatado
 */
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Manipula seleção e visualização de arquivo
 */
function handleFiles(files) {
    if (files.length > 0) {
        const file = files[0];
        const fileLabel = document.querySelector('.file-label');
        const fileInfo = document.getElementById('fileInfo');
        const filePreview = document.getElementById('filePreview');

        // Animação de upload
        fileLabel.classList.add('uploading');

        setTimeout(() => {
            fileLabel.classList.remove('uploading');

            // Atualizar informações do arquivo
            fileInfo.classList.remove('empty');
            fileInfo.classList.add('has-file');
            fileInfo.innerHTML = `
                <div class="file-name">${file.name}</div>
                <div class="file-size">${formatFileSize(file.size)}</div>
                <div>Tipo: ${file.type || 'Desconhecido'}</div>
            `;

            // Pré-visualização de imagem
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = function (e) {
                    filePreview.src = e.target.result;
                    filePreview.classList.add('visible');
                };
                reader.readAsDataURL(file);
            } else {
                filePreview.classList.remove('visible');
            }
        }, 1000);
    }
}

/**
 * Inicializa event listeners para upload de arquivo
 */
document.addEventListener('DOMContentLoaded', function () {
    const fileInput = document.getElementById('documentoFile');
    if (fileInput) {
        fileInput.addEventListener('change', function (e) {
            handleFiles(e.target.files);
        });
    }
});

/**
 * Validador de força de senha
 */
document.addEventListener('DOMContentLoaded', function () {
    const passwordInput = document.getElementById('password');
    const confirmInput = document.getElementById('passwordConfirm');
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

/**
 * Validador de CPF/CNPJ e tipo de documento esperado
 */
document.addEventListener('DOMContentLoaded', function () {
    const cpfInput = document.getElementById('cpf');
    const documentHint = document.getElementById('documentHint');
    
    if (!cpfInput) return;

    // Cria elemento para mostrar tipo de documento esperado
    const documentTypeInfo = document.createElement('div');
    documentTypeInfo.id = 'documentTypeInfo';
    documentTypeInfo.style.cssText = `
        margin-top: 5px;
        margin-bottom: 15px;
        font-size: 0.9em;
        padding: 8px 12px;
        border-radius: 4px;
        display: none;
        background-color: #e7f3ff;
        border-left: 4px solid #2196F3;
        color: #1976D2;
    `;
    
    cpfInput.parentElement.insertAdjacentElement('afterend', documentTypeInfo);

    function updateDocumentTypeInfo() {
        const cpfValue = cpfInput.value.replace(/\D/g, '');
        
        if (cpfValue.length === 0) {
            documentTypeInfo.style.display = 'none';
            documentTypeInfo.innerHTML = '';
            if (documentHint) {
                documentHint.innerHTML = 'Carregue um documento oficial com foto';
            }
            return;
        }

        documentTypeInfo.style.display = 'block';

        if (cpfValue.length === 11) {
            documentTypeInfo.innerHTML = `
                <strong>👤 Cadastro de usuário</strong><br>
                Documentos aceitos: <strong>RG</strong> ou <strong>CNH</strong>
            `;
            documentTypeInfo.style.backgroundColor = '#e3f2fd';
            documentTypeInfo.style.borderLeftColor = '#1976D2';
            documentTypeInfo.style.color = '#1565c0';
            
            if (documentHint) {
                documentHint.innerHTML = '📄 Envie um <strong>RG</strong> ou <strong>CNH</strong> claro e legível';
            }
        } else if (cpfValue.length === 14) {
            documentTypeInfo.innerHTML = `
                <strong>🏢 Cadastro empresarial</strong><br>
                Documentos aceitos: <strong>Certificado de MEI</strong> ou <strong>Comprovante de CNPJ</strong>
            `;
            documentTypeInfo.style.backgroundColor = '#f3e5f5';
            documentTypeInfo.style.borderLeftColor = '#7b1fa2';
            documentTypeInfo.style.color = '#6a1b9a';
            
            if (documentHint) {
                documentHint.innerHTML = '📄 Envie um <strong>Certificado de MEI</strong> ou <strong>Comprovante de CNPJ</strong> claro e legível';
            }
        } else if (cpfValue.length > 11 && cpfValue.length < 14) {
            documentTypeInfo.innerHTML = `
                <strong>⚠️ Formato incompleto</strong><br>
                CPF: 11 dígitos | CNPJ: 14 dígitos
            `;
            documentTypeInfo.style.backgroundColor = '#fff3e0';
            documentTypeInfo.style.borderLeftColor = '#f57c00';
            documentTypeInfo.style.color = '#e65100';
            
            if (documentHint) {
                documentHint.innerHTML = 'Complete o CPF ou CNPJ para ver documentos aceitos';
            }
        } else if (cpfValue.length > 14) {
            documentTypeInfo.innerHTML = `
                <strong>❌ Formato inválido</strong><br>
                CPF: 11 dígitos | CNPJ: 14 dígitos
            `;
            documentTypeInfo.style.backgroundColor = '#ffebee';
            documentTypeInfo.style.borderLeftColor = '#c62828';
            documentTypeInfo.style.color = '#b71c1c';
            
            if (documentHint) {
                documentHint.innerHTML = '❌ CPF ou CNPJ com formato inválido';
            }
        }
    }

    // Event listeners para detectar mudanças
    cpfInput.addEventListener('input', updateDocumentTypeInfo);
    cpfInput.addEventListener('change', updateDocumentTypeInfo);
});
