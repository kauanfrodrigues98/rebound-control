import { watch, type WatchSource } from 'vue';

type FeedbackColor = 'error' | 'success' | 'warning' | 'info';

/** Display operation feedback through the application toaster. */
export function useFeedbackToast(
  source: WatchSource<string | null | undefined>,
  color: FeedbackColor = 'error',
): void {
  const toast = useToast();
  if (!import.meta.client) return;

  watch(source, (description) => {
    if (!description?.trim()) return;
    toast.add({
      title: color === 'error' ? 'Não foi possível concluir' : color === 'success' ? 'Concluído' : 'Atenção',
      description,
      color,
      icon: color === 'error' ? 'i-lucide-circle-alert' : color === 'success' ? 'i-lucide-circle-check' : 'i-lucide-info',
      duration: color === 'error' ? 8000 : 5000,
    });
  }, { immediate: true, flush: 'sync' });
}
