'use client';

import {
  createElement,
  forwardRef,
  useState,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type FormHTMLAttributes,
  type MouseEventHandler,
  type ReactNode,
  type SubmitEvent as ReactSubmitEvent,
} from 'react';
import type { ActionMap, ActionNames } from '../types';
import type { FlowSnapshot } from '../core/controller';
import { FlowContextRoot, useFlowContext, useOptionalFlowContext, type FormInputs, type PublicFlow } from './flow-context';

export function SubmitFlowRoot<T extends ActionMap>({ flow, children }: { flow: PublicFlow<T>; children: ReactNode }) {
  return <FlowContextRoot flow={flow}>{children}</FlowContextRoot>;
}

export interface SubmitFlowFormProps<T extends ActionMap> extends Omit<FormHTMLAttributes<HTMLFormElement>, 'onSubmit' | 'action'> {
  flow: PublicFlow<T>;
  defaultAction: ActionNames<T>;
  getInput?: FormInputs<T>;
  onSubmit?: FormHTMLAttributes<HTMLFormElement>['onSubmit'];
  children: ReactNode;
}

export function SubmitFlowForm<T extends ActionMap>({
  flow,
  defaultAction,
  getInput,
  onSubmit,
  children,
  ...formProps
}: SubmitFlowFormProps<T>) {
  const [inputError, setInputError] = useState<string | null>(null);

  const handleSubmit = (event: ReactSubmitEvent<HTMLFormElement>) => {
    onSubmit?.(event);
    if (event.defaultPrevented) return;
    event.preventDefault();
    setInputError(null);

    const nativeEvent = event.nativeEvent;
    const submitter = nativeEvent.submitter instanceof HTMLElement ? nativeEvent.submitter : null;
    const actionName = submitter?.dataset.sfAction || defaultAction;
    const actionConverter = getInput?.[actionName as ActionNames<T>];
    try {
      const formData = submitter
        ? new FormData(event.currentTarget, submitter as HTMLButtonElement | HTMLInputElement)
        : new FormData(event.currentTarget);
      const value = actionConverter
        ? actionConverter(formData, submitter)
        : undefined;
      void (flow.run as (...args: [string, unknown?]) => Promise<unknown>)(actionName, value).catch((error: unknown) => {
        setInputError(error instanceof Error ? error.message : 'Unable to submit this form.');
      });
    } catch (error) {
      setInputError(error instanceof Error ? error.message : 'Check the form and try again.');
    }
  };

  return (
    <form {...formProps} onSubmit={handleSubmit}>
      <FlowContextRoot flow={flow}>{children}</FlowContextRoot>
      {inputError ? <p className="sf-feedback sf-feedback-error" role="alert">{inputError}</p> : null}
    </form>
  );
}

export interface SubmitButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  action: string;
  pendingLabel?: string;
}

export const SubmitButton = forwardRef<HTMLButtonElement, SubmitButtonProps>(function SubmitButton(
  { action, children, pendingLabel, disabled, type: _type, ...props }, ref,
) {
  const flow = useFlowContext();
  const active = flow.status === 'pending' && flow.pendingAction === action;
  return (
    <button
      {...props}
      ref={ref}
      type="submit"
      data-sf-action={action}
      data-action={action}
      data-state={active ? 'pending' : flow.status}
      aria-busy={active || undefined}
      disabled={disabled || flow.isBusy}
      className={['sf-button', props.className].filter(Boolean).join(' ')}
    >
      {active ? pendingLabel ?? flow.pendingLabel ?? 'Working…' : children}
    </button>
  );
});

export interface ActionButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  action: string;
  input?: unknown;
  pendingLabel?: string;
}

export const ActionButton = forwardRef<HTMLButtonElement, ActionButtonProps>(function ActionButton(
  { action, input, pendingLabel, disabled, onClick, children, type: _type, ...props }, ref,
) {
  const flow = useFlowContext();
  const active = flow.status === 'pending' && flow.pendingAction === action;
  const handleClick: MouseEventHandler<HTMLButtonElement> = (event) => {
    onClick?.(event);
    if (event.defaultPrevented) return;
    void (flow.run as (...args: [string, unknown?]) => Promise<unknown>)(action, input).catch(() => undefined);
  };
  return (
    <button
      {...props}
      ref={ref}
      type="button"
      onClick={handleClick}
      data-action={action}
      data-state={active ? 'pending' : flow.status}
      aria-busy={active || undefined}
      disabled={disabled || flow.isBusy}
      className={['sf-button', props.className].filter(Boolean).join(' ')}
    >
      {active ? pendingLabel ?? flow.pendingLabel ?? 'Working…' : children}
    </button>
  );
});

export interface CancelButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  onCancel?: () => void;
}

export const CancelButton = forwardRef<HTMLButtonElement, CancelButtonProps>(function CancelButton(
  { onCancel, onClick, disabled, children = 'Cancel', type: _type, ...props }, ref,
) {
  const flow = useFlowContext();
  const handleClick: MouseEventHandler<HTMLButtonElement> = (event) => {
    onClick?.(event);
    if (event.defaultPrevented) return;
    if (flow.isBusy) flow.cancel();
    else onCancel?.();
  };
  return <button {...props} ref={ref} type="button" onClick={handleClick} disabled={disabled || flow.status === 'cancelling'} className={['sf-button', props.className].filter(Boolean).join(' ')}>{children}</button>;
});

export interface BackButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  onBack: () => void;
}

export const BackButton = forwardRef<HTMLButtonElement, BackButtonProps>(function BackButton(
  { onBack, onClick, disabled, children = 'Back', type: _type, ...props }, ref,
) {
  const flow = useFlowContext();
  const handleClick: MouseEventHandler<HTMLButtonElement> = (event) => {
    onClick?.(event);
    if (!event.defaultPrevented) onBack();
  };
  return <button {...props} ref={ref} type="button" onClick={handleClick} disabled={disabled || flow.isBusy} className={['sf-button', props.className].filter(Boolean).join(' ')}>{children}</button>;
});

export interface SubmitFeedbackProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  flow?: Pick<FlowSnapshot, 'status' | 'pendingLabel' | 'feedback'>;
  children?: ReactNode | ((state: Pick<FlowSnapshot, 'status' | 'pendingLabel' | 'feedback'>) => ReactNode);
}

export const SubmitFeedback = forwardRef<HTMLDivElement, SubmitFeedbackProps>(function SubmitFeedback({ flow: supplied, children, className, ...props }, ref) {
  const contextual = useOptionalFlowContext();
  if (!supplied && !contextual) throw new Error('react-submit-flow: use <SubmitFeedback> inside a flow or pass its flow prop.');
  const flow = supplied ?? contextual!;
  const content = typeof children === 'function' ? children(flow) : children;
  const message = flow.feedback?.message ?? (flow.status === 'pending' ? flow.pendingLabel ?? 'Working…' : null);
  if (!content && !message) return null;
  return createElement('div', {
    ...props,
    ref,
    className: ['sf-feedback', className].filter(Boolean).join(' '),
    'data-state': flow.status,
    'aria-live': flow.status === 'error' ? 'assertive' : 'polite',
    role: flow.status === 'error' || flow.feedback?.kind === 'error' ? 'alert' : 'status',
  }, content ?? message);
});
