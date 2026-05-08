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

  const toggleLayout = () => {
    setLayoutOverride((prev) => {
      const current = prev ?? templateLayout;
      return current === 'two-column' ? 'single-column' : 'two-column';
    });
  };

  const toggleFormTheme = () => setFormTheme((t) => (t === 'light' ? 'dark' : 'light'));

  /* ── Shared toolbar controls (layout + form theme) ─────────────── */
  const ToolbarControls = () => (
    <div className="builder-toolbar-controls">
      {/* Layout toggle */}
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

      {/* Form theme toggle */}
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

      {/* ── Template banner ─────────────────────────────────────────── */}
      <div className="builder-banner">
        <div className="builder-banner__left">
          <span className="builder-banner__name">{activeTemplate.name}</span>
          {isPremium && <span className="builder-banner__premium-tag">Premium</span>}
        </div>
        <button type="button" className="builder-banner__reset-btn" onClick={onResetBuilder}>
          Reset
        </button>
      </div>

      {/* ── Mode switcher ───────────────────────────────────────────── */}
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

      {/* ── Edit mode panel ─────────────────────────────────────────── */}
      {!previewMode && (
        <>
          {isPremium ? (
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
                <ToolbarControls />
              </div>

              <DragDropFieldEditor fields={orderedFields} onChange={setOrderedFields} />
            </div>
          ) : (
            <div className="builder-panel">
              <div className="builder-panel__toolbar">
                <div className="builder-panel__block-buttons">
                  <button type="button" onClick={() => onAddBlock?.('text')}>Add Text</button>
                  <button type="button" onClick={() => onAddBlock?.('image')}>Add Image</button>
                  <button type="button" onClick={() => onAddBlock?.('divider')}>Add Divider</button>
                  <button type="button" onClick={onRemoveLastBlock} disabled={customBlocks.length === 0}>
                    Remove Last
                  </button>
                </div>
                <ToolbarControls />
              </div>

              {customBlocks.length > 0 && (
                <ul className="builder-panel__block-list" aria-label="Custom blocks">
                  {customBlocks.map((block) => (
                    <li key={block.id} className="builder-panel__block-item">{block.type}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </>
      )}

      {/* ── Preview mode toolbar (layout + theme toggles) ───────────── */}
      {previewMode && (
        <div className="builder-preview-toolbar">
          <ToolbarControls />
        </div>
      )}

      {/* ── Feedback message — only in preview mode ─────────────────── */}
      {previewMode && builderFeedback && (
        <p className="builder-feedback" role="status">{builderFeedback}</p>
      )}

      {/* ── Form preview — only in preview mode ─────────────────────── */}
      {previewMode && (
        <FormPreview
          activeTemplate={previewTemplate}
          customBlocks={remainingCustomBlocks}
          previewMode={previewMode}
          onSubmit={onSubmitForm}
          overrideFields={isPremium ? orderedFields : null}
          formTheme={formTheme}
        />
      )}
    </div>
  );
}
