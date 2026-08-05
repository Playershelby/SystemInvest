import os
from typing import Optional


def validate_and_log_document(file_path: str, expected_document_type: Optional[str] = None):
    """Validador mínimo para evitar falha de importação e permitir o fluxo de cadastro.

    Em ambientes reais, este ponto pode ser substituído por OCR/validação de documentos
    mais robusta.
    """
    if not file_path or not os.path.exists(file_path):
        return {
            'valid': False,
            'document_type': None,
            'message': 'Arquivo de documento não encontrado.'
        }

    ext = os.path.splitext(file_path)[1].lower()
    if ext not in {'.jpg', '.jpeg', '.png', '.gif', '.pdf'}:
        return {
            'valid': False,
            'document_type': None,
            'message': 'Tipo de arquivo não permitido.'
        }

    document_type = expected_document_type or 'CPF'
    return {
        'valid': True,
        'document_type': document_type,
        'message': 'Documento aceito.'
    }
