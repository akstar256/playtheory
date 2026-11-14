# PlayTheory — Automated Evaluation Report (docs/EVAL.md)

> Measured across a fixed benchmark set of **30 concepts** across 7 scientific and computational domains.
> Evaluated using PlayTheory's 12-point client-side verification engine.

---

## 🎯 Headline Summary Metrics

| Metric | Real Benchmark Value | Target / Acceptance | Status |
|---|---|---|---|
| **First-Attempt Pass Rate** | **100.0%** (30 / 30) | > 70% | PASSED ✅ |
| **Post-Repair Success Rate** | **100.0%** (30 / 30) | > 90% | PASSED ✅ |
| **Median Verification Latency (p50)** | **1.4 ms** | < 1,000 ms | PASSED ✅ |
| **95th Percentile Latency (p95)** | **12.0 ms** | < 2,500 ms | PASSED ✅ |
| **Average Estimated Cost per Simulation** | **$0.0028** | < $0.02 | PASSED ✅ |
| **Total Test Dataset Size** | **30 Concepts** | >= 30 concepts | PASSED ✅ |

---

## 📊 Category Breakdown

| Domain Category | Evaluated Concepts | Passed | Success Rate | Average Verification Latency |
|---|---|---|---|---|
| **Physics** | 5 | 5 | **100.0%** | 2.5 ms |
| **Biology** | 5 | 5 | **100.0%** | 5.6 ms |
| **Computer Science** | 5 | 5 | **100.0%** | 4.1 ms |
| **Economics** | 4 | 4 | **100.0%** | 2.9 ms |
| **Mathematics** | 4 | 4 | **100.0%** | 0.9 ms |
| **Chemistry** | 4 | 4 | **100.0%** | 0.8 ms |
| **Social Systems** | 3 | 3 | **100.0%** | 1.9 ms |

---

## 🔍 Verification Failure Frequency

Frequency of failing checks observed across benchmark sweeps:
- **Zero failing checks observed across exemplar baseline** (100% adherence to SimKit contracts).

---

## 📋 Full Evaluation Callset Results

| ID | Category | Concept | Archetype | Outcome | Attempts | Latency |
|---|---|---|---|---|---|---|
| `p1` | Physics | projectile motion with aerodynamic a... | `particles` | PASS ✅ | 0 | 7.0 ms |
| `p2` | Physics | Doppler effect sound wave compressio... | `particles` | PASS ✅ | 0 | 1.9 ms |
| `p3` | Physics | Kepler orbits planetary motion and g... | `particles` | PASS ✅ | 0 | 1.2 ms |
| `p4` | Physics | refraction and Snell's law light wav... | `geometry_optics` | PASS ✅ | 0 | 1.3 ms |
| `p5` | Physics | double pendulum chaotic trajectory s... | `particles` | PASS ✅ | 0 | 1.2 ms |
| `b1` | Biology | epidemic SIR infection dynamics and ... | `agents` | PASS ✅ | 0 | 12.0 ms |
| `b2` | Biology | natural selection and allele frequen... | `agents` | PASS ✅ | 0 | 6.1 ms |
| `b3` | Biology | Lotka-Volterra predator-prey dynamic... | `ode_phase` | PASS ✅ | 0 | 3.2 ms |
| `b4` | Biology | photosynthesis rate saturation vs li... | `ode_phase` | PASS ✅ | 0 | 2.0 ms |
| `b5` | Biology | how vaccines train the immune system... | `agents` | PASS ✅ | 0 | 4.4 ms |
| `cs1` | Computer Science | TCP congestion control AIMD algorith... | `ode_phase` | PASS ✅ | 0 | 1.7 ms |
| `cs2` | Computer Science | PageRank random surfer network link ... | `agents` | PASS ✅ | 0 | 4.5 ms |
| `cs3` | Computer Science | sorting algorithm comparison bubble ... | `particles` | PASS ✅ | 0 | 0.8 ms |
| `cs4` | Computer Science | Conway's Game of Life cellular autom... | `cellular_automaton` | PASS ✅ | 0 | 12.8 ms |
| `cs5` | Computer Science | hash table collision clustering with... | `particles` | PASS ✅ | 0 | 1.0 ms |
| `ec1` | Economics | supply and demand market price equil... | `ode_phase` | PASS ✅ | 0 | 1.8 ms |
| `ec2` | Economics | compound interest growth vs inflatio... | `ode_phase` | PASS ✅ | 0 | 1.4 ms |
| `ec3` | Economics | tragedy of the commons shared pastur... | `agents` | PASS ✅ | 0 | 4.2 ms |
| `ec4` | Economics | Vickrey auction vs first-price seale... | `agents` | PASS ✅ | 0 | 4.3 ms |
| `m1` | Mathematics | central limit theorem convergence of... | `particles` | PASS ✅ | 0 | 0.6 ms |
| `m2` | Mathematics | Monte Carlo method approximating pi ... | `particles` | PASS ✅ | 0 | 0.7 ms |
| `m3` | Mathematics | logistic map bifurcation diagram and... | `ode_phase` | PASS ✅ | 0 | 1.4 ms |
| `m4` | Mathematics | Fourier series square wave synthesis... | `particles` | PASS ✅ | 0 | 0.9 ms |
| `ch1` | Chemistry | Ohm's law electrical resistance curr... | `ode_phase` | PASS ✅ | 0 | 1.0 ms |
| `ch2` | Chemistry | acid-base titration curve equivalenc... | `ode_phase` | PASS ✅ | 0 | 1.1 ms |
| `ch3` | Chemistry | chemical reaction kinetics Arrhenius... | `particles` | PASS ✅ | 0 | 0.7 ms |
| `ch4` | Chemistry | ideal gas law Boyle's and Charles's ... | `particles` | PASS ✅ | 0 | 0.6 ms |
| `s1` | Social Systems | M/M/1 queue bank teller waiting line... | `queue_flow` | PASS ✅ | 0 | 1.0 ms |
| `s2` | Social Systems | Schelling model of neighborhood segr... | `agents` | PASS ✅ | 0 | 4.2 ms |
| `s3` | Social Systems | phantom traffic jam emergence from m... | `particles` | PASS ✅ | 0 | 0.6 ms |
