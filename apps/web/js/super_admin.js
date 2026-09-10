/**
 * CivicResolve Super Admin Portal Logic & Master Triage State Machine
 * Government of Jharkhand
 */

const STATE_DEPARTMENTS = [
  { name: 'Department of Agriculture, Animal Husbandry & Co-operative', code: 'AGRI_AHC', domain: 'Agriculture & Livelihood' },
  { name: 'Department of Building Construction', code: 'BLDG_CONST', domain: 'Public Works & Civil Infrastructure' },
  { name: 'Department of Drinking Water and Sanitation', code: 'DWSD', domain: 'Water Supply & Public Sanitation' },
  { name: 'Department of Energy', code: 'ENERGY_DEPT', domain: 'Power Distribution & Renewable Energy' },
  { name: 'Department of Forest, Environment & Climate Change', code: 'FOREST_ENV', domain: 'Forest Conservation & Pollution Control' },
  { name: 'Department of Health, Medical Education & Family Welfare', code: 'HEALTH_FW', domain: 'Public Health & Medical Infrastructure' },
  { name: 'Department of Higher and Technical Education', code: 'DHTE', domain: 'Higher Education & Technical Innovation' },
  { name: 'Department of Mines & Geology', code: 'MINES_GEOL', domain: 'Mining Regulations & Mineral Resources' },
  { name: 'Department of Road Construction', code: 'ROAD_CONST', domain: 'Highways & PWD Arterial Roadways' },
  { name: 'Department of Rural Development', code: 'RURAL_DEV', domain: 'Rural Infrastructure & Poverty Alleviation' },
  { name: 'Department of Rural Works', code: 'RURAL_WORKS', domain: 'Rural Connectivity & Village Roads' },
  { name: 'Department of School Education & Literacy', code: 'SCHOOL_EDU', domain: 'Primary & Secondary Education' },
  { name: 'Department of Urban Development & Housing', code: 'UDHD', domain: 'Municipal Governance & Solid Waste' },
  { name: 'Department of Water Resources', code: 'WATER_RES', domain: 'Dams, Canals & Irrigation Systems' },
  { name: 'Department of Women, Child Development & Social Security', code: 'WCD_SS', domain: 'Anganwadi & Social Safety Nets' }
];

const STATE_INSTITUTIONS = [
  { name: 'CSIR - Central Institute of Mining and Fuel Research (CIMFR), Dhanbad', code: 'CSIR_CIMFR', type: 'Govt Research Lab', district: 'Dhanbad' },
  { name: 'Central Tasar Research and Training Institute (CTRTI), Ranchi', code: 'CTRTI', type: 'Govt Research Lab', district: 'Ranchi' },
  { name: 'ICAR - Indian Institute of Agricultural Biotechnology (IIAB), Ranchi', code: 'ICAR_IIAB', type: 'Govt Research Lab', district: 'Ranchi' },
  { name: 'SAIL Research and Development Centre for Iron and Steel (RDCIS), Ranchi', code: 'SAIL_RDCIS', type: 'Govt Research Lab', district: 'Ranchi' },
  { name: 'IIT (ISM) Dhanbad', code: 'IIT_ISM', type: 'Institute of National Importance', district: 'Dhanbad' },
  { name: 'NIT Jamshedpur', code: 'NIT_JSR', type: 'Institute of National Importance', district: 'East Singhbhum' },
  { name: 'BIT Mesra, Ranchi', code: 'BIT_MESRA', type: 'Empaneled HEI & Lab', district: 'Ranchi' },
  { name: 'Birsa Agricultural University (BAU), Ranchi', code: 'BAU', type: 'State University', district: 'Ranchi' },
  { name: 'Jharkhand University of Technology (JUT), Ranchi', code: 'JUT', type: 'State University', district: 'Ranchi' },
  { name: 'Ranchi University, Ranchi', code: 'RU', type: 'State University', district: 'Ranchi' },
  { name: 'RIMS Ranchi', code: 'RIMS', type: 'Medical College', district: 'Ranchi' }
];

let activeFilter = 'all';

