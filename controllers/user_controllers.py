from flask import flash, render_template, request, redirect, url_for, Blueprint, jsonify, send_from_directory, current_app, send_file, session
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
from datetime import datetime, timedelta
from flask_login import login_user, logout_user, current_user, login_required
from models.user import Payment, Usuario, UserDocument, CartaoSalvo, db
from utils.document_validator import validate_and_log_document
import os
import time
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.image import MIMEImage
import random
import io
import threading
import re
import json
from fpdf import FPDF

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
UPLOAD_FOLDER = os.path.join(BASE_DIR, 'user_documents')
ALLOWED_EXTENSIONS = {'jpg', 'jpeg', 'png', 'gif', 'pdf'}

os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def get_client_ip():
    """
    Obtém IP do cliente priorizando X-Forwarded-For (quando atrás de proxy),
    com fallback para request.remote_addr.
    """
    x_forwarded_for = request.headers.get('X-Forwarded-For', '')
    if x_forwarded_for:
        # X-Forwarded-For pode vir como "client, proxy1, proxy2"
        ip = x_forwarded_for.split(',')[0].strip()
        if ip:
            return ip
    return (request.remote_addr or '').strip()

def validar_texto_observacao(texto):
    """
    Regras para observação:
    - Proibido @ (inclui @instagram / @usuario)
    - Proibido número de telefone (8+ dígitos, com ou sem separadores)
    - Proibido menções de contato/redes sociais (mesmo sem @)
    - Proibido caracteres especiais fora da lista permitida
    """
    if not texto:
        return True, None

    texto = texto.strip()
    if not texto:
        return True, None

    texto_lower = texto.lower()

    if '@' in texto:
        return False, "Observação inválida: não é permitido informar @ de Instagram/usuário."

    padroes_contato = [
        r'\binstagram\b',
        r'\binsta\b',
        r'\big\b',
        r'\bwhatsapp\b',
        r'\bwhats\b',
        r'\bzap\b',
        r'\bdirect\b',
        r'\bdm\b',
        r'\bcontato\b',
        r'entre\s+em\s+contato',
        r'me\s+chama',
        r'chama\s+no\s+direct',
        r'fale\s+comigo',
    ]

    texto_sem_espacos = re.sub(r'\s+', '', texto_lower)
    if 'insta' in texto_sem_espacos:
        return False, "Observação inválida: não é permitido compartilhar contato ou rede social."

    for padrao in padroes_contato:
        if re.search(padrao, texto_lower):
            return False, "Observação inválida: não é permitido compartilhar contato ou rede social."

    apenas_digitos = re.sub(r'\D', '', texto)
    if len(apenas_digitos) >= 8:
        return False, "Observação inválida: não é permitido informar número de telefone."

    padrao_permitido = r'^[A-Za-zÀ-ÿ0-9\s\.,;:!\?\-_/()\n\r]*$'
    if not re.match(padrao_permitido, texto):
        return False, "Observação inválida: não use caracteres especiais como #, @ e similares."

    return True, None


