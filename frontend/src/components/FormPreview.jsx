import { useState } from 'react';

/**
 * buildMergedSchema — merges template schema fields with custom blocks.
 */
function buildMergedSchema(template, customBlocks) {
  const schemaFields = template?.schema?.fields ?? [];
  const blockFields = (customBlocks ?? []).map((block) => ({
    name: `custom_block_${block.id}`,
    label: block.type.charAt(0).toUpperCase() + block.type.slice(1),
    type: block.type,
  }));
  return [...schemaFields, ...blockFields];
}

/**
 * renderFieldInput — renders the appropriate input element for a field.
 */
function renderFieldInput(field, formData, setFormData) {
  const value = formData[field.name] ?? '';

  const handleChange = (e) => {
    const newValue = field.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData((prev) => ({ ...prev, [field.name]: newValue }));
  };

  switch (field.type) {
    case 'email':
      return (
        <input type="email" id={field.name} name={field.name} value={value}
          onChange={handleChange} placeholder={field.placeholder ?? ''} aria-label={field.label} />
      );
    case 'password':
      return (
        <input type="password" id={field.name} name={field.name} value={value}
          onChange={handleChange} placeholder={field.placeholder ?? ''} aria-label={field.label} />
      );
    case 'number':
      return (
        <input type="number" id={field.name} name={field.name} value={value}
          onChange={handleChange} placeholder={field.placeholder ?? ''} aria-label={field.label} />
      );
    case 'tel':
      return (
        <input type="tel" id={field.name} name={field.name} value={value}
          onChange={handleChange} placeholder={field.placeholder ?? ''} aria-label={field.label} />
      );
    case 'url':
      return (
        <input type="url" id={field.name} name={field.name} value={value}
          onChange={handleChange} placeholder={field.placeholder ?? 'https://'} aria-label={field.label} />
      );
    case 'date':
      return (
        <input type="date" id={field.name} name={field.name} value={value}
          onChange={handleChange} aria-label={field.label} />
      );
    case 'datetime':
      return (
        <input type="datetime-local" id={field.name} name={field.name} value={value}
          onChange={handleChange} aria-label={field.label} />
      );
    case 'time':
      return (
        <input type="time" id={field.name} name={field.name} value={value}
          onChange={handleChange} aria-label={field.label} />
      );
    case 'range':
      return (
        <div className="form-field-range">
          <input type="range" id={field.name} name={field.name} value={value || 50}
            min={0} max={100} onChange={handleChange} aria-label={field.label} />
          <span className="form-field-range__value">{value || 50}</span>
        </div>
      );
    case 'color':
      return (
        <input type="color" id={field.name} name={field.name} value={value || '#3b82f6'}
          onChange={handleChange} aria-label={field.label} className="form-field-color" />
      );
    case 'file':
      return (
        <input type="file" id={field.name} name={field.name}
          onChange={handleChange} aria-label={field.label} />
      );
    case 'radio':
      return (
        <div className="form-field-radio-group" role="group" aria-label={field.label}>
          {(field.options ?? ['Option 1', 'Option 2', 'Option 3']).map((opt) => {
            const optVal = typeof opt === 'object' ? opt.value : opt;
            const optLabel = typeof opt === 'object' ? opt.label : opt;
            return (
              <label key={optVal} className="form-field-radio-option">
                <input type="radio" name={field.name} value={optVal}
                  checked={value === optVal} onChange={handleChange} />
                {optLabel}
              </label>
            );
          })}
        </div>
      );
    case 'textarea':
      return (
        <textarea id={field.name} name={field.name} value={value}
          onChange={handleChange} placeholder={field.placeholder ?? ''} aria-label={field.label} rows={4} />
      );
    case 'text':
      return (
        <input type="text" id={field.name} name={field.name} value={value}
          onChange={handleChange} placeholder={field.placeholder ?? ''} aria-label={field.label} />
      );
    case 'dropdown':
    case 'select':
      return (
        <select id={field.name} name={field.name} value={value}
          onChange={handleChange} aria-label={field.label}>
          <option value="">— select —</option>
          {(field.options ?? []).map((opt) => {
            const optValue = typeof opt === 'object' ? opt.value : opt;
            const optLabel = typeof opt === 'object' ? opt.label : opt;
            return <option key={optValue} value={optValue}>{optLabel}</option>;
          })}
        </select>
      );
    case 'checkbox':
      return (
        <input type="checkbox" id={field.name} name={field.name}
          checked={Boolean(formData[field.name])} onChange={handleChange} aria-label={field.label} />
      );
    case 'image':
      return (
        <div className="image-block-placeholder" aria-label="Image block">Image Block</div>
      );
    case 'divider':
      return <hr className="divider-block" />;
    default:
      return (
        <input type="text" id={field.name} name={field.name} value={value}
          onChange={handleChange} placeholder={field.placeholder ?? ''} aria-label={field.label} />
      );
  }
}

/**
 * FormPreview — renders a live preview of the active template's form.
 *
 * Props:
 *   activeTemplate  {object|null}   - template with a `schema` field
 *   customBlocks    {object[]}      - array of { id, type } custom block objects
 *   previewMode     {boolean}       - true = submit mode, false = edit mode
 *   onSubmit        {function}      - called with formData on submit
 *   overrideFields  {object[]|null} - when set, use these fields instead of merging
 *                                     (used by premium drag-and-drop editor)
 */
export default function FormPreview({
  activeTemplate = null,
  customBlocks = [],
  previewMode = false,
  onSubmit,
  overrideFields = null,
  formTheme = 'light',   // 'light' | 'dark'
}) {
  const [formData, setFormData] = useState({});

  if (!activeTemplate) {
    return <p>No template selected.</p>;
  }

  const fields = overrideFields ?? buildMergedSchema(activeTemplate, customBlocks);
  const layoutClass = activeTemplate?.schema?.layout ?? 'single-column';

  // Use explicit formTheme prop; fall back to accent-color detection for backward compat
  const accentColor = activeTemplate?.accent_color ?? '';
  const isAccentDark = accentColor === '#ea580c' || accentColor === '#f97316' || accentColor === '#c2410c';
  const isDarkTheme = formTheme === 'dark' || (formTheme === 'light' ? false : isAccentDark);
  const themeClass = isDarkTheme ? 'preview-form--dark' : '';

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit?.(formData);
  };

  return (
    <form
      className={`preview-form ${layoutClass} ${themeClass}`}
      onSubmit={handleSubmit}
      aria-label={`${activeTemplate.name} form preview`}
      noValidate
    >
      {fields.map((field) => (
        <div key={field.name} className="form-field">
          {field.type !== 'divider' && field.type !== 'image' && (
            <label htmlFor={field.name}>
              {field.label}
              {field.required && (
                <span className="required-marker" aria-hidden="true"> *</span>
              )}
            </label>
          )}
          {renderFieldInput(field, formData, setFormData)}
        </div>
      ))}

      {previewMode ? (
        <button type="submit" className="submit-btn">Submit</button>
      ) : (
        <p className="edit-mode-note" role="note">
          Switch to preview mode to submit this form.
        </p>
      )}
    </form>
  );
}
