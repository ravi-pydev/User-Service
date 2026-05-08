import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import useMarketplace from './hooks/useMarketplace';
import useTheme from './hooks/useTheme';
import Topbar from './components/Topbar';
import Sidebar from './components/Sidebar';
import TemplateGallery from './components/TemplateGallery';
import UseTemplateModal from './components/UseTemplateModal';
import PremiumModal from './components/PremiumModal';
import TemplateDetailPage from './components/TemplateDetailPage';

function AppShell() {
  const location = useLocation();
  const navigate = useNavigate();
  const isDetailPage = location.pathname.startsWith('/templates/');
  const { theme, toggleTheme } = useTheme();

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
    } else if (location.pathname === '/' && !location.search) {
      // Plain home — run bootstrap only on first load, otherwise just reload
      bootstrap();
    }
  }, [location.pathname, location.search]);

  const handleUseTemplate = async (id) => {
    await useTemplate(id);
    setIsBuilderOpen(true);
  };

  const handleCloseBuilder = () => {
    setIsBuilderOpen(false);
    closeBuilder();
  };

  const handleShowAll = () => {
    showAllTemplates();
    navigate('/');
  };

  const handleShowPremium = () => {
    navigate('/?category=premium');
  };

  const handleLogin = () => alert('Login coming soon!');
  const handleRegister = () => alert('Sign up coming soon!');

  return (
    <div className="app">
      <Topbar
        user={user}
        topbarStatus={topbarStatus}
        onShowAll={handleShowAll}
        onShowPremium={handleShowPremium}
        onLogin={handleLogin}
        onRegister={handleRegister}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      <div className="app-body">
        {!isDetailPage && (
          <Sidebar
            filters={filters}
            onSearchChange={(val) => loadMarketplace({ ...filters, search: val })}
            onCategoryChange={(val) => {
              const next = { ...filters, category: val };
              if (val === 'premium') navigate('/?category=premium');
              else navigate('/');
              loadMarketplace(next);
            }}
            onTypeChange={(val) => loadMarketplace({ ...filters, type: val })}
            onLayoutChange={(val) => loadMarketplace({ ...filters, layout: val })}
            onFieldTypeChange={(val) => loadMarketplace({ ...filters, field_type: val })}
            onHasRequiredChange={(val) => loadMarketplace({ ...filters, has_required: val })}
            onFieldCountChange={(val) => loadMarketplace({ ...filters, field_count: val })}
            onClearFilters={() => { clearFilters(); navigate('/'); }}
            availableTypes={availableTypes}
            recent={recent}
            favorites={favorites}
            onOpenTemplate={handleUseTemplate}
          />
        )}

        <main className={`app-main${isDetailPage ? ' app-main--full' : ''}`}>
          <Routes>
            <Route
              path="/templates/:id"
              element={
                <TemplateDetailPage
                  user={user}
                  onUse={handleUseTemplate}
                  onToggleFavorite={toggleFavorite}
                />
              }
            />
            <Route
              path="*"
              element={
                <TemplateGallery
                  templates={templates}
                  templateCount={templateCount}
                  onUse={handleUseTemplate}
                  onToggleFavorite={toggleFavorite}
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

export default function App() {
  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  );
}