def enviar_email_boas_vindas(destinatario, nome):
    remetente = os.getenv('MAIL_USERNAME') or current_app.config.get('MAIL_USERNAME')
    senha = os.getenv('MAIL_PASSWORD') or current_app.config.get('MAIL_PASSWORD')
    
    if not remetente or not senha:
        print("Aviso: Credenciais de e-mail (MAIL_USERNAME/MAIL_PASSWORD) não configuradas no .env ou na configuração do aplicativo. Ignorando envio real.")
        return
        
    msg = MIMEMultipart('related')
    msg['From'] = remetente
    msg['To'] = destinatario
    msg['Subject'] = "Bem-vindo ao CotaGO!"
    
    msg_alternative = MIMEMultipart('alternative')
    msg.attach(msg_alternative)
    
    corpo_texto = f"Olá {nome},\n\nSeu cadastro no CotaGO foi realizado com sucesso!\nEstamos muito felizes em ter você conosco.\n\nAtenciosamente,\nEquipe CotaGO"
    msg_alternative.attach(MIMEText(corpo_texto, 'plain', 'utf-8'))
    
    corpo_html = f"""
    <html>
    <body style="font-family: Arial, sans-serif; color: #333; line-height: 1.6; text-align: center;">
        <div style="background-color: #f4f4f4; padding: 20px; border-radius: 8px; max-width: 600px; margin: 0 auto; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <img src="cid:logogo" alt="Logo Dash" style="max-width: 200px; margin-bottom: 20px;">
            <h2 style="color: #061F40;">Olá, {nome}!</h2>
            <p>Seu cadastro no <strong>Dash</strong> foi realizado com sucesso!</p>
            <p>Estamos muito felizes em ter você conosco. Nossa plataforma foi feita para simplificar sua experiência e te conectar aos recursos principais.</p>
            <br>
            <p>Atenciosamente,<br><strong>Equipe DASH</strong></p>
        </div>
    </body>
    </html>
    """
    msg_alternative.attach(MIMEText(corpo_html, 'html', 'utf-8'))
    
    logo_path = os.path.join(BASE_DIR, 'views', 'static', 'img', 'Logo.png')
    if os.path.exists(logo_path):
        with open(logo_path, 'rb') as f:
            img_data = f.read()
        image = MIMEImage(img_data, name=os.path.basename(logo_path))
        image.add_header('Content-ID', '<logogo>')
        image.add_header('Content-Disposition', 'inline', filename=os.path.basename(logo_path))
        msg.attach(image)
    
    server = None
    try:
        # Usando servidor SMTP do Gmail
        server = smtplib.SMTP('smtp.gmail.com', 587)
        server.starttls()
        server.login(remetente, senha)
        server.send_message(msg)
        print(f"E-mail de boas-vindas enviado com sucesso para: {destinatario}")
    except Exception as e:
        print(f"Erro ao tentar enviar e-mail de boas-vindas para {destinatario}: {e}")
    finally:
        if server:
            try:
                server.quit()
            except Exception:
                pass

def enviar_email_em_background(func, *args, **kwargs):
    app = current_app._get_current_object()
    def task():
        with app.app_context():
            func(*args, **kwargs)
    thread = threading.Thread(target=task, daemon=True)
    thread.start()

def enviar_email_redefinicao_senha(destinatario, nome, codigo):
    remetente = os.getenv('MAIL_USERNAME') or current_app.config.get('MAIL_USERNAME')
    senha = os.getenv('MAIL_PASSWORD') or current_app.config.get('MAIL_PASSWORD')
    
    if not remetente or not senha:
        print("Aviso: Credenciais de e-mail (MAIL_USERNAME/MAIL_PASSWORD) não configuradas no .env ou na configuração do aplicativo. Ignorando envio real.")
        return
        
    msg = MIMEMultipart('related')
    msg['From'] = remetente
    msg['To'] = destinatario
    msg['Subject'] = "Dash - Redefinição de Senha"
    
    msg_alternative = MIMEMultipart('alternative')
    msg.attach(msg_alternative)
    
    corpo_texto = f"Olá {nome},\n\nRecebemos uma solicitação de redefinição de senha para sua conta no CotaGO.\n\nSeu código de redefinição é: {codigo}\n\nEste código é resetado a cada 30 segundos.\n\nAtenciosamente,\nEquipe CotaGO"
    msg_alternative.attach(MIMEText(corpo_texto, 'plain', 'utf-8'))
    
    corpo_html = f"""
    <html>
    <body style="font-family: Arial, sans-serif; color: #333; line-height: 1.6; text-align: center;">
        <div style="background-color: #f4f4f4; padding: 20px; border-radius: 8px; max-width: 600px; margin: 0 auto; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <img src="cid:logogo" alt="Logo Dash" style="max-width: 200px; margin-bottom: 20px;">
            <h2 style="color: #061F40;">Olá, {nome}!</h2>
            <p>Recebemos uma solicitação de redefinição de senha para sua conta no <strong>Dash</strong>.</p>
            <p>Seu código de redefinição é:</p>
            <div style="font-size: 24px; font-weight: bold; letter-spacing: 2px; color: #6366f1; background: #fff; padding: 10px 20px; display: inline-block; border-radius: 6px; margin: 15px 0; border: 1px dashed #6366f1;">
                {codigo}
            </div>
            <p style="font-size: 12px; color: #666;">Este código é resetado a cada 30 segundos. Se você não solicitou essa redefinição, por favor ignore este e-mail.</p>
            <br>
            <p>Atenciosamente,<br><strong>Equipe Dash</strong></p>
        </div>
    </body>
    </html>
    """
    msg_alternative.attach(MIMEText(corpo_html, 'html', 'utf-8'))
    
    logo_path = os.path.join(BASE_DIR, 'views', 'static', 'img', 'LogoGO.png')
    if os.path.exists(logo_path):
        with open(logo_path, 'rb') as f:
            img_data = f.read()
        image = MIMEImage(img_data, name=os.path.basename(logo_path))
        image.add_header('Content-ID', '<logogo>')
        image.add_header('Content-Disposition', 'inline', filename=os.path.basename(logo_path))
        msg.attach(image)
    
    server = None
    try:
        server = smtplib.SMTP('smtp.gmail.com', 587)
        server.starttls()
        server.login(remetente, senha)
        server.send_message(msg)
        print(f"E-mail de redefinição de senha enviado com sucesso para: {destinatario}. Código gerado: {codigo}")
    except Exception as e:
        print(f"Erro ao tentar enviar e-mail de redefinição para {destinatario}: {e}")
    finally:
        if server:
            try:
                server.quit()
            except Exception:
                pass