document.addEventListener('DOMContentLoaded', () => {
  const session = CivicAuth?.requireAuth(['super_admin']);
  if (!session) return;

  const userDisplay = document.getElementById('user-display');
  if (userDisplay) userDisplay.textContent = `${session.name} (${session.designation})`;

  renderStats();
  renderTriageQueue();
  renderProjectTracking();
  renderDirectory();
});

function renderStats() {
  const issues = CivicDB?.getIssues() || [];
  const pending = issues.filter(i => i.status === 'Reported' || i.status === 'Under Review / Triage' || i.status === 'pending_super_admin_review').length;
  const accepted = issues.filter(i => i.status === 'Triage / Accepted' || i.status === 'Accepted_Govt_RO' || i.status === 'accepted').length;
  const dept = issues.filter(i => i.status === 'Allocated' || i.status === 'Assigned_Govt_Dept' || i.status === 'In Progress').length;
  const resolved = issues.filter(i => i.status === 'Resolved' || i.status === 'resolved').length;

  const elTotal = document.getElementById('stat-total');
  const elPending = document.getElementById('stat-pending');
  const elAccepted = document.getElementById('stat-accepted');
  const elDept = document.getElementById('stat-dept');
  const elResolved = document.getElementById('stat-resolved');

  if (elTotal) elTotal.textContent = issues.length;
  if (elPending) elPending.textContent = pending;
  if (elAccepted) elAccepted.textContent = accepted;
  if (elDept) elDept.textContent = dept;
  if (elResolved) elResolved.textContent = resolved;
}

window.filterStatus = function(status) {
  activeFilter = status;
  document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
  if (window.event?.target) window.event.target.classList.add('active');
  renderTriageQueue();
};

function renderTriageQueue() {
  const container = document.getElementById('triage-list');
  if (!container) return;

  const issues = CivicDB?.getIssues() || [];
  const filtered = issues.filter(i => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'Reported') return i.status === 'Reported' || i.status === 'pending_super_admin_review';
    if (activeFilter === 'Under Review / Triage') return i.status === 'Under Review / Triage' || i.status === 'Triage / Accepted';
    if (activeFilter === 'Allocated') return i.status === 'Allocated';
    if (activeFilter === 'In Progress') return i.status === 'In Progress';
    if (activeFilter === 'Resolved') return i.status === 'Resolved';
    return i.status === activeFilter;
  });

  if (filtered.length === 0) {
    container.innerHTML = '<div class="card" style="text-align:center; color:#64748b; padding:2rem; background:#ffffff;">No grievances found under this filter.</div>';
    return;
  }

  container.innerHTML = filtered.map(issue => {
    const isPending = issue.status === 'Reported' || issue.status === 'Under Review / Triage';

    return `
    <div class="card" style="margin-bottom: 1rem; background:#ffffff; border:1px solid #e2e8f0; border-radius:12px; padding:1.25rem; border-left: 4px solid ${
      issue.status === 'Resolved' ? '#10b981' :
      issue.status === 'In Progress' ? '#0284c7' :
      issue.status === 'Allocated' ? '#6366f1' :
      issue.status === 'Under Review / Triage' ? '#059669' : '#d97706'
    };">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem; flex-wrap:wrap; gap:0.5rem;">
        <div style="display:flex; align-items:center; gap:0.5rem;">
          <strong style="font-family:monospace; color:#274c77; font-size:0.95rem;">${issue.trackingCode}</strong>
          <span class="badge" style="background:#f1f5f9; color:#334155; border:1px solid #cbd5e1; font-weight:700; font-size:0.75rem; padding:0.15rem 0.5rem; border-radius:4px;">${issue.status}</span>
        </div>
        <span style="font-size:0.75rem; color:#64748b; font-weight:600;">${issue.district} &bull; ${issue.categoryEnglish || issue.category}</span>
      </div>

      <h3 style="margin-bottom:0.4rem; font-size:1.1rem; color:#0f172a; font-family:'Source Serif 4', Georgia, serif; font-weight:700;">${issue.title}</h3>
      <p style="font-size:0.85rem; color:#475569; margin-bottom:0.75rem; line-height:1.4;">${issue.description}</p>

      ${issue.assignedOrg ? `
        <div style="background:#f0fdf4; border:1px solid #bbf7d0; color:#166534; padding:0.4rem 0.75rem; border-radius:6px; font-size:0.78rem; margin-bottom:0.75rem;">
          🏛️ <strong>Assigned Lead:</strong> ${issue.assignedOrg} &bull; Nodal: ${issue.responsibleNodalLead || 'State Desk'}
        </div>
      ` : ''}

      ${isPending ? `
        <div style="display:flex; gap:0.5rem; flex-wrap:wrap; border-top:1px dashed #cbd5e1; padding-top:0.75rem;">
          <button onclick="updateTriageStatus('${issue.id}', 'Allocated', 'Department of Drinking Water & Sanitation')" style="padding:0.45rem 0.85rem; font-size:0.78rem; font-weight:700; background:#0284c7; color:#fff; border:none; border-radius:6px; cursor:pointer;">
            🏢 Allocate to Dept Maintenance
          </button>
          <button onclick="updateTriageStatus('${issue.id}', 'Allocated', 'BIT Mesra Innovation Cell')" style="padding:0.45rem 0.85rem; font-size:0.78rem; font-weight:700; background:#7e22ce; color:#fff; border:none; border-radius:6px; cursor:pointer;">
            🔬 Assign to Research Org
          </button>
          <button onclick="updateTriageStatus('${issue.id}', 'In Progress', 'CSIR-CIMFR Central Lab')" style="padding:0.45rem 0.85rem; font-size:0.78rem; font-weight:700; background:#059669; color:#fff; border:none; border-radius:6px; cursor:pointer;">
            ⚡ Fast-Track Field Work
          </button>
        </div>
      ` : ''}
    </div>
    `;
  }).join('');
}

