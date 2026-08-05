    // Função para fechar mensagem flash manualmente
    function closeFlash(element) {
        const container = element.closest('.flash-container');
        if (container) {
            container.style.display = 'none';
        }
    }

    // Fechar automaticamente após 3 segundos
    setTimeout(function () {
        let flashContainers = document.querySelectorAll('.flash-container');
        flashContainers.forEach(function (container) {
            container.style.display = 'none';
        });
    }, 3000);

    // Alternativa: Fechar mensagens individuais
    setTimeout(function () {
        let flashMessages = document.querySelectorAll('.flash-message');
        flashMessages.forEach(function (message) {
            message.style.display = 'none';
        });
    }, 3000);

    // Funções para Modais de Alerta e Confirmação Personalizados
    function customConfirm(message, title = "Atenção") {
        return new Promise((resolve) => {
            const modal = document.createElement('div');
            // Inline styles to guarantee layout and prevent Tailwind JIT missing classes
            modal.style.position = 'fixed';
            modal.style.top = '0';
            modal.style.left = '0';
            modal.style.width = '100%';
            modal.style.height = '100%';
            modal.style.zIndex = '9999';
            modal.style.display = 'flex';
            modal.style.alignItems = 'center';
            modal.style.justifyContent = 'center';
            modal.style.padding = '1rem';
            modal.style.opacity = '0';
            modal.style.transition = 'opacity 0.3s ease';

            modal.innerHTML = `
                <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.6); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);"></div>
                <div style="position: relative; z-index: 10; background: rgba(255,255,255,0.05); backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px); border: 1px solid rgba(255,255,255,0.2); padding: 1.5rem; border-radius: 1.5rem; box-shadow: 0 8px 32px rgba(31,38,135,0.37); max-width: 400px; width: 100%; text-align: center; transform: scale(0.95); transition: transform 0.3s ease;">
                    <h3 style="font-size: 1.25rem; font-weight: bold; color: white; margin-bottom: 0.5rem; font-family: 'Poppins', sans-serif;">${title}</h3>
                    <p style="color: #cbd5e1; margin-bottom: 1.5rem; font-family: 'Poppins', sans-serif;">${message}</p>
                    <div style="display: flex; justify-content: center; gap: 1rem;">
                        <button id="btn-cancel" class="btn-recusar">
                            <i class="fas fa-times"></i> Cancelar
                        </button>
                        <button id="btn-confirm" class="btn-aceitar">
                            <i class="fas fa-check"></i> Confirmar
                        </button>
                    </div>
                </div>
            `;

            document.body.appendChild(modal);

            requestAnimationFrame(() => {
                modal.style.opacity = '1';
                modal.children[1].style.transform = 'scale(1)';
            });

            const close = (result) => {
                modal.style.opacity = '0';
                modal.children[1].style.transform = 'scale(0.95)';
                setTimeout(() => modal.remove(), 300);
                resolve(result);
            };

            modal.querySelector('#btn-cancel').onclick = () => close(false);
            modal.querySelector('#btn-confirm').onclick = () => close(true);
        });
    }

    function customAlert(message, title = "Aviso") {
        return new Promise((resolve) => {
            const modal = document.createElement('div');
            // Inline styles to guarantee layout and prevent Tailwind JIT missing classes
            modal.style.position = 'fixed';
            modal.style.top = '0';
            modal.style.left = '0';
            modal.style.width = '100%';
            modal.style.height = '100%';
            modal.style.zIndex = '9999';
            modal.style.display = 'flex';
            modal.style.alignItems = 'center';
            modal.style.justifyContent = 'center';
            modal.style.padding = '1rem';
            modal.style.opacity = '0';
            modal.style.transition = 'opacity 0.3s ease';

            modal.innerHTML = `
                <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.6); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);"></div>
                <div style="position: relative; z-index: 10; background: rgba(255,255,255,0.05); backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px); border: 1px solid rgba(255,255,255,0.2); padding: 1.5rem; border-radius: 1.5rem; box-shadow: 0 8px 32px rgba(31,38,135,0.37); max-width: 400px; width: 100%; text-align: center; transform: scale(0.95); transition: transform 0.3s ease;">
                    <h3 style="font-size: 1.25rem; font-weight: bold; color: white; margin-bottom: 0.5rem; font-family: 'Poppins', sans-serif;">${title}</h3>
                    <p style="color: #cbd5e1; margin-bottom: 1.5rem; font-family: 'Poppins', sans-serif;">${message}</p>
                    <div style="display: flex; justify-content: center;">
                        <button id="btn-ok" class="btn-aceitar">
                            <i class="fas fa-check"></i> OK
                        </button>
                    </div>
                </div>
            `;

            document.body.appendChild(modal);

            requestAnimationFrame(() => {
                modal.style.opacity = '1';
                modal.children[1].style.transform = 'scale(1)';
            });

            const close = () => {
                modal.style.opacity = '0';
                modal.children[1].style.transform = 'scale(0.95)';
                setTimeout(() => modal.remove(), 300);
                resolve();
            };

            modal.querySelector('#btn-ok').onclick = close;
        });
    }

    //Menu Dropdown
    document.addEventListener('DOMContentLoaded', function () {
        localStorage.setItem('last_dashboard', window.location.href);
        const icon = document.getElementById('icon_down');
        const linksNav = document.querySelector('.links-nav');

        icon.addEventListener('click', function () {
            // Alterna a visibilidade do menu
            const isVisible = linksNav.classList.contains('visible');

            if (isVisible) {
                // Se está visível, oculta
                linksNav.classList.remove('visible');
                linksNav.style.display = 'none';
                icon.classList.remove('bi-caret-up-square');
                icon.classList.add('bi-caret-down-square');
            } else {
                // Se está oculto, exibe
                linksNav.classList.add('visible');
                linksNav.style.display = 'block';
                icon.classList.remove('bi-caret-down-square');
                icon.classList.add('bi-caret-up-square');
            }
        });
        // Fechar o menu ao clicar fora dele
        document.addEventListener('click', function (event) {
            if (!icon.contains(event.target) && !linksNav.contains(event.target) && linksNav.classList.contains('visible')) {
                linksNav.classList.remove('visible');
                linksNav.style.display = 'none';
                icon.classList.remove('bi-caret-up-square');
                icon.classList.add('bi-caret-down-square');
            }
        });

        // Prevenir que o clique no menu feche o próprio menu
        linksNav.addEventListener('click', function (event) {
            event.stopPropagation();
        });
    });

    function toggleRanking() {
        const sidebar = document.getElementById('sidebarRanking');
        const icon = document.getElementById('iconRanking');

        sidebar.classList.toggle('open');

        if (sidebar.classList.contains('open')) {
            icon.classList.remove('fa-chevron-left');
            icon.classList.add('fa-chevron-right');
        } else {
            icon.classList.remove('fa-chevron-right');
            icon.classList.add('fa-chevron-left');
        }
    }

    document.addEventListener('DOMContentLoaded', function () {
        console.log('Dashboard inicializada.');

        // Garantir que o toast-container exista no DOM
        if (!document.getElementById('toast-container')) {
            const tc = document.createElement('div');
            tc.id = 'toast-container';
            tc.className = 'toast-container';
            document.body.appendChild(tc);
        }

        // Fallback: garantir que showToast exista
        if (typeof showToast === 'undefined') {
            window.showToast = function (type, title, message) {
                const container = document.getElementById('toast-container');
                if (!container) return;
                const icons = {
                    'info': 'fas fa-info-circle',
                    'completed': 'fas fa-check-double',
                    'accepted': 'fas fa-handshake',
                    'cancelled': 'fas fa-exclamation-triangle'
                };
                const toast = document.createElement('div');
                toast.className = 'toast toast-' + type;
                toast.style.position = 'relative';
                toast.innerHTML = '<div class="toast-icon"><i class="' + (icons[type] || 'fas fa-info-circle') + '"></i></div>' +
                    '<div class="toast-body"><div class="toast-title">' + title + '</div>' +
                    '<p class="toast-message">' + message + '</p></div>' +
                    '<div class="toast-progress"><div class="toast-progress-bar"></div></div>';
                toast.addEventListener('click', function () {
                    toast.classList.add('toast-exit');
                    setTimeout(function () { toast.remove(); }, 400);
                });
                container.appendChild(toast);
                setTimeout(function () {
                    if (toast.parentElement) {
                        toast.classList.add('toast-exit');
                        setTimeout(function () { toast.remove(); }, 400);
                    }
                }, 5000);
            };
        }

        // Botão de saque na carteira
        const saqueBtn = document.getElementById('btn-saque-carteira');
        const modalSaque = document.getElementById('modal-saque');
        const modalSaqueContent = document.getElementById('modal-saque-content');
        const modalSaqueBackdrop = document.getElementById('modal-saque-backdrop');
        const btnCancelarSaque = document.getElementById('btn-cancelar-saque');
        const formSaqueCarteira = document.getElementById('form-saque-carteira');

        function abrirModalSaque() {
            if (!modalSaque) return;
            modalSaque.classList.remove('hidden', 'opacity-0');
            modalSaque.classList.add('active');
            document.body.style.overflow = 'hidden';
        }

        function fecharModalSaque() {
            if (!modalSaque) return;
            modalSaque.classList.remove('active');
            setTimeout(() => {
                modalSaque.classList.add('hidden');
                document.body.style.overflow = '';
            }, 250);
        }

        if (saqueBtn) {
            saqueBtn.addEventListener('click', function () {
                abrirModalSaque();
            });
        }

        if (modalSaqueBackdrop) {
            modalSaqueBackdrop.addEventListener('click', fecharModalSaque);
        }

        if (btnCancelarSaque) {
            btnCancelarSaque.addEventListener('click', fecharModalSaque);
        }

        if (formSaqueCarteira) {
            formSaqueCarteira.addEventListener('submit', async function (e) {
                e.preventDefault();

                const valor = (document.getElementById('saque-valor')?.value || '').trim();
                const agencia = (document.getElementById('saque-agencia')?.value || '').trim();
                const conta = (document.getElementById('saque-conta')?.value || '').trim();
                const chavePix = (document.getElementById('saque-pix')?.value || '').trim();

                if (!valor) {
                    customAlert('Informe o valor a sacar.');
                    return;
                }

                const informouContaAgencia = Boolean(agencia && conta);
                const informouPix = Boolean(chavePix);

                if (!informouContaAgencia && !informouPix) {
                    customAlert('Informe agência + conta ou uma chave PIX.');
                    return;
                }

                try {
                    const resp = await fetch('/user/solicitar_saque', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            valor_saque: valor,
                            agencia: agencia,
                            conta: conta,
                            chave_pix: chavePix
                        })
                    });

                    const data = await resp.json();

                    if (!resp.ok || !data.success) {
                        customAlert((data && data.msg) ? data.msg : 'Não foi possível solicitar o saque.');
                        return;
                    }

                    fecharModalSaque();
                    customAlert(data.msg || 'Saque solicitado com sucesso.');
                    setTimeout(() => window.location.reload(), 700);
                } catch (err) {
                    console.error(err);
                    customAlert('Erro de conexão ao solicitar saque.');
                }
            });
        }

        // Inicializa o Check-in diário
        initCheckinDiario();
    });

    // --- Sistema de Check-in Diário ---
    function updateXpUI(newXp, newLevel) {
        const xpContainer = document.getElementById('xp-container');
        if (!xpContainer) return;

        xpContainer.style.setProperty('--progress', (newXp % 100) + '%');

        const xpText = document.getElementById('xp-text');
        if (xpText) xpText.innerHTML = `<span>${newXp % 100}</span> / 100 XP para o nível ${newLevel + 1}`;

        const xpTotalText = document.getElementById('xp-total-text');
        if (xpTotalText) xpTotalText.textContent = `${newXp} XP Total`;

        const xpLevelText = document.getElementById('xp-level-text');
        if (xpLevelText) xpLevelText.textContent = `Nível ${newLevel}`;

        const levelText = document.getElementById('LevelText');
        if (levelText) levelText.innerText = `${newLevel}`;
    }

    function openWeeklyBonusModal(bonusXp) {
        const modal = document.getElementById('weekly-bonus-modal');
        if (!modal) return;

        const txt = document.getElementById('weekly-bonus-text');
        if (txt) txt.textContent = `Loot recebido: +${bonusXp} XP na sua barra!`;

        modal.style.display = 'flex';

        const closeBtn = document.getElementById('weekly-bonus-close');
        const closeFn = () => {
            modal.style.display = 'none';
            if (closeBtn) closeBtn.removeEventListener('click', closeFn);
        };

        if (closeBtn) closeBtn.addEventListener('click', closeFn);
    }

    function loadConfettiIfNeededAndFire() {
        const fire = () => {
            confetti({
                particleCount: 150,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#FFD700', '#C0C0C0', '#cd7f32', '#428bca', '#5cb85c']
            });
        };

        if (typeof confetti === 'function') {
            fire();
        } else {
            const script = document.createElement('script');
            script.src = "https://cdn.jsdelivr.net/npm/canvas-confetti@1.6.0/dist/confetti.browser.min.js";
            script.onload = fire;
            document.head.appendChild(script);
        }
    }

    function initCheckinDiario() {
        const today = new Date();
        let currentDayOfWeek = today.getDay();
        let checkinDayIndex = currentDayOfWeek === 0 ? 7 : currentDayOfWeek;

        const monday = new Date(today);
        monday.setDate(today.getDate() - checkinDayIndex + 1);

        const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
        const dayNames = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];
        const dailyRewards = [5, 5, 5, 5, 5, 10, 20];

        for (let i = 1; i <= 7; i++) {
            const itemDate = new Date(monday);
            itemDate.setDate(monday.getDate() + (i - 1));

            const dateString = `${itemDate.getDate()} ${monthNames[itemDate.getMonth()]}`;
            const checkinItem = document.querySelector(`.checkin-item:nth-child(${i})`);

            if (!checkinItem) continue;

            const dateEl = checkinItem.querySelector('.checkin-date');
            const infoEl = checkinItem.querySelector('.checkin-info');
            const btn = checkinItem.querySelector('.checkin-btn');

            if (dateEl) dateEl.textContent = dateString;
            if (infoEl) infoEl.textContent = `${dayNames[i - 1]} • ${dailyRewards[i - 1]} XP`;
            if (!btn) continue;

            if (i < checkinDayIndex) {
                btn.disabled = true;
                btn.textContent = "Expirado";
                continue;
            }

            if (i > checkinDayIndex) {
                btn.disabled = true;
                btn.textContent = "Bloqueado";
                continue;
            }

            // Dia atual: permite resgate no backend
            btn.disabled = false;
            btn.textContent = "Check-in";

            btn.onclick = function () {
                fetch('/user/api/ticket-diario/resgatar', { method: 'POST' })
                    .then(async (res) => {
                        const data = await res.json();
                        if (!res.ok || !data.success) {
                            if (data && data.already_claimed_today) {
                                btn.disabled = true;
                                btn.textContent = "Resgatado";
                                btn.classList.add("claimed");
                                customAlert(data.msg || 'Ticket já resgatado hoje.');
                                return null;
                            }
                            throw new Error((data && data.msg) || 'Falha ao resgatar ticket diário.');
                        }
                        return data;
                    })
                    .then((data) => {
                        if (!data) return;

                        btn.disabled = true;
                        btn.textContent = "Resgatado";
                        btn.classList.add("claimed");

                        updateXpUI(data.xp, data.level);

                        if (typeof showToast !== 'undefined') {
                            showToast('completed', 'Ticket Diário Resgatado', `+${data.daily_xp} XP adicionado imediatamente!`);
                        }

                        const audio = new Audio("{{ url_for('static', filename='audio/Avião_sound_effects.mp3') }}");
                        audio.play().catch(e => console.error("Erro ao tocar áudio:", e));

                        loadConfettiIfNeededAndFire();

                        if (data.weekly_bonus_awarded) {
                            openWeeklyBonusModal(data.bonus_xp || 0);
                            if (typeof showToast !== 'undefined') {
                                showToast('accepted', 'Bônus Semanal', `Loot especial: +${data.bonus_xp || 0} XP!`);
                            }
                        }
                    })
                    .catch((err) => {
                        console.error(err);
                        customAlert(err.message || 'Erro ao resgatar ticket diário.');
                    });
            };
        }
    }

    // Lógica para marcar/desmarcar "Todas" as companhias no modal de resposta
    document.addEventListener('change', function (e) {
        if (e.target.matches('input[name="consolidadoras"]')) {
            const container = e.target.closest('.airline-options-container');
            if (!container) return;

            const todasCheckbox = container.querySelector('input[value="Todas"]');
            if (!todasCheckbox) return;

            const otherCheckboxes = Array.from(container.querySelectorAll('input[name="consolidadoras"]:not([value="Todas"])'));

            if (e.target === todasCheckbox) {
                // Se clicou em "Todas", aplica o estado para todas as outras
                otherCheckboxes.forEach(cb => cb.checked = todasCheckbox.checked);
            } else {
                // Se clicou em qualquer outra
                if (!e.target.checked) {
                    todasCheckbox.checked = false;
                } else {
                    const allChecked = otherCheckboxes.every(cb => cb.checked);
                    todasCheckbox.checked = allChecked;
                }
            }
        }
    });