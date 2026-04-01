/**
 * migrate.ts — One-shot Firestore Seed Script
 * =============================================
 * Reads the static data from the frontend/src/data/*.ts files and writes
 * it into the Firestore database under the "default" tenant.
 *
 * Usage:
 *   npx tsx src/scripts/migrate.ts
 *
 * Firestore structure created:
 *   tenants/
 *     default/
 *       dashboard/
 *         kpis  → { dashboardKPIs, dailyExecutions, weeklyDefects,
 *                    coverageByModule, aiMappingAccuracy, failureHeatmap }
 *       healing/
 *         events          → { items: HealingEvent[] }
 *         overview        → { ...healingOverview }
 *         decisionMatrix  → { items: [...] }
 *         shadowApprovals → { items: [...] }
 *       tenantData/
 *         clients     → { items: TenantClient[] }
 *         clientTiles → { items: ClientTile[] }
 */

import dotenv from "dotenv";
dotenv.config({ path: "../.env" });

import { db, cleanUndefinedProps } from "../config/firebase.js";

// ─── Constants ───────────────────────────────────────────────────────────────
const TENANT_ID = "default";

// ─── Dashboard Data (mirror of frontend/src/data/dashboard.ts) ───────────────

const dashboardKPIs = [
    { label: "Total Test Cases", value: 84720, suffix: "", change: 12, changeLabel: "vs last sprint", icon: "TestTube2" },
    { label: "Pass Rate", value: 97.3, suffix: "%", target: 99, targetLabel: "target: 99%", icon: "CheckCircle2" },
    { label: "Escaped Defects", value: 0.38, suffix: "%", target: 0.5, targetLabel: "target: <0.5%", icon: "ShieldAlert" },
    { label: "Avg Regression Time", value: 4.2, suffix: " hrs", previousValue: 18, previousLabel: "was 18 hrs", icon: "Clock" },
    { label: "AI Healing Events (30d)", value: 1847, suffix: "", icon: "Sparkles" },
    { label: "Release Confidence", value: 91, suffix: "/100", icon: "Gauge" },
];

function generateDailyExecutions() {
    const data: any[] = [];
    const now = Date.now();
    for (let i = 89; i >= 0; i--) {
        const date = new Date(now - i * 86400000);
        data.push({
            date: date.toISOString().split("T")[0],
            Gateway: Math.floor(1800 + Math.random() * 2400 + Math.sin(i / 7) * 400),
            Workpapers: Math.floor(1200 + Math.random() * 1800 + Math.cos(i / 5) * 300),
            "Tax Organizer": Math.floor(800 + Math.random() * 1400 + Math.sin(i / 10) * 200),
        });
    }
    return data;
}

const weeklyDefects = Array.from({ length: 12 }, (_, i) => ({
    week: `W${i + 1}`,
    Critical: Math.floor(2 + Math.random() * 6),
    High: Math.floor(8 + Math.random() * 12),
    Medium: Math.floor(15 + Math.random() * 20),
    Low: Math.floor(20 + Math.random() * 30),
}));

const coverageByModule = [
    { name: "Gateway", value: 31, fill: "hsl(187, 94%, 43%)" },
    { name: "Workpapers", value: 24, fill: "hsl(160, 84%, 39%)" },
    { name: "Tax Organizer", value: 19, fill: "hsl(38, 92%, 50%)" },
    { name: "AI Assistant", value: 14, fill: "hsl(262, 83%, 58%)" },
    { name: "Cognify API", value: 12, fill: "hsl(350, 89%, 60%)" },
];

const aiMappingAccuracy = [
    { month: "Oct", accuracy: 92.0 },
    { month: "Nov", accuracy: 93.8 },
    { month: "Dec", accuracy: 95.1 },
    { month: "Jan", accuracy: 96.4 },
    { month: "Feb", accuracy: 97.6 },
    { month: "Mar", accuracy: 98.7 },
];

function generateFailureHeatmap() {
    const heatmap: { day: string; hour: number; failures: number }[] = [];
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    days.forEach((day) => {
        for (let h = 0; h < 24; h++) {
            const isWorkHour = h >= 8 && h <= 18;
            const isWeekday = ["Mon", "Tue", "Wed", "Thu", "Fri"].includes(day);
            const base = isWorkHour && isWeekday ? 8 : 2;
            heatmap.push({ day, hour: h, failures: Math.floor(base + Math.random() * (isWorkHour ? 15 : 4)) });
        }
    });
    return heatmap;
}

// ─── Healing Data (mirror of frontend/src/data/healingEvents.ts) ─────────────

