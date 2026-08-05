 // ==============================================
    // Lógica de cálculo de valor on-the-fly
    // ==============================================
    function calcularPreco() {
        let total = 0;
        const addIfValue = (selector) => {
            const el = document.querySelector(selector);
            if (el && el.value.trim() !== "") total += 1;
        };

        // Ida
        addIfValue('select[name="origem"]');
        addIfValue('select[name="destino"]');
        addIfValue('input[name="data_ida"]');

        const flexIda = document.querySelector('input[name="flex_ida"]:checked');
        if (flexIda && flexIda.value !== '0') total += 1;

        if (document.getElementById('chk-mult') && document.getElementById('chk-mult').checked) {
            addIfValue('select[name="mult_origem_ida"]');
        }
        if (document.getElementById('chk-mult-dest') && document.getElementById('chk-mult-dest').checked) {
            addIfValue('select[name="mult_destino_ida"]');
        }

        // Volta
        addIfValue('select[name="origem_volta"]');
        addIfValue('select[name="destino_volta"]');
        addIfValue('input[name="data_volta"]');

        const flexVolta = document.querySelector('input[name="flex_volta"]:checked');
        if (flexVolta && flexVolta.value !== '0') total += 1;

        if (document.getElementById('chk-mult-volta') && document.getElementById('chk-mult-volta').checked) {
            addIfValue('select[name="mult_origem_volta"]');
        }
        if (document.getElementById('chk-mult-dest-volta') && document.getElementById('chk-mult-dest-volta').checked) {
            addIfValue('select[name="mult_destino_volta"]');
        }

        // Passageiros (Multiplica o valor R$ 1,00 pela quantidade exata de pessoas)
        total += parseInt(document.getElementById('input-adultos').value || "0");
        total += parseInt(document.getElementById('input-criancas').value || "0");
        total += parseInt(document.getElementById('input-bebes').value || "0");

        // Bagagens
        const bagagens = document.querySelector('input[name="bagagens"]:checked');
        if (bagagens) {
            if (bagagens.value === "Todas as opções") total += 3;
            else total += 1;
        }

        // Classe
        const classe = document.querySelector('select[name="classe"]');
        if (classe) {
            if (classe.value.includes("Todas")) total += 3;
            else total += 1;
        }

        // Observação
        const obs = document.querySelector('textarea[name="observacao"]');
        if (obs && obs.value.trim() !== "") total += 1;

        // Consolidadoras
        const chkTodas = document.querySelector('input[name="consolidadoras"][value="Todas"]');
        if (chkTodas && chkTodas.checked) {
            total += 6;
        } else {
            const outras = document.querySelectorAll('input[name="consolidadoras"]:not([value="Todas"]):checked');
            total += outras.length;
        }

        // Filtro: Voos Diretos
        const chkVoosDiretos = document.querySelector('input[name="voos_diretos"]');
        if (chkVoosDiretos && chkVoosDiretos.checked) {
            total += 1;
        }

        // Milheiros
        const chkMilheiros = document.querySelector('input[name="checkMilhas"]');
        if (chkMilheiros && chkMilheiros.checked) {
            total += 1;
        }

        // Atualizar UI
        const precoStr = total.toFixed(2).replace('.', ',');
        const display = document.getElementById('preco-total');
        const inputPreco = document.getElementById('input-preco-total');

        if (display) display.innerText = 'R$ ' + precoStr;
        if (inputPreco) inputPreco.value = total.toFixed(2);
    }

    // Attach master listeners to update on any input change
    const formValor = document.getElementById('form-valor');
    if (formValor) {
        formValor.addEventListener('change', calcularPreco);
        formValor.addEventListener('input', calcularPreco);

        // Init
        calcularPreco();
    }

    // Listener específico para o checkbox de Milheiros (pode estar fora do formulário)
    const chkMilheirosListener = document.querySelector('input[name="checkMilhas"]');
    if (chkMilheirosListener) {
        chkMilheirosListener.addEventListener('change', calcularPreco);
    }

    // Listeners para checkboxes de múltiplos (para recalcular ao mudar de estado)
    const checkboxesMultiplos = [
        'chk-mult',
        'chk-mult-dest',
        'chk-mult-volta',
        'chk-mult-dest-volta'
    ];

    checkboxesMultiplos.forEach(checkboxId => {
        const checkbox = document.getElementById(checkboxId);
        if (checkbox) {
            checkbox.addEventListener('change', calcularPreco);
        }
    });

    // Listeners para os campos select de múltiplos aeroportos e destinos
    const multiplosFields = [
        'select[name="mult_origem_ida"]',
        'select[name="mult_destino_ida"]',
        'select[name="mult_origem_volta"]',
        'select[name="mult_destino_volta"]'
    ];

    multiplosFields.forEach(selector => {
        const field = document.querySelector(selector);
        if (field) {
            field.addEventListener('change', calcularPreco);
            field.addEventListener('input', calcularPreco);
        }
    });