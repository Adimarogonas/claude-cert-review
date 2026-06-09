import Head from "next/head";
import { useAppNavigation } from "@/controllers/useAppNavigation";
import HomeView from "@/views/HomeView";

export default function HomePage() {
  const onNavigate = useAppNavigation();

  return (
    <>
      <Head>
        <title>Claude Certified Architect - Practice Exam</title>
        <meta
          name="description"
          content="Study by scenario or take a timed mock exam for the Claude Certified Architect certification."
        />
      </Head>
      <HomeView onNavigate={onNavigate} />
    </>
  );
}