const suites = ["Gateway Auth", "Tax Organizer", "Cognify Tile", "Workpapers", "AI Assistant", "e-Sign", "1040 Parser", "K-1 Logic"];
const elements = ['"Submit" button', '"File e-Sign"', '"Upload Document"', '"Save Draft"', '"Next Step"', '"Calculate"', '"Export PDF"', '"Apply Filter"', '"Search" input', '"Delete" icon'];
const observations = ["Element moved to sidebar", "Label changed from old text", "Element missing entirely", "500 error on click", "Element hidden by overlay", "Class name updated", "ID attribute removed", "Position shifted 200px", "Element inside iframe now", "Rendered after delay"];
const inferences = ["UI Refactor", "Copy Update", "Functional Gap", "System Bug"] as const;
const actions = ["Auto-Healed ✅", "Auto-Healed ✅", "❌ Defect Raised", "❌ Backend Regression"] as const;
const eventStatuses = ["Approved", "Pending", "Defect", "Rejected"] as const;

const healingEvents = Array.from({ length: 120 }, (_, i) => {
    const infIdx = Math.floor(Math.random() * inferences.length);
    const mins = Math.floor(Math.random() * 2880);
    return {
        id: `HE-${4821 - i}`,
        suite: suites[Math.floor(Math.random() * suites.length)],
        elementSought: elements[Math.floor(Math.random() * elements.length)],
        observation: observations[Math.floor(Math.random() * observations.length)],
        inference: inferences[infIdx],
        action: actions[infIdx],
        confidence: Math.floor(85 + Math.random() * 15),
        time: mins < 60 ? `${mins}m ago` : `${Math.floor(mins / 60)}h ago`,
        status: eventStatuses[Math.floor(Math.random() * eventStatuses.length)],
    };
});

const healingOverview = {
    eventsToday: 47,
    autoApproved: 39,
    pendingReview: 8,
    falsePositives: 3,
    avgHealTime: "1.3s",
};

const decisionMatrix = [
    { type: "UI Refactor", action: "Auto-Heal", icon: "RefreshCw", color: "primary" },
    { type: "Copy Update", action: "Auto-Heal", icon: "FileText", color: "primary" },
    { type: "Functional Gap", action: "Fail & Report", icon: "AlertTriangle", color: "destructive" },
    { type: "System Bug", action: "Fail & Report", icon: "Bug", color: "destructive" },
];

const shadowApprovals = Array.from({ length: 8 }, (_, i) => ({
    id: `SA-${100 + i}`,
    suite: suites[i % suites.length],
    element: elements[i % elements.length],
    confidence: Math.floor(88 + Math.random() * 10),
    change: observations[i % observations.length],
}));

// ─── Tenant Data (mirror of frontend/src/data/tenantClients.ts) ──────────────

const tenantClients = [
    { name: "Cognify-Alpha", healthScore: 94, passRate: 98.2, activeSuites: 24, lastTestRun: "3m ago" },
    { name: "Cognify-Beta", healthScore: 87, passRate: 95.1, activeSuites: 18, lastTestRun: "12m ago" },
    { name: "TaxFirm-Pro", healthScore: 96, passRate: 99.1, activeSuites: 31, lastTestRun: "1m ago" },
    { name: "EnterpriseX", healthScore: 91, passRate: 97.5, activeSuites: 42, lastTestRun: "8m ago" },
    { name: "RegionalCPA-7", healthScore: 78, passRate: 92.3, activeSuites: 12, lastTestRun: "45m ago" },
    { name: "GlobalTax-Corp", healthScore: 95, passRate: 98.8, activeSuites: 38, lastTestRun: "2m ago" },
    { name: "SmallBiz-Acct", healthScore: 89, passRate: 96.4, activeSuites: 9, lastTestRun: "22m ago" },
    { name: "MetroTax-LLC", healthScore: 92, passRate: 97.9, activeSuites: 15, lastTestRun: "5m ago" },
    { name: "Apex-Financial", healthScore: 88, passRate: 95.7, activeSuites: 21, lastTestRun: "17m ago" },
    { name: "Summit-CPA", healthScore: 93, passRate: 98.0, activeSuites: 27, lastTestRun: "7m ago" },
    { name: "PrimeTax-Group", healthScore: 85, passRate: 94.2, activeSuites: 14, lastTestRun: "33m ago" },
    { name: "NovaTax-Inc", healthScore: 97, passRate: 99.4, activeSuites: 35, lastTestRun: "1m ago" },
    { name: "StrataTax-Pro", healthScore: 82, passRate: 93.1, activeSuites: 11, lastTestRun: "52m ago" },
    { name: "CoreFin-Suite", healthScore: 90, passRate: 96.9, activeSuites: 19, lastTestRun: "10m ago" },
    { name: "TrustBridge-Acct", healthScore: 86, passRate: 95.0, activeSuites: 16, lastTestRun: "28m ago" },
    { name: "ClearPath-Tax", healthScore: 94, passRate: 98.3, activeSuites: 23, lastTestRun: "4m ago" },
    { name: "IronLedger-CPA", healthScore: 79, passRate: 91.8, activeSuites: 8, lastTestRun: "1h ago" },
    { name: "VaultTax-Corp", healthScore: 91, passRate: 97.2, activeSuites: 29, lastTestRun: "6m ago" },
    { name: "Keystone-Fin", healthScore: 83, passRate: 93.5, activeSuites: 13, lastTestRun: "40m ago" },
    { name: "Pinnacle-Acct", healthScore: 95, passRate: 98.6, activeSuites: 33, lastTestRun: "2m ago" },
];

