import { useState, useRef } from 'react';

/**
 * DragDropFieldEditor — drag-and-drop field editor for premium templates.
 *
 * Each row supports:
 *   - Drag to reorder
 *   - Inline editable field label (dynamic field name)
 *   - Inline editable placeholder
 *   - Required / Not required toggle
 *   - Remove field (×)
 *
 * Props:
 *   fields    {object[]}  - array of field objects
 *   onChange  {function}  - called with the updated fields array
 */
export default function DragDropFieldEditor({ fields = [], onChange }) {
  const dragIndex = useRef(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  // Track which field row is expanded for editing
  const [expandedIndex, setExpandedIndex] = useState(null);

  const ALL_FIELD_TYPES = [
    { value: 'text',     label: 'Text' },
    { value: 'email',    label: 'Email' },
    { value: 'password', label: 'Password' },
    { value: 'number',   label: 'Number' },
    { value: 'tel',      label: 'Phone' },
    { value: 'url',      label: 'URL' },
    { value: 'textarea', label: 'Textarea' },
    { value: 'dropdown', label: 'Dropdown' },
    { value: 'date',     label: 'Date' },
    { value: 'datetime', label: 'Date & Time' },
    { value: 'time',     label: 'Time' },
    { value: 'checkbox', label: 'Checkbox' },
    { value: 'radio',    label: 'Radio' },
    { value: 'range',    label: 'Range / Slider' },
    { value: 'color',    label: 'Color Picker' },
    { value: 'file',     label: 'File Upload' },
    { value: 'image',    label: 'Image Block' },
    { value: 'divider',  label: 'Divider' },
  ];

  const typeColors = {
    text:     { bg: '#dbeafe', color: '#1e40af' },
    email:    { bg: '#dcfce7', color: '#166534' },
    password: { bg: '#fce7f3', color: '#9d174d' },
    number:   { bg: '#fef9c3', color: '#854d0e' },
    tel:      { bg: '#dcfce7', color: '#166534' },
    url:      { bg: '#dbeafe', color: '#1e40af' },
    textarea: { bg: '#fef9c3', color: '#854d0e' },
    dropdown: { bg: '#ede9fe', color: '#5b21b6' },
    date:     { bg: '#ffedd5', color: '#9a3412' },
    datetime: { bg: '#ffedd5', color: '#9a3412' },
    time:     { bg: '#ffedd5', color: '#9a3412' },
    checkbox: { bg: '#f0fdf4', color: '#15803d' },
    radio:    { bg: '#f0fdf4', color: '#15803d' },
    range:    { bg: '#e0e7ff', color: '#3730a3' },
    color:    { bg: '#fce7f3', color: '#9d174d' },
    file:     { bg: '#f1f5f9', color: '#475569' },
    image:    { bg: '#f1f5f9', color: '#475569' },
    divider:  { bg: '#f1f5f9', color: '#475569' },
  };

  // ── Drag handlers ──────────────────────────────────────────────────
  const handleDragStart = (e, index) => {
    dragIndex.current = index;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setDragImage(e.currentTarget, 20, 20);
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (index !== dragIndex.current) setDragOverIndex(index);
  };

  const handleDrop = (e, dropIndex) => {
    e.preventDefault();
    const from = dragIndex.current;
    if (from === null || from === dropIndex) { setDragOverIndex(null); return; }
    const reordered = [...fields];
    const [moved] = reordered.splice(from, 1);
    reordered.splice(dropIndex, 0, moved);
    dragIndex.current = null;
    setDragOverIndex(null);
    // Keep expanded index in sync after reorder
    if (expandedIndex === from) setExpandedIndex(dropIndex);
    onChange?.(reordered);
  };

  const handleDragEnd = () => {
    dragIndex.current = null;
    setDragOverIndex(null);
  };

  // ── Field mutation helpers ─────────────────────────────────────────
  const updateField = (index, patch) => {
    const updated = fields.map((f, i) => i === index ? { ...f, ...patch } : f);
    onChange?.(updated);
  };

  const handleRemove = (index) => {
    onChange?.(fields.filter((_, i) => i !== index));
    if (expandedIndex === index) setExpandedIndex(null);
    else if (expandedIndex > index) setExpandedIndex(expandedIndex - 1);
  };

  const toggleExpand = (index) => {
    setExpandedIndex((prev) => (prev === index ? null : index));
  };

  if (fields.length === 0) {
    return (
      <div className="dnd-editor dnd-editor--empty">
        <p>No fields. Add blocks above to populate the form.</p>
      </div>
    );
  }

  return (
    <div className="dnd-editor" aria-label="Drag to reorder form fields">
      <p className="dnd-editor__hint">
        ⠿ Drag to reorder · click a row to edit · × to remove
      </p>
      <ul className="dnd-editor__list" role="list">
        {fields.map((field, index) => {
          const typeStyle = typeColors[field.type] ?? { bg: '#f3f4f6', color: '#374151' };
          const isDragOver = dragOverIndex === index;
          const isDragging = dragIndex.current === index;
          const isExpanded = expandedIndex === index;
          const hasPlaceholder = !['checkbox', 'radio', 'date', 'datetime', 'time', 'range', 'color', 'file', 'divider', 'image'].includes(field.type);

          return (
            <li
              key={field.name ?? index}
              className={[
                'dnd-editor__row',
                isDragOver   ? 'dnd-editor__row--over'     : '',
                isDragging   ? 'dnd-editor__row--dragging' : '',
                isExpanded   ? 'dnd-editor__row--expanded' : '',
              ].filter(Boolean).join(' ')}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDrop={(e) => handleDrop(e, index)}
              onDragEnd={handleDragEnd}
            >
              {/* ── Collapsed row ──────────────────────────────────── */}
              <div
                className="dnd-editor__row-summary"
                onClick={() => toggleExpand(index)}
                role="button"
                tabIndex={0}
                aria-expanded={isExpanded}
                onKeyDown={(e) => e.key === 'Enter' && toggleExpand(index)}
              >
                <span className="dnd-editor__handle" aria-hidden="true">⠿</span>

                <div className="dnd-editor__field-info">
                  <span className="dnd-editor__field-label">
                    {field.label || <em className="dnd-editor__unnamed">Unnamed field</em>}
                    {field.required && (
                      <span className="dnd-editor__required" aria-label="required"> *</span>
                    )}
                  </span>
                  {field.placeholder && !isExpanded && (
                    <span className="dnd-editor__placeholder">{field.placeholder}</span>
                  )}
                </div>

                <span
                  className="dnd-editor__type-badge"
                  style={{ background: typeStyle.bg, color: typeStyle.color }}
                >
                  {field.type}
                </span>

                <span
                  className={`dnd-editor__required-badge ${field.required ? 'dnd-editor__required-badge--on' : 'dnd-editor__required-badge--off'}`}
                  aria-hidden="true"
                >
                  {field.required ? 'Required' : 'Optional'}
                </span>

                <span className="dnd-editor__expand-icon" aria-hidden="true">
                  {isExpanded ? '▲' : '▼'}
                </span>

                <button
                  type="button"
                  className="dnd-editor__remove-btn"
                  onClick={(e) => { e.stopPropagation(); handleRemove(index); }}
                  aria-label={`Remove field: ${field.label ?? field.name}`}
                >
                  ×
                </button>
              </div>

              {/* ── Expanded edit panel ────────────────────────────── */}
              {isExpanded && (
                <div className="dnd-editor__edit-panel" onClick={(e) => e.stopPropagation()}>

                  {/* Field label / name */}
                  <div className="dnd-editor__edit-row">
                    <label className="dnd-editor__edit-label" htmlFor={`field-label-${index}`}>
                      Field name
                    </label>
                    <input
                      id={`field-label-${index}`}
                      type="text"
                      className="dnd-editor__edit-input"
                      value={field.label ?? ''}
                      placeholder="e.g. Full Name"
                      onChange={(e) => updateField(index, { label: e.target.value })}
                    />
                  </div>

                  {/* Field type selector */}
                  <div className="dnd-editor__edit-row">
                    <label className="dnd-editor__edit-label" htmlFor={`field-type-${index}`}>
                      Input type
                    </label>
                    <div className="dnd-editor__type-select-wrap">
                      <span
                        className="dnd-editor__type-select-badge"
                        style={{ background: typeStyle.bg, color: typeStyle.color }}
                      >
                        {field.type}
                      </span>
                      <select
                        id={`field-type-${index}`}
                        className="dnd-editor__edit-select"
                        value={field.type ?? 'text'}
                        onChange={(e) => updateField(index, { type: e.target.value, placeholder: '' })}
                      >
                        {ALL_FIELD_TYPES.map(({ value, label }) => (
                          <option key={value} value={value}>{label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Placeholder — only for text-like fields */}
                  {hasPlaceholder && (
                    <div className="dnd-editor__edit-row">
                      <label className="dnd-editor__edit-label" htmlFor={`field-placeholder-${index}`}>
                        Placeholder
                      </label>
                      <input
                        id={`field-placeholder-${index}`}
                        type="text"
                        className="dnd-editor__edit-input"
                        value={field.placeholder ?? ''}
                        placeholder="e.g. Enter your name…"
                        onChange={(e) => updateField(index, { placeholder: e.target.value })}
                      />
                    </div>
                  )}

                  {/* Required toggle */}
                  <div className="dnd-editor__edit-row dnd-editor__edit-row--toggle">
                    <span className="dnd-editor__edit-label">Required</span>
                    <button
                      type="button"
                      className={`dnd-editor__toggle-btn ${field.required ? 'dnd-editor__toggle-btn--on' : 'dnd-editor__toggle-btn--off'}`}
                      onClick={() => updateField(index, { required: !field.required })}
                      aria-pressed={Boolean(field.required)}
                    >
                      <span className="dnd-editor__toggle-track">
                        <span className="dnd-editor__toggle-thumb" />
                      </span>
                      <span className="dnd-editor__toggle-text">
                        {field.required ? 'Required' : 'Optional'}
                      </span>
                    </button>
                  </div>

                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
