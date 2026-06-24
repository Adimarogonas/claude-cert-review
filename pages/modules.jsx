import Head from 'next/head';
import { useAppNavigation } from '@/controllers/useAppNavigation';
import ModuleListView from '@/views/ModuleListView';

export default function ModulesPage() {
  const onNavigate = useAppNavigation();

  return (
    <>
      <Head>
        <title>Study by Domain — Claude Certified Architect</title>
      </Head>
      <ModuleListView onNavigate={onNavigate} />
    </>
  );
}
