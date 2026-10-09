'use client';

import { useCallback, useEffect, useId, useRef } from 'react';
import { useFeedbackBridge } from './bridge';
import type { AlertOptions, AlertResult, ConfirmOptions } from '../types';

export function useSubmitFeedback() {
  const bridge = useFeedbackBridge();
  const ownerId = useId();
  const mounted = useRef(false);
  const sequence = useRef(0);
  if (!bridge) throw new Error('react-submit-flow: useSubmitFeedback() must be used inside <SubmitFlowProvider>.');
  const currentBridge = bridge;
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      currentBridge.dismissOwner(ownerId);
    };
  }, [currentBridge, ownerId]);

  // The effect tracks owner cleanup. Requests are created only from event handlers.
  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    if (!mounted.current) return Promise.resolve(false);
    const handle = currentBridge.confirm(options, {
      id: `dialog-${ownerId}-${++sequence.current}`,
      ownerId,
      signal: options.signal,
    });
    return handle.decision;
  }, [currentBridge, ownerId]);

  const alert = useCallback((options: AlertOptions): Promise<AlertResult> => {
    if (!mounted.current) return Promise.resolve({ status: 'dismissed', reason: 'unmounted' });
    return currentBridge.alert(options, { ownerId, signal: options.signal }).decision;
  }, [currentBridge, ownerId]);

  return { confirm, alert };
}
