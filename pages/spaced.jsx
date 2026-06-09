import Head from "next/head";
import { useAppNavigation } from "@/controllers/useAppNavigation";
import SpacedRepetitionView from "@/views/SpacedRepetitionView";

export default function SpacedPage() {
  const onNavigate = useAppNavigation();

  return (
    <>
      <Head>
        <title>Spaced Repetition - Claude Certified Architect</title>
      </Head>
      <SpacedRepetitionView onNavigate={onNavigate} />
    </>
  );
}
