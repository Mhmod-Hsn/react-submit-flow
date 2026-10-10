'use client';

import {
  useEffect,
  useRef,
  useSyncExternalStore,
  type CSSProperties,
} from 'react';
import type {
  AlertOptions,
  AlertResult,
  ConfirmOptions,
  DialogRequest,
  FeedbackMessage,
  ProviderOptions,
} from '../types';
import { FeedbackBridgeContext, type FeedbackBridge, type ModalHandle } from '../react/bridge';

type ModalEntry = {
  request: DialogRequest;
  kind: 'confirm' | 'alert';
  retain: boolean;
  decided: boolean;
  resolve(value: boolean | AlertResult): void;
  closed(): void;
  cancel?: () => void;
  removeAbort?: () => void;
};

interface ProviderSnapshot {
  active: DialogRequest | null;
  toasts: FeedbackMessage[];
}

const emptySnapshot: ProviderSnapshot = { active: null, toasts: [] };
let dialogSequence = 0;
let toastSequence = 0;

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => { resolve = done; });
  return { promise, resolve };
}

class FeedbackStore implements FeedbackBridge {
  private snapshot: ProviderSnapshot = emptySnapshot;
  private listeners = new Set<() => void>();
  private entries = new Map<string, ModalEntry>();
  private waiting: string[] = [];
  private activeId: string | null = null;
  private toastTimers = new Map<string, ReturnType<typeof setTimeout>>();
  private options: Pick<ProviderOptions, 'dialogDefaults' | 'toastDuration' | 'maxVisibleToasts' | 'portalContainer'> = {};