auth_bp = Blueprint('auth', __name__, template_folder='templates')

@auth_bp.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        nome = request.form['nome']
        senha = request.form['password']
        
        user = Usuario.query.filter_by(username=nome).first()
        if user and check_password_hash(user.password, senha):
            login_user(user)
            session['just_logged_in'] = True
            agora = datetime.now().strftime("%H:%M:%S")
            flash(f'Login realizado ás {agora}')
            
            if user.username == 'root':
                return redirect(url_for('user.admSecret'))

            user_mode = (getattr(user, 'access_mode', None) or '').upper()
            if user_mode == 'AGENCIA':
                return redirect(url_for('user.dashagencia'))

            # COTADOR e AMBOS iniciam em dashboard de cotador
            return redirect(url_for('user.dashboard'))
        else:
            return render_template('index.html', error='Nome de usuário ou senha incorretos')
        
    return render_template('index.html')

@auth_bp.route('/logout')
@login_required
def logout():
    logout_user()
    agora = datetime.now().strftime("%H:%M:%S")
    flash(f'Você deslogou com sucesso! {agora}')
    return redirect(url_for('auth.login'))

@auth_bp.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'GET':
        return render_template('cadastro.html')
    
    nome_usuario = request.form['nomeForm']
    senha = request.form['senhaForm']
    confirmar_senha = request.form['confirmarSenhaForm']
    email = request.form['emailForm']
    doc = request.files.get('documentoForm')
    cpf_cnpj = request.form['cpfForm']
    data_nascimento = request.form['dataNascimentoForm']

    # ===== REMOVE CARACTERES ESPECIAIS DO CPF/CNPJ =====
    cpf_cnpj_clean = cpf_cnpj.replace('.', '').replace('-', '').replace('/', '')
    
    # ===== DETERMINA O TIPO DE DOCUMENTO E VALIDA =====
    tipo_documento = None
    if len(cpf_cnpj_clean) == 11:
        tipo_documento = 'CPF'
    elif len(cpf_cnpj_clean) == 14:
        tipo_documento = 'CNPJ'
    else:
        return render_template('cadastro.html', error='CPF deve ter 11 dígitos ou CNPJ deve ter 14 dígitos')
    
    # ===== VALIDAÇÕES INICIAIS =====
    client_ip = get_client_ip()
    if client_ip:
        contas_mesmo_ip = Usuario.query.filter_by(ip_cadastro=client_ip).count()
        if contas_mesmo_ip >= 2:
            return render_template('cadastro.html', error='Limite de cadastro por IP atingido. Máximo de 2 contas por IP.')
            
    if Usuario.query.filter_by(username=nome_usuario).first():
        return render_template('cadastro.html', error='Nome de usuário já registrado')
    if Usuario.query.filter_by(cpf=cpf_cnpj_clean).first():
        tipo_doc_existente = Usuario.query.filter_by(cpf=cpf_cnpj_clean).first().tipo_documento
        return render_template('cadastro.html', error=f'{tipo_doc_existente} já registrado')
    if data_nascimento:
        try:
            data_nascimento = datetime.strptime(data_nascimento, '%Y-%m-%d').date()
        except ValueError:
            return render_template('cadastro.html', error='Data de nascimento inválida')
    if senha != confirmar_senha:
        return render_template('cadastro.html', error='As senhas não coincidem')
    if Usuario.query.filter_by(email=email).first():
        return render_template('cadastro.html', error='Email já registrado')

    # ===== VALIDAÇÃO DO DOCUMENTO (ANTES DE CRIAR O USUÁRIO) =====
    document_type = None
    document_filename = None
    document_path = None
    
    if doc and doc.filename != '':
        filename = secure_filename(doc.filename)
        
        # Verifica se o tipo de arquivo é permitido
        if not allowed_file(filename):
            return render_template('cadastro.html', error='Tipo de arquivo não permitido. Use: jpg, jpeg, png, gif ou pdf')
        
        timestamp = str(int(time.time()))
        unique_filename = f"{timestamp}_{filename}"
        save_path = os.path.join(UPLOAD_FOLDER, unique_filename)
        doc.save(save_path)
        
        # Valida o documento de acordo com o tipo (CPF -> RG/CNH, CNPJ -> MEI/CNPJ)
        validation_result = validate_and_log_document(save_path, expected_document_type=tipo_documento)
        
        if not validation_result['valid']:
            # Remove o arquivo se não for válido
            try:
                os.remove(save_path)
            except Exception as e:
                print(f"Erro ao remover arquivo inválido: {e}")
            
            # Retorna erro com mensagem específica (ANTES DE CRIAR O USUÁRIO)
            error_message = validation_result['message']
            return render_template('cadastro.html', error=error_message)
        
        # Documento validado com sucesso
        document_type = validation_result['document_type']
        document_filename = filename
        document_path = save_path

    # ===== DETERMINA STATUS DE CONTA COM BASE NO TIPO CADASTRADO =====
    agencia_enabled = (tipo_documento == 'CNPJ')  # compat legado
    access_mode = 'AGENCIA' if tipo_documento == 'CNPJ' else 'COTADOR'

    # ===== CRIAR USUÁRIO APENAS APÓS VALIDAÇÃO DO DOCUMENTO =====
    novo_usuario = Usuario(
        username=nome_usuario,
        cpf=cpf_cnpj_clean,
        tipo_documento=tipo_documento,
        data_nascimento=data_nascimento,
        email=email, 
        password=generate_password_hash(senha),
        nick=nome_usuario[:6].upper(),
        agencia_enabled=agencia_enabled,
        access_mode=access_mode,
        ip_cadastro=client_ip if client_ip else None
    )
    db.session.add(novo_usuario)
    db.session.commit()
    
    # ===== SALVAR DOCUMENTO (SE FOI VALIDADO) =====
    if document_path:
        documento = UserDocument(
            user_id=novo_usuario.id, 
            filename=document_filename, 
            path=document_path,
            document_type=document_type
        )
        db.session.add(documento)
        db.session.commit()
    
    # Envia o e-mail de boas-vindas em segundo plano para não atrasar o cadastro
    tipo_usuario = 'Agência' if agencia_enabled else 'Cotador'
    enviar_email_em_background(enviar_email_boas_vindas, email, nome_usuario)

    agora = datetime.now().strftime("%H:%M:%S")
    flash(f'Cadastro realizado com sucesso como {tipo_usuario}! {agora}')
    return redirect(url_for('auth.login'))

