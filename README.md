# ProofMesh: Autonomous AI Research Scientist

> **Production-grade autonomous research platform that turns complex research questions into structured, falsifiable, and explainable evidence graphs with cryptographic claim-level provenance.**

[![Next.js 16](https://img.shields.io/badge/Next.js-16.4.3-black?style=flat&logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?style=flat&logo=tailwind-css)](https://tailwindcss.com/)
[![React Flow](https://img.shields.io/badge/@xyflow/react-12-FF0072?style=flat)](https://reactflow.dev/)
[![Gemini](https://img.shields.io/badge/Gemini-AI%20Studio-orange?style=flat&logo=google)](https://ai.google.dev/)
[![TinyFish](https://img.shields.io/badge/TinyFish-Web%20Agent%20API-emerald?style=flat)](https://tinyfish.ai)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=flat&logo=supabase)](https://supabase.com)

---

## Table of Contents

- [What is ProofMesh?](#what-is-proofmesh)
- [How ProofMesh Differs from Claude / ChatGPT / Perplexity](#how-proofmesh-differs-from-claude--chatgpt--perplexity)
- [Key Systems & Competitive Differentiation](#key-systems--competitive-differentiation)
- [System Architecture & Swarm Topology](#system-architecture--swarm-topology)
- [Live Observability & Research Console](#live-observability--research-console)
- [Prerequisites & Installation](#prerequisites--installation)
- [Environment Configuration](#environment-configuration)
- [Database Setup (Supabase & Local Store)](#database-setup-supabase--local-store)
- [Running ProofMesh](#running-proofmesh)
- [Automated Acceptance Testing](#automated-acceptance-testing)
- [Repository Structure](#repository-structure)
- [Verification Benchmark Results](#verification-benchmark-results)

---

## What is ProofMesh?

ProofMesh is not an AI chatbot, search wrapper, or linear report generator. It is an **autonomous research scientist** designed to execute end-to-end investigative workflows:

1. **Compiles & Decomposes:** Converts ambiguous natural language questions into formal hypotheses, null hypotheses, and research objectives organized into a Directed Acyclic Graph (DAG).
2. **Dispatches Dynamic Swarms:** Spawns specialized agents (Economic, Regulatory, Technical, Supply Chain, Skeptic) according to the problem requirements.
3. **Conducts Deep Web Research:** Leverages high-speed direct retrieval alongside the TinyFish Web Agent API to crawl primary sources, regulatory notices, and academic literature.
4. **Enforces Adversarial Popperian Falsification:** Deploys dedicated Skeptic Agents to challenge confirmation bias, compute empirical support/contradiction weights, and derive a quantitative **Swarm Truth Index**.
5. **Maintains a Cryptographic Evidence Ledger:** Anchors every claim to an exact verbatim passage with an immutable **SHA-256 hash** and audit trail.
6. **Builds an Interactive Evidence Graph:** Renders a 2D topological graph linking Hypotheses, Claims, Sources, and Contradictions in React Flow.
7. **Tracks Longitudinal Drift:** Provides temporal intelligence to detect source text mutations and regulatory amendments across time.

---

## How ProofMesh Differs from Claude / ChatGPT / Perplexity

When you prompt **Claude** (even Claude with Web Search) or Perplexity, you interact with a **single-session statistical text synthesizer**. It retrieves a handful of search engine snippets, places them in a context window, and writes a smooth essay that tends to agree with your premise.

**ProofMesh is a persistent, verifiable research infrastructure.**

### Comparative Matrix

| Capability | Prompting Claude / Perplexity | ProofMesh Autonomous Research Scientist |
| :--- | :--- | :--- |
| **Execution Model** | **Monolithic & Ephemeral.** Single LLM generating linear text sequentially in one chat turn. Context is lost when the tab closes. | **Hierarchical Swarm DAG.** Master Planner compiles queries into formal hypotheses, dependency trees, and dispatches parallel specialized agents. |
| **Web Exploration** | **Shallow SERP Snippets.** Takes top 3–5 search engine summary snippets; cannot navigate deep DOMs or complex workflows. | **Deep Multi-Tier Browsing.** Dual-engine web extraction pairing high-speed HTTP scrapers with headless browser agents (TinyFish) navigating deep portals. |
| **Confirmation Bias** | **Sycophantic / Agreeable.** Tends to adopt the prompt's implicit assumptions and smooths over conflicting data into agreeable prose. | **Popperian Adversarial Falsification.** Explicitly assigns **Skeptic Agents** mandated to disprove hypotheses and calculates a mathematical **Swarm Truth Index**. |
| **Citation Ground Truth** | **Decorative Footnotes.** URLs inserted in prose; frequently hallucinated, broken, generic homepages, or detached from the sentence claim. | **Cryptographic Evidence Ledger.** Every claim is anchored to a **SHA-256 hashed verbatim passage excerpt**. If 1 byte changes, verification fails. |
| **Handling Contradictions** | **Muddled Compromise.** Merges opposing views into generic phrases like *"some experts say X, while others note Y"*. | **Conflict Detection & Adaptive Spawning.** Flags irreconcilable claims (e.g. $180k CAPEX vs. $3,450/ton levelized cost) and dynamically spawns **Verification Agents**. |
| **Failure Tolerance** | **Single Point of Failure.** If a search query times out or a site blocks the request, the chat aborts or hallucinates missing details. | **Circuit Breakers & Fault Isolation.** Isolated per-task error boundaries. If 2 of 21 website tasks return `403 Forbidden`, remaining tasks continue cleanly. |
| **Knowledge Representation** | **Flat Markdown Text.** Linear walls of paragraphs. | **Interactive Topological Graph.** Visual React Flow knowledge graph connecting Objectives $\rightarrow$ Hypotheses $\rightarrow$ Claims $\rightarrow$ Sources $\rightarrow$ Contradiction edges. |
| **Longitudinal Tracking** | **Frozen in Time.** To see if anything changed, you must start from scratch and re-read a new chat. | **Temporal Intelligence & Diffing.** Re-crawls sources over time to detect regulatory amendments or market price shifts, computing a temporal delta between runs. |
| **Scientific Reproducibility** | **Non-reproducible.** Re-prompting Claude yields different wording, different points, and no chain-of-custody logs. | **Immutable Run Snapshots.** Versioned snapshots (`v1`, `v2`), raw crawled artifacts, agent execution logs, and verifiable audit trails. |

---

## Key Systems & Competitive Differentiation

### 1. Research Compiler
Translates ambiguous user queries into structured investigation plans containing:
- Primary and sub-hypotheses
- Explicit **Null Hypotheses ($H_0$)** formulated for Popperian falsification
- Entity extraction, geographical boundaries, and temporal horizons
- Required evidence schemas and domain constraints

### 2. Dynamic Hierarchical Swarm
Rather than fixed, hardcoded agents, the orchestrator inspects the decomposition and dynamically spawns:
- **Economic Research Agents:** Baseline cost models, unit economics, levelized CAPEX/OPEX.
- **Technical & Engineering Agents:** Material recovery yields, throughput, latency, architecture.
- **Regulatory & Policy Agents:** Compliance mandates (e.g., CPCB Battery Waste Rules, HIPAA standards).
- **Counterargument & Skeptic Agents:** Documented failure modes, operational risks, and hidden costs.

### 3. Adversarial Popperian Dialectic
The system does not accept claims simply because a source asserts them:
- Proponent and Skeptic findings are cross-examined.
- A quantitative **Swarm Truth Index** is calculated:
  $$\text{Truth Index} = \frac{\sum w_{\text{support}}}{\sum w_{\text{support}} + \sum w_{\text{contradiction}}}$$
- If empirical contradiction weight exceeds thresholds, hypotheses are formally flagged as unviable or contested.

### 4. Cryptographic Evidence Ledger
- Every extracted claim stores:
  - Verbatim original passage
  - **SHA-256 hash** of the raw text
  - Source URL and verified domain
  - Extraction timestamp and agent ID
- Clicking any node in the UI drawer highlights the exact excerpt within the original source text.

### 5. Adaptive Spawning
When severe contradictions or critical information gaps are discovered during execution, the orchestrator dynamically spawns new **Verification Tasks** and dispatches supplemental agents within configured budget limits.

### 6. Temporal Intelligence
Persists investigations and periodically audits sources:
- Monitors source URLs for text mutations and regulatory amendments.
- Flags **Temporal Drift** (e.g., revised recycling targets from 2022 to 2026).
- Displays chronological diffs of research conclusions.

### 7. Interactive Evidence Topology
- React Flow interactive canvas displaying:
  - Root Hypothesis Nodes
  - Dynamic Objective Nodes
  - Claim / Evidence Nodes (color-coded by stance: Supports, Contradicts, Neutral)
  - Primary Source Nodes
  - Contradiction Nodes linking conflicting claims

---

## System Architecture & Swarm Topology

```
                          ┌────────────────────────┐
                          │   User Research Query  │
                          └───────────┬────────────┘
                                      │
                                      ▼
                        ┌───────────────────────────┐
                        │     Research Compiler     │
                        │ (Falsifiable Hypotheses)  │
                        └─────────────┬─────────────┘
                                      │
                                      ▼
                      ┌───────────────────────────────┐
                      │   Swarm Planner & Dispatcher  │
                      └───────┬───────────────┬───────┘
                              │               │
             ┌────────────────┼───────────────┼────────────────┐
             ▼                ▼               ▼                ▼
     ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
     │   Economic   │ │  Technical   │ │  Regulatory  │ │ Adversarial  │
     │    Agent     │ │    Agent     │ │    Agent     │ │Skeptic Agent │
     └───────┬──────┘ └───────┬──────┘ └───────┬──────┘ └───────┬──────┘
             │                │               │                │
             └────────────────┼───────────────┼────────────────┘
                              ▼
                ┌───────────────────────────┐
                │   Resilient Task Queue    │
                │  (Bounded 2-Concurrency,  │
                │   Circuit Breaker, 20s)   │
                └─────────────┬─────────────┘
                              │
             ┌────────────────┴───────────────┐
             ▼                                ▼
     ┌──────────────┐                 ┌──────────────┐
     │ Direct Scrap │                 │   TinyFish   │
     │ (Fast Fetch) │                 │  Web Agent   │
     └───────┬──────┘                 └───────┬──────┘
             │                                │
             └────────────────┬───────────────┘
                              │
                              ▼
                ┌───────────────────────────┐
                │   Streaming Aggregator    │
                │  - Claim Extraction       │
                │  - SHA-256 Hash Ledger    │
                │  - Conflict Detector      │
                └─────────────┬─────────────┘
                              │
                              ▼
                ┌───────────────────────────┐
                │    Interactive Topology   │
                │   & Final Report Engine   │
                └───────────────────────────┘
```

---

## Live Observability & Research Console

ProofMesh eliminates blank loading screens with a real-time event-driven observability workstation:

- **Route:** `/research/[id]/live`
- **Real-Time SSE Bus:** High-throughput streaming via Server-Sent Events (`/api/research/[id]/stream`).
- **5 Live Console Regions:**
  1. **Overview Bar:** Query, session ID, elapsed timer, live agent counters, task completion meters.
  2. **Live Agent Monitor:** Real-time state cards for every agent (progress, status, current action).
  3. **Live Activity Stream:** Filterable event feed (Agents, Tasks, Evidence, Errors, System).
  4. **Website Activity Inspector:** Real-time tracking of URL navigation, HTTP status, and task duration.
  5. **Live Evidence Discovery:** Instant feed of claims as they are extracted and hashed.

---

## Prerequisites & Installation

### Prerequisites
- **Node.js:** v18.18.0 or higher (Node 20+ recommended).
- **Package Manager:** `npm`, `pnpm`, or `yarn`.
- **API Keys:**
  - Google Gemini API Key ([Google AI Studio](https://aistudio.google.com/))
  - TinyFish Web Agent API Key ([TinyFish Agent Portal](https://agent.tinyfish.ai/))

### Installation Steps

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-org/proofmesh.git
   cd proofmesh
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

---

## Environment Configuration

Create a `.env.local` file in the root directory:

```bash
cp .env.example .env.local
```

Populate the following variables:

```env
# Required: Google Gemini API (Compiler, Claim Extraction, Report Synthesis)
GEMINI_API_KEY=your_gemini_api_key_here

# Required: TinyFish Web Agent API (Deep Autonomous Web Browsing)
TINYFISH_API_KEY=your_tinyfish_api_key_here

# Optional: Supabase PostgreSQL (Cloud Database Persistence)
# If omitted or not yet migrated, ProofMesh automatically uses local persistent storage (.data/)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

---

## Database Setup (Supabase & Local Store)

ProofMesh features **Dual-Engine Persistence**:

### Mode A: Zero-Config Local Store (Default)
Out of the box, ProofMesh requires no external database. All research sessions, agents, website tasks, evidence graphs, cryptographic ledgers, and reproducibility snapshots are persisted in:
- `.data/proofmesh.json`
- `.data/ledger/`
- `.data/snapshots/`
- `.data/temporal/`

### Mode B: Supabase PostgreSQL (Production)
To enable cloud storage in your Supabase project:
1. Navigate to the **[Supabase SQL Editor](https://supabase.com/dashboard/project/_/sql/new)**.
2. Copy and run the schema file located at:
   [`supabase/migrations/20261101_init_proofmesh.sql`](file:///d:/Code/proofmesh/supabase/migrations/20261101_init_proofmesh.sql)
3. The schema creates 10 tables:
   - `research_sessions`
   - `research_objectives`
   - `research_agents`
   - `website_tasks`
   - `sources`
   - `claims`
   - `contradictions`
   - `evidence_graph_nodes`
   - `evidence_graph_edges`
   - `research_reports`
4. ProofMesh will automatically detect the tables and store all run data in PostgreSQL.

---

## Running ProofMesh

### Development Mode
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build
```bash
npm run build
npm run start
```
The application compiles under Next.js 16 with Partial Prerendering (PPR) and Turbopack optimization.

---

## Automated Acceptance Testing

ProofMesh includes an end-to-end acceptance test suite verifying all 13 core requirements (Tests A through M):

| Test | Objective | Verification Target |
| :---: | :--- | :--- |
| **A** | Research Compiler Decomposition | Generates $\ge 3$ objectives, falsifiable predicates, search queries |
| **B** | Dynamic Agent Hierarchy | Spawns specialized agents matching problem domain |
| **C** | TinyFish Headless Web Browsing | Web search and content normalization |
| **D** | Structured Claim Extraction | Verbatim passage, stance, confidence, and source binding |
| **E** | Contradiction Detection | Identifies conflicts between contradictory sources |
| **F** | Interactive Evidence Graph | Validates DAG nodes, positions, and typed edges |
| **G** | Fault Isolation & Error Boundaries | Verifies system survives 403, timeouts, and network blocks |
| **H** | Partial Results Usability | Generates valid report and graph even with failed tasks |
| **I** | Adversarial Research | Validates Popperian skeptic agent & Swarm Truth Index |
| **J** | Cryptographic Provenance Ledger | Validates SHA-256 byte-level hash verification |
| **K** | Adaptive Research Investigation | Dynamic spawning of verification agents on conflicts |
| **L** | Temporal Intelligence | Tracks source text mutations and regulatory drift |
| **M** | Research Reproducibility | Creates immutable versioned snapshots and delta diffing |

### Running the Test Suite:
```bash
npm test
```
*Result: 13/13 passing tests.*

---

## Repository Structure

```
proofmesh/
├── app/
│   ├── api/
│   │   └── research/             # REST & SSE endpoints
│   │       ├── [id]/stream/      # Real-time Server-Sent Events stream
│   │       ├── [id]/graph/       # Evidence graph API
│   │       ├── [id]/ledger/      # Cryptographic provenance ledger API
│   │       ├── [id]/temporal/    # Temporal drift detection API
│   │       └── [id]/snapshots/   # Versioned run snapshots API
│   ├── research/
│   │   ├── [id]/page.tsx         # Results Workstation (Graph, Report, Ledger)
│   │   └── [id]/live/page.tsx    # Live Observability Console
│   └── page.tsx                  # Query Formulation & Research Launcher
├── components/
│   ├── dashboard/                # Observability & Analysis panels
│   │   ├── EvidenceLedgerPanel.tsx
│   │   ├── AdversarialPanel.tsx
│   │   ├── TemporalAuditPanel.tsx
│   │   ├── ReproducibilityPanel.tsx
│   │   └── AgentGrid.tsx
│   └── graph/                    # React Flow Evidence Graph visualization
│       ├── EvidenceGraph.tsx
│       └── EvidenceDetailDrawer.tsx
├── lib/
│   ├── ai/
│   │   └── gemini.ts             # Google Gemini API client
│   ├── database/
│   │   ├── ledger.ts             # SHA-256 Provenance Ledger engine
│   │   ├── store.ts              # Dual-mode repository (Supabase + Local)
│   │   └── supabase.ts           # Supabase client initializer
│   ├── observability/            # Real-time event bus & stream handlers
│   │   ├── event-bus.ts
│   │   ├── event-emitter.ts
│   │   └── event-stream.ts
│   ├── research-engine/          # Autonomous Scientist core engine
│   │   ├── compiler.ts           # Question compiler & hypothesis generator
│   │   ├── orchestrator.ts       # Dynamic swarm coordinator
│   │   ├── task-queue.ts         # Resilient bounded-concurrency task pool
│   │   ├── adversarial.ts        # Popperian falsification & Truth Index
│   │   ├── adaptive.ts           # Dynamic verification task generator
│   │   ├── temporal.ts           # Longitudinal change detector
│   │   └── reproducibility.ts    # Run snapshotting & delta diffing
│   └── tinyfish/                 # TinyFish Web Agent API & fast-fetch scrapers
├── supabase/
│   └── migrations/               # PostgreSQL schema migration
└── tests/
    └── acceptance.test.ts        # Complete 13-test automated test suite
```

---

## Verification Benchmark Results

ProofMesh was benchmarked on the complex investigation:

> *"Is small-scale lithium-ion battery recycling economically and technically viable in India by 2028? Investigate capital expenditure, operating costs, lithium recovery efficiency, feedstock availability, Indian environmental regulations, market demand, and environmental risks."*

### Benchmark Highlights:
- **Objectives Formulated:** 6 specialized objectives with explicit falsifiable null hypotheses.
- **Agents Dispatched:** 4 dynamic agents (Economic, Technical, Regulatory, Counterargument Skeptic).
- **Website Tasks:** 21 individual target URLs executed with bounded concurrency.
- **Injected Failure Handling:** 1 source intentionally injected with `HTTP 403 Forbidden`; isolated and logged without stalling execution.
- **Claims Extracted & Hashed:** 19 verified claims with byte-level SHA-256 hashes.
- **Contradictions Identified:** Resolved empirical divergence between standard hydrometallurgy CAPEX ($180k) vs. levelized operating cost ($3,450/ton).
- **Topology:** Generated 44-node interactive evidence graph.
- **Auditability:** Complete chain-of-custody recorded in `.data/ledger/` and `.data/snapshots/`.

---

## License

MIT License. Built for rigorous, explainable, and verifiable autonomous research.