  configure(options: ProviderOptions) {
    this.options = options;
  }

  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };
  getSnapshot = () => this.snapshot;
  getServerSnapshot = () => emptySnapshot;

  confirm(options: ConfirmOptions, metadata: { id: string; ownerId: string; action?: string; signal?: AbortSignal; cancel?: () => void }, retain = false): ModalHandle<boolean> {
    const merged = this.normalize(options);
    return this.enqueue<boolean>(
      { ...merged, id: metadata.id, ownerId: metadata.ownerId, kind: 'confirm' },
      'confirm', metadata.signal, retain, metadata.cancel,
    );
  }

  alert(options: AlertOptions, metadata: { ownerId: string; signal?: AbortSignal }): ModalHandle<AlertResult> {
    const id = `alert-${metadata.ownerId}-${++dialogSequence}`;
    const merged = this.normalize(options);
    return this.enqueue<AlertResult>(
      { ...merged, id, ownerId: metadata.ownerId, kind: 'alert', acknowledgeLabel: options.acknowledgeLabel ?? 'OK' },
      'alert', metadata.signal, false,
    );
  }

  private normalize(options: ConfirmOptions): Omit<DialogRequest, 'id' | 'ownerId' | 'kind'> {
    const defaults = this.options.dialogDefaults;
    const destructive = options.destructive ?? defaults?.destructive ?? false;
    const variant = options.variant ?? defaults?.variant ?? (destructive ? 'danger' : 'neutral');
    const size = options.size ?? defaults?.size ?? 'md';
    const width = options.width ?? defaults?.width;
    return {
      ...options,
      variant,
      size,
      width,
      confirmLabel: options.confirmLabel ?? defaults?.confirmLabel ?? 'Confirm',
      cancelLabel: options.cancelLabel ?? defaults?.cancelLabel ?? 'Cancel',
      destructive,
      closeOnEscape: options.closeOnEscape ?? defaults?.closeOnEscape ?? true,
      outsidePress: options.outsidePress ?? defaults?.outsidePress ?? false,
      portalContainer: options.portalContainer ?? this.options.portalContainer,
      phase: 'decision',
    };
  }

  private enqueue<T>(
    request: DialogRequest,
    kind: 'confirm' | 'alert',
    signal: AbortSignal | undefined,
    retain: boolean,
    cancel?: () => void,
  ): ModalHandle<T> {
    const result = deferred<boolean | AlertResult>();
    const closed = deferred<void>();
    const entry: ModalEntry = {
      request,
      kind,
      retain,
      decided: false,
      resolve: result.resolve,
      closed: closed.resolve,
      cancel,
    };
    this.entries.set(request.id, entry);
    this.waiting.push(request.id);
    if (signal?.aborted) {
      this.dismissDialog(request.id, 'aborted');
    } else if (signal) {
      const listener = () => {
        if (!entry.decided) this.dismissDialog(request.id, 'aborted');
      };
      signal.addEventListener('abort', listener, { once: true });
      entry.removeAbort = () => signal.removeEventListener('abort', listener);
    }
    this.pump();

    return {
      decision: result.promise as Promise<T>,
      closed: closed.promise,
      update: (state) => this.update(request.id, state),
      close: (reason) => this.closeHandle(request.id, reason),
    };
  }

  private closeHandle(id: string, reason?: 'aborted' | 'unmounted') {
    const entry = this.entries.get(id);
    if (!entry) return;
    if (!entry.decided) {
      entry.decided = true;
      entry.removeAbort?.();
      entry.resolve(entry.kind === 'alert'
        ? { status: 'dismissed', reason: reason === 'unmounted' ? 'unmounted' : 'aborted' }
        : false);
    }
    this.finishEntry(entry);
  }

  answer(id: string, accepted: boolean) {
    const entry = this.entries.get(id);
    if (!entry || entry.decided) return;
    entry.decided = true;
    entry.removeAbort?.();
    if (entry.kind === 'alert') {
      entry.resolve(accepted ? { status: 'acknowledged' } : { status: 'dismissed', reason: 'escape' });
      this.finishEntry(entry);
      return;
    }
    entry.resolve(accepted);
    if (!entry.retain || !accepted) this.finishEntry(entry);
    else this.setActive(entry.request);
  }

  cancelExecution(id: string) {
    const entry = this.entries.get(id);
    if (!entry || !entry.decided || !entry.cancel) return;
    entry.request = { ...entry.request, phase: 'cancelling', phaseMessage: 'Cancelling…' };
    this.setActive(entry.request);
    entry.cancel();
  }

  dismissDialog(id: string, reason: 'escape' | 'outside' | 'aborted' | 'unmounted') {
    const entry = this.entries.get(id);
    if (!entry) return;
    if (entry.decided && entry.retain && entry.request.phase !== 'error' && reason !== 'unmounted') return;
    if (!entry.decided) {
      entry.decided = true;
      entry.removeAbort?.();
      entry.resolve(entry.kind === 'alert' ? { status: 'dismissed', reason } : false);
    }
    this.finishEntry(entry);
  }

  update(id: string, state: { status: 'pending' | 'cancelling' | 'error'; message?: string }) {
    const entry = this.entries.get(id);
    if (!entry || !entry.retain) return;
    entry.request = { ...entry.request, phase: state.status, phaseMessage: state.message };
    this.setActive(entry.request);
  }

  private finishEntry(entry: ModalEntry) {
    entry.removeAbort?.();
    this.entries.delete(entry.request.id);
    this.waiting = this.waiting.filter((id) => id !== entry.request.id);
    if (this.activeId === entry.request.id) {
      this.activeId = null;
      this.snapshot = { ...this.snapshot, active: null };
      this.emit();
    }
    entry.closed();
    this.pump();
  }

  private pump() {
    if (this.activeId) return;
    while (this.waiting.length) {
      const id = this.waiting.shift()!;
      const entry = this.entries.get(id);
      if (!entry) continue;
      this.activeId = id;
      this.setActive(entry.request);
      return;
    }
  }

  private setActive(active: DialogRequest) {
    this.snapshot = { ...this.snapshot, active };
    this.emit();
  }

  dismissOwner(ownerId: string) {
    for (const entry of [...this.entries.values()]) {
      if (entry.request.ownerId === ownerId) this.dismissDialog(entry.request.id, 'unmounted');
    }
  }

  notify(message: Omit<FeedbackMessage, 'id' | 'createdAt'>) {
    const id = `toast-${++toastSequence}`;
    const record: FeedbackMessage = { ...message, id, createdAt: Date.now() };
    this.snapshot = { ...this.snapshot, toasts: [...this.snapshot.toasts, record] };
    this.emit();
    const duration = this.options.toastDuration ?? 5000;
    if (message.kind !== 'error' && duration > 0) this.scheduleToast(id, duration);
    const max = this.options.maxVisibleToasts ?? 3;
    // Keep the complete queue; the host only shows the oldest configured number.
    if (max < 1) this.dismiss(id);
    return () => this.dismiss(id);
  }

  private scheduleToast(id: string, duration: number) {
    const timer = setTimeout(() => this.dismiss(id), duration);
    this.toastTimers.set(id, timer);
  }

  visibleToasts() {
    return this.snapshot.toasts.slice(0, this.options.maxVisibleToasts ?? 3);
  }

  pauseToast(id: string) {
    const timer = this.toastTimers.get(id);
    if (timer) clearTimeout(timer);
    this.toastTimers.delete(id);
  }

  resumeToast(id: string) {
    if (this.toastTimers.has(id)) return;
    const toast = this.snapshot.toasts.find((item) => item.id === id);
    if (toast && toast.kind !== 'error') {
      const elapsed = Date.now() - toast.createdAt;
      this.scheduleToast(id, Math.max(500, (this.options.toastDuration ?? 5000) - elapsed));
    }
  }

  dismiss(id: string) {
    const timer = this.toastTimers.get(id);
    if (timer) clearTimeout(timer);
    this.toastTimers.delete(id);
    const next = this.snapshot.toasts.filter((toast) => toast.id !== id);
    if (next.length !== this.snapshot.toasts.length) {
      this.snapshot = { ...this.snapshot, toasts: next };
      this.emit();
    }
  }

  dispose() {
    for (const entry of [...this.entries.values()]) this.dismissDialog(entry.request.id, 'unmounted');
    for (const timer of this.toastTimers.values()) clearTimeout(timer);
    this.toastTimers.clear();
    this.snapshot = emptySnapshot;
  }

  private emit() { for (const listener of this.listeners) listener(); }
}