user_bp = Blueprint('user', __name__, template_folder='templates')


# ========= Termos de Uso e Política de Privacidade =========
@user_bp.route('/authtermos', methods=['GET', 'POST'])
def authtermos():
    return render_template('auth.termos.html')

@user_bp.route('/esqueceu_senha', methods=['GET', 'POST'])
def esqueceu_senha():
    if request.method == 'POST':
        email = request.form['email']
        user = Usuario.query.filter_by(email=email).first()
        if user:
            # Gera código numérico de 6 dígitos
            codigo = ''.join(random.choices('0123456789', k=6))
            user.codigo_recuperacao = codigo
            user.codigo_expiracao = datetime.utcnow() + timedelta(seconds=30)
            db.session.commit()
            
            # Envia o e-mail de redefinição de senha em segundo plano
            enviar_email_em_background(enviar_email_redefinicao_senha, email, user.username, codigo)
            flash('Verifique seu e-mail para obter o código de redefinição!', 'success')
            return redirect(url_for('user.redPassword'))
        else:
            flash('Email não encontrado!', 'error')
    return render_template('esqueceu_senha.html')

@user_bp.route('/redPassword', methods=['GET', 'POST'])
def redPassword():
    if request.method == 'POST':
        codigo = request.form['codigo']
        senha = request.form['password']
        confirmar_senha = request.form['confirm_password']
        if senha != confirmar_senha:
            flash('As senhas não coincidem!', 'error')
            return redirect(url_for('user.redPassword'))
            
        user = Usuario.query.filter_by(codigo_recuperacao=codigo).first()
        if user and user.codigo_expiracao and user.codigo_expiracao > datetime.utcnow():
            user.password = generate_password_hash(senha)
            user.codigo_recuperacao = None
            user.codigo_expiracao = None
            db.session.commit()
            flash('Senha redefinida com sucesso!', 'success')
            return redirect(url_for('auth.login'))
        else:
            flash('Código inválido ou expirado!', 'error')
    return render_template('redPassword.html')

