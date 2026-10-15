import type { CSSProperties, ReactNode } from "react";

export type FlowStatus =
  | "idle"
  | "confirming"
  | "pending"
  | "cancelling"
  | "success"
  | "error"
  | "cancelled";
export type FeedbackKind = "loading" | "success" | "error" | "info";
export type FeedbackVariant = "neutral" | "danger" | "warning" | "success" | "info";
export type DialogSize = "sm" | "md" | "lg";
export type DialogDismissReason = "escape" | "outside" | "aborted" | "unmounted";

export interface ConfirmOptions {
  title: string;
  description?: string;
  content?: ReactNode;
  variant?: FeedbackVariant;
  size?: DialogSize;
  width?: CSSProperties["width"];
  closeOnEscape?: boolean;
  outsidePress?: boolean;
  signal?: AbortSignal;
  portalContainer?: HTMLElement | null;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  closeOnConfirm?: boolean;
}

export interface AlertOptions extends Omit<
  ConfirmOptions,
  "confirmLabel" | "cancelLabel" | "destructive" | "closeOnConfirm"
> {
  acknowledgeLabel?: string;
}

export type DialogDefaults = Partial<
  Pick<
    ConfirmOptions,
    | "variant"
    | "size"
    | "width"
    | "closeOnEscape"
    | "outsidePress"
    | "confirmLabel"
    | "cancelLabel"
    | "destructive"
    | "closeOnConfirm"
  >
>;

export type AlertResult =
  | { status: "acknowledged" }
  | { status: "dismissed"; reason: DialogDismissReason };

export type RunResult<T = unknown, A extends string = string> =
  | { status: "success"; action: A; data: T; runId: string }
  | { status: "error"; action: A; error: unknown; runId: string }
  | { status: "cancelled"; action: A; reason: "declined" | "user" | "unmounted"; runId: string }
  | { status: "skipped"; reason: "busy" };

export interface ActionContext {
  readonly signal: AbortSignal;
  readonly runId: string;
  readonly action: string;
  throwIfCancelled(): void;
}

export interface ActionDefinition<Input = void, Output = unknown> {
  run: (input: Input, context: ActionContext) => Output | Promise<Output>;
  confirm?: ConfirmOptions | ((input: Input) => ConfirmOptions);
  pendingLabel?: string;
  success?: string | ((data: Awaited<Output>, input: Input) => string);
  error?: string | ((error: unknown, input: Input) => string);
  feedback?: "toast" | "inline" | "none";
  closeOnConfirm?: boolean;
  onSuccess?: (data: Awaited<Output>, input: Input) => void | Promise<void>;
  onError?: (error: unknown, input: Input) => void | Promise<void>;
  onCancel?: (input: Input) => void | Promise<void>;
}

export type ActionMap = Record<string, ActionDefinition<any, any>>;
export type ActionInput<A> = A extends ActionDefinition<infer Input, any> ? Input : never;
export type ActionOutput<A> =
  A extends ActionDefinition<any, infer Output> ? Awaited<Output> : never;
export type ActionNames<T extends ActionMap> = Extract<keyof T, string>;
export type RunArguments<T extends ActionMap> = {
  [K in ActionNames<T>]: [ActionInput<T[K]>] extends [void]
    ? [action: K, input?: void]
    : [action: K, input: ActionInput<T[K]>];
}[ActionNames<T>];
export type MappedRunResult<T extends ActionMap> =
  | {
      [K in ActionNames<T>]: RunResult<ActionOutput<T[K]>, K>;
    }[ActionNames<T>]
  | { status: "skipped"; reason: "busy" };

export interface FeedbackMessage {
  id: string;
  flowId: string;
  runId: string;
  kind: FeedbackKind;
  message: string;
  createdAt: number;
}

export type DialogRequest = ConfirmOptions & {
  id: string;
  ownerId: string;
  kind: "confirm" | "alert";
  acknowledgeLabel?: string;
  confirmLabel: string;
  cancelLabel: string;
  variant: FeedbackVariant;
  size: DialogSize;
  closeOnEscape: boolean;
  outsidePress: boolean;
  phase?: "decision" | "pending" | "cancelling" | "error";
  phaseMessage?: string;
};

export interface ConfirmationSession {
  decision: Promise<boolean>;
  closed: Promise<void>;
  update(state: { status: "pending" | "cancelling" | "error"; message?: string }): void;
  close(): void;
}

export interface FeedbackAdapters {
  confirm?: (
    request: ConfirmOptions,
    context: { signal: AbortSignal; triggerElement: HTMLElement | null },
  ) => Promise<boolean>;
  alert?: (
    request: AlertOptions,
    context: { signal: AbortSignal; triggerElement: HTMLElement | null },
  ) => Promise<AlertResult>;
  retainedConfirmation?: (
    request: ConfirmOptions,
    context: { signal: AbortSignal; triggerElement: HTMLElement | null; cancel: () => void },
  ) => ConfirmationSession;
  notifications?: {
    notify(message: Omit<FeedbackMessage, "id" | "createdAt">): void;
    dismiss(messageId: string): void;
  };
}

export interface FlowOptions {
  successMessage?: string;
  errorMessage?: string | ((error: unknown) => string);
  adapters?: FeedbackAdapters;
  onObserverError?: (error: unknown) => void;
}

export interface ProviderOptions {
  children: ReactNode;
  dialogDefaults?: DialogDefaults;
  toastDuration?: number;
  maxVisibleToasts?: number;
  portalContainer?: HTMLElement | null;
  className?: string;
  /** Direction applied to provider-rendered dialogs and notifications. Omit to inherit from the surrounding document. */
  dir?: "ltr" | "rtl" | "auto";
}
