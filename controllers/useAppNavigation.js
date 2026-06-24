import { useCallback } from 'react';
import { useRouter } from 'next/router';

export function routeForMode(mode, scenarioId = null) {
  if (mode === 'exam') return '/exam';
  if (mode === 'review') return '/review';
  if (mode === 'spaced') return '/spaced';
  if (mode === 'modules') return '/modules';
  if (mode === 'module') return scenarioId ? `/modules/${scenarioId}` : '/modules';
  if (mode === 'scenario') {
    return scenarioId ? `/scenario/${scenarioId}` : '/scenario';
  }
  return '/';
}

export function useAppNavigation() {
  const router = useRouter();

  return useCallback(
    (mode, scenarioId = null) => {
      router.push(routeForMode(mode, scenarioId));
    },
    [router]
  );
}