@user_bp.route('/dashboard')
@login_required
def dashboard():
    user_mode = (getattr(current_user, 'access_mode', None) or '').upper()
    if user_mode == 'AGENCIA':
        flash('Sua conta é somente agência.', 'error')
        return redirect(url_for('user.dashagencia'))
    user = current_user
    documents = [{
        'id': doc.id,
        'filename': doc.filename,
        'upload_date': doc.upload_date.strftime('%Y-%m-%d %H:%M:%S'),
        'download_url': url_for('user.download_document', doc_id=doc.id)
    } for doc in user.documents]
    
    if session.pop('just_logged_in', False):
        flash(f'Bem-vindo(a) {user.username}!')
            
    # Obter os maiores pontuadores (XP) que possuem nick e não são usuários somente agência
    top_users = Usuario.query.filter(
        Usuario.nick.isnot(None),
        Usuario.nick != '',
        Usuario.username != 'root',
        db.func.upper(db.func.coalesce(Usuario.access_mode, '')) != 'AGENCIA'
    ).order_by(Usuario.xp.desc()).limit(50).all()
        
    return render_template('user_dashboard.html', user=user, documents=documents, top_users=top_users)


@user_bp.route('/upload_documento', methods=['POST'])
@login_required
def upload_documento():
    if 'documento' not in request.files:
        return jsonify({'error': 'Nenhum arquivo enviado'}), 400
    
    file = request.files['documento']
    if file.filename == '':
        return jsonify({'error': 'Por favor, selecione um arquivo.'}), 400
    
    if not allowed_file(file.filename):
        return jsonify({'error': 'Formato inválido. Use JPG, PNG, GIF ou PDF'}), 400
    
    filename = secure_filename(file.filename)
    timestamp = str(int(time.time()))
    unique_filename = f"{timestamp}_{filename}"
    save_path = os.path.join(UPLOAD_FOLDER, unique_filename)
    
    file.save(save_path)

    doc = UserDocument(user_id=current_user.id, filename=filename, path=save_path)
    db.session.add(doc)
    db.session.commit()
    
    return redirect(url_for('user.dashboard'))

@user_bp.route('/download/<int:doc_id>')
@login_required
def download_document(doc_id):
    document = UserDocument.query.get_or_404(doc_id)
    if document.user_id != current_user.id:
        return "Acesso negado", 403
    return send_from_directory(UPLOAD_FOLDER, os.path.basename(document.path), as_attachment=True, download_name=document.filename)

@user_bp.route('/upload/<filename>')
@login_required
def user_documents(filename):
    return send_from_directory(UPLOAD_FOLDER, filename)

@user_bp.route('/account', methods=['GET', 'POST'])
@login_required
def account():
    if request.method == 'GET':
        return render_template('settings_account.html', user=current_user)
    else:
        data = request.get_json()
        if data and 'nickname' in data:
            current_user.nick = data['nickname'][:6]
            db.session.commit()
            flash('Nickname atualizado com sucesso!')
            return jsonify({'success': True})
        return redirect(url_for('user.dashboard'))