const clientTiles = [
    { tileName: "Tax Organizer v2", type: "Core Module", testCases: 1847, passRate: 99.1, avgLatency: 142, lastRun: "4m ago", issues: 0, slaMet: true },
    { tileName: "Custom K-1 Parser", type: "Custom Tile", testCases: 312, passRate: 96.8, avgLatency: 287, lastRun: "22m ago", issues: 4, slaMet: false },
    { tileName: "e-Sign Integration", type: "Integration", testCases: 98, passRate: 100, avgLatency: 89, lastRun: "1h ago", issues: 0, slaMet: true },
    { tileName: "Document Upload", type: "Core Module", testCases: 567, passRate: 98.5, avgLatency: 198, lastRun: "8m ago", issues: 1, slaMet: true },
    { tileName: "AI Chat Widget", type: "AI Feature", testCases: 234, passRate: 95.3, avgLatency: 445, lastRun: "15m ago", issues: 3, slaMet: false },
    { tileName: "Report Generator", type: "Core Module", testCases: 421, passRate: 99.5, avgLatency: 312, lastRun: "12m ago", issues: 0, slaMet: true },
    { tileName: "Bulk Import Tool", type: "Utility", testCases: 189, passRate: 97.2, avgLatency: 567, lastRun: "30m ago", issues: 2, slaMet: true },
    { tileName: "Client Portal", type: "Core Module", testCases: 756, passRate: 98.9, avgLatency: 156, lastRun: "3m ago", issues: 0, slaMet: true },
    { tileName: "Notification Hub", type: "Integration", testCases: 134, passRate: 99.2, avgLatency: 78, lastRun: "25m ago", issues: 0, slaMet: true },
    { tileName: "Custom Dashboard", type: "Custom Tile", testCases: 278, passRate: 96.1, avgLatency: 234, lastRun: "18m ago", issues: 2, slaMet: false },
];

// ─── Synthetic Datasets (mirror of frontend/src/data/syntheticDatasets.ts) ────

const formTypes = ["W2", "1040", "1120S", "K-1", "Schedule C", "Schedule E"];
const complexities = ["Simple", "Multi-Entity", "Edge Cases"];
const testSuiteNames = [
    "Gateway Auth Flow", "1040 Extraction Regression", "K-1 Multi-Entity Logic", "Cognify Tile Perf Test",
    "e-Sign Workflow", "1120S Form Parsing", "W2 Upload Validation", "Schedule C Calculations",
    "Multi-Entity Merge", "Tax Organizer Search", "AI Assistant Chat Flow", "Document Classification Suite"
];

const syntheticDatasets = Array.from({ length: 35 }, (_, i) => {
    const count = [100, 500, 1000, 2500, 5000, 10000][Math.floor(Math.random() * 6)];
    const hrs = Math.floor(Math.random() * 720);
    const linkedSuites = testSuiteNames
        .sort(() => Math.random() - 0.5)
        .slice(0, Math.floor(Math.random() * 3) + 1)
        .map(name => name.split(" ")[0]);
    
    return {
        id: `DS-${2041 - i}`,
        formType: formTypes[Math.floor(Math.random() * formTypes.length)],
        count,
        year: [2022, 2023, 2024, 2025][Math.floor(Math.random() * 4)],
        complexity: complexities[Math.floor(Math.random() * complexities.length)],
        generated: hrs < 24 ? `${hrs} hrs ago` : `${Math.floor(hrs / 24)} days ago`,
        size: `${(count * 0.0091).toFixed(1)} MB`,
        status: Math.random() > 0.85 ? "Outdated" : "Ready",
        usedIn: linkedSuites.length,
        schemaVersion: Math.random() > 0.85 ? "2.1.0" : "2.4.2",
        linkedSuites,
        previewPdf: true,
    };
});

const sampleTaxRecord = {
    taxpayer: { name: "Jordan T. Mercer", ssn: "***-**-7842", filingStatus: "Married Filing Jointly" },
    income: { wages: 124500, interest: 2340, dividends: 8900, capitalGains: 15200, otherIncome: 3100 },
    agi: 154040,
    deductions: { standardDeduction: 27700, stateTaxes: 12500, mortgageInterest: 18900, charitableContributions: 5200 },
    taxableIncome: 126340,
    totalTax: 22741,
    withholdings: 25600,
    refundDue: 2859,
    forms: ["1040", "Schedule B", "Schedule D", "Schedule A"],
    generatedAt: "2024-03-15T14:22:00Z",
    piiStatus: "Anonymized",
    complianceFlags: { SOC2: true, GDPR: true, noPII: true, hubSyncPrivacy: true },
};

