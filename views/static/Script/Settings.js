// ==========================================
// Funções de Configurações
// ==========================================

/**
 * Botão voltar genérico para configurações
 */
function initBackButton(destination = '/user/dashboard') {
    const btnBack = document.getElementById('btn-back');
    if (btnBack) {
        btnBack.addEventListener('click', function (e) {
            e.preventDefault();
            window.location.href = destination;
        });
    }
}

/**
 * Formata o tamanho de arquivo em formato legível (reutilizado de Cadastro.js)
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
 * Manipula seleção e visualização de arquivo para settings_account
 */
function handleProfileFiles(files) {
    if (files.length > 0) {
        const file = files[0];
        const fileLabel = document.querySelector('.file-label');
        const fileInfo = document.getElementById('fileInfo');
        const filePreview = document.getElementById('filePreview');

        if (fileLabel) {
            fileLabel.classList.add('uploading');

            setTimeout(() => {
                fileLabel.classList.remove('uploading');

                if (fileInfo) {
                    fileInfo.classList.remove('empty');
                    fileInfo.classList.add('has-file');
                    fileInfo.innerHTML = `
                        <div class="file-name">${file.name}</div>
                        <div class="file-size">${formatFileSize(file.size)}</div>
                        <div>Tipo: ${file.type || 'Desconhecido'}</div>
                    `;
                }

                if (file.type.startsWith('image/')) {
                    const reader = new FileReader();
                    reader.onload = function (e) {
                        if (filePreview) {
                            filePreview.src = e.target.result;
                            filePreview.classList.add('visible');
                        }
                    };
                    reader.readAsDataURL(file);
                } else if (filePreview) {
                    filePreview.classList.remove('visible');
                }
            }, 1000);
        }
    }
}

/**
 * Salva o nickname do usuário via API
 */
function saveNickname() {
    const nicknameInput = document.getElementById('inNickname');
    if (!nicknameInput) return;

    const nickname = nicknameInput.value.trim();
    if (!nickname) {
        alert('Por favor, digite um nickname válido.');
        return;
    }

    fetch('/user/account', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ nickname: nickname }),
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('Nickname atualizado com sucesso!');
                location.reload();
            } else {
                alert('Erro ao atualizar nickname: ' + (data.error || 'Erro desconhecido'));
            }
        })
        .catch((error) => {
            console.error('Error:', error);
            alert('Erro de conexão ao tentar atualizar o nickname.');
        });
}

/**
 * Inicializa os event listeners de settings_account
 */
document.addEventListener('DOMContentLoaded', function () {
    // Upload de arquivo de perfil
    const fileInput = document.getElementById('fileInput');
    if (fileInput) {
        fileInput.addEventListener('change', function (e) {
            handleProfileFiles(e.target.files);
        });
    }

    const btnUpload = document.getElementById('btn_upload');
    const btnClose = document.getElementById('btn_close');
    if (btnUpload) {
        btnUpload.addEventListener('click', function () {
            const linksNav = document.getElementById('container_documents');
            if (linksNav) {
                linksNav.removeAttribute('hidden');
                linksNav.style.display = 'block';
            }
        });
    }

    if (btnClose) {
        btnClose.addEventListener('click', function () {
            const containerDocuments = document.getElementById('container_documents');
            if (containerDocuments) {
                containerDocuments.setAttribute('hidden', '');
                containerDocuments.style.display = 'none';
            }
        });
    }

    // Botão de salvar nickname
    const btnSaveNickname = document.getElementById('btn-save-nickname');
    if (btnSaveNickname) {
        btnSaveNickname.addEventListener('click', function () {
            saveNickname();
        });
    }
});

/**
 * Inicializa botões de voltar em diferentes páginas de settings
 */
document.addEventListener('DOMContentLoaded', function () {
    const currentPage = window.location.pathname;

    if (currentPage.includes('/user/account')) {
        initBackButton('/user/settings');
    } else if (currentPage === '/user/settings') {
        const isAdmin = document.body?.dataset?.isAdmin === 'true';
        initBackButton(isAdmin ? '/user/admSecret' : '/user/dashboard');
    } else if (currentPage.includes('/settings/')) {
        initBackButton('/user/settings');
    }
});

/**
 * Deleção da conta (pop-up com motivo)
 */
document.addEventListener('DOMContentLoaded', function () {
    const btnDelete = document.getElementById('btn-delete-account');
    if (!btnDelete) return;

    function openDeletionPopup() {
        // Pequena implementação com prompt/confirm para não depender de libs.
        // Regras:
        // - pergunta motivo
        // - se 5: abre campo de texto (prompt)
        // - envia para backend

        const options = [
            '1- O app é muito caro.',
            '2- O app não cumpri o que promete.',
            '3- Teve problemas com app e o suporte não resolveu.',
            '4- Pretendo voltar no futuro.',
            '5- nehuma das opções acima.'
        ].join('\n');

        let motivo = prompt(`Qual o motivo para deletar a sua conta ?\n\n${options}\n\nDigite o número (1-5):`);
        if (motivo === null) return; // cancelado

        motivo = (motivo || '').trim();
        if (!['1', '2', '3', '4', '5'].includes(motivo)) {
            alert('Motivo inválido. Cancelando deleção.');
            return;
        }

        let motivoTexto = '';
        if (motivo === '5') {
            motivoTexto = prompt('Escreva sua opinião (motivo):');
            if (motivoTexto === null) return;
            motivoTexto = (motivoTexto || '').trim();
        }

        const confirmar = confirm('Tem certeza que deseja deletar sua conta? Esta ação é irreversível.');
        if (!confirmar) return;

        fetch('/user/delete_account', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ motivo: parseInt(motivo, 10), motivo_texto: motivoTexto }),
        })
            .then(async (res) => {
                if (!res.ok) {
                    const text = await res.text();
                    throw new Error(text || 'Erro ao deletar conta');
                }
                return res.json().catch(() => ({}));
            })
            .then(() => {
                // backend deve redirecionar via código JSON? aqui garantimos redirect
                window.location.href = '/auth/login';
            })
            .catch((err) => {
                console.error(err);
                alert('Erro ao deletar conta.');
            });
    }

    btnDelete.addEventListener('click', function () {
        openDeletionPopup();
    });
});

