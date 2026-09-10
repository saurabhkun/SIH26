/**
 * CivicResolve Unified Authentication & Fast Session Hydration
 */
const CivicAuth = {
  USERS: {
    'superadmin@jharkhand.gov.in': {
      role: 'super_admin',
      name: 'Sri Sunil Kumar, IAS',
      designation: 'Principal Secretary & Chief Super Administrator',
      redirect: 'super_admin.html'
    },
    'csr.head@tatasteel.com': {
      role: 'industry_tech',
      name: 'Sanjay Chatterjee',
      designation: 'Head of CSR & Tech Partner (Tata Steel & CMPDI)',
      redirect: 'dashboard.html'
    },
    'audit.lead@cmpdi.co.in': {
      role: 'industry_tech',
      name: 'Dr. Alok K. Mishra',
      designation: 'Technical Consultancy & NABL Auditor (CMPDI)',
      redirect: 'dashboard.html'
    },
    'director.rnd@bitmesra.ac.in': {
      role: 'college',
      name: 'Dr. Ananya Sen',
      designation: 'Dean of Research & Innovation (BIT Mesra)',
      redirect: 'dashboard.html'
    },
    'ro.evaluator@jharkhand.gov.in': {
      role: 'research_org',
      name: 'Dr. Birendra Mahato',
      designation: 'Research Organization Evaluator',
      redirect: 'dashboard.html'
    }
  },

  autoFillRole(roleId) {
    const emailInput = document.getElementById('email');
    const passInput = document.getElementById('password');
    if (!emailInput || !passInput) return;

    if (roleId === 'industry_tech' || roleId === 'csr_tech') {
      emailInput.value = 'csr.head@tatasteel.com';
      passInput.value = 'Industry@1234';
    } else if (roleId === 'super_admin') {
      emailInput.value = 'superadmin@jharkhand.gov.in';
      passInput.value = 'SuperAdmin@1234';
    } else if (roleId === 'research_org' || roleId === 'gov_ro') {
      emailInput.value = 'ro.evaluator@jharkhand.gov.in';
      passInput.value = 'Ro@1234';
    } else if (roleId === 'college') {
      emailInput.value = 'director.rnd@bitmesra.ac.in';
      passInput.value = 'College@1234';
    }
  },

  initTheme() {
    const theme = localStorage.getItem('civic_theme') || 'light';
    if (theme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
      document.documentElement.classList.remove('dark');
    }
  },

  toggleTheme() {
    const isDark = document.documentElement.classList.contains('dark') || document.documentElement.getAttribute('data-theme') === 'dark';
    const newTheme = isDark ? 'light' : 'dark';
    localStorage.setItem('civic_theme', newTheme);
    this.initTheme();
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
      sessionStorage.setItem('civic_session_user', JSON.stringify(sessionData));
      return { success: true, redirect: user.redirect, user: sessionData };
    }

    // Generic fallback for any email
    const fallbackRole = normalized.includes('super') ? 'super_admin' : normalized.includes('csr') ? 'csr_partner' : 'tech_admin';
    const sessionData = {
      email: normalized,
      name: normalized.split('@')[0],
      role: fallbackRole,
      designation: 'Authorized Enterprise Member',
      token: 'signed_jwt_session_' + Date.now()
    };
    sessionStorage.setItem('civic_session_user', JSON.stringify(sessionData));
    const target = fallbackRole === 'super_admin' ? 'super_admin.html' : 'dashboard.html';
    return { success: true, redirect: target, user: sessionData };
  },

  logout() {
    sessionStorage.removeItem('civic_session_user');
    window.location.href = 'index.html';
  },

  requireAuth(allowedRoles = []) {
    const session = this.getSession();
    if (!session) {
      window.location.href = 'index.html';
      return null;
    }
    if (allowedRoles.length > 0 && !allowedRoles.includes(session.role)) {
      alert('Access Denied: Your account role (' + session.role + ') is not authorized for this portal view.');
      window.location.href = session.role === 'super_admin' ? 'super_admin.html' : 'dashboard.html';
      return null;
    }
    return session;
  }
};

// Immediate instant theme setup without waiting for DOMContentLoaded
CivicAuth.initTheme();
window.CivicAuth = CivicAuth;
