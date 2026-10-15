"use client";

import { useState } from "react";
import { ActionButton, SubmitFeedback, SubmitFlowRoot, useSubmitFlow } from "react-submit-flow";

export function LiveDemo() {
  const [name, setName] = useState("Samira");
  const [simulateFailure, setSimulateFailure] = useState(false);
  const flow = useSubmitFlow({
    save: {
      run: async (input: { name: string }, { signal }: { signal: AbortSignal }) => {
        await new Promise<void>((resolve, reject) => {
          const timer = setTimeout(resolve, 700);
          signal.addEventListener(
            "abort",
            () => {
              clearTimeout(timer);
              reject(new DOMException("Cancelled", "AbortError"));
            },
            { once: true },
          );
        });
        if (simulateFailure) throw new Error("The example server is unavailable.");
        return { saved: input.name };
      },
      pendingLabel: "Saving profile…",
      success: (result: { saved: string }) => `${result.saved}’s profile is up to date.`,
      error: "The example request failed. Try again.",
    },
    publish: {
      run: async (input: { name: string }) => ({ published: input.name }),
      confirm: {
        title: "Publish this profile?",
        description: "Visitors will see these changes.",
        confirmLabel: "Publish",
        variant: "info",
      },
      pendingLabel: "Publishing…",
      success: (result: { published: string }) => `${result.published} is now published.`,
    },
  });

  return (
    <SubmitFlowRoot flow={flow}>
      <div className="demo-card">
        <div className="demo-head">
          <span className="status-dot" /> Live example <span className="demo-tag">Interactive</span>
        </div>
        <label className="demo-label">
          Display name
          <input
            className="demo-input"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </label>
        <label className="demo-toggle">
          <input
            type="checkbox"
            checked={simulateFailure}
            onChange={(event) => setSimulateFailure(event.target.checked)}
          />{" "}
          Simulate save error
        </label>
        <div className="demo-actions">
          <ActionButton
            action="save"
            input={{ name }}
            pendingLabel="Saving…"
            className="demo-primary"
          >
            Save changes
          </ActionButton>
          <ActionButton action="publish" input={{ name }} className="demo-secondary">
            Publish
          </ActionButton>
        </div>
        <SubmitFeedback className="demo-feedback" />
        <div className="demo-state">
          <span>flow.status</span>
          <code>{flow.status}</code>
          <span>flow.pendingAction</span>
          <code>{flow.pendingAction ?? "—"}</code>
        </div>
      </div>
    </SubmitFlowRoot>
  );
}
