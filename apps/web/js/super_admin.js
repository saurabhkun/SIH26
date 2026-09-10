/**
 * CivicResolve Super Admin Portal Logic & Master Triage State Machine
 */
document.addEventListener('DOMContentLoaded', () => {
  const session = CivicAuth.requireAuth(['super_admin']);
  if (!session) return;

  // Set user badge
  const userDisplay = document.getElementById('user-display');
  if (userDisplay) userDisplay.textContent = session.name + ' (' + session.designation + ')';

  // State
  let currentTab = 'triage';
  let activeFilter = 'all';

  const DEPARTMENTS = [
    { id: 'pwd_roads', name: 'Public Works Dept (PWD - Roads)', cat: 'roads' },
    { id: 'dwsd_water', name: 'Drinking Water & Sanitation Dept (DWSD)', cat: 'water_sewage' },
    { id: 'urban_waste', name: 'Urban Development & Solid Waste Management', cat: 'waste_management' },
    { id: 'juvnl_power', name: 'Jharkhand Urja Vikas Nigam (JUVNL - Streetlights)', cat: 'electricity_streetlights' }
  ];

  function renderStats() {
    const issues = CivicDB.getIssues();
    const pending = issues.filter(i => i.status === 'pending_super_admin_review').length;
    const accepted = issues.filter(i => i.status === 'accepted').length;
    const dept = issues.filter(i => i.status === 'assigned_to_govt_dept').length;
    const rejected = issues.filter(i => i.status === 'rejected').length;

    const elTotal = document.getElementById('stat-total');
    const elPending = document.getElementById('stat-pending');
    const elAccepted = document.getElementById('stat-accepted');
    const elDept = document.getElementById('stat-dept');
    const elRejected = document.getElementById('stat-rejected');

    if (elTotal) elTotal.textContent = issues.length;
    if (elPending) elPending.textContent = pending;
    if (elAccepted) elAccepted.textContent = accepted;
    if (elDept) elDept.textContent = dept;
    if (elRejected) elRejected.textContent = rejected;
  }

  function renderTriageQueue() {
    const container = document.getElementById('triage-list');
    if (!container) return;

    const issues = CivicDB.getIssues();
    const filtered = issues.filter(i => {
      if (activeFilter === 'all') return true;
      return i.status === activeFilter;
    });

    if (filtered.length === 0) {
      container.innerHTML = '<div class="card" style="text-align:center; color:var(--text-secondary); padding:2rem;">No complaints found for this status.</div>';
      return;
    }

    container.innerHTML = filtered.map(issue => `
      <div class="card" style="margin-bottom: 1rem; border-left: 4px solid ${
        issue.status === 'accepted' ? 'var(--status-accepted)' :
        issue.status === 'assigned_to_govt_dept' ? 'var(--status-dept)' :
        issue.status === 'rejected' ? 'var(--status-rejected)' : 'var(--status-pending)'
      }">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem; flex-wrap:wrap; gap:0.5rem;">
          <div style="display:flex; align-items:center; gap:0.5rem;">
            <strong style="font-family:monospace; color:var(--brand-primary);">${issue.trackingCode}</strong>
            ${issue.isStarred ? '<span class="badge badge-star">★ AI Priority Flag</span>' : ''}
            <span class="badge badge-${
              issue.status === 'accepted' ? 'accepted' :
              issue.status === 'assigned_to_govt_dept' ? 'dept' :
              issue.status === 'rejected' ? 'rejected' : 'pending'
            }">${issue.status.replace(/_/g, ' ')}</span>
          </div>
          <span style="font-size:0.75rem; color:var(--text-secondary);">${issue.district} &bull; ${issue.category}</span>
        </div>

        <h3 style="margin-bottom:0.4rem; font-size:1.1rem;">${issue.title}</h3>
        <p style="font-size:0.85rem; color:var(--text-secondary); margin-bottom:0.75rem;">${issue.description}</p>

        ${issue.aiAnalysisReason ? `
          <div style="background:rgba(217,119,6,0.1); border:1px solid rgba(217,119,6,0.3); border-radius:8px; padding:0.6rem; font-size:0.8rem; margin-bottom:0.75rem; color:var(--text-primary);">
            <strong>🤖 Gemini AI Technical Triage:</strong> ${issue.aiAnalysisReason}
          </div>
        ` : ''}

        ${issue.status === 'pending_super_admin_review' ? `
          <div style="display:flex; gap:0.5rem; flex-wrap:wrap; margin-top:0.75rem; padding-top:0.75rem; border-top:1px solid var(--border-color);">
            <button class="btn btn-success" onclick="acceptIssue('${issue.id}')">✓ Accept (Research Org Portal)</button>
            <button class="btn btn-primary" onclick="routeToDept('${issue.id}', '${issue.category}')">🏢 Route to Govt Dept Maintenance</button>
            <button class="btn btn-danger" onclick="promptReject('${issue.id}')">✕ Reject Complaint</button>
          </div>
        ` : `
          <div style="font-size:0.75rem; color:var(--text-secondary); margin-top:0.5rem; border-top:1px dashed var(--border-color); padding-top:0.4rem;">
            ${issue.status === 'accepted' ? '✓ Accepted and published to Public Verified Directory & Research Organization Portal.' :
              issue.status === 'assigned_to_govt_dept' ? `✓ Dispatched to ${issue.assignedDepartment || 'Govt Maintenance'} queue.` :
              `✕ Rejected with reason: "${issue.rejectionReason || 'Filtered by Super Admin'}"`}
          </div>
        `}
      </div>
    `).join('');
  }

  window.acceptIssue = function(id) {
    CivicDB.updateIssueStatus(id, 'accepted', {
      reviewedBy: session.name,
      acceptedAt: new Date().toISOString()
    });
    renderStats();
    renderTriageQueue();
    alert('✓ Issue accepted! Added to Global Verified Directory & visible in Research Organization Portal.');
  };

  window.routeToDept = function(id, category) {
    const dept = DEPARTMENTS.find(d => d.cat === category) || DEPARTMENTS[0];
    CivicDB.updateIssueStatus(id, 'assigned_to_govt_dept', {
      assignedDepartment: dept.name,
      reviewedBy: session.name,
      dispatchedAt: new Date().toISOString()
    });
    renderStats();
    renderTriageQueue();
    alert('✓ Issue routed directly to ' + dept.name + ' maintenance queue!');
  };

  window.promptReject = function(id) {
    const reasons = [
      '1. Duplicate / already under active repair',
      '2. Out of administrative state jurisdiction',
      '3. Spam or fraudulent photo evidence',
      '4. Private civil property dispute'
    ];
    const choice = prompt('Select Rejection Reason:\n' + reasons.join('\n') + '\n\nEnter reason text:');
    if (choice) {
      CivicDB.updateIssueStatus(id, 'rejected', {
        rejectionReason: choice,
        reviewedBy: session.name,
        rejectedAt: new Date().toISOString()
      });
      renderStats();
      renderTriageQueue();
    }
  };

  window.filterStatus = function(status) {
    activeFilter = status;
    renderTriageQueue();
  };

  // Initial render
  renderStats();
  renderTriageQueue();
});
