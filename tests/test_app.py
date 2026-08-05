import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import create_app


def test_core_routes_are_registered_and_accessible():
    app = create_app()
    client = app.test_client()

    assert client.get('/auth/login').status_code == 200
    assert client.get('/auth/register').status_code == 200
    assert client.get('/user/esqueceu_senha').status_code == 200
    assert client.get('/user/settings').status_code == 302
    assert client.get('/user/settings/account').status_code == 302
    assert client.get('/user/settings/pagamentos').status_code == 302
    assert client.get('/user/relatorio_cotador').status_code == 302
