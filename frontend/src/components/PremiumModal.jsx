/**
 * PremiumModal — overlay dialog for the premium upgrade flow.
 *
 * Props:
 *   isOpen         {boolean}  - whether the modal is visible
 *   modalFeedback  {string}   - feedback message (e.g. "Payment failed. Please try again.")
 *   onClose        {function} - called when the modal is dismissed
 *   onMockSuccess  {function} - called when "Mock Success" payment button is clicked
 *   onMockFailure  {function} - called when "Mock Failure" payment button is clicked
 */
export default function PremiumModal({
  isOpen = false,
  modalFeedback = '',
  onClose,
  onMockSuccess,
  onMockFailure,
}) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div
        className="modal-box"
        role="dialog"
        aria-modal="true"
        aria-labelledby="premium-modal-title"
      >
        <h2 id="premium-modal-title">Upgrade to Premium</h2>

        <p>
          This template requires a premium account. Upgrade now to unlock all
          premium templates and exclusive features.
        </p>

        <div className="modal-box__actions">
          <button
            type="button"
            className="modal-box__btn modal-box__btn--success"
            onClick={onMockSuccess}
          >
            Mock Success
          </button>
          <button
            type="button"
            className="modal-box__btn modal-box__btn--failure"
            onClick={onMockFailure}
          >
            Mock Failure
          </button>
        </div>

        <button
          type="button"
          className="modal-box__close-btn"
          onClick={onClose}
          aria-label="Close premium upgrade dialog"
        >
          Close
        </button>

        {modalFeedback && (
          <p className="modal-box__feedback" role="status">
            {modalFeedback}
          </p>
        )}
      </div>
    </div>
  );
}
