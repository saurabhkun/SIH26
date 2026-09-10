/**
 * CivicResolve Unified Authentication & Fast Session Hydration
 * Government of Jharkhand
 */
const CivicAuth = {
  USERS: {
    'superadmin@jharkhand.gov.in': {
      role: 'super_admin',
      name: 'Sri Sunil Kumar, IAS',
      designation: 'Principal Secretary & Chief Super Administrator',
      redirect: 'super_admin.html'
    },
    'officer@jharkhand.gov.in': {
      role: 'gov_dept',
      name: 'Dr. Arvind Kumar',
      designation: 'Nodal Officer (PWD & Urban Infrastructure)',
      redirect: 'dept_dashboard.html'
    },
    'ro.evaluator@jharkhand.gov.in': {
      role: 'gov_ro',
      name: 'Dr. Birendra Mahato',
      designation: 'State Central Lab Director (CSIR-CIMFR)',
      redirect: 'dashboard.html'
    },
    'director.rnd@bitmesra.ac.in': {
      role: 'research_org',
      name: 'Dr. Ananya Sen',
      designation: 'Dean of Research & Innovation (BIT Mesra)',
      redirect: 'dashboard.html'
    },
    'csr.head@tatasteel.com': {
      role: 'industry_tech',
      name: 'Sanjay Chatterjee',
      designation: 'Head of CSR & Tech Partner (Tata Steel & CMPDI)',
      redirect: 'dashboard.html'
    }
  },

  autoFillRole(roleId) {
    const emailInput = document.getElementById('email');
    const passInput = document.getElementById('password');
    if (!emailInput || !passInput) return;

    if (roleId === 'super_admin') {
      emailInput.value = 'superadmin@jharkhand.gov.in';
      passInput.value = 'SuperAdmin@1234';
    } else if (roleId === 'gov_dept' || roleId === 'gov') {
      emailInput.value = 'officer@jharkhand.gov.in';
      passInput.value = 'Gov@1234';
    } else if (roleId === 'gov_ro') {
      emailInput.value = 'ro.evaluator@jharkhand.gov.in';
      passInput.value = 'Ro@1234';
    } else if (roleId === 'research_org' || roleId === 'college') {
      emailInput.value = 'director.rnd@bitmesra.ac.in';
      passInput.value = 'College@1234';
    } else if (roleId === 'industry_tech' || roleId === 'csr_tech' || roleId === 'industry') {
      emailInput.value = 'csr.head@tatasteel.com';
      passInput.value = 'Industry@1234';
    }
  },

  initTheme() {
    try {
      const theme = localStorage.getItem('civic_theme') || localStorage.getItem('theme') || 'light';
      if (theme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.removeAttribute('data-theme');
        document.documentElement.classList.remove('dark');
        localStorage.setItem('civic_theme', 'light');
        localStorage.setItem('theme', 'light');
      }
    } catch (_) {}
  },

  toggleTheme() {
    try {
      const isDark = document.documentElement.classList.contains('dark') || document.documentElement.getAttribute('data-theme') === 'dark';
      const newTheme = isDark ? 'light' : 'dark';
      localStorage.setItem('civic_theme', newTheme);
      localStorage.setItem('theme', newTheme);
      this.initTheme();
    } catch (_) {}
  },

  getSession() {
    try {
      const cached = sessionStorage.getItem('civic_session_user');
      return cached ? JSON.parse(cached) : null;
    } catch (_) {
      return null;
    }
  },

  login(email, password) {
    const normalized = (email || '').toLowerCase().trim();
    const user = this.USERS[normalized];

    if (user) {
      const sessionData = {
        email: normalized,
        name: user.name,
        role: user.role,
        designation: user.designation,
        token: 'signed_jwt_session_' + Date.now()
      };
      try {
        sessionStorage.setItem('civic_session_user', JSON.stringify(sessionData));
      } catch (_) {}
      return { success: true, redirect: user.redirect, user: sessionData };
    }

    // Dynamic role derivation
    let fallbackRole = 'research_org';
    let target = 'dashboard.html';

    if (normalized.includes('super')) {
      fallbackRole = 'super_admin';
      target = 'super_admin.html';
    } else if (normalized.includes('dept') || normalized.includes('gov') || normalized.includes('pwd')) {
      fallbackRole = 'gov_dept';
      target = 'dept_dashboard.html';
    } else if (normalized.includes('lab') || normalized.includes('ro')) {
      fallbackRole = 'gov_ro';
      target = 'dashboard.html';
    } else if (normalized.includes('csr') || normalized.includes('industry')) {
      fallbackRole = 'industry_tech';
      target = 'dashboard.html';
    }

    const sessionData = {
      email: normalized,
      name: normalized.split('@')[0],
      role: fallbackRole,
      designation: 'Authorized Official',
      token: 'signed_jwt_session_' + Date.now()
    };
    try {
      sessionStorage.setItem('civic_session_user', JSON.stringify(sessionData));
    } catch (_) {}
    return { success: true, redirect: target, user: sessionData };
  },

  logout() {
    try {
      sessionStorage.removeItem('civic_session_user');
    } catch (_) {}
    window.location.href = 'index.html';
  },

  requireAuth(allowedRoles = []) {
    const session = this.getSession();
    if (!session) {
      window.location.href = 'index.html';
      return null;
    }
    if (allowedRoles.length > 0 && !allowedRoles.includes(session.role)) {
      alert('Access Notice: Redirecting to authorized workspace for role (' + session.role + ').');
      const target = session.role === 'super_admin' ? 'super_admin.html' : session.role === 'gov_dept' ? 'dept_dashboard.html' : 'dashboard.html';
      window.location.href = target;
      return null;
    }
    return session;
  }
};

// Immediate instant theme setup without waiting for DOMContentLoaded
CivicAuth.initTheme();
window.CivicAuth = CivicAuth;
