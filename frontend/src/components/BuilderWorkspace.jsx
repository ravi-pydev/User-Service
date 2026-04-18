import FormPreview from './FormPreview';

/**
 * BuilderWorkspace — renders the main builder area (right side of the app).
 *
 * Props:
 *   activeTemplate    {object|null}  - currently selected template object, or null
 *   customBlocks      {object[]}     - array of { id, type } custom blocks
 *   previewMode       {boolean}      - true = preview mode, false = edit mode
 *   builderFeedback   {string}       - feedback message to display
 *   onAddBlock        {function}     - called with block type ('text' | 'image' | 'divider')
 *   onRemoveLastBlock {function}     - called to remove the last block
 *   onResetBuilder    {function}     - called to reset the builder
 *   onEditMode        {function}     - called to switch to edit mode
 *   onPreviewMode     {function}     - called to switch to preview mode
 *   onSubmitForm      {function}     - called with formData when form is submitted
 */
export default function BuilderWorkspace({
  activeTemplate = null,
  customBlocks = [],
  previewMode = false,
  builderFeedback = '',
  onAddBlock,
  onRemoveLastBlock,
  onResetBuilder,
  onEditMode,
  onPreviewMode,
  onSubmitForm,
}) {
  if (!activeTemplate) {
    return (
      <div className="builder-workspace builder-workspace--empty">
        <p>Select a template from the gallery to get started.</p>
      </div>
    );
  }

  return (
    <div className="builder-workspace">
      {/* Template banner */}
      <div className="builder-banner">
        <span className="builder-banner__name">{activeTemplate.name}</span>
        <button
          type="button"
          className="builder-banner__reset-btn"
          onClick={onResetBuilder}
        >
          Reset
        </button>
      </div>

      {/* Mode switcher */}
      <div className="builder-mode-switcher" role="group" aria-label="Builder mode">
        <button
          type="button"
          className={`builder-mode-switcher__btn${!previewMode ? ' builder-mode-switcher__btn--active' : ''}`}
          onClick={onEditMode}
          aria-pressed={!previewMode}
        >
          Edit
        </button>
        <button
          type="button"
          className={`builder-mode-switcher__btn${previewMode ? ' builder-mode-switcher__btn--active' : ''}`}
          onClick={onPreviewMode}
          aria-pressed={previewMode}
        >
          Preview
        </button>
      </div>

      {/* Builder panel — edit mode only */}
      {!previewMode && (
        <div className="builder-panel">
          <div className="builder-panel__block-buttons">
            <button
              type="button"
              onClick={() => onAddBlock?.('text')}
            >
              Add Text
            </button>
            <button
              type="button"
              onClick={() => onAddBlock?.('image')}
            >
              Add Image
            </button>
            <button
              type="button"
              onClick={() => onAddBlock?.('divider')}
            >
              Add Divider
            </button>
            <button
              type="button"
              onClick={onRemoveLastBlock}
              disabled={customBlocks.length === 0}
            >
              Remove Last Block
            </button>
          </div>

          {customBlocks.length > 0 && (
            <ul className="builder-panel__block-list" aria-label="Custom blocks">
              {customBlocks.map((block) => (
                <li key={block.id} className="builder-panel__block-item">
                  {block.type}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Feedback message */}
      {builderFeedback && (
        <p className="builder-feedback" role="status">
          {builderFeedback}
        </p>
      )}

      {/* Form preview — always shown */}
      <FormPreview
        activeTemplate={activeTemplate}
        customBlocks={customBlocks}
        previewMode={previewMode}
        onSubmit={onSubmitForm}
      />
    </div>
  );
}