window.updateTriageStatus = function(issueId, newStatus, assignedOrg) {
  CivicDB?.updateIssueStatus(issueId, newStatus, { assignedOrg });
  renderStats();
  renderTriageQueue();
  renderProjectTracking();
  alert(`✓ Status updated to "${newStatus}" for issue.`);
};

// Universal Project Tracking Section (Timeline: Reported -> Under Review / Triage -> Allocated -> In Progress -> Resolved)
const FLOW_STAGES = ['Reported', 'Under Review / Triage', 'Allocated', 'In Progress', 'Resolved'];

function renderProjectTracking() {
  const container = document.getElementById('project-tracking-list');
  if (!container) return;

  const issues = CivicDB?.getIssues() || [];
  container.innerHTML = issues.map(item => {
    const curStage = item.stage || item.status || 'Reported';
    const pct = item.progress || (curStage === 'Resolved' ? 100 : curStage === 'In Progress' ? 80 : curStage === 'Allocated' ? 60 : curStage === 'Under Review / Triage' ? 40 : 20);

    return `
      <div style="border:1px solid #e2e8f0; border-radius:10px; padding:1.2rem; background:#ffffff; box-shadow:0 1px 3px rgba(0,0,0,0.03);">
        <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:0.75rem; flex-wrap:wrap; gap:0.5rem;">
          <div>
            <div style="display:flex; align-items:center; gap:0.5rem;">
              <span style="font-family:monospace; font-weight:700; color:#274c77; font-size:0.95rem;">${item.trackingCode}</span>
              <span style="font-size:0.72rem; background:#e0f2fe; color:#0369a1; padding:0.15rem 0.5rem; border-radius:9999px; font-weight:700;">${item.district}</span>
            </div>
            <h4 style="font-size:1rem; font-weight:700; color:#0f172a; margin-top:0.25rem;">${item.title}</h4>
          </div>
          <div style="text-align:right;">
            <span style="font-size:0.8rem; font-weight:800; color:#0284c7;">${pct}% Complete</span>
            <div style="font-size:0.72rem; color:#64748b;">Updated: ${new Date(item.updatedTimestamp || item.createdAt).toLocaleDateString('en-IN', { day:'2-digit', month:'short' })}</div>
          </div>
        </div>

        <div style="width:100%; background:#e2e8f0; border-radius:9999px; height:8px; margin-bottom:0.85rem; overflow:hidden;">
          <div style="background:linear-gradient(90deg, #274c77, #10b981); height:8px; width:${pct}%; transition:width 0.3s ease;"></div>
        </div>

        <!-- 5-Stage Visual Stepper -->
        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(130px, 1fr)); gap:0.4rem; font-size:0.72rem; margin-bottom:0.75rem;">
          ${FLOW_STAGES.map((stg, sIdx) => {
            const curIdx = FLOW_STAGES.indexOf(curStage);
            const isCompleted = sIdx <= curIdx;
            const isCurrent = stg === curStage;
            return `
              <div style="padding:0.35rem 0.5rem; border-radius:6px; border:1px solid ${isCurrent ? '#274c77' : isCompleted ? '#10b981' : '#cbd5e1'}; background:${isCurrent ? '#274c77' : isCompleted ? '#ecfdf5' : '#ffffff'}; color:${isCurrent ? '#ffffff' : isCompleted ? '#047857' : '#94a3b8'}; font-weight:${isCurrent ? '700' : '600'}; text-align:center;">
                ${isCompleted ? '✓ ' : ''}${stg}
              </div>
            `;
          }).join('')}
        </div>

        <div style="display:flex; justify-content:space-between; font-size:0.75rem; color:#64748b; background:#f8fafc; padding:0.6rem 0.8rem; border-radius:6px; flex-wrap:wrap; gap:0.5rem;">
          <span>👤 <strong>Nodal Lead:</strong> ${item.responsibleNodalLead || 'State Triage Desk'}</span>
          <span>🏛️ <strong>Assigned Lead:</strong> ${item.assignedOrg || 'Pending Allocation'}</span>
        </div>
      </div>
    `;
  }).join('');
}

