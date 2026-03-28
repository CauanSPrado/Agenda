function showToast(msg, type = 'success') {
            const t = document.getElementById('toast');
            t.textContent = msg;
            t.className = `toast toast-${type} show`;
            clearTimeout(t._timer);
            t._timer = setTimeout(() => { t.className = 'toast'; }, 2400);
        }
 
        function togglePw(inputId, btn) {
            const el = document.getElementById(inputId);
            const show = el.type === 'password';
            el.type = show ? 'text' : 'password';
            btn.textContent = show ? '🙈' : '👁️';
        }
 
 
        function switchTab(tab) {
            const isLogin = tab === 'login';
            document.getElementById('panel-login').classList.toggle('hidden', !isLogin);
            document.getElementById('panel-cadastro').classList.toggle('hidden', isLogin);
            document.getElementById('tab-login').classList.toggle('active', isLogin);
            document.getElementById('tab-cadastro').classList.toggle('active', !isLogin);
            document.getElementById('tab-login').setAttribute('aria-selected', isLogin);
            document.getElementById('tab-cadastro').setAttribute('aria-selected', !isLogin);
        }
 
 
        function checkPw() {
            const pw = document.getElementById('cad-pw').value;
            const set = (id, ok) => document.getElementById(id).className = ok ? 'ok' : '';
            set('hint-len',  pw.length >= 6);
            set('hint-num',  /\d/.test(pw));
            set('hint-char', /[a-zA-Z]/.test(pw));
        }
 
        function pwValid(pw) {
            return pw.length >= 6 && /\d/.test(pw) && /[a-zA-Z]/.test(pw);
        }
 
        async function handleLogin() {
            const login = document.getElementById('login-user').value.trim();
            const senha = document.getElementById('login-pw').value;
            const btn   = document.getElementById('btn-login');
 
            if (!login) { showToast('⚠️ Informe seu login.', 'error'); document.getElementById('login-user').focus(); return; }
            if (!senha)  { showToast('⚠️ Informe sua senha.', 'error'); document.getElementById('login-pw').focus();  return; }
 
            btn.textContent = '⏳ Entrando…';
            btn.disabled = true;
 
            try {
                await new Promise(r => setTimeout(r, 900));
                showToast(`✅ Bem-vindo(a), ${login}! Redirecionando…`, 'success');
                setTimeout(() => {
                    btn.textContent = '🚀 Entrar na Agenda';
                    btn.disabled = false;
                    window.location.href = 'index.html';
                }, 1800);
 
            } catch {
                showToast('❌ Erro de conexão. Tente novamente.', 'error');
                btn.textContent = '🚀 Entrar na Agenda';
                btn.disabled = false;
            }
        }
 
        async function handleCadastro() {
            const nome  = document.getElementById('cad-nome').value.trim();
            const login = document.getElementById('cad-login').value.trim();
            const nasc  = document.getElementById('cad-nasc').value;
            const pw    = document.getElementById('cad-pw').value;
            const pw2   = document.getElementById('cad-pw2').value;
            const btn   = document.getElementById('btn-cadastro');
 
            if (!nome)          { showToast('⚠️ Informe seu nome completo.', 'error');      document.getElementById('cad-nome').focus();  return; }
            if (!login)         { showToast('⚠️ Escolha um login.', 'error');              document.getElementById('cad-login').focus(); return; }
            if (!nasc)          { showToast('⚠️ Informe sua data de nascimento.', 'error'); document.getElementById('cad-nasc').focus();  return; }
            if (!pwValid(pw))   { showToast('⚠️ A senha não atende aos requisitos.', 'error'); document.getElementById('cad-pw').focus(); return; }
            if (pw !== pw2)     { showToast('⚠️ As senhas não conferem.', 'error'); document.getElementById('cad-pw2').focus(); return; }
 
            btn.textContent = '⏳ Criando conta…';
            btn.disabled = true;
 
            try {
                await new Promise(r => setTimeout(r, 1000));
                showToast('🎉 Conta criada com sucesso! Faça login.', 'success');
                setTimeout(() => {
                    switchTab('login');
                    document.getElementById('login-user').value = login;
                    btn.textContent = '✨ Criar minha conta';
                    btn.disabled = false;
                }, 1500);
 
            } catch {
                showToast('❌ Erro de conexão. Tente novamente.', 'error');
                btn.textContent = '✨ Criar minha conta';
                btn.disabled = false;
            }
        }
 
        document.addEventListener('keydown', (e) => {
            if (e.key !== 'Enter') return;
            const loginAtivo = !document.getElementById('panel-login').classList.contains('hidden');
            if (loginAtivo) handleLogin();
            else handleCadastro();
        });