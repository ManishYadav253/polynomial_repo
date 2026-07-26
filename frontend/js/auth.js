/* ══════════════════════════════════════════════════════════
   AUTH MODULE — JWT login/register/logout
══════════════════════════════════════════════════════════ */
const Auth = (() => {
  let currentUser = null;

  function getUser()  { return currentUser; }
  function getToken() { return localStorage.getItem('poly_token'); }

  function setSession(token, user) {
    localStorage.setItem('poly_token', token);
    localStorage.setItem('poly_user', JSON.stringify(user));
    currentUser = user;
    updateUI();
  }

  function clearSession() {
    localStorage.removeItem('poly_token');
    localStorage.removeItem('poly_user');
    currentUser = null;
    updateUI();
  }

  function updateUI() {
    const sidebarUser = document.getElementById('sidebar-user');
    const authBtn     = document.getElementById('auth-btn');
    if (!sidebarUser) return;

    if (currentUser) {
      sidebarUser.innerHTML = `
        <div class="user-info">
          <div class="user-avatar">${currentUser.username[0].toUpperCase()}</div>
          <div class="user-details">
            <div class="user-name">${currentUser.username}</div>
            <button class="logout-btn" id="logout-btn">Sign out</button>
          </div>
        </div>`;
      document.getElementById('logout-btn')?.addEventListener('click', logout);
    } else {
      sidebarUser.innerHTML = `
        <button class="btn-ghost" id="auth-btn">
          <i data-lucide="log-in"></i><span>Sign In</span>
        </button>`;
      document.getElementById('auth-btn')?.addEventListener('click', openModal);
      if (window.lucide) lucide.createIcons({ nodes: [sidebarUser] });
    }
  }

  function openModal() {
    document.getElementById('auth-modal').classList.remove('hidden');
    showTab('login');
    gsap.from('.modal-glass', { scale: 0.9, opacity: 0, duration: 0.35, ease: 'back.out(1.7)' });
  }

  function closeModal() {
    gsap.to('.modal-glass', {
      scale: 0.95, opacity: 0, duration: 0.2, ease: 'power2.in',
      onComplete: () => document.getElementById('auth-modal').classList.add('hidden')
    });
  }

  function showTab(tab) {
    document.querySelectorAll('.auth-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
    document.getElementById('login-form').classList.toggle('hidden', tab !== 'login');
    document.getElementById('register-form').classList.toggle('hidden', tab !== 'register');
  }

  async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value.trim();
    const pass  = document.getElementById('login-password').value;
    const errEl = document.getElementById('login-error');
    errEl.classList.add('hidden');
    try {
      const data = await API.auth.login(email, pass);
      setSession(data.token, data.user);
      closeModal();
      Toast.show('Welcome back, ' + data.user.username + '!', 'success');
    } catch (err) {
      errEl.textContent = err.message;
      errEl.classList.remove('hidden');
    }
  }

  async function handleRegister(e) {
    e.preventDefault();
    const username = document.getElementById('reg-username').value.trim();
    const email    = document.getElementById('reg-email').value.trim();
    const pass     = document.getElementById('reg-password').value;
    const errEl    = document.getElementById('reg-error');
    errEl.classList.add('hidden');
    if (pass.length < 6) { errEl.textContent = 'Password must be at least 6 characters'; errEl.classList.remove('hidden'); return; }
    try {
      const data = await API.auth.register(username, email, pass);
      setSession(data.token, data.user);
      closeModal();
      Toast.show('Account created! Welcome, ' + data.user.username + '!', 'success');
    } catch (err) {
      errEl.textContent = err.message;
      errEl.classList.remove('hidden');
    }
  }

  function logout() {
    clearSession();
    Toast.show('Signed out successfully', 'info');
  }

  function init() {
    // Restore session
    const stored = localStorage.getItem('poly_user');
    if (stored && getToken()) {
      try { currentUser = JSON.parse(stored); updateUI(); } catch {}
    }

    // Event bindings
    document.getElementById('auth-modal-close')?.addEventListener('click', closeModal);
    document.getElementById('auth-modal')?.addEventListener('click', e => {
      if (e.target === document.getElementById('auth-modal')) closeModal();
    });

    document.querySelectorAll('.auth-tab').forEach(btn => {
      btn.addEventListener('click', () => showTab(btn.dataset.tab));
    });

    document.getElementById('login-form')?.addEventListener('submit', handleLogin);
    document.getElementById('register-form')?.addEventListener('submit', handleRegister);
    document.getElementById('auth-btn')?.addEventListener('click', openModal);

    updateUI();
  }

  // Inject user-info styles
  const style = document.createElement('style');
  style.textContent = `
    .user-info { display:flex; align-items:center; gap:10px; width:100%; }
    .user-avatar { width:32px; height:32px; border-radius:50%; background:linear-gradient(135deg,var(--accent-primary),var(--accent-violet)); display:flex; align-items:center; justify-content:center; font-size:14px; font-weight:700; color:#fff; flex-shrink:0; }
    .user-details { flex:1; min-width:0; }
    .user-name { font-size:13px; font-weight:600; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
    .logout-btn { font-size:11px; color:var(--text-muted); cursor:pointer; background:none; border:none; padding:0; font-family:inherit; margin-top:2px; display:block; }
    .logout-btn:hover { color:var(--accent-rose); }
  `;
  document.head.appendChild(style);

  return { init, openModal, getUser, getToken, isLoggedIn: () => !!currentUser };
})();