function renderDirectory() {
  const container = document.getElementById('directory-content');
  if (!container) return;

  const q = (document.getElementById('directory-search')?.value || '').toLowerCase().trim();

  let list = [
    ...STATE_DEPARTMENTS.map(d => ({ title: d.name, code: d.code, type: 'State Department', sub: d.domain, color: '#0284c7' })),
    ...STATE_INSTITUTIONS.map(i => ({ title: i.name, code: i.code, type: i.type, sub: `${i.district} District`, color: '#059669' }))
  ];

  if (q) {
    list = list.filter(item => item.title.toLowerCase().includes(q) || item.code.toLowerCase().includes(q) || item.sub.toLowerCase().includes(q));
  }

  container.innerHTML = list.map(item => `
    <div style="background:#ffffff; border:1px solid #e2e8f0; border-radius:8px; padding:1rem; display:flex; flex-direction:column; justify-content:space-between;">
      <div>
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.4rem;">
          <span style="font-family:monospace; font-size:0.75rem; color:#274c77; font-weight:700;">${item.code}</span>
          <span style="font-size:0.7rem; font-weight:700; color:${item.color}; background:${item.color}15; padding:0.15rem 0.45rem; border-radius:4px;">${item.type}</span>
        </div>
        <h4 style="font-size:0.9rem; font-weight:700; color:#0f172a; margin-bottom:0.3rem;">${item.title}</h4>
      </div>
      <div style="font-size:0.75rem; color:#64748b; margin-top:0.4rem;">${item.sub}</div>
    </div>
  `).join('');
}

window.filterDirectory = function() {
  renderDirectory();
};

window.switchSuperTab = function(tabName) {
  document.querySelectorAll('.super-section').forEach(sec => sec.style.display = 'none');
  document.querySelectorAll('#super-admin-nav .nav-tab').forEach(btn => {
    btn.style.background = '#ffffff';
    btn.style.color = '#334155';
    btn.style.borderColor = '#e2e8f0';
  });

  const sec = document.getElementById(`section-${tabName}`);
  if (sec) sec.style.display = 'block';

  const activeBtn = document.getElementById(`tab-${tabName}`);
  if (activeBtn) {
    activeBtn.style.background = '#274c77';
    activeBtn.style.color = '#ffffff';
    activeBtn.style.borderColor = '#274c77';
  }

  if (tabName === 'triage') renderTriageQueue();
  if (tabName === 'tracking') renderProjectTracking();
  if (tabName === 'directory') renderDirectory();
};
