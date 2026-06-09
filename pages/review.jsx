import Head from "next/head";
import { useAppNavigation } from "@/controllers/useAppNavigation";
import ReviewView from "@/views/ReviewView";

export default function ReviewPage() {
  const onNavigate = useAppNavigation();

  return (
    <>
      <Head>
        <title>Review Answers - Claude Certified Architect</title>
      </Head>
      <ReviewView onNavigate={onNavigate} />
    </>
  );
}