export function SubmitFlowProvider(options: ProviderOptions) {
  const { children, className } = options;
  const storeRef = useRef<FeedbackStore | null>(null);
  if (!storeRef.current) storeRef.current = new FeedbackStore();
  const store = storeRef.current;
  store.configure(options);
  useEffect(() => () => store.dispose(), [store]);

  return (
    <FeedbackBridgeContext.Provider value={store}>
      {children}
      <FeedbackHost store={store} className={className} />
    </FeedbackBridgeContext.Provider>
  );
}

function FeedbackHost({ store, className }: { store: FeedbackStore; className?: string }) {
  const snapshot = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getServerSnapshot);
  const request = snapshot.active;
  return (
    <>
      {request ? <DialogLayer store={store} request={request} /> : null}
      <div className={className} data-sf-toast-host="" aria-label="Notifications" style={toastHostStyle}>
        {store.visibleToasts().map((toast) => (
          <div
            key={toast.id}
            className="sf-toast"
            data-kind={toast.kind}
            role={toast.kind === 'error' ? 'alert' : 'status'}
            aria-live={toast.kind === 'error' ? 'assertive' : 'polite'}
            onPointerEnter={() => store.pauseToast(toast.id)}
            onPointerLeave={() => store.resumeToast(toast.id)}
            onFocus={() => store.pauseToast(toast.id)}
            onBlur={() => store.resumeToast(toast.id)}
            style={toastStyle}
          >
            <span>{toast.message}</span>
            <button type="button" aria-label="Dismiss notification" onClick={() => store.dismiss(toast.id)} style={closeStyle}>×</button>
          </div>
        ))}
      </div>
    </>
  );
}

