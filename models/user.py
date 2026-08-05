from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from flask_login import UserMixin

db = SQLAlchemy()


class Usuario(db.Model, UserMixin):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(100), unique=True, nullable=False) # Nome completo do Usuario
    email = db.Column(db.String(100), unique=True, nullable=False) 
    password = db.Column(db.String(255), nullable=False)
    documents = db.relationship('UserDocument', backref='usuario', lazy=True)
    cpf = db.Column(db.String(14), unique=True, nullable=False) # CPF ou CNPJ
    tipo_documento = db.Column(db.String(4), nullable=False, default='CPF')  # CPF ou CNPJ
    data_nascimento = db.Column(db.Date, nullable=False)
    profile_pic = db.Column(db.String(255), nullable=True)
    balance = db.Column(db.Float, nullable=False, default=0.0)   # saldo em R$
    xp = db.Column(db.Integer, nullable=False, default=0)        # Pontos de experiência acumulados
    level = db.Column(db.Integer, nullable=False, default=1)     # Nível atual do usuário
    nick = db.Column(db.String(6), unique=False, nullable=False)  # Nickname
    agencia_enabled = db.Column(db.Boolean, nullable=False, default=False)  # compat legado
    access_mode = db.Column(db.String(20), nullable=False, default='COTADOR')  # COTADOR | AGENCIA | AMBOS
    codigo_recuperacao = db.Column(db.String(6), nullable=True)
    codigo_expiracao = db.Column(db.DateTime, nullable=True)
    ip_cadastro = db.Column(db.String(45), nullable=True, index=True)  # IPv4/IPv6 de origem no cadastro

    # Ticket diário (persistência semanal)
    weekly_ticket_progress = db.Column(db.Integer, nullable=False, default=0)  # 0..7
    weekly_ticket_last_claim_date = db.Column(db.Date, nullable=True)
    weekly_ticket_week_start = db.Column(db.Date, nullable=True)  # Segunda-feira da semana de progresso
    weekly_ticket_bonus_claimed = db.Column(db.Boolean, nullable=False, default=False)

    def __init__(self, **kwargs):
        super(Usuario, self).__init__(**kwargs)

    @property
    def rank_position(self):
        # Admin root não aparece no rank
        count = Usuario.query.filter(
            Usuario.username != 'root',
            Usuario.nick.isnot(None),
            Usuario.nick != '',
            Usuario.xp > self.xp
        ).count()
        return count + 1

    __tablename__ = 'Usuario'

class UserDocument(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('Usuario.id'), nullable=False)
    filename = db.Column(db.String(255), nullable=False)
    path = db.Column(db.String(512), nullable=False)
    document_type = db.Column(db.String(10), nullable=True, default=None)  # RG, CNH, ou None
    upload_date = db.Column(db.DateTime, default=datetime.utcnow)

    def __init__(self, **kwargs):
        super(UserDocument, self).__init__(**kwargs)

    __tablename__ = 'UserDocument'

class Payment(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(100), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('Usuario.id'), nullable=False)
    
    # Expandable row details
    amount = db.Column(db.Float, nullable=False)               # valor pago
    description = db.Column(db.String(255), nullable=True)    # ex.: "Recarga cartão"
    status = db.Column(db.String(20), nullable=False, default='completed')
    last4 = db.Column(db.String(4), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def __init__(self, **kwargs):
        super(Payment, self).__init__(**kwargs)

    __tablename__ = 'payments'

class CartaoSalvo(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('Usuario.id'), nullable=False)
    nome_cartao = db.Column(db.String(100), nullable=False)
    numero_cartao = db.Column(db.String(100), nullable=False) # In a real app this should be encrypted/tokenized
    validade = db.Column(db.String(5), nullable=False)
    cpf = db.Column(db.String(14), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    usuario = db.relationship('Usuario', backref='cartoes_salvos', lazy=True)
    
    def __init__(self, **kwargs):
        super(CartaoSalvo, self).__init__(**kwargs)

    __tablename__ = 'cartoes_salvos'