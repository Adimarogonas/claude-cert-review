import Head from "next/head";
import { useAppNavigation } from "@/controllers/useAppNavigation";
import ExamView from "@/views/ExamView";

export default function ExamPage() {
  const onNavigate = useAppNavigation();

  return (
    <>
      <Head>
        <title>Mock Exam - Claude Certified Architect</title>
      </Head>
      <ExamView onNavigate={onNavigate} />
    </>
  );
}
