'use client';

import type { ReactNode } from 'react';
import { SubmitFlowProvider } from 'react-submit-flow';

export function Providers({ children }: { children: ReactNode }) {
  return <SubmitFlowProvider toastDuration={5000}>{children}</SubmitFlowProvider>;
}
