import { notFound } from "next/navigation";
import { getStore } from "@/lib/store";
import { ARCHETYPE_EXEMPLARS } from "@/lib/archetypes";
import { SimulationView } from "./SimulationView";

export const dynamic = "force-dynamic";

interface SimulationPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: SimulationPageProps) {
  const { slug } = await params;
  const store = getStore();
  const sim = (await store.getSim(slug)) || (ARCHETYPE_EXEMPLARS[slug.replace("-exemplar", "")] ? {
    spec: ARCHETYPE_EXEMPLARS[slug.replace("-exemplar", "")].spec,
  } : null);

  if (!sim) {
    return { title: "Simulation Not Found — PlayTheory" };
  }

  return {
    title: `${sim.spec.title} — PlayTheory Simulation`,
    description: sim.spec.coreIdea,
    openGraph: {
      title: `${sim.spec.title} — PlayTheory`,
      description: sim.spec.coreIdea,
    },
  };
}

export default async function SimulationPage({ params }: SimulationPageProps) {
  const { slug } = await params;
  const store = getStore();

  let sim = await store.getSim(slug);

  // Fallback to built-in exemplar if requested directly or local testing
  if (!sim) {
    const exemplarKey = slug.replace("-exemplar", "");
    if (ARCHETYPE_EXEMPLARS[exemplarKey]) {
      const exemplar = ARCHETYPE_EXEMPLARS[exemplarKey];
      sim = {
        slug,
        spec: exemplar.spec,
        code: exemplar.code,
        report: {
          status: "pass",
          attempt: 0,
          codeHash: "seed",
          checks: [],
          timings: { stepMsAvg: 0.5, drawMsAvg: 1.2 },
        },
        repairHistory: [],
        createdAt: Date.now(),
        source: "seed",
        cacheKey: `seed_${exemplarKey}`,
        hits: 1,
      };
    }
  }

  if (!sim) {
    notFound();
  }

  return <SimulationView sim={sim} />;
}
