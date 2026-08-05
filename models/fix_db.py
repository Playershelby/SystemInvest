from app import app
from models.user import db, Payment
from sqlalchemy import text

with app.app_context():
    db.session.execute(text("DROP TABLE IF EXISTS payments"))
    db.session.commit()
    db.create_all()
    print("Tabela 'payments' apagada e recriada com sucesso de acordo com o novo modelo!")
