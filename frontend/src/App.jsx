import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import useMarketplace from './hooks/useMarketplace';
import useTheme from './hooks/useTheme';
import useAuth from './hooks/useAuth';
import { registerOn401 } from './api/client';
import Header from './components/Header';
import Footer from './components/Footer';
import Topbar from './components/Topbar';
import Sidebar from './components/Sidebar';
import TemplateGallery from './components/TemplateGallery';
import UseTemplateModal from './components/UseTemplateModal';
import PremiumModal from './components/PremiumModal';
import TemplateDetailPage from './components/TemplateDetailPage';
import AuthModal from './components/AuthModal';
import HomePage from './pages/HomePage';
import { AuthProvider } from './auth/AuthContext';

/* ── Public homepage wrapper (Header + content + Footer) ─────────── */
function PublicLayout({ children, onOpenLogin, onOpenSignup, theme, onToggleTheme }) {
  return (
    <div className="public-layout">
      <Header
        onOpenLogin={onOpenLogin}
        onOpenSignup={onOpenSignup}
        theme={theme}
        onToggleTheme={onToggleTheme}
      />
      <main className="public-main">{children}</main>
      <Footer />
    </div>
  );
}

/* ── App marketplace shell (Topbar + Sidebar + content) ──────────── */
function AppShell({ onOpenLogin, onOpenSignup, theme, onToggleTheme }) {
  const location = useLocation();
  const navigate = useNavigate();
  const isDetailPage = location.pathname.startsWith('/app/templates/');
  const { isAuthenticated } = useAuth();

  const {
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
    topbarStatus,
    builderFeedback,
    modalFeedback,
    isModalOpen,
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
    setFilters,
  } = useMarketplace();

  const [isBuilderOpen, setIsBuilderOpen] = useState(false);

  // Sync filters from URL search params on every navigation
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const category = params.get('category') ?? '';

    if (category === 'premium') {
      showPremiumTemplates();
    } else if (location.pathname === '/app' && !location.search) {
      bootstrap();
    }
  }, [location.pathname, location.search]);

  const handleUseTemplate = async (id) => {
    // Gate: unauthenticated users see the login modal instead
    if (!isAuthenticated) {
      onOpenLogin();
      return;
    }
    await useTemplate(id);
    setIsBuilderOpen(true);
  };

  const handleToggleFavorite = (id) => {
    if (!isAuthenticated) { onOpenLogin(); return; }
    toggleFavorite(id);
  };

  const handleCloseBuilder = () => {
    setIsBuilderOpen(false);
    closeBuilder();
  };

  const handleShowAll = () => {
    showAllTemplates();
    navigate('/app');
  };

  const handleShowPremium = () => {
    navigate('/app?category=premium');
  };

  return (
    <div className="app">
      <Topbar
        topbarStatus={topbarStatus}
        onShowAll={handleShowAll}
        onShowPremium={handleShowPremium}
        theme={theme}
        onToggleTheme={onToggleTheme}
        onOpenLogin={onOpenLogin}
        onOpenSignup={onOpenSignup}
      />

      <div className="app-body">
        {!isDetailPage && (
          <Sidebar
            filters={filters}
            onSearchChange={(val) => { const next = { ...filters, search: val }; setFilters(next); loadMarketplace(next); }}
            onCategoryChange={(val) => {
              const next = { ...filters, category: val };
              setFilters(next);
              if (val === 'premium') navigate('/app?category=premium');
              else navigate('/app');
              loadMarketplace(next);
            }}
            onTypeChange={(val) => { const next = { ...filters, type: val }; setFilters(next); loadMarketplace(next); }}
            onLayoutChange={(val) => { const next = { ...filters, layout: val }; setFilters(next); loadMarketplace(next); }}
            onFieldTypeChange={(val) => { const next = { ...filters, field_type: val }; setFilters(next); loadMarketplace(next); }}
            onHasRequiredChange={(val) => { const next = { ...filters, has_required: val }; setFilters(next); loadMarketplace(next); }}
            onFieldCountChange={(val) => { const next = { ...filters, field_count: val }; setFilters(next); loadMarketplace(next); }}
            onClearFilters={() => { clearFilters(); navigate('/app'); }}
            availableTypes={availableTypes}
            recent={recent}
            favorites={favorites}
            onOpenTemplate={handleUseTemplate}
          />
        )}

        <main className={`app-main${isDetailPage ? ' app-main--full' : ''}`}>
          <Routes>
            <Route
              path="templates/:id"
              element={
                <TemplateDetailPage
                  user={user}
                  onUse={handleUseTemplate}
                  onToggleFavorite={handleToggleFavorite}
                  onOpenLogin={onOpenLogin}
                />
              }
            />
            <Route
              path="*"
              element={
                <TemplateGallery
                  templates={templates}
                  templateCount={templateCount}
                  filters={filters}
                  onUse={handleUseTemplate}
                  onToggleFavorite={handleToggleFavorite}
                  isPremiumView={new URLSearchParams(location.search).get('category') === 'premium'}
                />
              }
            />
          </Routes>
        </main>
      </div>

      <UseTemplateModal
        isOpen={isBuilderOpen && Boolean(activeTemplate)}
        activeTemplate={activeTemplate}
        customBlocks={customBlocks}
        previewMode={previewMode}
        builderFeedback={builderFeedback}
        onClose={handleCloseBuilder}
        onBuyPremium={() => {
          handleCloseBuilder();
          if (activeTemplate) handleUseTemplate(activeTemplate.id);
        }}
        onAddBlock={addBlock}
        onRemoveLastBlock={removeLastBlock}
        onResetBuilder={resetBuilder}
        onEditMode={jumpToEditMode}
        onPreviewMode={jumpToPreviewMode}
        onSubmitForm={submitCurrentForm}
      />

      <PremiumModal
        isOpen={isModalOpen}
        modalFeedback={modalFeedback}
        onClose={closePremiumModal}
        onMockSuccess={() => runMockUpgrade('success')}
        onMockFailure={() => runMockUpgrade('failure')}
      />
    </div>
  );
}

/* ── Root — handles auth modal state and routing ─────────────────── */
function Root() {
  const { theme, toggleTheme } = useTheme();
  const { registerOpenLogin } = useAuth();
  const [authModal, setAuthModal] = useState(null); // null | 'login' | 'signup'

  // Register so AuthContext.logout() and apiFetch 401s open the login modal
  useEffect(() => {
    const opener = () => setAuthModal('login');
    registerOpenLogin(opener);
    registerOn401(opener);
  }, [registerOpenLogin]);

  const openLogin = () => setAuthModal('login');
  const openSignup = () => setAuthModal('signup');
  const closeModal = () => setAuthModal(null);

  return (
    <>
      <Routes>
        {/* Public homepage */}
        <Route
          path="/"
          element={
            <PublicLayout
              onOpenLogin={openLogin}
              onOpenSignup={openSignup}
              theme={theme}
              onToggleTheme={toggleTheme}
            >
              <HomePage onOpenSignup={openSignup} onOpenLogin={openLogin} />
            </PublicLayout>
          }
        />

        {/* Marketplace app — /app and /app/templates/:id */}
        <Route
          path="/app/*"
          element={
            <AppShell
              onOpenLogin={openLogin}
              onOpenSignup={openSignup}
              theme={theme}
              onToggleTheme={toggleTheme}
            />
          }
        />
      </Routes>

      {/* Auth modal — rendered at root level so it overlays everything */}
      <AuthModal
        isOpen={authModal !== null}
        initialView={authModal ?? 'login'}
        onClose={closeModal}
      />
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Root />
      </AuthProvider>
    </BrowserRouter>
  );
}
