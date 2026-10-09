'use client';

import { useState } from 'react';
import { useSubmitFeedback } from 'react-submit-flow';

export function DialogDemo() {
  const feedback = useSubmitFeedback();
  const [lastResult, setLastResult] = useState('');
  return (
    <div className="demo-card">
      <div className="demo-head"><span className="status-dot" /> Standalone dialogs</div>
      <p>Try a destructive confirmation or an acknowledgement dialog. Both use the shared provider queue.</p>
      <div className="dialog-actions">
        <button className="demo-primary sf-button" type="button" onClick={async () => {
          const accepted = await feedback.confirm({ title: 'Remove this draft?', description: 'The draft will be permanently deleted.', destructive: true, size: 'sm' });
          setLastResult(accepted ? 'Confirmed' : 'Dismissed');
        }}>Delete draft</button>
        <button className="demo-secondary sf-button" type="button" onClick={async () => {
          const result = await feedback.alert({ title: 'Export ready', description: 'Your sample archive is ready to download.', variant: 'success', acknowledgeLabel: 'Done' });
          setLastResult(result.status === 'acknowledged' ? 'Acknowledged' : `Dismissed: ${result.reason}`);
        }}>Show alert</button>
      </div>
      <p className="demo-feedback" aria-live="polite">{lastResult}</p>
    </div>
  );
}