// ─── Test Suites (mirror of frontend/src/data/testSuites.ts) ────────────────

const modules = ["Gateway", "Workpapers", "Tax Organizer", "AI Assistant", "Cognify API"];
const types = ["E2E", "AI-Validation", "Performance", "Integration", "Agent-on-Agent", "Data"];
const statuses = ["Passed", "Passed", "Passed", "Passed", "Degraded", "Failed"] as const;

const suiteNames = [
    "Gateway Auth Flow", "1040 Extraction Regression", "K-1 Multi-Entity Logic", "Cognify Tile Perf Test",
    "e-Sign Workflow", "1120S Form Parsing", "W2 Upload Validation", "Schedule C Calculations",
    "Multi-Entity Merge", "Tax Organizer Search", "AI Assistant Chat Flow", "Document Classification Suite",
    "AGI Extraction Pipeline", "Line Mapping Accuracy", "Summary Quality Check", "Batch Upload Stress",
    "SSO Integration", "MFA Challenge Flow", "Role-Based Access", "Audit Trail Logging",
    "PDF Generation Suite", "Email Notification Flow", "Webhook Delivery", "API Rate Limiting",
    "Data Migration Check", "Concurrent Upload Test", "File Format Validation", "OCR Accuracy Suite",
    "Currency Conversion Logic", "State Tax Calculations", "Federal Form Validation", "Client Portal Access",
    "Custom Tile Rendering", "Dashboard Widget Test", "Report Generation Suite", "Export Functionality",
    "Compliance Check Suite", "PII Detection Flow", "Encryption Validation", "Token Refresh Flow",
    "Session Management", "Cross-Browser Compat", "Mobile Responsive Suite", "Accessibility Audit",
    "Localization Check", "Timezone Handling", "Date Format Validation", "Bulk Delete Operations",
    "Archive & Restore", "Notification Preferences", "Search Indexing", "Filter Combination Matrix",
    "Pagination Stress Test", "Sort Order Validation", "Real-time Sync Check", "Offline Mode Fallback",
];

const testSuites = suiteNames.map((name, i) => {
    const total = Math.floor(50 + Math.random() * 1200);
    const failCount = Math.floor(Math.random() * (total * 0.05));
    const flakyCount = Math.floor(Math.random() * (total * 0.02));
    const passCount = total - failCount - flakyCount;
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const mins = Math.floor(Math.random() * 1440);
    const lastRun = mins < 60 ? `${mins} mins ago` : `${Math.floor(mins / 60)} hrs ago`;
    return {
        id: `TS-${1000 + i}`,
        name,
        module: modules[i % modules.length],
        type: types[i % types.length],
        totalCases: total,
        passed: passCount,
        failed: failCount,
        flaky: flakyCount,
        lastRun,
        status,
        aiHealed: Math.floor(Math.random() * 12),
        runHistory: Array.from({ length: 5 }, () => Math.random() > 0.15),
    };
});

// ─── Agent Jobs (mirror of frontend/src/data/agentJobs.ts) ──────────────────

const qaAgents = ["Winnie-QA-01", "Winnie-QA-02", "Winnie-QA-03", "Winnie-QA-04", "Winnie-QA-05"];
const targetAgents = ["AI Assistant v2.4", "Tax Mapper v1.9", "Doc Summarizer v3", "OCR Engine v4.1", "Classifier v2.0"];
const agentTestTypes = ["Document Classification", "AGI Extraction", "Line Mapping", "Summary Quality", "OCR Accuracy", "Entity Detection"];
const forms = ["1120S", "1040", "W2", "K-1", "Schedule C", "Schedule E"];

const agentJobsData = Array.from({ length: 50 }, (_, i) => {
    const accuracy = +(88 + Math.random() * 12).toFixed(1);
    const baseline = +(88 + Math.random() * 12).toFixed(1);
    const delta = +(accuracy - baseline).toFixed(1);
    const status = delta < -1.5 ? "Degraded" : delta < -0.5 ? "Regression" : "Pass";
    const secs = Math.floor(60 + Math.random() * 480);
    const job: any = {
        id: `AJ-${9981 - i}`,
        qaAgent: qaAgents[Math.floor(Math.random() * qaAgents.length)],
        targetAgent: targetAgents[Math.floor(Math.random() * targetAgents.length)],
        testType: agentTestTypes[Math.floor(Math.random() * agentTestTypes.length)],
        form: forms[Math.floor(Math.random() * forms.length)],
        accuracy,
        baseline,
        delta,
        status,
        runtime: `${Math.floor(secs / 60)}m ${secs % 60}s`,
    };
    // Only include cotTrace for non-Pass status (avoid undefined fields)
    if (status !== "Pass") {
        job.cotTrace = [
            "QA Agent: Scanned Page 4 interest schedules.",
            `Target Agent extracted $12,450 from Line 7, but I calculated $15,100 based on Interest Schedules (Form ${forms[Math.floor(Math.random() * forms.length)]}).`,
            "QA Agent: Detecting functional intent mismatch in extraction layer.",
            "QA Agent: Confidence in discrepancy is 94.2%. Marking as Regression."
        ];
    }
    return job;
});