@user_bp.route('/settings')
@login_required
def settings():
    return render_template(
        'settings.html',
        show_agencia_controls=bool(getattr(current_user, 'agencia_enabled', False)),
        is_admin=bool(getattr(current_user, 'username', None) == 'root')
    )

@user_bp.route('/settings/account')
@login_required
def account_settings():
    return render_template('settings_account.html', user=current_user)

@user_bp.route('/delete_account', methods=['POST'])
@login_required
def delete_account():
    """Deleta a conta do usuário atual (irreversível) após coletar motivo."""
    try:
        data = request.get_json(silent=True) or {}
        motivo = data.get('motivo', None)
        motivo_texto = (data.get('motivo_texto') or '').strip()

        # valida motivo
        try:
            motivo_int = int(motivo)
        except (TypeError, ValueError):
            motivo_int = None

        if motivo_int not in (1, 2, 3, 4, 5):
            return ("Motivo inválido", 400)

        if motivo_int == 5 and len(motivo_texto) == 0:
            return ("Informe sua opinião quando escolher a opção 5.", 400)

        user = current_user

        # Deleção irreversível: ORM cascade deve remover relações; documentos devem ser removidos do filesystem se existir.
        # Nota: UserDocument não está com cascade definido, então removemos explicitamente.
        try:
            user_docs = UserDocument.query.filter_by(user_id=user.id).all()
            for d in user_docs:
                try:
                    if d.path and os.path.exists(d.path):
                        os.remove(d.path)
                except Exception:
                    pass
                db.session.delete(d)
        except Exception:
            pass

        # Remove usuário
        db.session.delete(user)
        db.session.commit()

        # limpa session
        session.clear()

        # como o front envia JSON, retornamos redirect-like via status 200 e depois o JS manda para /auth/login
        return jsonify({'success': True})

    except Exception as e:
        db.session.rollback()
        return (str(e), 500)


@user_bp.route('/upload_profile_pic', methods=['POST'])
@login_required
def upload_profile_pic():

    if 'profile_pic' not in request.files:
        return jsonify({'error': 'Nenhuma imagem enviada'}), 400
    
    file = request.files['profile_pic']
    if file.filename == '':
        return jsonify({'error': 'Por favor, selecione uma imagem.'}), 400
    
    if not allowed_file(file.filename):
        return jsonify({'error': 'Formato inválido. Use JPG, PNG ou GIF'}), 400
    
    filename = secure_filename(file.filename)
    timestamp = str(int(time.time()))
    unique_filename = f"{timestamp}_{filename}"
    save_path = os.path.join(UPLOAD_FOLDER, unique_filename)
    
    file.save(save_path)

    user = current_user
    user.profile_pic = unique_filename
    db.session.commit()
    
    return render_template('settings_account.html', user=user), 200

@user_bp.route('/settings/privacy')
@login_required
def settings_privacy():
    return render_template('settingsPrivacy.html')

@user_bp.route('/settings/pagamentos')
@login_required
def pagamentos():
    cartao_salvo = CartaoSalvo.query.filter_by(user_id=current_user.id).first()
    return render_template('pagamentos.html', user=current_user, cartao_salvo=cartao_salvo)

@user_bp.route('/solicitar_saque', methods=['POST'])
@login_required
def solicitar_saque():
    payload = request.get_json(silent=True) or {}
    valor_raw = request.form.get('valor_saque') or payload.get('valor_saque')
    agencia = (request.form.get('agencia') or payload.get('agencia') or '').strip()
    conta = (request.form.get('conta') or payload.get('conta') or '').strip()
    chave_pix = (request.form.get('chave_pix') or payload.get('chave_pix') or '').strip()

    try:
        valor_saque = float(str(valor_raw).replace(',', '.'))
    except (TypeError, ValueError):
        return jsonify({'success': False, 'msg': 'Valor de saque inválido.'}), 400

    if valor_saque <= 0:
        return jsonify({'success': False, 'msg': 'O valor de saque deve ser maior que zero.'}), 400

    informou_conta_agencia = bool(agencia and conta)
    informou_pix = bool(chave_pix)

    if not informou_conta_agencia and not informou_pix:
        return jsonify({'success': False, 'msg': 'Informe agência + conta ou uma chave PIX para receber o saque.'}), 400

    saldo_atual = float(current_user.balance or 0.0)
    if valor_saque > saldo_atual:
        return jsonify({'success': False, 'msg': 'Saldo insuficiente para saque.'}), 400

    try:
        current_user.balance = saldo_atual - valor_saque
        db.session.commit()
        return jsonify({
            'success': True,
            'msg': 'Saque solicitado com sucesso.',
            'novo_saldo': round(float(current_user.balance or 0.0), 2)
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'msg': f'Erro ao processar saque: {str(e)}'}), 500

