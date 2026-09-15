import './ConfirmDialog.css';

const ConfirmDialog = ({
  open,
  title = 'Confirm action',
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  busy = false,
  onConfirm,
  onCancel,
}) => {
  if (!open) return null;

  return (
    <div className="confirm-dialog-overlay" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget && !busy) onCancel();
    }}>
      <div className="confirm-dialog" role="alertdialog" aria-modal="true" aria-labelledby="confirm-dialog-title">
        <div className="confirm-dialog-icon" aria-hidden="true">!</div>
        <div className="confirm-dialog-content">
          <h2 id="confirm-dialog-title">{title}</h2>
          <p>{message}</p>
        </div>
        <div className="confirm-dialog-actions">
          <button type="button" className="confirm-dialog-cancel" onClick={onCancel} disabled={busy}>
            {cancelLabel}
          </button>
          <button type="button" className="confirm-dialog-confirm" onClick={onConfirm} disabled={busy}>
            {busy ? 'Please wait...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
