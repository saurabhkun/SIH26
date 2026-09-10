/**
 * CivicResolve Client Data Service & Persistence
 * Government of Jharkhand
 */
const CivicDB = {
  getIssues() {
    try {
      const stored = localStorage.getItem('civic_issues_v4');
      if (stored) return JSON.parse(stored);
    } catch (_) {}

    const seed = [
      {
        id: 'iss-8841',
        trackingCode: 'CR-JH-8841A1',
        title: 'Drinking Water & Handpumps (पीने का पानी / नल / चापाकल)',
        description: 'Spectroscopic water testing indicates fluoride level > 4.2 mg/L across 450 households in Garhwa block.',
        category: 'water',
        categoryEnglish: 'Drinking Water & Handpumps',
        categoryHindi: 'पीने का पानी / नल / चापाकल',
        district: 'Garhwa',
        priority: 'Normal',
        status: 'Allocated',
        stage: 'Allocated',
        progress: 60,
        responsibleNodalLead: 'Dr. Arvind Kumar (DWSD)',
        assignedOrg: 'BIT Mesra Environmental Lab',
        updatedTimestamp: new Date(Date.now() - 3600000 * 4).toISOString(),
        citizenName: 'Rameshwar Oraon',
        createdAt: new Date(Date.now() - 86400000 * 2).toISOString()
      },
      {
        id: 'iss-1049',
        trackingCode: 'CR-JH-1049B2',
        title: 'Mine Dust & Pollution (खदान का धुआं और काला कचरा)',
        description: 'High particulate matter from open-cast coal transport creating airborne emissions along residential corridor.',
        category: 'mining_dust',
        categoryEnglish: 'Mine Dust & Pollution',
        categoryHindi: 'खदान का धुआं और काला कचरा',
        district: 'Dhanbad',
        priority: 'Normal',
        status: 'In Progress',
        stage: 'In Progress',
        progress: 80,
        responsibleNodalLead: 'Sanjay Chatterjee (CSR Lead)',
        assignedOrg: 'CSIR-CIMFR Dhanbad Central Lab',
        updatedTimestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
        citizenName: 'Anita Soren',
        createdAt: new Date(Date.now() - 86400000 * 3).toISOString()
      },
      {
        id: 'iss-3920',
        trackingCode: 'CR-JH-3920C3',
        title: 'School & Classroom Facilities (स्कूल की छत, बिजली व शौचालय)',
        description: 'Primary school roof requires structural waterproofing and electrical rewiring before monsoon.',
        category: 'education',
        categoryEnglish: 'School & Classroom Facilities',
        categoryHindi: 'स्कूल की छत, बिजली व शौचालय',
        district: 'Ranchi',
        priority: 'Normal',
        status: 'Reported',
        stage: 'Reported',
        progress: 20,
        responsibleNodalLead: 'State Apex Triage Desk',
        assignedOrg: 'Department of School Education & Literacy',
        updatedTimestamp: new Date(Date.now() - 3600000 * 6).toISOString(),
        citizenName: 'Manoj Tirkey',
        createdAt: new Date(Date.now() - 86400000 * 1).toISOString()
      },
      {
        id: 'iss-5512',
        trackingCode: 'CR-JH-5512D4',
        title: 'Farm Water & Irrigation (खेत की सिंचाई / सूखा)',
        description: 'Canal sluice gate breach impacting 200 hectares of agricultural land requiring automated IoT gate.',
        category: 'irrigation',
        categoryEnglish: 'Farm Water & Irrigation',
        categoryHindi: 'खेत की सिंचाई / सूखा',
        district: 'Palamu',
        priority: 'Normal',
        status: 'Under Review / Triage',
        stage: 'Under Review / Triage',
        progress: 40,
        responsibleNodalLead: 'Sri Sunil Kumar, IAS',
        assignedOrg: 'Birsa Agricultural University (BAU)',
        updatedTimestamp: new Date(Date.now() - 3600000 * 8).toISOString(),
        citizenName: 'Birsa Munda',
        createdAt: new Date(Date.now() - 86400000 * 2).toISOString()
      },
      {
        id: 'iss-6721',
        trackingCode: 'CR-JH-6721E5',
        title: 'Anganwadi & Child Nutrition (आंगनवाड़ी / बच्चों का पौष्टिक राशन)',
        description: 'Supplementary nutrition supply chain distribution restored and cold storage verified.',
        category: 'nutrition',
        categoryEnglish: 'Anganwadi & Child Nutrition',
        categoryHindi: 'आंगनवाड़ी / बच्चों का पौष्टिक राशन',
        district: 'Dumka',
        priority: 'Normal',
        status: 'Resolved',
        stage: 'Resolved',
        progress: 100,
        responsibleNodalLead: 'Dumka District Nodal Team',
        assignedOrg: 'State Child Nutrition Taskforce',
        updatedTimestamp: new Date(Date.now() - 3600000 * 12).toISOString(),
        citizenName: 'Poonam Devi',
        createdAt: new Date(Date.now() - 86400000 * 5).toISOString()
      }
    ];

    try {
      localStorage.setItem('civic_issues_v4', JSON.stringify(seed));
    } catch (_) {}
    return seed;
  },

  saveIssues(issues) {
    try {
      localStorage.setItem('civic_issues_v4', JSON.stringify(issues));
    } catch (_) {}
  },

  save() {
    this.saveIssues(this.getIssues());
  },

  addIssue(issue) {
    const issues = this.getIssues();
    const hexSuffix = Math.random().toString(16).substring(2, 8).toUpperCase();
    const newIssue = {
      id: 'iss-' + hexSuffix,
      trackingCode: `CR-JH-${hexSuffix}`,
      stage: 'Reported',
      status: 'Reported',
      progress: 20,
      responsibleNodalLead: 'State Apex Triage Desk',
      assignedOrg: 'Pending Allocation',
      updatedTimestamp: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      ...issue
    };
    issues.unshift(newIssue);
    this.saveIssues(issues);
    return newIssue;
  },

  updateIssueStatus(id, newStatus, extra = {}) {
    const issues = this.getIssues();
    const target = issues.find(i => i.id === id || i.trackingCode === id);
    if (target) {
      target.status = newStatus;
      if (newStatus === 'Reported') {
        target.stage = 'Reported';
        target.progress = 20;
      } else if (newStatus === 'Under Review / Triage' || newStatus === 'Triage / Accepted') {
        target.stage = 'Under Review / Triage';
        target.progress = 40;
      } else if (newStatus === 'Allocated') {
        target.stage = 'Allocated';
        target.progress = 60;
      } else if (newStatus === 'In Progress' || newStatus === 'In Progress / Field Work') {
        target.stage = 'In Progress';
        target.progress = 80;
      } else if (newStatus === 'Resolved') {
        target.stage = 'Resolved';
        target.progress = 100;
      }
      target.updatedTimestamp = new Date().toISOString();
      Object.assign(target, extra);
      this.saveIssues(issues);
    }
    return target;
  }
};

window.CivicDB = CivicDB;
