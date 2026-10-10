'use client';

import { createContext, useContext } from 'react';
import type { AlertOptions, AlertResult, ConfirmOptions, DialogDefaults, FeedbackMessage } from '../types';

export interface ModalHandle<T> {
  decision: Promise<T>;
  closed: Promise<void>;
  update(state: { status: 'pending' | 'cancelling' | 'error'; message?: string }): void;
  close(reason?: 'aborted' | 'unmounted'): void;
}

export interface FeedbackBridge {
  getDialogDefaults(): DialogDefaults | undefined;
  confirm(
    options: ConfirmOptions,
    metadata: { id: string; ownerId: string; action?: string; signal?: AbortSignal; cancel?: () => void },
    retain?: boolean,
  ): ModalHandle<boolean>;
  alert(options: AlertOptions, metadata: { ownerId: string; signal?: AbortSignal }): ModalHandle<AlertResult>;
  dismissOwner(ownerId: string): void;
  notify(message: Omit<FeedbackMessage, 'id' | 'createdAt'>): () => void;
  dismiss(id: string): void;
}

export const FeedbackBridgeContext = createContext<FeedbackBridge | null>(null);

export function useFeedbackBridge() {
  return useContext(FeedbackBridgeContext);
}
