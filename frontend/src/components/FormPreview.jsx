import { useState } from 'react';

/**
 * buildMergedSchema — merges template schema fields with custom blocks.
 *
 * @param {object} template     - template object with a `schema` field
 * @param {object[]} customBlocks - array of { id, type } custom block objects
 * @returns {object[]} merged array of field objects
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
 *
 * @param {object}   field       - field descriptor ({ name, type, options, ... })
 * @param {object}   formData    - current form data state
 * @param {function} setFormData - state setter for formData
 * @returns {JSX.Element}
 */
function renderFieldInput(field, formData, setFormData) {
  const value = formData[field.name] ?? '';

  const handleChange = (e) => {
    const newValue =
      field.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData((prev) => ({ ...prev, [field.name]: newValue }));
  };

  switch (field.type) {
    case 'text':
    case 'textarea':
      return (
        <textarea
          id={field.name}
          name={field.name}
          value={value}
          onChange={handleChange}
          aria-label={field.label}
          rows={field.type === 'textarea' ? 4 : 2}
        />
      );

    case 'select':
      return (
        <select
          id={field.name}
          name={field.name}
          value={value}
          onChange={handleChange}
          aria-label={field.label}
        >
          <option value="">— select —</option>
          {(field.options ?? []).map((opt) => {
            const optValue = typeof opt === 'object' ? opt.value : opt;
            const optLabel = typeof opt === 'object' ? opt.label : opt;
            return (
              <option key={optValue} value={optValue}>
                {optLabel}
              </option>
            );
          })}
        </select>
      );

    case 'checkbox':
      return (
        <input
          type="checkbox"
          id={field.name}
          name={field.name}
          checked={Boolean(formData[field.name])}
          onChange={handleChange}
          aria-label={field.label}
        />
      );

    case 'image':
      return (
        <div className="image-block-placeholder" aria-label="Image block">
          Image Block
        </div>
      );

    case 'divider':
      return <hr className="divider-block" />;

    default:
      return (
        <input
          type="text"
          id={field.name}
          name={field.name}
          value={value}
          onChange={handleChange}
          aria-label={field.label}
        />
      );
  }
}

/**
 * FormPreview — renders a live preview of the active template's form.
 *
 * Props:
 *   activeTemplate  {object|null}  - template with a `schema` field, or null
 *   customBlocks    {object[]}     - array of { id, type } custom block objects
 *   previewMode     {boolean}      - true = preview/submit mode, false = edit mode
 *   onSubmit        {function}     - called with formData when the form is submitted
 */
export default function FormPreview({
  activeTemplate = null,
  customBlocks = [],
  previewMode = false,
  onSubmit,
}) {
  const [formData, setFormData] = useState({});

  if (!activeTemplate) {
    return <p>No template selected.</p>;
  }

  const mergedFields = buildMergedSchema(activeTemplate, customBlocks);
  const layoutClass = activeTemplate?.schema?.layout ?? 'single-column';

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit?.(formData);
  };

  return (
    <form
      className={`preview-form ${layoutClass}`}
      onSubmit={handleSubmit}
      aria-label={`${activeTemplate.name} form preview`}
      noValidate
    >
      {mergedFields.map((field) => (
        <div key={field.name} className="form-field">
          {/* Divider and image blocks don't need a visible label */}
          {field.type !== 'divider' && field.type !== 'image' && (
            <label htmlFor={field.name}>
              {field.label}
              {field.required && (
                <span className="required-marker" aria-hidden="true">
                  {' '}*
                </span>
              )}
            </label>
          )}
          {renderFieldInput(field, formData, setFormData)}
        </div>
      ))}

      {previewMode ? (
        <button type="submit" className="submit-btn">
          Submit
        </button>
      ) : (
        <p className="edit-mode-note" role="note">
          Switch to preview mode to submit this form.
        </p>
      )}
    </form>
  );
}