function DialogLayer({ store, request }: { store: FeedbackStore; request: DialogRequest }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = `sf-title-${request.id}`;
  const descriptionId = `sf-description-${request.id}`;
  const isRetained = request.kind === 'confirm' && request.phase !== 'decision';
  const overlayStyle: CSSProperties = { ...overlayBase, ...(request.variant === 'danger' ? { background: 'rgba(30, 8, 8, 0.56)' } : {}) };
  const defaultWidth: CSSProperties['width'] = request.size === 'sm' ? '22rem' : request.size === 'lg' ? '44rem' : '32rem';
  const dialogStyle: CSSProperties = { ...dialogBase, width: request.width ?? defaultWidth, maxWidth: 'calc(100vw - 2rem)' };
  useEffect(() => {
    const element = dialogRef.current;
    if (!element || element.open) return;
    element.showModal();
    return () => {
      if (element.open) element.close();
    };
  }, []);

  const canDismiss = (request.phase === 'decision' && !isRetained) || (request.phase === 'error' && request.closeOnEscape);
  return (
    <dialog
      ref={dialogRef}
      className="sf-native-dialog"
      data-variant={request.variant}
      data-size={request.size}
      data-state={request.phase ?? 'decision'}
      aria-labelledby={titleId}
      aria-describedby={request.description && !request.content ? descriptionId : undefined}
      aria-modal="true"
      role={request.kind === 'alert' || request.variant === 'danger' ? 'alertdialog' : 'dialog'}
      onCancel={(event) => {
        event.preventDefault();
        if (canDismiss) store.dismissDialog(request.id, 'escape');
      }}
      style={nativeDialogStyle}
    >
      <div
        className="sf-overlay"
        data-variant={request.variant}
        style={overlayStyle}
        aria-hidden="true"
        onClick={() => {
          if (request.outsidePress && canDismiss) store.dismissDialog(request.id, 'outside');
        }}
      />
      <section className="sf-dialog" data-variant={request.variant} data-size={request.size} data-state={request.phase ?? 'decision'} style={dialogStyle}>
        <h2 className="sf-dialog-title" id={titleId} style={titleStyle}>{request.title}</h2>
        {request.description ? <p className="sf-dialog-description" id={descriptionId} style={descriptionStyle}>{request.description}</p> : null}
        {request.content ? <div className="sf-dialog-content">{request.content}</div> : null}
        <DialogActions store={store} request={request} />
      </section>
    </dialog>
  );
}

function DialogActions({ store, request }: { store: FeedbackStore; request: DialogRequest }) {
  if (request.kind === 'alert') {
    return <div className="sf-dialog-actions" style={actionsStyle}><button type="button" className="sf-button sf-button-primary" onClick={() => store.answer(request.id, true)} style={buttonPrimaryStyle}>{request.acknowledgeLabel ?? 'OK'}</button></div>;
  }

  if (request.phase === 'pending' || request.phase === 'cancelling') {
    return (
      <div className="sf-dialog-actions" style={actionsStyle}>
        <p role="status" aria-live="polite" className="sf-dialog-status" style={{ margin: 0, flex: 1 }}>{request.phaseMessage ?? 'Working…'}</p>
        {request.phase === 'pending' ? <button type="button" className="sf-button" onClick={() => store.cancelExecution(request.id)} style={buttonStyle}>Cancel action</button> : null}
      </div>
    );
  }

  if (request.phase === 'error') {
    return (
      <>
        {request.phaseMessage ? <p role="alert" className="sf-dialog-error" style={errorStyle}>{request.phaseMessage}</p> : null}
        <div className="sf-dialog-actions" style={actionsStyle}>
          <button type="button" autoFocus className="sf-button sf-button-primary" onClick={() => store.dismissDialog(request.id, 'outside')} style={buttonPrimaryStyle}>Close</button>
        </div>
      </>
    );
  }

  return (
    <div className="sf-dialog-actions" style={actionsStyle}>
      <button type="button" autoFocus={request.destructive} className="sf-button" onClick={() => store.answer(request.id, false)} style={buttonStyle}>{request.cancelLabel}</button>
      <button type="button" autoFocus={!request.destructive} className="sf-button sf-button-primary" onClick={() => store.answer(request.id, true)} style={buttonPrimaryStyle}>{request.confirmLabel}</button>
    </div>
  );
}

