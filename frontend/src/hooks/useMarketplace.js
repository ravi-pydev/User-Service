import { useState, useCallback, useRef } from 'react';
import { apiFetch } from '../api/client.js';

/**
 * useMarketplace — central state and async logic for the template marketplace.
 *
 * Encapsulates all state and side-effects that were previously managed in the
 * monolithic app.js, exposing them as a single hook that components can consume.
 *
 * @returns {object} All state values and action functions.
 */
export default function useMarketplace() {
  // ── User ──────────────────────────────────────────────────────────────────
  const [user, setUser] = useState(null);

  // ── Template catalogue ────────────────────────────────────────────────────
  const [templates, setTemplates] = useState([]);
  const [templateCount, setTemplateCount] = useState(0);
  const [recent, setRecent] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [availableTypes, setAvailableTypes] = useState([]);

  // ── Builder ───────────────────────────────────────────────────────────────
  const [activeTemplate, setActiveTemplate] = useState(null);
  const [customBlocks, setCustomBlocks] = useState([]);
  const [previewMode, setPreviewMode] = useState(true);

  // ── Filters ───────────────────────────────────────────────────────────────
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    type: '',
    layout: '',
    field_type: '',
    has_required: false,
    field_count: '',
  });
  // Keep a ref in sync so loadMarketplace can always read the latest filters
  // without needing them in its dependency array.
  const filtersRef = useRef(filters);
  const setFiltersAndRef = useCallback((next) => {
    filtersRef.current = next;
    setFilters(next);
  }, []);

  // ── Premium modal ─────────────────────────────────────────────────────────
  const [pendingPremiumTemplateId, setPendingPremiumTemplateId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // ── Status / feedback messages ────────────────────────────────────────────
  const [topbarStatus, setTopbarStatus] = useState('');
  const [builderFeedback, setBuilderFeedback] = useState('');
  const [modalFeedback, setModalFeedback] = useState('');

  // Auto-clear topbarStatus after 3 seconds
  const statusTimerRef = useRef(null);
  const setTopbarStatusWithTimeout = useCallback((msg) => {
    setTopbarStatus(msg);
    if (statusTimerRef.current) clearTimeout(statusTimerRef.current);
    if (msg) {
      statusTimerRef.current = setTimeout(() => setTopbarStatus(''), 3000);
    }
  }, []);

  // ── Internal helpers ──────────────────────────────────────────────────────

  /**
   * Build the query string from the current filters object.
   * @param {object} f - filters object (defaults to current state)
   */
  const buildQuery = useCallback((f) => {
    const params = new URLSearchParams();
    if (f.search)       params.set('search', f.search);
    if (f.category)     params.set('category', f.category);
    if (f.type)         params.set('type', f.type);
    if (f.layout)       params.set('layout', f.layout);
    if (f.field_type)   params.set('field_type', f.field_type);
    if (f.has_required) params.set('has_required', 'true');
    if (f.field_count)  params.set('field_count', f.field_count);
    const qs = params.toString();
    return qs ? `?${qs}` : '';
  }, []);

  // ── Public actions ────────────────────────────────────────────────────────

  /**
   * Load templates from the API using the current filters.
   * Updates templates, templateCount, recent, favorites, and availableTypes.
   * For logged-out users the API returns 401 — we catch it silently and
   * leave the template list empty (the login modal will open via the 401 handler).
   */
  const loadMarketplace = useCallback(async (overrideFilters) => {
    const activeFilters = overrideFilters ?? filtersRef.current;
    try {
      const data = await apiFetch(`/api/templates/${buildQuery(activeFilters)}`);
      setTemplates(data.templates ?? []);
      setTemplateCount(data.templates?.length ?? 0);
      setRecent(data.recently_used ?? []);
      setFavorites(data.favorites ?? []);
      setAvailableTypes(data.available_types ?? []);
      setTopbarStatus('');
    } catch (err) {
      if (err?.status === 401) {
        // Not logged in — silently show empty state; login modal handles the rest
        setTemplates([]);
        setTemplateCount(0);
      } else {
        setTopbarStatusWithTimeout('Unable to load the marketplace.');
        console.error('loadMarketplace error', err);
      }
    }
  }, [buildQuery]);

  /**
   * Bootstrap the app: load templates (always), and fetch the current user
   * only if a token is present in localStorage.
   */
  const bootstrap = useCallback(async () => {
    const hasToken = Boolean(localStorage.getItem('auth_token'));
    try {
      if (hasToken) {
        const [userData] = await Promise.all([
          apiFetch('/api/user/'),
          loadMarketplace(),
        ]);
        setUser(userData);
      } else {
        // Logged-out: just load templates (no auth required for listing)
        await loadMarketplace();
      }
    } catch (err) {
      // If user fetch fails (expired token etc.) still try to show templates
      try { await loadMarketplace(); } catch (_) { /* ignore */ }
      console.error('bootstrap error', err);
    }
  }, [loadMarketplace]);

  /**
   * Open a template in the builder.
   * If the template is premium and the user is not premium, open the upgrade modal.
   * @param {number|string} id - template id
   */
  const useTemplate = useCallback(async (id) => {
    try {
      const data = await apiFetch(`/api/templates/${id}/use/`, { method: 'POST' });
      setActiveTemplate(data);
      setCustomBlocks([]);
      setPreviewMode(false);
      setBuilderFeedback('');
      setTopbarStatusWithTimeout(`Opened: ${data.name}`);
    } catch (err) {
      if (err?.status === 403 && err?.payload?.code === 'premium_required') {
        setPendingPremiumTemplateId(id);
        setIsModalOpen(true);
        setModalFeedback('');
      } else {
        setTopbarStatusWithTimeout('Failed to open template.');
        console.error('useTemplate error', err);
      }
    }
  }, []);

  /**
   * Toggle the favourite state of a template.
   * @param {number|string} id - template id
   */
  const toggleFavorite = useCallback(async (id) => {
    try {
      const data = await apiFetch(`/api/templates/${id}/favorite/`, { method: 'POST' });
      // Refresh the catalogue so the favorites list stays in sync.
      await loadMarketplace();
      setTopbarStatusWithTimeout(data.is_favorite ? 'Added to favourites.' : 'Removed from favourites.');
    } catch (err) {
      setTopbarStatusWithTimeout('Failed to update favourite.');
      console.error('toggleFavorite error', err);
    }
  }, [loadMarketplace]);

  /**
   * Run the mock premium upgrade flow.
   * @param {'success'|'failure'} outcome
   */
  const runMockUpgrade = useCallback(async (outcome) => {
    try {
      const data = await apiFetch('/api/user/upgrade/', {
        method: 'POST',
        body: JSON.stringify({ outcome }),
      });

      if (data.payment_status === 'success') {
        setUser(data.user);
        setModalFeedback('Premium unlocked! Opening your template…');

        // If there was a pending template, open it now.
        if (pendingPremiumTemplateId !== null) {
          const id = pendingPremiumTemplateId;
          setPendingPremiumTemplateId(null);
          setIsModalOpen(false);
          await useTemplate(id);
        } else {
          setIsModalOpen(false);
        }
      } else {
        setModalFeedback('Payment failed. Please try again.');
      }
    } catch (err) {
      setModalFeedback('An error occurred. Please try again.');
      console.error('runMockUpgrade error', err);
    }
  }, [pendingPremiumTemplateId, useTemplate]);

  /**
   * Add a custom block to the builder.
   * @param {'text'|'image'|'divider'} type
   */
  const addBlock = useCallback((type) => {
    setCustomBlocks((prev) => [...prev, { type, id: Date.now() }]);
    setBuilderFeedback(`Added ${type} block.`);
  }, []);

  /**
   * Remove the last custom block from the builder.
   */
  const removeLastBlock = useCallback(() => {
    setCustomBlocks((prev) => {
      if (prev.length === 0) return prev;
      return prev.slice(0, -1);
    });
    setBuilderFeedback('Removed last block.');
  }, []);

  /**
   * Reset the builder: discard custom blocks and mode changes but keep the
   * active template open. Used by the Reset button inside the modal.
   */
  const resetBuilder = useCallback(() => {
    setCustomBlocks([]);
    setPreviewMode(true);
    setBuilderFeedback('');
  }, []);

  /**
   * Close the builder: fully clear the active template and all state.
   * Used when the modal is closed.
   */
  const closeBuilder = useCallback(() => {
    setActiveTemplate(null);
    setCustomBlocks([]);
    setPreviewMode(false);
    setBuilderFeedback('');
    setTopbarStatus('');
  }, []);

  /**
   * Submit the current form with the provided form data.
   * @param {object} formData - key/value pairs from the form
   */
  const submitCurrentForm = useCallback(async (formData) => {
    if (!activeTemplate) {
      setBuilderFeedback('No active template to submit.');
      return;
    }
    try {
      const data = await apiFetch(`/api/templates/${activeTemplate.id}/submit/`, {
        method: 'POST',
        body: JSON.stringify({ form_data: formData }),
      });
      setBuilderFeedback(`Submitted! (ID: ${data.submission_id})`);
      setTopbarStatusWithTimeout('Form submitted successfully.');
    } catch (err) {
      setBuilderFeedback('Submission failed. Please try again.');
      console.error('submitCurrentForm error', err);
    }
  }, [activeTemplate]);

  /**
   * Clear all active filters and reload the marketplace.
   */
  const clearFilters = useCallback(() => {
    const cleared = {
      search: '',
      category: '',
      type: '',
      layout: '',
      field_type: '',
      has_required: false,
      field_count: '',
    };
    setFiltersAndRef(cleared);
    loadMarketplace(cleared);
  }, [loadMarketplace]);

  /**
   * Show all templates (alias for clearFilters).
   */
  const showAllTemplates = useCallback(() => {
    clearFilters();
  }, [clearFilters]);

  /**
   * Show only premium templates.
   */
  const showPremiumTemplates = useCallback(() => {
    const premiumFilters = {
      search: '',
      category: 'premium',
      type: '',
      layout: '',
      field_type: '',
      has_required: false,
      field_count: '',
    };
    setFiltersAndRef(premiumFilters);
    loadMarketplace(premiumFilters);
  }, [loadMarketplace]);

  /**
   * Switch the builder to preview mode. Clears stale feedback so submission starts fresh.
   */
  const jumpToPreviewMode = useCallback(() => {
    setPreviewMode(true);
    setBuilderFeedback('');
  }, []);

  /**
   * Switch the builder to edit mode. Clears any stale feedback messages.
   */
  const jumpToEditMode = useCallback(() => {
    setPreviewMode(false);
    setBuilderFeedback('');
  }, []);

  /**
   * Close the premium upgrade modal.
   */
  const closePremiumModal = useCallback(() => {
    setIsModalOpen(false);
    setPendingPremiumTemplateId(null);
    setModalFeedback('');
  }, []);

  // ── Return value ──────────────────────────────────────────────────────────
  return {
    // State
    user,
    templates,
    templateCount,
    recent,
    favorites,
    availableTypes,
    activeTemplate,
    customBlocks,
    previewMode,
    filters,
    pendingPremiumTemplateId,
    topbarStatus,
    builderFeedback,
    modalFeedback,
    isModalOpen,

    // Actions
    loadMarketplace,
    bootstrap,
    useTemplate,
    toggleFavorite,
    runMockUpgrade,
    addBlock,
    removeLastBlock,
    resetBuilder,
    closeBuilder,
    submitCurrentForm,
    clearFilters,
    showAllTemplates,
    showPremiumTemplates,
    jumpToPreviewMode,
    jumpToEditMode,
    closePremiumModal,
    setFilters: setFiltersAndRef,
  };
}