const accuracyTrendData = Array.from({ length: 30 }, (_, i) => ({
    version: `v2.${i + 1}`,
    Classification: +(92 + Math.random() * 7 + i * 0.15).toFixed(1),
    Extraction: +(90 + Math.random() * 8 + i * 0.12).toFixed(1),
    Mapping: +(93 + Math.random() * 6 + i * 0.1).toFixed(1),
}));

// ─── KPI Glossary (mirror of frontend/src/data/kpiGlossary.ts) ──────────────

const kpiDefinitions = [
    { name: "Pass Rate", definition: "% of test cases that passed in a given run", formula: "(Passed Cases / Total Cases) × 100", target: "≥99%", current: "97.3%", source: "Test Execution Engine", category: "KPIs" },
    { name: "Escaped Defect Rate", definition: "% of defects that reached production", formula: "(Production Bugs / Total Bugs Found) × 100", target: "<0.5%", current: "0.38%", source: "Defect Tracking", category: "KPIs" },
    { name: "AI Mapping Accuracy", definition: "Accuracy of AI in mapping tax form fields", formula: "(Correctly Mapped Fields / Total Fields) × 100", target: "≥99%", current: "98.7%", source: "Agent-on-Agent Engine", category: "KPIs" },
    { name: "Flaky Test Rate", definition: "% of tests with inconsistent results", formula: "(Flaky Tests / Total Tests) × 100", target: "<2%", current: "1.4%", source: "Execution Logs", category: "KPIs" },
    { name: "Self-Healing Success Rate", definition: "% of healing events resolved without human", formula: "(Auto-Healed / Total Healing Events) × 100", target: ">85%", current: "83%", source: "Self-Healing Engine", category: "KPIs" },
    { name: "Release Confidence Score", definition: "Composite score of release readiness", formula: "(Coverage×0.2) + (PassRate×0.3) + (AIAccuracy×0.25) + (PerfSLA×0.15) + (DefectDensity×0.1)", target: "≥90", current: "91", source: "QAI Platform", category: "KPIs" },
    { name: "Regression Cycle Time", definition: "Time from code commit to regression completion", formula: "Σ(execution time) / parallelism factor", target: "<6 hrs", current: "4.2 hrs", source: "CI/CD Integration", category: "KPIs" },
    { name: "Defect Density", definition: "Defects per 1,000 lines of code", formula: "(Total Defects / KLOC)", target: "<2", current: "1.4", source: "Code Intelligence Engine", category: "KPIs" },
    { name: "Test Maintenance Overhead", definition: "Weekly hours spent fixing broken test scripts", formula: "Hours spent on script fixes per week", target: "<2 hrs", current: "1.8 hrs", source: "Team Reports", category: "KPIs" },
    { name: "AI Confidence Score", definition: "Model certainty score on a classification/extraction", formula: "Softmax output probability × 100", target: "≥95%", current: "97.2%", source: "AI/LLM Layer", category: "KPIs" },
    { name: "Shadow Mode Approval Rate", definition: "% of auto-heals approved by QA engineers", formula: "(Approved / (Approved + Rejected)) × 100", target: ">90%", current: "91.3%", source: "Self-Healing Engine", category: "KPIs" },
    { name: "Synthetic Data Compliance", definition: "% of generated records passing PII checks", formula: "(Clean Records / Total Generated) × 100", target: "100%", current: "100%", source: "Data Generator", category: "KPIs" },
    { name: "P95 Latency", definition: "95th percentile response time under load", formula: "Value below which 95% of requests fall", target: "<300ms", current: "187ms", source: "Performance Engine", category: "KPIs" },
    { name: "MTTR", definition: "Avg time from defect detection to fix", formula: "Σ(repair times) / number of defects", target: "<4 hrs", current: "2.8 hrs", source: "Defect Lifecycle", category: "KPIs" },
    { name: "Code Coverage", definition: "% of code exercised by automated tests", formula: "(Lines Tested / Total Lines) × 100", target: "≥90%", current: "94%", source: "Coverage Tool", category: "KPIs" },
    { name: "Test Automation Rate", definition: "% of test cases that are automated", formula: "(Automated Tests / Total Tests) × 100", target: "≥85%", current: "91%", source: "Test Management", category: "KPIs" },
    { name: "Mean Time to Detection", definition: "Avg time from defect introduction to detection", formula: "Σ(detection times) / number of defects", target: "<2 hrs", current: "1.4 hrs", source: "CI/CD Pipeline", category: "KPIs" },
    { name: "Test Execution Speed", definition: "Tests executed per minute", formula: "Total Tests / Execution Time (min)", target: ">500/min", current: "680/min", source: "Execution Engine", category: "KPIs" },
    { name: "Retest Efficiency", definition: "% of retests that pass on first attempt", formula: "(First-Pass Retests / Total Retests) × 100", target: ">90%", current: "93%", source: "Regression Engine", category: "KPIs" },
    { name: "Environment Uptime", definition: "% of time test environments are available", formula: "(Uptime Hours / Total Hours) × 100", target: ">99.5%", current: "99.8%", source: "Infrastructure Monitor", category: "KPIs" },
    { name: "Defect Removal Efficiency", definition: "% of defects found before production", formula: "(Pre-Prod Defects / Total Defects) × 100", target: ">95%", current: "96.2%", source: "Defect Tracking", category: "KPIs" },
    { name: "Test Data Freshness", definition: "Age of synthetic test data in use", formula: "Avg days since dataset generation", target: "<7 days", current: "3.2 days", source: "Data Generator", category: "KPIs" },
    { name: "Agent Accuracy Variance", definition: "Std deviation of AI agent accuracy across runs", formula: "σ(accuracy scores)", target: "<1.5%", current: "0.8%", source: "Agent Testing Engine", category: "KPIs" },
    { name: "SLA Compliance Rate", definition: "% of tenant SLAs met", formula: "(SLAs Met / Total SLAs) × 100", target: ">98%", current: "97.5%", source: "Multi-Tenant Monitor", category: "KPIs" },
    { name: "Parallel Execution Ratio", definition: "Degree of test parallelization", formula: "Parallel Runners / Total Runners", target: ">80%", current: "85%", source: "Execution Engine", category: "KPIs" },
];

