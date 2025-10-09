// hooks/useSafeToast.ts
import { useCallback, useRef } from 'react';
import toast from 'react-hot-toast';

export function useSafeToast() {
  const toastQueue = useRef<(() => void)[]>([]);
  const isProcessing = useRef(false);

  const processQueue = useCallback(() => {
    if (isProcessing.current || toastQueue.current.length === 0) return;
    
    isProcessing.current = true;
    
    const queue = [...toastQueue.current];
    toastQueue.current = [];
    
    queue.forEach(toastFn => {
      toastFn();
    });
    
    // Allow next batch after a short delay
    setTimeout(() => {
      isProcessing.current = false;
      if (toastQueue.current.length > 0) {
        processQueue();
      }
    }, 100);
  }, []);

  const safeToast = useCallback((fn: () => void) => {
    toastQueue.current.push(fn);
    // Use requestAnimationFrame to ensure we're not in a render cycle
    requestAnimationFrame(processQueue);
  }, [processQueue]);

  return {
    success: (message: string) => safeToast(() => toast.success(message)),
    error: (message: string) => safeToast(() => toast.error(message)),
    loading: (message: string) => safeToast(() => toast.loading(message)),
    // Add other toast methods as needed
  };
}