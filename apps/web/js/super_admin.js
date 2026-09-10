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

  // 5-Factor Deterministic Institutional Routing Evaluation Engine
  function evaluateRoutingDestination(issue) {
    const domain = (issue.domain || issue.category || '').toLowerCase();
    const text = ((issue.title || '') + ' ' + (issue.description || '') + ' ' + domain).toLowerCase();

    // 1. Sensitivity
    let sensitivityLevel = 'Public';
    if (text.includes('security') || text.includes('defense') || text.includes('classified') || text.includes('border')) {
      sensitivityLevel = 'Security Sensitive';
    } else if (text.includes('policy') || text.includes('land acquisition') || text.includes('statutory audit') || text.includes('cabinet')) {
      sensitivityLevel = 'Policy Sensitive';
    }
    const isSensitive = sensitivityLevel !== 'Public';

    // 2. State RO Presence
    const govtDomains = ['roads', 'water_sewage', 'waste_management', 'electricity_streetlights', 'urban'];
    const existingGovtRO = govtDomains.some(d => domain.includes(d));

    // 3. Dedicated Budget
    const hasDedicatedBudget = text.includes('pothole') || text.includes('streetlight') || text.includes('pipe') || text.includes('garbage');

    // 4. State RO Load
    const govtCapacityStatus = 'Available';

    // 5. University Capability Matching
    const empaneledUniversities = [
      { name: 'BIT Mesra - Environmental Lab', domains: ['water', 'water_sewage', 'waste_management', 'environment'], score: 0.95 },
      { name: 'NIT Jamshedpur - Civil Dept', domains: ['roads', 'infrastructure', 'civil', 'mining'], score: 0.92 },
      { name: 'IIT (ISM) Dhanbad - Mining & Clean Energy', domains: ['mining', 'environment', 'air'], score: 0.96 },
      { name: 'Birsa Agri University (BAU) - Soil & Agritech', domains: ['farming', 'agriculture', 'livelihood'], score: 0.88 }
    ];

    const matchedUnis = empaneledUniversities.filter(u => u.domains.some(d => domain.includes(d)));
    const uniScore = matchedUnis.length > 0 ? matchedUnis[0].score : 0.60;
    const eligibleUnis = matchedUnis.map(u => u.name);

    // Decision Logic
    if (isSensitive) {
      return {
        routingDecision: 'GOVT_DEPT',
        confidenceScore: 0.98,
        factors: { isSensitive: true, sensitivityLevel, existingGovtRO, hasDedicatedBudget, govtCapacityStatus, eligibleUniversities: eligibleUnis },
        rationale: `Retained under Government control: Issue classified as "${sensitivityLevel}" which statutory governance mandates retaining within sovereign departmental jurisdiction.`
      };
    }

    if (hasDedicatedBudget && existingGovtRO) {
      return {
        routingDecision: 'GOVT_DEPT',
        confidenceScore: 0.94,
        factors: { isSensitive: false, sensitivityLevel, existingGovtRO, hasDedicatedBudget, govtCapacityStatus, eligibleUniversities: eligibleUnis },
        rationale: 'Retained by Government Department: Active departmental fiscal budget exists and issue requires standard statutory enforcement / municipal maintenance.'
      };
    }

    if ((!hasDedicatedBudget || !existingGovtRO) && uniScore >= 0.70 && eligibleUnis.length > 0) {
      return {
        routingDecision: 'UNIVERSITY_RESEARCH_ORG',
        confidenceScore: uniScore,
        factors: { isSensitive: false, sensitivityLevel, existingGovtRO, hasDedicatedBudget, govtCapacityStatus, eligibleUniversities: eligibleUnis },
        rationale: `Allocated to Academic Research Organization: Unbudgeted exploratory civic challenge requiring academic R&D or CSR co-funding. Matched with ${eligibleUnis.join(', ')} (${(uniScore * 100).toFixed(0)}% capability alignment).`
      };
    }

    return {
      routingDecision: existingGovtRO ? 'GOVT_RO' : 'GOVT_DEPT',
      confidenceScore: 0.85,
      factors: { isSensitive: false, sensitivityLevel, existingGovtRO, hasDedicatedBudget, govtCapacityStatus, eligibleUniversities: eligibleUnis },
      rationale: `Retained under Government oversight: Retained under State Nodal authority.`
    };
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

    container.innerHTML = filtered.map(issue => {
      const rec = evaluateRoutingDestination(issue);
      const decisionBadge =
        rec.routingDecision === 'UNIVERSITY_RESEARCH_ORG' ? '🎓 Academic Research Org' :
        rec.routingDecision === 'GOVT_DEPT' ? '🏢 Govt Dept Maintenance' : '🔬 State Research Org (RO)';

      return `
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

        <!-- Smart Routing Matrix Card -->
        <div class="smart-routing-matrix" style="background:var(--bg-surface); border:1px solid var(--border-color); border-radius:10px; padding:0.9rem; margin-bottom:0.85rem; font-size:0.8rem;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.6rem; flex-wrap:wrap; gap:0.4rem;">
            <div style="display:flex; align-items:center; gap:0.4rem;">
              <span style="font-size:1.1rem;">🏛️</span>
              <strong style="color:var(--brand-primary); font-size:0.9rem;">Smart Routing Matrix</strong>
              <span style="font-weight:700; background:rgba(37,99,235,0.1); color:var(--brand-primary); padding:0.15rem 0.5rem; border-radius:12px; font-size:0.75rem;">
                ${(rec.confidenceScore * 100).toFixed(0)}% Score
              </span>
            </div>
            <span style="font-weight:700; background:${rec.routingDecision === 'UNIVERSITY_RESEARCH_ORG' ? 'rgba(147,51,234,0.1)' : 'rgba(16,185,129,0.1)'}; color:${rec.routingDecision === 'UNIVERSITY_RESEARCH_ORG' ? '#7e22ce' : '#047857'}; padding:0.25rem 0.65rem; border-radius:6px; font-size:0.75rem; border:1px solid ${rec.routingDecision === 'UNIVERSITY_RESEARCH_ORG' ? '#c084fc' : '#6ee7b7'};">
              ${decisionBadge}
            </span>
          </div>

          <!-- 4 Interactive Toggle Chips / Scores -->
          <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(170px, 1fr)); gap:0.4rem; margin-bottom:0.6rem;">
            <div style="padding:0.4rem 0.6rem; border-radius:6px; border:1px solid var(--border-color); background:var(--bg-primary);">
              <span style="font-size:0.68rem; color:var(--text-secondary); display:block;">Security/Policy</span>
              <strong style="font-size:0.75rem; color:${rec.factors.isSensitive ? '#e11d48' : 'var(--text-primary)'};">
                ${rec.factors.isSensitive ? 'Sensitive: Yes 🛑' : 'Sensitive: No ✓'}
              </strong>
            </div>

            <div style="padding:0.4rem 0.6rem; border-radius:6px; border:1px solid var(--border-color); background:var(--bg-primary);">
              <span style="font-size:0.68rem; color:var(--text-secondary); display:block;">Annual Scheme Budget</span>
              <strong style="font-size:0.75rem; color:${rec.factors.hasDedicatedBudget ? '#059669' : 'var(--text-primary)'};">
                ${rec.factors.hasDedicatedBudget ? 'Allocated ✓' : 'None / Grant ✕'}
              </strong>
            </div>

            <div style="padding:0.4rem 0.6rem; border-radius:6px; border:1px solid var(--border-color); background:var(--bg-primary);">
              <span style="font-size:0.68rem; color:var(--text-secondary); display:block;">Govt Lab Capacity</span>
              <strong style="font-size:0.75rem; color:${rec.factors.govtCapacityStatus === 'High / Saturated' ? '#d97706' : '#059669'};">
                ${rec.factors.govtCapacityStatus === 'High / Saturated' ? 'Saturated ⚠️' : 'Optimal ✓'}
              </strong>
            </div>

            <div style="padding:0.4rem 0.6rem; border-radius:6px; border:1px solid var(--border-color); background:var(--bg-primary);">
              <span style="font-size:0.68rem; color:var(--text-secondary); display:block;">Capable University Labs</span>
              <strong style="font-size:0.75rem; color:${rec.factors.eligibleUniversities.length > 0 ? '#2563eb' : 'var(--text-secondary)'};">
                ${rec.factors.eligibleUniversities.length > 0 ? `Found (${rec.factors.eligibleUniversities.length})` : 'None'}
              </strong>
            </div>
          </div>

          <div style="background:var(--bg-primary); border:1px solid var(--border-color); border-radius:6px; padding:0.5rem 0.7rem; font-size:0.75rem; color:var(--text-secondary); line-height:1.4; margin-bottom:0.6rem;">
            <strong style="color:var(--text-primary);">Decision Rationale:</strong> ${rec.rationale}
          </div>

          ${issue.status === 'pending_super_admin_review' ? `
            <div style="margin-top:0.6rem; padding-top:0.6rem; border-top:1px dashed var(--border-color);">
              ${rec.routingDecision === 'UNIVERSITY_RESEARCH_ORG' ? `
                <div style="margin-bottom:0.5rem;">
                  <label style="display:block; font-size:0.72rem; font-weight:700; margin-bottom:0.25rem; color:var(--text-secondary);">
                    Matched Capable Colleges (Multi-Select):
                  </label>
                  <select id="college-select-${issue.id}" multiple style="width:100%; font-size:0.75rem; padding:0.3rem; border-radius:6px; border:1px solid var(--border-color); background:var(--bg-primary); color:var(--text-primary); height:60px;">
                    ${rec.factors.eligibleUniversities.map(u => `<option value="${u}" selected>${u}</option>`).join('')}
                  </select>
                </div>
                <button class="btn btn-primary" onclick="allocateToAcademia('${issue.id}')" style="width:100%; padding:0.6rem; font-size:0.82rem; font-weight:700; background:linear-gradient(135deg, #7e22ce, #4f46e5); color:#fff; border:none; border-radius:8px; cursor:pointer;">
                  🎓 Allocate to Empaneled University / Research Org &rarr;
                </button>
              ` : `
                <button class="btn btn-success" onclick="dispatchToGovt('${issue.id}', '${issue.category}')" style="width:100%; padding:0.6rem; font-size:0.82rem; font-weight:700; background:#047857; color:#fff; border:none; border-radius:8px; cursor:pointer;">
                  🏢 Confirm Dispatch to Govt Dept / State RO &rarr;
                </button>
              `}
            </div>
          ` : ''}
        </div>

        ${issue.aiAnalysisReason ? `
          <div style="background:rgba(217,119,6,0.1); border:1px solid rgba(217,119,6,0.3); border-radius:8px; padding:0.6rem; font-size:0.8rem; margin-bottom:0.75rem; color:var(--text-primary);">
            <strong>🤖 Gemini AI Technical Triage:</strong> ${issue.aiAnalysisReason}
          </div>
        ` : ''}

        ${issue.status === 'pending_super_admin_review' ? `
          <div style="display:flex; gap:0.4rem; flex-wrap:wrap; margin-top:0.6rem; padding-top:0.6rem; border-top:1px solid var(--border-color);">
            <button class="btn btn-secondary" onclick="routeToDept('${issue.id}', '${issue.category}')" style="font-size:0.75rem; padding:0.35rem 0.7rem;">Manual Dept Route</button>
            <button class="btn btn-secondary" onclick="acceptIssue('${issue.id}')" style="font-size:0.75rem; padding:0.35rem 0.7rem;">Manual RO Accept</button>
            <button class="btn btn-danger" onclick="promptReject('${issue.id}')" style="font-size:0.75rem; padding:0.35rem 0.7rem;">✕ Reject</button>
          </div>
        ` : `
          <div style="font-size:0.75rem; color:var(--text-secondary); margin-top:0.5rem; border-top:1px dashed var(--border-color); padding-top:0.4rem;">
            ${issue.status === 'accepted' ? '✓ Accepted and published to Public Verified Directory & Research Organization Portal.' :
              issue.status === 'assigned_to_govt_dept' ? `✓ Dispatched to ${issue.assignedDepartment || 'Govt Maintenance'} queue.` :
              `✕ Rejected with reason: "${issue.rejectionReason || 'Filtered by Super Admin'}"`}
          </div>
        `}
      </div>
    `;
    }).join('');
  }

  window.allocateToAcademia = function(id) {
    const select = document.getElementById('college-select-' + id);
    const selectedColleges = select ? Array.from(select.selectedOptions).map(o => o.value) : [];
    const issue = CivicDB.getIssues().find(i => i.id === id);

    CivicDB.updateIssueStatus(id, 'accepted', {
      reviewedBy: `${session.name} (Smart Routing Engine)`,
      assignedColleges: selectedColleges,
      triageRationale: `Allocated to ${selectedColleges.join(', ') || 'Empaneled Universities'} for grassroots R&D.`,
      acceptedAt: new Date().toISOString()
    });

    alert(`✓ Issue ${issue ? issue.trackingCode : id} allocated to Empaneled Universities:\n${selectedColleges.join('\n') || 'Academic Consortium'}`);
    renderStats();
    renderTriageQueue();
  };

  window.dispatchToGovt = function(id, category) {
    const dept = DEPARTMENTS.find(d => d.cat === category) || DEPARTMENTS[0];
    const issue = CivicDB.getIssues().find(i => i.id === id);

    CivicDB.updateIssueStatus(id, 'assigned_to_govt_dept', {
      assignedDepartment: dept.name,
      reviewedBy: `${session.name} (Smart Routing Engine)`,
      triageRationale: `Dispatched to ${dept.name} for statutory enforcement.`,
      dispatchedAt: new Date().toISOString()
    });

    alert(`✓ Issue ${issue ? issue.trackingCode : id} dispatched to ${dept.name} maintenance queue!`);
    renderStats();
    renderTriageQueue();
  };

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
