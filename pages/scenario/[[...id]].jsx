import Head from "next/head";
import { useRouter } from "next/router";
import { useAppNavigation } from "@/controllers/useAppNavigation";
import ScenarioView from "@/views/ScenarioView";

function parseScenarioId(value) {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw) return null;
  const id = Number(raw);
  return Number.isFinite(id) ? id : null;
}

export default function ScenarioPage() {
  const router = useRouter();
  const onNavigate = useAppNavigation();
  const scenarioId = parseScenarioId(router.query.id);

  return (
    <>
      <Head>
        <title>Scenario Practice - Claude Certified Architect</title>
      </Head>
      <ScenarioView scenarioId={scenarioId} onNavigate={onNavigate} />
    </>
  );
}
