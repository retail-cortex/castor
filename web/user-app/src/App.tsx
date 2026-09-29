import React, { useState } from 'react';
import { ToastProvider } from './contexts/ToastContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SecurityProvider } from './contexts/SecurityContext';
import { ProfileProvider } from './contexts/ProfileContext';
import { WorkspaceProvider } from './contexts/WorkspaceContext';
import { SkillCatalogProvider } from './contexts/SkillCatalogContext';
import { SkillEditProvider } from './contexts/SkillEditContext';
import { AgentProvider } from './contexts/AgentContext';

import { TopAppBar } from './components/navigation/TopAppBar';
import { NavigationRail } from './components/navigation/NavigationRail';
import { CommandPalette } from './components/navigation/CommandPalette';
import { ToastContainer } from './components/common/ToastContainer';
import { OAuthLoginModal } from './components/auth/OAuthLoginModal';

import { Dashboard } from './components/dashboard/Dashboard';
import { SkillCatalog } from './components/skills/SkillCatalog';
import { SkillDetail } from './components/skills/SkillDetail';
import { WorkspaceAdmin } from './components/workspaces/WorkspaceAdmin';
import { ProfileManager } from './components/profile/ProfileManager';
import { ManualStudio } from './components/studio/ManualStudio';
import { AgentStudio } from './components/agent/AgentStudio';

const MainShell: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const [currentView, setCurrentView] = useState<string>('dashboard');
  const [selectedSkillId, setSelectedSkillId] = useState<string | null>(null);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState<boolean>(false);

  const navigateTo = (view: string, skillId?: string) => {
    if (skillId) {
      setSelectedSkillId(skillId);
    }
    setCurrentView(view);
  };

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-surface gap-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-primary-container flex items-center justify-center text-on-primary font-bold shadow-xl shadow-primary/30 border border-white/20 animate-pulse">
          <span className="material-symbols-rounded text-2xl">bolt</span>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono text-outline">
          <span className="w-3.5 h-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span>Validating Enterprise OAuth Session...</span>
        </div>
      </div>
    );
  }

  // Mandatory OAuth Login Gate
  if (!isAuthenticated) {
    return (
      <>
        <OAuthLoginModal />
        <ToastContainer />
      </>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-surface text-on-surface">
      {/* Top App Bar */}
      <TopAppBar
        currentView={currentView}
        onNavigate={navigateTo}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
      />

      {/* Main Body with Left Navigation Rail */}
      <div className="flex-1 flex min-h-0">
        <NavigationRail currentView={currentView} onNavigate={navigateTo} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto max-w-full">
          {currentView === 'dashboard' && <Dashboard onNavigate={navigateTo} />}

          {currentView === 'skills' && (
            <SkillCatalog
              onSelectSkill={(id) => navigateTo('skill-detail', id)}
              onCreateWithAi={() => navigateTo('agent')}
              onCreateManual={() => navigateTo('manual')}
            />
          )}

          {currentView === 'skill-detail' && selectedSkillId && (
            <SkillDetail
              skillId={selectedSkillId}
              onBack={() => navigateTo('skills')}
              onEditManual={() => navigateTo('manual')}
            />
          )}

          {currentView === 'agent' && (
            <AgentStudio
              onBackToCatalog={() => navigateTo('skills')}
              onSkillPublished={(id) => navigateTo('skill-detail', id)}
            />
          )}

          {currentView === 'manual' && (
            <ManualStudio
              onBackToCatalog={() => navigateTo('skills')}
              onSkillPublished={(id) => navigateTo('skill-detail', id)}
            />
          )}

          {currentView === 'workspaces' && <WorkspaceAdmin />}

          {currentView === 'profile' && <ProfileManager />}
        </main>
      </div>

      {/* Global Command Palette (Cmd+K) */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onNavigate={navigateTo}
      />

      {/* Toast Snackbars Container */}
      <ToastContainer />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <ToastProvider>
      <AuthProvider>
        <SecurityProvider>
          <ProfileProvider>
            <WorkspaceProvider>
              <SkillCatalogProvider>
                <SkillEditProvider>
                  <AgentProvider>
                    <MainShell />
                  </AgentProvider>
                </SkillEditProvider>
              </SkillCatalogProvider>
            </WorkspaceProvider>
          </ProfileProvider>
        </SecurityProvider>
      </AuthProvider>
    </ToastProvider>
  );
};

export default App;