const formulaExamples = [
    {
        name: "Release Confidence Score",
        formula: `Release Confidence Score = 
  (Code Coverage × 0.20) +
  (Regression Pass Rate × 0.30) +
  (AI Accuracy × 0.25) +
  (Performance SLA × 0.15) +
  (Defect Density Score × 0.10)`,
        example: `= (94 × 0.20) + (97.3 × 0.30) + (98.7 × 0.25) + (96 × 0.15) + (88 × 0.10)
= 18.8 + 29.19 + 24.675 + 14.4 + 8.8
= 95.865 → Normalized to 91/100`,
        variables: ["Code Coverage: 94%", "Regression Pass Rate: 97.3%", "AI Accuracy: 98.7%", "Performance SLA: 96%", "Defect Density Score: 88%"],
    },
    {
        name: "Escaped Defect Rate",
        formula: `Escaped Defect Rate = (Production Bugs / Total Bugs Found) × 100`,
        example: `= (3 / 789) × 100 = 0.38%`,
        variables: ["Production Bugs: 3", "Total Bugs Found: 789"],
    },
    {
        name: "Self-Healing Success Rate",
        formula: `Self-Healing Success Rate = (Auto-Healed / Total Healing Events) × 100`,
        example: `= (1532 / 1847) × 100 = 83%`,
        variables: ["Auto-Healed: 1532", "Total Healing Events: 1847"],
    },
];

const chartIndex = [
    { chart: "Line Chart", page: "Dashboard", data: "Daily test executions (90 days)", library: "Recharts LineChart" },
    { chart: "Stacked Bar Chart", page: "Dashboard", data: "Weekly defect breakdown by severity", library: "Recharts BarChart" },
    { chart: "Donut Chart", page: "Dashboard", data: "Test coverage by module", library: "Recharts PieChart" },
    { chart: "Area Chart", page: "Dashboard", data: "AI Mapping Accuracy trend", library: "Recharts AreaChart" },
    { chart: "Heatmap Grid", page: "Dashboard", data: "7×24 test failure heatmap", library: "Custom SVG" },
    { chart: "Line Chart", page: "Agent Testing", data: "AI accuracy over 30 versions", library: "Recharts LineChart" },
    { chart: "Radial Gauge", page: "Analytics", data: "Release Readiness Score", library: "Recharts RadialBarChart" },
    { chart: "Treemap", page: "Analytics", data: "Test coverage by service", library: "Recharts Treemap" },
    { chart: "Line Chart", page: "Analytics", data: "Bug leakage to production (12mo)", library: "Recharts LineChart" },
    { chart: "Bar Chart", page: "Analytics", data: "Test maintenance time (12mo)", library: "Recharts BarChart" },
];

const aiModels = [
    { feature: "AI Summary (Dashboard)", model: "claude-sonnet-4-20250514", strategy: "Zero-shot", output: "Markdown bullets", display: "Drawer panel" },
    { feature: "AI Summary (Healing)", model: "claude-sonnet-4-20250514", strategy: "Zero-shot", output: "Markdown analysis", display: "Drawer panel" },
    { feature: "AI Summary (Analytics)", model: "claude-sonnet-4-20250514", strategy: "Zero-shot", output: "Structured insight", display: "Insight card" },
    { feature: "Winnie Chatbot", model: "claude-sonnet-4-20250514", strategy: "Conversational", output: "Streaming text", display: "Chat drawer" },
    { feature: "NL Test Generator", model: "claude-sonnet-4-20250514", strategy: "Chain-of-thought", output: "JSON test plan", display: "Preview card" },
];