@user_bp.route('/gerar_relatorio_csv')
@login_required
def gerar_relatorio_csv():
    import csv
    from flask import Response
    import io
    
    output = io.StringIO()
    writer = csv.writer(output, delimiter=';')
    writer.writerow(['TIPO', 'ID', 'DATA_EMISSAO', 'DESCRICAO_ROTA', 'VALOR_BASE', 'VALOR_FINAL', 'MARKUP_LUCRO', 'STATUS'])
    
    pagamentos = Payment.query.filter_by(username=current_user.username).order_by(Payment.created_at.desc()).all()
    for p in pagamentos:
        writer.writerow([
            'Pagamento',
            p.id,
            p.created_at.strftime('%d/%m/%Y %H:%M:%S'),
            p.description,
            '0.00',
            f"{p.amount:.2f}",
            '0.00',
            p.status
        ])
        
    return Response(
        output.getvalue().encode('utf-8-sig'),
        mimetype="text/csv",
        headers={"Content-Disposition": "attachment;filename=relatorio_completo.csv"}
    )

@user_bp.route('/relatorios')
@login_required
def relatorios_usuario():
    pagamentos = Payment.query.filter_by(user_id=current_user.id).order_by(Payment.created_at.desc()).all()
    total_investido = sum(float(p.amount or 0) for p in pagamentos)
    total_operacoes = len(pagamentos)
    ultima_operacao = pagamentos[0].created_at if pagamentos else None

    return render_template(
        'relatorios.html',
        pagamentos=pagamentos,
        total_investido=round(total_investido, 2),
        total_operacoes=total_operacoes,
        ultima_operacao=ultima_operacao
    )

@user_bp.route('/remover_cartao_salvo', methods=['POST'])
@login_required
def remover_cartao_salvo():
    cartao = CartaoSalvo.query.filter_by(user_id=current_user.id).first()
    if cartao:
        db.session.delete(cartao)
        db.session.commit()
        flash('Cartão removido com sucesso!', 'success')
    return redirect(url_for('user.pagamentos'))

@user_bp.route('/processar_pagamento', methods=['GET', 'POST'])
@login_required
def processar_pagamento():
    cartao_existente = CartaoSalvo.query.filter_by(user_id=current_user.id).first()
    
    nome_cartao   = request.form.get('nome_cartao')
    numero_cartao = request.form.get('numero_cartao')
    validade      = request.form.get('validade')
    cvc           = request.form.get('cvc')
    cpf           = request.form.get('cpf')
    valor_str     = request.form.get('valor')
    salvar_cartao = request.form.get('salvar_cartao') == 'on'

    if not all([nome_cartao, numero_cartao, validade,
                cvc, cpf, valor_str]):
        return render_template('pagamentos.html',
                    user=current_user,
                    cartao_salvo=cartao_existente,
                    error='Preencha todos os campos')

    # valor → float (aceita vírgula ou ponto)
    try:
        valor_float = float(valor_str.replace(',', '.'))
        if valor_float <= 0:
            raise ValueError()
    except (ValueError, TypeError):
        return render_template('pagamentos.html',
                    user=current_user,
                    cartao_salvo=cartao_existente,
                    error='Valor inválido. Use número positivo.')

    # validações do cartão (tamanho, CVC, etc.) …
    numero_limpo = numero_cartao.replace(' ', '')
    if not (13 <= len(numero_limpo) <= 19):
        return render_template('pagamentos.html',
                    user=current_user,
                    cartao_salvo=cartao_existente,
                    error='Número do cartão inválido')
    if len(cvc) < 3:
        return render_template('pagamentos.html',
                    user=current_user,
                    cartao_salvo=cartao_existente,
                    error='CVC inválido')

    # simulação de gateway (substitua por Stripe, PagSeguro, etc.)
    pagamento_sucesso = True
    if not pagamento_sucesso:
        return render_template('pagamentos.html',
                user=current_user,
                cartao_salvo=cartao_existente,
                error='Falha ao processar pagamento.')

    try:
        current_user.balance = (current_user.balance or 0) + valor_float
        novo_pagamento = Payment(
            username=current_user.username,
            user_id=current_user.id,
            amount=valor_float,
            description='Recarga de saldo',
            status='completed',
            last4=numero_limpo[-4:]
        )
        db.session.add(novo_pagamento)

        if salvar_cartao:
            # Apaga cartão antigo se existir (só permitindo 1 salvo)
            cartao_antigo = CartaoSalvo.query.filter_by(user_id=current_user.id).first()
            if cartao_antigo:
                db.session.delete(cartao_antigo)
            
            # Salva o novo
            novo_cartao = CartaoSalvo(
                user_id=current_user.id,
                nome_cartao=nome_cartao,
                numero_cartao=numero_limpo,
                validade=validade,
                cpf=cpf
            )
            db.session.add(novo_cartao)

        db.session.commit()
    except Exception:
        db.session.rollback()
        return render_template('pagamentos.html',
            user=current_user,
            cartao_salvo=cartao_existente,
            error='Erro interno ao atualizar saldo.')

    flash('pagamento bem sucedido')
    return redirect(url_for('user.dashagencia'))

    
    
