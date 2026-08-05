// ==========================================
// Funções de relatórios e exportação
// ==========================================

document.addEventListener('DOMContentLoaded', function () {
    const btnExportCsv = document.getElementById('btn-export-csv');
    if (btnExportCsv) {
        btnExportCsv.addEventListener('click', function () {
            exportarCSV();
        });
    }
});

function exportarCSV() {
    window.location.href = '/user/gerar_relatorio_csv';
}