const defectPredictions = [
    { component: "1040 Parser", riskScore: 78, riskLevel: "High", predictedDefects: "4–6", lastChange: "2 days ago", complexity: "High", recommendation: "Increase test coverage" },
    { component: "Gateway Auth", riskScore: 34, riskLevel: "Medium", predictedDefects: "1–2", lastChange: "5 days ago", complexity: "Medium", recommendation: "Monitor" },
    { component: "Cognify API v3", riskScore: 71, riskLevel: "High", predictedDefects: "3–5", lastChange: "1 day ago", complexity: "High", recommendation: "Trigger regression suite" },
    { component: "Tax Organizer UI", riskScore: 22, riskLevel: "Low", predictedDefects: "0–1", lastChange: "8 days ago", complexity: "Low", recommendation: "No action needed" },
    { component: "e-Sign Module", riskScore: 45, riskLevel: "Medium", predictedDefects: "1–3", lastChange: "3 days ago", complexity: "Medium", recommendation: "Review recent changes" },
    { component: "K-1 Parser", riskScore: 82, riskLevel: "High", predictedDefects: "5–7", lastChange: "1 day ago", complexity: "High", recommendation: "Priority testing" },
    { component: "Document Upload", riskScore: 29, riskLevel: "Low", predictedDefects: "0–1", lastChange: "10 days ago", complexity: "Low", recommendation: "Monitor" },
    { component: "Report Generator", riskScore: 55, riskLevel: "Medium", predictedDefects: "2–3", lastChange: "4 days ago", complexity: "Medium", recommendation: "Add edge case tests" },
    { component: "Bulk Import", riskScore: 67, riskLevel: "High", predictedDefects: "3–4", lastChange: "2 days ago", complexity: "High", recommendation: "Load testing recommended" },
    { component: "Notification Service", riskScore: 18, riskLevel: "Low", predictedDefects: "0", lastChange: "14 days ago", complexity: "Low", recommendation: "No action needed" },
    { component: "OCR Engine", riskScore: 73, riskLevel: "High", predictedDefects: "4–5", lastChange: "1 day ago", complexity: "High", recommendation: "Accuracy regression suite" },
    { component: "AI Chat Widget", riskScore: 61, riskLevel: "Medium", predictedDefects: "2–4", lastChange: "3 days ago", complexity: "High", recommendation: "Prompt regression tests" },
    { component: "Client Portal", riskScore: 25, riskLevel: "Low", predictedDefects: "0–1", lastChange: "7 days ago", complexity: "Medium", recommendation: "Monitor" },
    { component: "Session Manager", riskScore: 38, riskLevel: "Medium", predictedDefects: "1–2", lastChange: "6 days ago", complexity: "Medium", recommendation: "Security audit" },
    { component: "PDF Generator", riskScore: 52, riskLevel: "Medium", predictedDefects: "2–3", lastChange: "4 days ago", complexity: "Medium", recommendation: "Template validation" },
    { component: "Webhook Handler", riskScore: 41, riskLevel: "Medium", predictedDefects: "1–2", lastChange: "5 days ago", complexity: "Medium", recommendation: "Retry logic review" },
    { component: "Search Indexer", riskScore: 69, riskLevel: "High", predictedDefects: "3–5", lastChange: "2 days ago", complexity: "High", recommendation: "Full reindex test" },
    { component: "Data Exporter", riskScore: 33, riskLevel: "Medium", predictedDefects: "1", lastChange: "6 days ago", complexity: "Low", recommendation: "Format validation" },
    { component: "MFA Module", riskScore: 47, riskLevel: "Medium", predictedDefects: "1–3", lastChange: "4 days ago", complexity: "High", recommendation: "Cross-browser test" },
    { component: "Audit Logger", riskScore: 15, riskLevel: "Low", predictedDefects: "0", lastChange: "20 days ago", complexity: "Low", recommendation: "No action needed" },
];

const bugLeakageTrend = Array.from({ length: 12 }, (_, i) => ({
    month: ["Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"][i],
    rate: +(5 - i * 0.38 + Math.random() * 0.3).toFixed(2),
}));

const maintenanceTimeTrend = Array.from({ length: 12 }, (_, i) => ({
    month: ["Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"][i],
    hours: +(20 - i * 1.5 + Math.random() * 1.5).toFixed(1),
}));