@user_bp.route('/api/ticket-diario/resgatar', methods=['POST'])
@login_required
def resgatar_ticket_diario():
    """
    Resgata o ticket diário e aplica XP imediatamente no usuário logado.
    Também entrega bônus semanal ao completar os 7 tickets.
    """
    try:
        today = datetime.utcnow().date()
        week_start = today - timedelta(days=today.weekday())  # segunda-feira da semana atual

        # Reset semanal automático quando muda a semana
        if current_user.weekly_ticket_week_start != week_start:
            current_user.weekly_ticket_week_start = week_start
            current_user.weekly_ticket_progress = 0
            current_user.weekly_ticket_bonus_claimed = False
            current_user.weekly_ticket_last_claim_date = None

        # Evita múltiplos resgates no mesmo dia
        if current_user.weekly_ticket_last_claim_date == today:
            return jsonify({
                'success': False,
                'msg': 'Ticket diário já foi resgatado hoje.',
                'already_claimed_today': True,
                'xp': current_user.xp or 0,
                'level': current_user.level or 1,
                'weekly_progress': current_user.weekly_ticket_progress or 0,
                'weekly_bonus_awarded': False
            }), 409

        # XP por dia (1..7)
        daily_xp_table = {
            1: 5,
            2: 5,
            3: 5,
            4: 5,
            5: 5,
            6: 10,
            7: 20
        }

        next_day = (current_user.weekly_ticket_progress or 0) + 1
        if next_day > 7:
            # Segurança extra
            next_day = 7

        daily_xp = daily_xp_table.get(next_day, 5)
        bonus_xp = 0
        weekly_bonus_awarded = False

        # Aplica XP diário imediatamente
        current_user.weekly_ticket_progress = next_day
        current_user.weekly_ticket_last_claim_date = today
        current_user.xp = (current_user.xp or 0) + daily_xp

        # Bônus por concluir a semana
        if current_user.weekly_ticket_progress >= 7 and not current_user.weekly_ticket_bonus_claimed:
            bonus_xp = 30
            current_user.xp += bonus_xp
            current_user.weekly_ticket_bonus_claimed = True
            weekly_bonus_awarded = True

        # Recalcula nível (100 XP por nível)
        current_user.level = (current_user.xp // 100) + 1

        db.session.commit()

        return jsonify({
            'success': True,
            'msg': f'Ticket diário resgatado! +{daily_xp} XP',
            'daily_xp': daily_xp,
            'bonus_xp': bonus_xp,
            'weekly_bonus_awarded': weekly_bonus_awarded,
            'xp': current_user.xp,
            'level': current_user.level,
            'weekly_progress': current_user.weekly_ticket_progress,
            'week_start': week_start.isoformat(),
            'claimed_date': today.isoformat()
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'msg': str(e)}), 500