const toastHostStyle: CSSProperties = { position: 'fixed', zIndex: 10000, insetBlockStart: '1rem', insetInlineEnd: '1rem', display: 'grid', gap: '.5rem', width: 'min(24rem, calc(100vw - 2rem))', pointerEvents: 'none' };
const toastStyle: CSSProperties = { pointerEvents: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', padding: '1rem', border: 'var(--sf-toast-border-width, 1px) solid var(--sf-toast-border-color, color-mix(in srgb, CanvasText 18%, transparent))', borderRadius: 'var(--sf-toast-radius, .75rem)', background: 'var(--sf-toast-background, Canvas)', color: 'var(--sf-toast-foreground, CanvasText)', boxShadow: 'var(--sf-toast-shadow, 0 12px 36px rgb(0 0 0 / .16))' };
const closeStyle: CSSProperties = { border: 0, background: 'transparent', color: 'inherit', font: 'inherit', cursor: 'pointer', fontSize: '1.25rem' };
const overlayBase: CSSProperties = { position: 'fixed', inset: 0, zIndex: 9998, background: 'rgb(15 23 42 / .5)', backdropFilter: 'blur(2px)' };
const nativeDialogStyle: CSSProperties = { position: 'fixed', inset: 0, width: '100vw', height: '100dvh', maxWidth: 'none', maxHeight: 'none', margin: 0, padding: 0, border: 0, background: 'transparent', overflow: 'visible' };
const dialogBase: CSSProperties = { position: 'fixed', zIndex: 9999, insetBlockStart: '50%', insetInlineStart: '50%', transform: 'translate(-50%, -50%)', boxSizing: 'border-box', width: 'calc(100vw - 2rem)', maxHeight: 'calc(100dvh - 2rem)', overflow: 'auto', padding: '1.5rem', outline: 'none', border: 'var(--sf-dialog-border-width, 1px) solid var(--sf-dialog-border-color, color-mix(in srgb, CanvasText 14%, transparent))', borderRadius: 'var(--sf-dialog-radius, 1rem)', background: 'var(--sf-dialog-background, Canvas)', color: 'var(--sf-dialog-foreground, CanvasText)', boxShadow: 'var(--sf-dialog-shadow, 0 24px 72px rgb(0 0 0 / .26))' };
const titleStyle: CSSProperties = { display: 'block', margin: 0, fontSize: '1.15rem', fontWeight: 650, lineHeight: 1.3 };
const descriptionStyle: CSSProperties = { margin: '.65rem 0 0', lineHeight: 1.5 };
const actionsStyle: CSSProperties = { display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '.65rem', marginTop: '1.5rem', flexWrap: 'wrap' };
const buttonStyle: CSSProperties = { borderWidth: 'var(--sf-button-border-width, 1px)', borderStyle: 'solid', borderColor: 'var(--sf-button-border-color, color-mix(in srgb, CanvasText 22%, transparent))', borderRadius: 'var(--sf-button-radius, .65rem)', padding: '.6rem .9rem', background: 'transparent', color: 'inherit', font: 'inherit', fontWeight: 550, cursor: 'pointer' };
const buttonPrimaryStyle: CSSProperties = { ...buttonStyle, borderColor: 'var(--sf-primary-border-color, var(--sf-accent, CanvasText))', background: 'var(--sf-primary-background, var(--sf-accent, CanvasText))', color: 'var(--sf-primary-foreground, Canvas)' };
const errorStyle: CSSProperties = { margin: '1rem 0 0', padding: '.75rem', borderRadius: '.5rem', background: 'color-mix(in srgb, #b42318 10%, Canvas)', color: 'color-mix(in srgb, #b42318 85%, CanvasText)' };
