import { useEffect } from 'react';
import BuilderWorkspace from './BuilderWorkspace';

/**
 * UseTemplateModal — full-screen modal that wraps the BuilderWorkspace.
 *
 * Props:
 *   isOpen            {boolean}      - whether the modal is visible
 *   activeTemplate    {object|null}  - the template being used
 *   customBlocks      {object[]}     - custom blocks added in the builder
 *   previewMode       {boolean}      - edit vs preview mode
 *   builderFeedback   {string}       - status message inside the builder
 *   onClose           {function}     - called to close
 *   onBuyPremium      {function}     - called when Buy Premium is clicked
 *   onAddBlock        {function}     - add a custom block
 *   onRemoveLastBlock {function}     - remove last custom block
 *   onResetBuilder    {function}     - reset builder state (no close)
 *   onEditMode        {function}     - switch to edit mode
 *   onPreviewMode     {function}     - switch to preview mode
 *   onSubmitForm      {function}     - submit the form
 */
export default function UseTemplateModal({
  isOpen = false,
  activeTemplate = null,
  customBlocks = [],
  previewMode = false,
  builderFeedback = '',
  onClose,
  onBuyPremium,
  onAddBlock,
  onRemoveLastBlock,
  onResetBuilder,
  onEditMode,
  onPreviewMode,
  onSubmitForm,
}) {
  // Lock body scroll while open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen || !activeTemplate) return null;

  const isPremium = Boolean(activeTemplate.is_premium);

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose?.();
  };

  const handleReset = () => {
    onResetBuilder?.();
    // Stay in modal — only discard changes
  };

  return (
    <div
      className="use-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="use-modal-title"
      onClick={handleOverlayClick}
    >
      <div className="use-modal">

        {/* ── Modal header ─────────────────────────────────────────── */}
        <div className="use-modal__header">
          <div className="use-modal__header-left">
            <h2 id="use-modal-title" className="use-modal__title">
              {activeTemplate.name}
            </h2>
            {isPremium && (
              <span className="use-modal__premium-tag">Premium</span>
            )}
          </div>

          <div className="use-modal__header-right">
            {/* Buy Premium button — only for premium templates */}
            {isPremium && (
              <button
                type="button"
                className="use-modal__buy-btn"
                onClick={onBuyPremium}
                aria-label="Buy Premium to unlock all premium templates"
              >
                ✦ Buy Premium
              </button>
            )}

            <button
              type="button"
              className="use-modal__close-btn"
              onClick={onClose}
              aria-label="Close template builder"
            >
              ✕
            </button>
          </div>
        </div>

        {/* ── Builder content ──────────────────────────────────────── */}
        <div className="use-modal__body">
          <BuilderWorkspace
            activeTemplate={activeTemplate}
            customBlocks={customBlocks}
            previewMode={previewMode}
            builderFeedback={builderFeedback}
            onAddBlock={onAddBlock}
            onRemoveLastBlock={onRemoveLastBlock}
            onResetBuilder={handleReset}
            onEditMode={onEditMode}
            onPreviewMode={onPreviewMode}
            onSubmitForm={onSubmitForm}
          />
        </div>

      </div>
    </div>
  );
}
