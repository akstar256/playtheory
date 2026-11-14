# AI Usage & Disclosure

> Submitted for IceHacks 2026 in compliance with hackathon rules regarding disclosure of AI assistance and developer tooling.

## 1. Development & Engineering Agents
- **Antigravity (Google DeepMind)**: Served as lead autonomous software engineer for project architecture, code generation, test authoring, and documentation following `PlayTheory_Master_Build_Brief.md`.

## 2. Runtime Model Providers
- **Google Gemini API**:
  - `gemini-2.5-pro`: Utilized by the Simulation Planner (`/api/plan`) for concept decomposition, mathematical modeling, and structured JSON `SimSpec` generation.
  - `gemini-2.5-flash`: Utilized by the Code Builder (`/api/build`) and Self-Repair Loop (`/api/repair`) for constrained JavaScript simulation module authoring.

## 3. Sponsor Tooling & Infrastructure
- **Upstash Redis**: Serverless KV database used for simulation persistence, prompt caching, and per-IP rate limiting.
- **Vercel**: Serverless hosting platform for Next.js web application and edge execution.
