import { useState, useEffect } from 'react';
import FormPreview from './FormPreview';
import DragDropFieldEditor from './DragDropFieldEditor';

/**
 * buildMergedFields — merges template schema fields with custom blocks.
 */
function buildMergedFields(template, customBlocks) {
  const schemaFields = template?.schema?.fields ?? [];
  const blockFields = (customBlocks ?? []).map((block) => ({
    name: `custom_block_${block.id}`,
    label: block.type.charAt(0).toUpperCase() + block.type.slice(1),
    type: block.type,
  }));
  return [...schemaFields, ...blockFields];
}

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
  const isPremium = Boolean(activeTemplate?.is_premium);

  const [orderedFields, setOrderedFields]   = useState([]);
  const [layoutOverride, setLayoutOverride] = useState(null);
  // Form preview theme — independent of the global app theme
  const [formTheme, setFormTheme]           = useState('light');

  useEffect(() => {
    if (activeTemplate) setOrderedFields(buildMergedFields(activeTemplate, customBlocks));
  }, [activeTemplate, customBlocks]);

  useEffect(() => {
    setLayoutOverride(null);
    setFormTheme('light');
  }, [activeTemplate?.id]);

  if (!activeTemplate) {
    return (
      <div className="builder-workspace builder-workspace--empty">
        <p>Select a template from the gallery to get started.</p>
      </div>
    );
  }

  const templateLayout = activeTemplate?.schema?.layout ?? 'single-column';
  const activeLayout   = layoutOverride ?? templateLayout;
  const isTwoColumn    = activeLayout === 'two-column';
  const isDarkForm     = formTheme === 'dark';

  const previewTemplate = {
    ...activeTemplate,
    schema: {
      ...activeTemplate.schema,
      layout: activeLayout,
      ...(isPremium && {
        fields: orderedFields.filter((f) => !f.name?.startsWith('custom_block_')),
      }),
    },
  };

  const remainingCustomBlocks = isPremium
    ? orderedFields
        .filter((f) => f.name?.startsWith('custom_block_'))
        .map((f) => ({ id: Number(f.name.replace('custom_block_', '')), type: f.type }))
    : customBlocks;

  const handleReset = () => {
    setLayoutOverride(null);
    setFormTheme('light');
    onResetBuilder?.();
  };

  const toggleLayout = () => {
    setLayoutOverride((prev) => {
      const current = prev ?? templateLayout;
      return current === 'two-column' ? 'single-column' : 'two-column';
    });
  };

  const toggleFormTheme = () => setFormTheme((t) => (t === 'light' ? 'dark' : 'light'));

  /* ── Toolbar controls JSX (not a component — avoids remount issues) */
  const toolbarControls = (
    <div className="builder-toolbar-controls">
      <button
        type="button"
        className={`builder-layout-toggle${isTwoColumn ? ' builder-layout-toggle--active' : ''}`}
        onClick={toggleLayout}
        aria-pressed={isTwoColumn}
        title={isTwoColumn ? 'Switch to single column' : 'Switch to two columns'}
      >
        <span className="builder-layout-toggle__icon" aria-hidden="true">
          {isTwoColumn ? '⊟' : '⊞'}
        </span>
        {isTwoColumn ? '1 Col' : '2 Col'}
      </button>

      <button
        type="button"
        className={`builder-form-theme-toggle${isDarkForm ? ' builder-form-theme-toggle--dark' : ''}`}
        onClick={toggleFormTheme}
        aria-pressed={isDarkForm}
        title={isDarkForm ? 'Switch form to light theme' : 'Switch form to dark theme'}
      >
        <span aria-hidden="true">{isDarkForm ? '☀️' : '🌙'}</span>
        {isDarkForm ? 'Light form' : 'Dark form'}
      </button>
    </div>
  );

  return (
    <div className="builder-workspace">

      {/* ── Edit mode panel — premium only ──────────────────────────── */}
      {isPremium && !previewMode && (
        <div className="builder-panel builder-panel--premium">
          <div className="builder-panel__premium-header">
            <span className="builder-panel__premium-icon">✦</span>
            <span>Premium editor — drag fields to reorder, × to remove</span>
          </div>

          <div className="builder-panel__toolbar">
            <div className="builder-panel__block-buttons">
              <button type="button" onClick={() => onAddBlock?.('text')}>+ Text</button>
              <button type="button" onClick={() => onAddBlock?.('image')}>+ Image</button>
              <button type="button" onClick={() => onAddBlock?.('divider')}>+ Divider</button>
            </div>
          </div>

          <DragDropFieldEditor fields={orderedFields} onChange={setOrderedFields} />

          <div className="builder-panel__footer">
            <button
              type="button"
              className="builder-mode-switcher__btn--inline"
              onClick={onPreviewMode}
            >
              ← Preview
            </button>
          </div>
        </div>
      )}

      {/* ── Preview toolbar (layout + theme + edit/reset actions) ───── */}
      {(isPremium ? previewMode : true) && (
        <div className="builder-preview-toolbar">
          <div className="builder-preview-toolbar__left">
            {isPremium && (
              <>
                <button
                  type="button"
                  className="builder-mode-switcher__btn--inline"
                  onClick={onEditMode}
                >
                  Edit
                </button>
                <button
                  type="button"
                  className="builder-banner__reset-btn"
                  onClick={handleReset}
                >
                  Reset
                </button>
              </>
            )}
          </div>
          {toolbarControls}
        </div>
      )}

      {/* ── Feedback message ────────────────────────────────────────── */}
      {(isPremium ? previewMode : true) && builderFeedback && (
        <p className="builder-feedback" role="status">{builderFeedback}</p>
      )}

      {/* ── Form preview ────────────────────────────────────────────── */}
      {(isPremium ? previewMode : true) && (
        <FormPreview
          activeTemplate={previewTemplate}
          customBlocks={remainingCustomBlocks}
          previewMode={true}
          onSubmit={onSubmitForm}
          overrideFields={isPremium ? orderedFields : null}
          formTheme={formTheme}
        />
      )}
    </div>
  );
}
