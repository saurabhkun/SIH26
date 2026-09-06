# CivicResolve - SIH 2026 (PS: 26043)

## 🚀 The Pitch
CivicResolve is a unified digital ecosystem designed to bridge the gap between citizens, higher education institutions (HEIs), industry/CSR, and the government. By leveraging community-reported data and matching it with institutional expertise and industry funding, CivicResolve accelerates the resolution of local challenges and transforms them into actionable innovation projects. 

Instead of issues getting lost in bureaucracy, CivicResolve empowers universities to tackle real-world problems with real-world funding, all under the transparent oversight of the government.

## 🎯 Problem Statement (PS: 26043)
The project mandates a robust "notification and communication system" connecting citizens, colleges, industry, and government throughout the project lifecycle. 

The goal is to create a seamless pipeline where a citizen's issue can be adopted by a college, funded by an industry partner, and overseen by the government, with complete transparency at every step. This prototype demonstrates this core workflow, including role-specific dashboards, sandbox payments, map-based analytics, and a comprehensive notification system.

## 🏗️ Folder Structure

```text
SIH/
├── app/                  # Next.js App Router pages and API routes
│   ├── api/              # Backend API routes (auth, issues, gov, pledges, proposals, etc.)
│   ├── dashboard/        # Role-specific dashboards (college, gov, industry)
│   ├── district/         # District-level view for public
│   ├── login/            # Netflix-style role selection & authentication
│   ├── report/           # Public issue reporting wizard
│   └── track/            # Citizen issue tracking
├── components/           # Reusable React components (UI, Shells, Maps, NotificationBell)
├── lib/                  # Core logic, database models, constants, and utils
│   ├── auth/             # Session management
│   ├── data/             # Static data (districts, domains, etc.)
│   └── models/           # Mongoose schemas (User, Issue, College, Proposal, Notification, etc.)
├── scripts/              # Database seeding scripts
└── public/               # Static assets
```

## ⚙️ How to Run Locally

### Prerequisites
- Node.js (v18+)
- MongoDB (Optional: The app will automatically spin up an in-memory MongoDB instance if a local daemon is not running).

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Variables
Ensure you have a `.env.local` file in the root directory. 
```env
MONGODB_URI=mongodb://127.0.0.1:27017/civicresolve
```
*(If you do not have MongoDB running locally, the application will fallback to `mongodb-memory-server` automatically).*

### 3. Seed the Database
Populate the database with test accounts, colleges, and sample data.
```bash
npm run seed
```
**Test Credentials Created:**
- 🏛️ **Government**: `officer@jharkhand.gov.in` (Pass: `Gov@1234`)
- 🎓 **College**: `rnd.director@bitmesra.ac.in` (Pass: `College@1234`)
- 🏭 **Industry**: `csr.head@tatasteel.com` (Pass: `Industry@1234`)

### 4. Start the Development Server
```bash
npm run dev
```
Navigate to [http://localhost:3000](http://localhost:3000) to view the application.

## 🌟 Key Features Built
- **Role-Based Portals**: Distinct Netflix-style login gateway for Government, Universities, and Industry partners.
- **Smart Issue Marketplace**: Colleges are matched with citizen-reported issues based on their declared domain capabilities.
- **Industry Funding & Escrow**: Mock integration with Razorpay Sandbox for CSR funding pledges. Milestone-based fund release.
- **Government Analytics**: Recharts-powered dashboard showing resolution rates, capital distribution, proposal funnels, and geographic issue density.
- **Unified Notification System**: Fire-and-forget notification bell across all portals tracking key lifecycle transitions.

---
*Built for Smart India Hackathon (SIH) 2026*
