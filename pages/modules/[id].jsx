import Head from 'next/head';
import { useRouter } from 'next/router';
import { useAppNavigation } from '@/controllers/useAppNavigation';
import ModuleDetailView from '@/views/ModuleDetailView';
import { getTaskStatement } from '@/models/modules';

export default function ModuleDetailPage() {
  const router = useRouter();
  const onNavigate = useAppNavigation();
  const { id } = router.query;

  const title = id ? getTaskStatement(id)?.taskStatement?.title ?? 'Module' : 'Module';

  return (
    <>
      <Head>
        <title>{title} — Claude Certified Architect</title>
      </Head>
      {id && (
        <ModuleDetailView
          taskId={id}
          onBack={() => onNavigate('modules')}
        />
      )}
    </>
  );
}
