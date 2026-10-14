# DOS FUTUROS CAMPUS · V2 audit remediation

Scope: only causal-wargame V2. No V1 changes or resetting real sessions.

Deploy in sequence: (1) new SQL migration 202610140002 on staging, (2) verify true ATE ~5.704 and observed ATE ~5.744 from the synthetic cohort, (3) both V2 Edge Functions together, (4) UI/Pages, (5) browser QA on isolated game and multiple devices. The functions reveal the truth only in reveal/teaching/microcheck/finished. Avoid concurrent CI reset smoke with classroom session FUTUROS.

Laboratory score is still evidence of participation, not tamper-proof numerical certification: Pyodide runs locally and submits signed-by-player events. Client now awaits the event acknowledgement to avoid awarding laboratory points before evidence is recorded. To certify actual results, add a server-side numerical validator with independent target values.

DAG now includes an interactive panel and independent numerical intervention demonstrating mediation/collider bias; DML adds a rough iid CI; DR nuisance fits are out-of-fold with reserved profiles. The model battle labels EconML/Causal Forest data as illustrative fixed numbers, not trained models.

Release gates: npm test, secure/demo builds, DB staging migration and consistency, each of 17 Pyodide blocks on desktop/mobile, isolated four-player Facilitator/Wall run, p50/p95 timing, no leakage before reveal, accessibility, 120-minute rehearsal. Synthetic academic data are not the real SharePoint source. Review three legacy tables with RLS disabled before any independent security migration; avoid breaking V1.
