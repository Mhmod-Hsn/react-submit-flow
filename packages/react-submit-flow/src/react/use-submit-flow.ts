'use client';

import { useEffect, useRef, useSyncExternalStore } from 'react';
import { FlowController } from '../core/controller';
import { useFeedbackBridge } from './bridge';
import type { ActionMap, FlowOptions, MappedRunResult, RunArguments } from '../types';

export function useSubmitFlow<T extends ActionMap>(actions: T, options: FlowOptions = {}) {
  const actionsRef = useRef(actions);
  const optionsRef = useRef(options);
  const bridge = useFeedbackBridge();
  const bridgeRef = useRef(bridge);
  actionsRef.current = actions;
  optionsRef.current = options;
  bridgeRef.current = bridge;

  const controllerRef = useRef<FlowController<T> | null>(null);
  if (!controllerRef.current) {
    controllerRef.current = new FlowController(
      () => actionsRef.current,
      () => optionsRef.current,
      () => bridgeRef.current,
    );
  }
  const controller = controllerRef.current;
  const snapshot = useSyncExternalStore(controller.subscribe, controller.getSnapshot, controller.getServerSnapshot);

  useEffect(() => controller.attach(), [controller]);

  return {
    ...snapshot,
    id: controller.id,
    run: (...args: RunArguments<T>) => controller.run(...args),
    cancel: controller.cancel,
    reset: controller.reset,
    clearFeedback: controller.clearFeedback,
  } as {
    id: string;
    status: typeof snapshot.status;
    isBusy: boolean;
    pendingAction: string | null;
    pendingLabel: string | null;
    lastResult: MappedRunResult<T> | null;
    feedback: typeof snapshot.feedback;
    run: (...args: RunArguments<T>) => Promise<MappedRunResult<T>>;
    cancel(): boolean;
    reset(): boolean;
    clearFeedback(): void;
  };
}
