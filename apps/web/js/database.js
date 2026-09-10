/**
 * CivicResolve Client Data Service & Supabase Query Mock / Cache
 */
const CivicDB = {
  getIssues() {
    try {
      const stored = localStorage.getItem('civic_issues_v2');
      if (stored) return JSON.parse(stored);
    } catch (_) {}

    const seed = [
      {
        id: 'iss-8841',
        trackingCode: 'JH-2026-WTR-8841',
        title: 'High Fluoride & Arsenic Contamination in Drinking Wells',
        description: 'Spectroscopic tests show fluoride level > 4.2 mg/L affecting 450 households across Garhwa block.',
        category: 'water_sewage',
        district: 'Garhwa',
        priority: 'CRITICAL',
        isStarred: true,
        aiAnalysisReason: 'Direct chemical toxicity threat detected in drinking water; requires immediate lab filter prototype.',
        status: 'pending_super_admin_review',
        citizenName: 'Rameshwar Oraon',
        createdAt: new Date().toISOString()
      },
      {
        id: 'iss-1049',
        trackingCode: 'JH-2026-RD-1049',
        title: 'Severe Road Subsidence and 3ft Potholes on Ring Road Km 14',
        description: 'Heavy mining trucks caused cratering of asphalt surface causing recurrent vehicle accidents.',
        category: 'roads',
        district: 'Dhanbad',
        priority: 'HIGH',
        isStarred: false,
        aiAnalysisReason: 'Standard road infrastructure maintenance; routine municipal asphalt patching required.',
        status: 'pending_super_admin_review',
        citizenName: 'Anita Soren',
        createdAt: new Date().toISOString()
      },
      {
        id: 'iss-3920',
        trackingCode: 'JH-2026-WST-3920',
        title: 'Solid Waste Dumping & Open Garbage Burning Near Middle School',
        description: 'Solid municipal waste piled over 200 meters near school compound releasing toxic smoke.',
        category: 'waste_management',
        district: 'Ranchi',
        priority: 'MEDIUM',
        isStarred: false,
        aiAnalysisReason: 'Municipal waste clearing and garbage truck dispatch needed within 24h SLA.',
        status: 'pending_super_admin_review',
        citizenName: 'Manoj Tirkey',
        createdAt: new Date().toISOString()
      }
    ];
    localStorage.setItem('civic_issues_v2', JSON.stringify(seed));
    return seed;
  },

  saveIssues(issues) {
    localStorage.setItem('civic_issues_v2', JSON.stringify(issues));
  },

  updateIssueStatus(id, newStatus, extra = {}) {
    const issues = this.getIssues();
    const target = issues.find(i => i.id === id || i.trackingCode === id);
    if (target) {
      target.status = newStatus;
      Object.assign(target, extra);
      this.saveIssues(issues);
    }
    return target;
  }
};

window.CivicDB = CivicDB;
