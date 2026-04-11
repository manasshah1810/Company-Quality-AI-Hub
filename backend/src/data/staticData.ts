/**
 * Static Data Store
 * Replaces Firestore for the Quality AI Hub
 */

// ─── Dashboard Data ───────────────────────────────────────────────────────────

export const dashboardKPIs = [
    { label: "Total Test Cases", value: 84720, suffix: "", change: 12, changeLabel: "vs last sprint", icon: "TestTube2" },
    { label: "Pass Rate", value: 97.3, suffix: "%", target: 99, targetLabel: "target: 99%", icon: "CheckCircle2" },
    { label: "Escaped Defects", value: 0.38, suffix: "%", target: 0.5, targetLabel: "target: <0.5%", icon: "ShieldAlert" },
    { label: "Avg Regression Time", value: 4.2, suffix: " hrs", previousValue: 18, previousLabel: "was 18 hrs", icon: "Clock" },
    { label: "AI Healing Events (30d)", value: 1847, suffix: "", icon: "Sparkles" },
    { label: "Release Confidence", value: 91, suffix: "/100", icon: "Gauge" },
];

export function generateDailyExecutions() {
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

export const weeklyDefects = Array.from({ length: 12 }, (_, i) => ({
    week: `W${i + 1}`,
    Critical: Math.floor(2 + Math.random() * 6),
    High: Math.floor(8 + Math.random() * 12),
    Medium: Math.floor(15 + Math.random() * 20),
    Low: Math.floor(20 + Math.random() * 30),
}));

export const coverageByModule = [
    { name: "Gateway", value: 31, fill: "hsl(187, 94%, 43%)" },
    { name: "Workpapers", value: 24, fill: "hsl(160, 84%, 39%)" },
    { name: "Tax Organizer", value: 19, fill: "hsl(38, 92%, 50%)" },
    { name: "AI Assistant", value: 14, fill: "hsl(262, 83%, 58%)" },
    { name: "Cognify API", value: 12, fill: "hsl(350, 89%, 60%)" },
];

export const aiMappingAccuracy = [
    { month: "Oct", accuracy: 92.0 },
    { month: "Nov", accuracy: 93.8 },
    { month: "Dec", accuracy: 95.1 },
    { month: "Jan", accuracy: 96.4 },
    { month: "Feb", accuracy: 97.6 },
    { month: "Mar", accuracy: 98.7 },
];

export function generateFailureHeatmap() {
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

// ─── Healing Data ─────────────────────────────────────────────────────────────

const suites = ["Gateway Auth", "Tax Organizer", "Cognify Tile", "Workpapers", "AI Assistant", "e-Sign", "1040 Parser", "K-1 Logic"];
const elements = ['"Submit" button', '"File e-Sign"', '"Upload Document"', '"Save Draft"', '"Next Step"', '"Calculate"', '"Export PDF"', '"Apply Filter"', '"Search" input', '"Delete" icon'];
const observations = ["Element moved to sidebar", "Label changed from old text", "Element missing entirely", "500 error on click", "Element hidden by overlay", "Class name updated", "ID attribute removed", "Position shifted 200px", "Element inside iframe now", "Rendered after delay"];
const inferences = ["UI Refactor", "Copy Update", "Functional Gap", "System Bug"] as const;
const actions = ["Auto-Healed ✅", "Auto-Healed ✅", "❌ Defect Raised", "❌ Backend Regression"] as const;
const eventStatuses = ["Approved", "Pending", "Defect", "Rejected"] as const;

export const healingEvents = Array.from({ length: 120 }, (_, i) => {
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

export const healingOverview = {
    eventsToday: 47,
    autoApproved: 39,
    pendingReview: 8,
    falsePositives: 3,
    avgHealTime: "1.3s",
};

export const decisionMatrix = [
    { type: "UI Refactor", action: "Auto-Heal", icon: "RefreshCw", color: "primary" },
    { type: "Copy Update", action: "Auto-Heal", icon: "FileText", color: "primary" },
    { type: "Functional Gap", action: "Fail & Report", icon: "AlertTriangle", color: "destructive" },
    { type: "System Bug", action: "Fail & Report", icon: "Bug", color: "destructive" },
];

export const shadowApprovals = Array.from({ length: 8 }, (_, i) => ({
    id: `SA-${100 + i}`,
    suite: suites[i % suites.length],
    element: elements[i % elements.length],
    confidence: Math.floor(88 + Math.random() * 10),
    change: observations[i % observations.length],
}));

// ─── Tenant Data ─────────────────────────────────────────────────────────────

export const tenantClients = [
    { name: "Cognify-Alpha", healthScore: 94, passRate: 98.2, activeSuites: 24, lastTestRun: "3m ago", region: "North America" },
    { name: "Cognify-Beta", healthScore: 87, passRate: 95.1, activeSuites: 18, lastTestRun: "12m ago", region: "EMEA" },
    { name: "TaxFirm-Pro", healthScore: 96, passRate: 99.1, activeSuites: 31, lastTestRun: "1m ago", region: "North America" },
    { name: "EnterpriseX", healthScore: 91, passRate: 97.5, activeSuites: 42, lastTestRun: "8m ago", region: "APAC" },
    { name: "RegionalCPA-7", healthScore: 78, passRate: 92.3, activeSuites: 12, lastTestRun: "45m ago", region: "LATAM" },
    { name: "GlobalTax-Corp", healthScore: 95, passRate: 98.8, activeSuites: 38, lastTestRun: "2m ago", region: "EMEA" },
    { name: "SmallBiz-Acct", healthScore: 89, passRate: 96.4, activeSuites: 9, lastTestRun: "22m ago", region: "North America" },
    { name: "MetroTax-LLC", healthScore: 92, passRate: 97.9, activeSuites: 15, lastTestRun: "5m ago", region: "APAC" },
    { name: "Apex-Financial", healthScore: 88, passRate: 95.7, activeSuites: 21, lastTestRun: "17m ago", region: "LATAM" },
    { name: "Summit-CPA", healthScore: 93, passRate: 98.0, activeSuites: 27, lastTestRun: "7m ago", region: "North America" },
    { name: "PrimeTax-Group", healthScore: 85, passRate: 94.2, activeSuites: 14, lastTestRun: "33m ago", region: "EMEA" },
    { name: "NovaTax-Inc", healthScore: 97, passRate: 99.4, activeSuites: 35, lastTestRun: "1m ago", region: "APAC" },
    { name: "StrataTax-Pro", healthScore: 82, passRate: 93.1, activeSuites: 11, lastTestRun: "52m ago", region: "LATAM" },
    { name: "CoreFin-Suite", healthScore: 90, passRate: 96.9, activeSuites: 19, lastTestRun: "10m ago", region: "North America" },
    { name: "TrustBridge-Acct", healthScore: 86, passRate: 95.0, activeSuites: 16, lastTestRun: "28m ago", region: "EMEA" },
    { name: "ClearPath-Tax", healthScore: 94, passRate: 98.3, activeSuites: 23, lastTestRun: "4m ago", region: "APAC" },
    { name: "IronLedger-CPA", healthScore: 79, passRate: 91.8, activeSuites: 8, lastTestRun: "1h ago", region: "LATAM" },
    { name: "VaultTax-Corp", healthScore: 91, passRate: 97.2, activeSuites: 29, lastTestRun: "6m ago", region: "EMEA" },
    { name: "Keystone-Fin", healthScore: 83, passRate: 93.5, activeSuites: 13, lastTestRun: "40m ago", region: "North America" },
    { name: "Pinnacle-Acct", healthScore: 95, passRate: 98.6, activeSuites: 33, lastTestRun: "2m ago", region: "APAC" },
];

export const clientTiles = [
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

// ─── Synthetic Datasets ──────────────────────────────────────────────────────

const formTypes = ["W2", "1040", "1120S", "K-1", "Schedule C", "Schedule E"];
const complexities = ["Simple", "Multi-Entity", "Edge Cases"];
const testSuiteNamesData = [
    "Gateway Auth Flow", "1040 Extraction Regression", "K-1 Multi-Entity Logic", "Cognify Tile Perf Test",
    "e-Sign Workflow", "1120S Form Parsing", "W2 Upload Validation", "Schedule C Calculations",
    "Multi-Entity Merge", "Tax Organizer Search", "AI Assistant Chat Flow", "Document Classification Suite"
];

export const syntheticDatasets = Array.from({ length: 35 }, (_, i) => {
    const count = [100, 500, 1000, 2500, 5000, 10000][Math.floor(Math.random() * 6)];
    const hrs = Math.floor(Math.random() * 720);
    const linkedSuites = testSuiteNamesData
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

export const sampleTaxRecord = {
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

// ─── Test Suites ─────────────────────────────────────────────────────────────

const modules = ["Gateway", "Workpapers", "Tax Organizer", "AI Assistant", "Cognify API"];
const types = ["E2E", "AI-Validation", "Performance", "Integration", "Agent-on-Agent", "Data"];
const testStatuses = ["Passed", "Passed", "Passed", "Passed", "Degraded", "Failed"] as const;

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

export const testSuites = suiteNames.map((name, i) => {
    const total = Math.floor(50 + Math.random() * 1200);
    const failCount = Math.floor(Math.random() * (total * 0.05));
    const flakyCount = Math.floor(Math.random() * (total * 0.02));
    const passCount = total - failCount - flakyCount;
    const status = testStatuses[Math.floor(Math.random() * testStatuses.length)];
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

// ─── Agent Jobs ───────────────────────────────────────────────────────────────

const qaAgents = ["Winnie-QA-01", "Winnie-QA-02", "Winnie-QA-03", "Winnie-QA-04", "Winnie-QA-05"];
const targetAgents = ["AI Assistant v2.4", "Tax Mapper v1.9", "Doc Summarizer v3", "OCR Engine v4.1", "Classifier v2.0"];
const agentTestTypes = ["Document Classification", "AGI Extraction", "Line Mapping", "Summary Quality", "OCR Accuracy", "Entity Detection"];
const forms = ["1120S", "1040", "W2", "K-1", "Schedule C", "Schedule E"];

export const agentJobsData = Array.from({ length: 50 }, (_, i) => {
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

export const accuracyTrendData = Array.from({ length: 30 }, (_, i) => ({
    version: `v2.${i + 1}`,
    Classification: +(92 + Math.random() * 7 + i * 0.15).toFixed(1),
    Extraction: +(90 + Math.random() * 8 + i * 0.12).toFixed(1),
    Mapping: +(93 + Math.random() * 6 + i * 0.1).toFixed(1),
}));

// ─── KPI Glossary ─────────────────────────────────────────────────────────────

export const kpiDefinitions = [
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
];

export const formulaExamples = [
    {
        name: "Release Confidence Score",
        formula: `Release Confidence Score = (Code Coverage × 0.20) + (Regression Pass Rate × 0.30) + (AI Accuracy × 0.25) + (Performance SLA × 0.15) + (Defect Density Score × 0.10)`,
        example: `= (94 × 0.20) + (97.3 × 0.30) + (98.7 × 0.25) + (96 × 0.15) + (88 × 0.10) = 18.8 + 29.19 + 24.675 + 14.4 + 8.8 = 95.865 → Normalized to 91/100`,
        variables: ["Code Coverage: 94%", "Regression Pass Rate: 97.3%", "AI Accuracy: 98.7%", "Performance SLA: 96%", "Defect Density Score: 88%"],
    },
];

export const chartIndex = [
    { chart: "Line Chart", page: "Dashboard", data: "Daily test executions (90 days)", library: "Recharts LineChart" },
    { chart: "Stacked Bar Chart", page: "Dashboard", data: "Weekly defect breakdown by severity", library: "Recharts BarChart" },
];

export const aiModels = [
    { feature: "Winnie Chatbot", model: "claude-sonnet-4-20250514", strategy: "Conversational", output: "Streaming text", display: "Chat drawer" },
];

export const defectPredictions = [
    { component: "1040 Parser", riskScore: 78, riskLevel: "High", predictedDefects: "4–6", lastChange: "2 days ago", complexity: "High", recommendation: "Increase test coverage" },
];

export const bugLeakageTrend = Array.from({ length: 12 }, (_, i) => ({
    month: ["Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"][i],
    rate: +(5 - i * 0.38 + Math.random() * 0.3).toFixed(2),
}));

export const maintenanceTimeTrend = Array.from({ length: 12 }, (_, i) => ({
    month: ["Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"][i],
    hours: +(20 - i * 1.5 + Math.random() * 1.5).toFixed(1),
}));

export const coverageTreemap = [
    { name: "Gateway Auth", size: 94, coverage: 94, confidence: 98 },
];

// ─── Real-time Jobs (In-memory) ───────────────────────────────────────────────

export const activeJobs: any[] = [
    {
        id: "job-initial-01",
        qaAgent: "Winnie-QA",
        targetAgent: "Browser Runner (Chromium)",
        testType: "Functional UI Test",
        form: "Example Scenario",
        accuracy: 98.5,
        baseline: 98.4,
        delta: "0.10",
        runtime: "5.8s",
        status: "Pass",
        progress: 100,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    }
];
