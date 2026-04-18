import { useEffect } from 'react';
import useMarketplace from './hooks/useMarketplace';
import Topbar from './components/Topbar';
import Sidebar from './components/Sidebar';
import TemplateGallery from './components/TemplateGallery';
import BuilderWorkspace from './components/BuilderWorkspace';
import PremiumModal from './components/PremiumModal';

export default function App() {
  const {
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
    submitCurrentForm,
    clearFilters,
    showAllTemplates,
    showPremiumTemplates,
    jumpToPreviewMode,
    jumpToEditMode,
    closePremiumModal,
  } = useMarketplace();

  useEffect(() => {
    bootstrap();
  }, []);

  return (
    <div className="app">
      <Topbar
        user={user}
        topbarStatus={topbarStatus}
        onShowAll={showAllTemplates}
        onShowPremium={showPremiumTemplates}
      />
      <div className="app-body">
        <Sidebar
          filters={filters}
          onSearchChange={(val) => loadMarketplace({ ...filters, search: val })}
          onCategoryChange={(val) => loadMarketplace({ ...filters, category: val })}
          onTypeChange={(val) => loadMarketplace({ ...filters, type: val })}
          onClearFilters={clearFilters}
          availableTypes={availableTypes}
          recent={recent}
          favorites={favorites}
          onOpenTemplate={useTemplate}
        />
        <main className="app-main">
          {activeTemplate ? (
            <BuilderWorkspace
              activeTemplate={activeTemplate}
              customBlocks={customBlocks}
              previewMode={previewMode}
              builderFeedback={builderFeedback}
              onAddBlock={addBlock}
              onRemoveLastBlock={removeLastBlock}
              onResetBuilder={resetBuilder}
              onEditMode={jumpToEditMode}
              onPreviewMode={jumpToPreviewMode}
              onSubmitForm={submitCurrentForm}
            />
          ) : (
            <TemplateGallery
              templates={templates}
              templateCount={templateCount}
              onUse={useTemplate}
              onToggleFavorite={toggleFavorite}
            />
          )}
        </main>
      </div>
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