const coverageTreemap = [
    { name: "Gateway Auth", size: 94, coverage: 94, confidence: 98 },
    { name: "Tax Organizer", size: 91, coverage: 91, confidence: 95 },
    { name: "Workpapers", size: 88, coverage: 88, confidence: 92 },
    { name: "AI Assistant", size: 86, coverage: 86, confidence: 64 }, // Blind Spot
    { name: "Cognify API", size: 92, coverage: 92, confidence: 97 },
    { name: "e-Sign", size: 97, coverage: 97, confidence: 99 },
    { name: "Document Upload", size: 95, coverage: 95, confidence: 88 },
    { name: "Report Gen", size: 89, coverage: 89, confidence: 91 },
    { name: "Client Portal", size: 93, coverage: 93, confidence: 94 },
    { name: "Notification", size: 96, coverage: 96, confidence: 96 },
    { name: "Search", size: 82, coverage: 82, confidence: 58 }, // Blind Spot
    { name: "Bulk Import", size: 78, coverage: 78, confidence: 45 }, // High Risk Blind Spot
    { name: "PDF Gen", size: 90, coverage: 90, confidence: 92 },
    { name: "Webhook", size: 85, coverage: 85, confidence: 87 },
    { name: "MFA", size: 91, coverage: 91, confidence: 98 },
];

// ─── Migration Logic ─────────────────────────────────────────────────────────

async function migrate() {
    console.log("🔄  Starting Firestore migration...\n");

    const tenantRef = db.collection("tenants").doc(TENANT_ID);

    // 1. Dashboard KPIs
    console.log("  📊  Writing dashboard/kpis...");
    await tenantRef.collection("dashboard").doc("kpis").set({
        dashboardKPIs,
        dailyExecutions: generateDailyExecutions(),
        weeklyDefects,
        coverageByModule,
        aiMappingAccuracy,
        failureHeatmap: generateFailureHeatmap(),
        _migratedAt: new Date().toISOString(),
    });
    console.log("     ✅  dashboard/kpis written");

    // 2. Healing Events
    console.log("  🩹  Writing healing/events...");
    await tenantRef.collection("healing").doc("events").set({
        items: healingEvents,
        _migratedAt: new Date().toISOString(),
    });
    console.log("     ✅  healing/events written");

    console.log("  🩹  Writing healing/overview...");
    await tenantRef.collection("healing").doc("overview").set({
        ...healingOverview,
        _migratedAt: new Date().toISOString(),
    });
    console.log("     ✅  healing/overview written");

    console.log("  🩹  Writing healing/decisionMatrix...");
    await tenantRef.collection("healing").doc("decisionMatrix").set({
        items: decisionMatrix,
        _migratedAt: new Date().toISOString(),
    });
    console.log("     ✅  healing/decisionMatrix written");

    console.log("  🩹  Writing healing/shadowApprovals...");
    await tenantRef.collection("healing").doc("shadowApprovals").set({
        items: shadowApprovals,
        _migratedAt: new Date().toISOString(),
    });
    console.log("     ✅  healing/shadowApprovals written");

    // 3. Tenant Data
    console.log("  🏢  Writing tenantData/clients...");
    await tenantRef.collection("tenantData").doc("clients").set({
        items: tenantClients,
        _migratedAt: new Date().toISOString(),
    });
    console.log("     ✅  tenantData/clients written");

    console.log("  🏢  Writing tenantData/clientTiles...");
    await tenantRef.collection("tenantData").doc("clientTiles").set({
        items: clientTiles,
        _migratedAt: new Date().toISOString(),
    });
    console.log("     ✅  tenantData/clientTiles written");

    // 4. Test Suites
    console.log("  🧪  Writing tenantData/testSuites...");
    await tenantRef.collection("tenantData").doc("testSuites").set({
        items: testSuites,
        _migratedAt: new Date().toISOString(),
    });
    console.log("     ✅  tenantData/testSuites written");

    // 5. Agent Jobs
    console.log("  🤖  Writing tenantData/agentJobs...");
    await tenantRef.collection("tenantData").doc("agentJobs").set(
        cleanUndefinedProps({
            items: agentJobsData,
            accuracyTrend: accuracyTrendData,
            _migratedAt: new Date().toISOString(),
        })
    );
    console.log("     ✅  tenantData/agentJobs written");

    // 6. Synthetic Datasets
    console.log("  📂  Writing tenantData/syntheticDatasets...");
    await tenantRef.collection("tenantData").doc("syntheticDatasets").set({
        items: syntheticDatasets,
        sample: sampleTaxRecord,
        _migratedAt: new Date().toISOString(),
    });
    console.log("     ✅  tenantData/syntheticDatasets written");

    // 7. KPI Glossary
    console.log("  📈  Writing tenantData/kpiGlossary...");
    await tenantRef.collection("tenantData").doc("kpiGlossary").set({
        kpiDefinitions,
        formulaExamples,
        chartIndex,
        aiModels,
        defectPredictions,
        bugLeakageTrend,
        maintenanceTimeTrend,
        coverageTreemap,
        _migratedAt: new Date().toISOString(),
    });
    console.log("     ✅  tenantData/kpiGlossary written");

    console.log("\n✅  Migration complete! All data seeded under tenant:", TENANT_ID);
}

// ─── Run ─────────────────────────────────────────────────────────────────────

migrate()
    .then(() => process.exit(0))
    .catch((err) => {
        console.error("❌  Migration failed:", err);
        process.exit(1);
    });
