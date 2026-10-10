import type {
  ActionMap,
  ConfirmOptions,
  FlowOptions,
  FlowStatus,
  FeedbackMessage,
  MappedRunResult,
  RunArguments,
} from '../types';
import type { FeedbackBridge, ModalHandle } from '../react/bridge';

export interface FlowSnapshot {
  status: FlowStatus;
  isBusy: boolean;
  pendingAction: string | null;
  pendingLabel: string | null;
  lastResult: MappedRunResult<ActionMap> | null;
  feedback: FeedbackMessage | null;
}

const initialSnapshot: FlowSnapshot = {
  status: 'idle', isBusy: false, pendingAction: null, pendingLabel: null, lastResult: null, feedback: null,
};

let nextRun = 0;
let nextFlow = 0;
const makeId = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${(++nextRun).toString(36)}`;

export class FlowController<T extends ActionMap> {
  readonly id = `flow-${++nextFlow}`;
  private snapshot: FlowSnapshot = initialSnapshot;
  private listeners = new Set<() => void>();
  private bridge: FeedbackBridge | null = null;
  private controller: AbortController | null = null;
  private activeDialog: ModalHandle<boolean> | null = null;
  private activeSession: { handle: ModalHandle<boolean>; runId: string } | null = null;
  private runToken = 0;
  private attached = false;
  private lifecycle = 0;
  private mounted = false;

  constructor(getActions: () => T, getOptions: () => FlowOptions, getBridge: () => FeedbackBridge | null) {
    this.getActions = getActions;
    this.getOptions = getOptions;
    this.getBridge = getBridge;
  }

  private getActions: () => T;
  private getOptions: () => FlowOptions;
  private getBridge: () => FeedbackBridge | null;

  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  getSnapshot = () => this.snapshot;
  getServerSnapshot = () => initialSnapshot;

  attach = () => {
    this.attached = true;
    this.mounted = true;
    this.lifecycle += 1;
    return () => {
      this.attached = false;
      this.mounted = false;
      const lifecycle = ++this.lifecycle;
      queueMicrotask(() => {
        if (this.lifecycle === lifecycle && !this.attached) this.dispose();
      });
    };
  };

  run = async (...args: RunArguments<T>): Promise<MappedRunResult<T>> => {
    const [actionName, input] = args as [string, unknown];
    const actions = this.getActions();
    const action = actions[actionName];
    if (!action) throw new Error(`react-submit-flow: unknown action "${actionName}".`);
    if (this.snapshot.isBusy) return { status: 'skipped', reason: 'busy' } as MappedRunResult<T>;
    if (!this.mounted) this.mounted = true;

    this.activeSession?.handle.close('aborted');
    this.activeSession = null;
    this.dismissFeedback();

    const runId = makeId('run');
    const token = ++this.runToken;
    const abort = new AbortController();
    this.controller = abort;
    this.patch({ status: 'idle', isBusy: true, pendingAction: actionName, pendingLabel: action.pendingLabel ?? null, lastResult: null, feedback: null });

    const context = {
      signal: abort.signal,
      runId,
      action: actionName,
      throwIfCancelled() {
        if (abort.signal.aborted) throw new DOMException('The action was cancelled.', 'AbortError');
      },
    };

    let session: ModalHandle<boolean> | null = null;
    const confirmOptions = typeof action.confirm === 'function' ? action.confirm(input) : action.confirm;
    const providerDefault = this.getBridge()?.getDialogDefaults()?.closeOnConfirm;
    const closeOnConfirm = action.closeOnConfirm ?? confirmOptions?.closeOnConfirm ?? providerDefault ?? true;
    const keepOpen = Boolean(confirmOptions && !closeOnConfirm);

    if (confirmOptions) {
      this.patch({ status: 'confirming' });
      try {
        const accepted = await this.confirm(confirmOptions, actionName, runId, abort, keepOpen);
        if (token !== this.runToken || !this.mounted) return { status: 'cancelled', action: actionName, reason: 'unmounted', runId } as MappedRunResult<T>;
        if (!accepted || abort.signal.aborted) {
          return this.finishCancelled(actionName, input, runId, token, abort.signal.aborted ? 'user' : 'declined', action.onCancel);
        }
        session = this.activeDialog;
        this.activeDialog = null;
        if (!keepOpen) session?.close();
      } catch (error) {
        if (abort.signal.aborted) return this.finishCancelled(actionName, input, runId, token, 'user', action.onCancel);
        return this.finishError(actionName, input, runId, token, error, action, null);
      }
    }

    if (token !== this.runToken || abort.signal.aborted) return this.finishCancelled(actionName, input, runId, token, 'user', action.onCancel);
    if (keepOpen && session) {
      this.activeSession = { handle: session, runId };
      session.update({ status: 'pending', message: action.pendingLabel ?? 'Working…' });
    }
    this.patch({ status: 'pending' });

    try {
      const data = await action.run(input, context);
      if (abort.signal.aborted) return this.finishCancelled(actionName, input, runId, token, 'user', action.onCancel, session);
      if (token !== this.runToken || !this.mounted) return { status: 'cancelled', action: actionName, reason: 'unmounted', runId } as MappedRunResult<T>;
      const result = { status: 'success', action: actionName, data, runId } as MappedRunResult<T>;
      this.finish(result, 'success', token);
      session?.close();
      this.activeSession = null;
      if (action.feedback !== 'none' && !session) this.notify('success', this.successText(action, data, input), runId);
      await this.observe(action.onSuccess, [data, input]);
      return result;
    } catch (error) {
      if (abort.signal.aborted) return this.finishCancelled(actionName, input, runId, token, 'user', action.onCancel, session);
      return this.finishError(actionName, input, runId, token, error, action, session);
    } finally {
      if (this.controller === abort && !this.snapshot.isBusy) this.controller = null;
    }
  };

  cancel = () => {
    if (!this.controller || !this.snapshot.isBusy || this.controller.signal.aborted) return false;
    this.controller.abort();
    if (this.activeSession) {
      this.activeSession.handle.update({ status: 'cancelling', message: 'Cancelling…' });
    } else {
      this.activeDialog?.close('aborted');
    }
    this.patch({ status: 'cancelling' });
    return true;
  };

  clearFeedback = () => this.dismissFeedback();

  reset = () => {
    if (this.snapshot.isBusy) return false;
    this.activeSession?.handle.close('aborted');
    this.activeSession = null;
    this.dismissFeedback();
    this.patch({ ...initialSnapshot });
    return true;
  };

  private async confirm(options: ConfirmOptions, action: string, runId: string, abort: AbortController, retained: boolean) {
    const bridge = this.getBridge();
    const adapters = this.getOptions().adapters;
    const adapter = retained ? adapters?.retainedConfirmation : adapters?.confirm;
    if (retained && adapters?.confirm && !adapters.retainedConfirmation) {
      throw new Error('react-submit-flow: closeOnConfirm=false requires a retainedConfirmation adapter.');
    }
    if (retained && !adapter && !bridge) throw new Error('react-submit-flow: retained confirmations require a provider or retainedConfirmation adapter.');

    if (adapter && retained && adapters?.retainedConfirmation) {
      const handle = adapters.retainedConfirmation(options, {
        signal: abort.signal,
        triggerElement: null,
        cancel: this.cancel,
      });
      const adapted: ModalHandle<boolean> = {
        decision: handle.decision,
        closed: handle.closed,
        update: handle.update,
        close: () => handle.close(),
      };
      this.activeDialog = adapted;
      return adapted.decision;
    }
    if (adapter && !retained) {
      const accepted = await adapters!.confirm!(options, { signal: abort.signal, triggerElement: null });
      return accepted;
    }
    if (!bridge) throw new Error('react-submit-flow: confirmation needs SubmitFlowProvider or a confirmation adapter.');
    const handle = bridge.confirm(options, { id: runId, ownerId: this.id, action, signal: abort.signal, cancel: this.cancel }, retained);
    this.activeDialog = handle;
    return handle.decision;
  }

  private finishCancelled<A extends string, I>(action: A, input: I, runId: string, token: number, reason: 'declined' | 'user' | 'unmounted', observer?: (input: I) => void | Promise<void>, session?: ModalHandle<boolean> | null) {
    const result = { status: 'cancelled', action, reason, runId } as unknown as MappedRunResult<T>;
    if (token === this.runToken && this.mounted) this.finish(result, 'cancelled', token);
    session?.close();
    if (this.activeSession?.runId === runId) this.activeSession = null;
    if (this.activeDialog) {
      this.activeDialog.close(reason === 'declined' ? undefined : 'aborted');
      this.activeDialog = null;
    }
    if (reason !== 'unmounted' && token === this.runToken) void this.observe(observer, [input]);
    return result;
  }

  private finishError<A extends string, I>(action: A, input: I, runId: string, token: number, error: unknown, definition: ActionMap[string], session: ModalHandle<boolean> | null) {
    const result = { status: 'error', action, error, runId } as unknown as MappedRunResult<T>;
    if (token === this.runToken && this.mounted) {
      this.finish(result, 'error', token);
      const message = this.errorText(definition, error, input);
      if (session) {
        this.activeSession = { handle: session, runId };
        session.update({ status: 'error', message });
      } else if (definition.feedback !== 'none') {
        this.notify('error', message, runId);
      }
    }
    if (!session) this.activeDialog?.close();
    this.activeDialog = null;
    void this.observe(definition.onError, [error, input]);
    return result;
  }

  private finish(result: MappedRunResult<T>, status: FlowStatus, token: number) {
    if (token !== this.runToken) return;
    this.snapshot = { ...this.snapshot, status, isBusy: false, pendingAction: null, pendingLabel: null, lastResult: result };
    this.emit();
  }

  private successText(definition: ActionMap[string], data: unknown, input: unknown) {
    const value = definition.success;
    try {
      return typeof value === 'function' ? value(data, input) : value ?? this.getOptions().successMessage ?? 'Completed successfully.';
    } catch (error) {
      this.reportObserverError(error);
      return 'Completed successfully.';
    }
  }

  private errorText(definition: ActionMap[string], error: unknown, input: unknown) {
    const value = definition.error;
    try {
      if (typeof value === 'function') return value(error, input);
      if (value) return value;
      const fallback = this.getOptions().errorMessage;
      return typeof fallback === 'function' ? fallback(error) : fallback ?? 'Something went wrong. Please try again.';
    } catch (formatterError) {
      this.reportObserverError(formatterError);
      return 'Something went wrong. Please try again.';
    }
  }

  private notify(kind: 'success' | 'error', message: string, runId: string) {
    if (!message) return;
    const adapters = this.getOptions().adapters;
    if (adapters?.notifications) {
      try { adapters.notifications.notify({ flowId: this.id, runId, kind, message }); }
      catch (error) { this.reportObserverError(error); }
      return;
    }
    const bridge = this.getBridge();
    if (bridge) {
      const dismiss = bridge.notify({ flowId: this.id, runId, kind, message });
      this.snapshot = { ...this.snapshot, feedback: { id: `feedback-${runId}`, flowId: this.id, runId, kind, message, createdAt: Date.now() } };
      this.emit();
      this.dismissFeedbackAction = dismiss;
    } else {
      this.snapshot = { ...this.snapshot, feedback: { id: `feedback-${runId}`, flowId: this.id, runId, kind, message, createdAt: Date.now() } };
      this.emit();
    }
  }

  private dismissFeedback = () => {
    this.dismissFeedbackAction?.();
    this.dismissFeedbackAction = undefined;
    if (this.snapshot.feedback) this.patch({ feedback: null });
  };
  private dismissFeedbackAction?: () => void;

  private async observe<TArgs extends unknown[]>(observer: ((...args: TArgs) => unknown) | undefined, args: TArgs) {
    if (!observer) return;
    try { await observer(...args); }
    catch (error) { this.reportObserverError(error); }
  }

  private reportObserverError(error: unknown) {
    try { this.getOptions().onObserverError?.(error); }
    catch { /* Diagnostics never change the result. */ }
  }

  private patch(patch: Partial<FlowSnapshot>) {
    this.snapshot = { ...this.snapshot, ...patch };
    this.emit();
  }
  private emit() { for (const listener of this.listeners) listener(); }

  private dispose() {
    this.controller?.abort();
    this.activeDialog?.close('unmounted');
    this.activeSession?.handle.close('unmounted');
    this.activeDialog = null;
    this.activeSession = null;
    this.dismissFeedback();
    this.runToken += 1;
    this.patch({ ...initialSnapshot });
  }
}
