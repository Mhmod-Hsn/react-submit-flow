'use client';

import { createContext, useContext, type ReactNode } from 'react';
import type { ActionMap, ActionInput, ActionNames } from '../types';
import type { FlowSnapshot } from '../core/controller';

export interface PublicFlow<T extends ActionMap = ActionMap> extends FlowSnapshot {
  id: string;
  run(...args: import('../types').RunArguments<T>): Promise<import('../types').MappedRunResult<T>>;
  cancel(): boolean;
  reset(): boolean;
  clearFeedback(): void;
}

export type FormInputs<T extends ActionMap> = Partial<{
  [K in ActionNames<T>]: (data: FormData, submitter: HTMLElement | null) => ActionInput<T[K]>;
}>;

// Context is a UI state bridge. Its action signatures are intentionally erased
// here; callers that invoke `run` should retain the typed value from the hook.
const FlowContext = createContext<PublicFlow<any> | null>(null);

export function FlowContextRoot({ flow, children }: { flow: PublicFlow<any>; children: ReactNode }) {
  return <FlowContext.Provider value={flow}>{children}</FlowContext.Provider>;
}

export function useFlowContext() {
  const flow = useContext(FlowContext);
  if (!flow) throw new Error('react-submit-flow: place this component inside <SubmitFlowRoot> or <SubmitFlowForm>.');
  return flow;
}

export function useOptionalFlowContext() {
  return useContext(FlowContext);
}
