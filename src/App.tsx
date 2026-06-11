import React, { useEffect, useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Dashboard } from './components/views/Dashboard';
import { Research } from './components/views/Research';
import { MarketTools } from './components/views/MarketTools';
import { Sentiment } from './components/views/Sentiment';
import { Alerts } from './components/views/Alerts';
import { Settings } from './components/views/Settings';
import { Jobs } from './components/views/Jobs';
import { ReportDetail } from './components/views/ReportDetail';
import { Auth } from './components/views/Auth';
import { Landing } from './components/views/Landing';
import { api } from './api';
import { CurrentUser, Report, View } from './types';

export default function App() {
  const [currentView, setCurrentView] = useState<View>('landing');
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [authChecking, setAuthChecking] = useState(Boolean(api.getAuthToken()));
  const [landingAuthMode, setLandingAuthMode] = useState<'login' | 'register' | null>(null);
  const [postAuthView, setPostAuthView] = useState<View>('dashboard');


  useEffect(() => {
    if (!api.getAuthToken()) {
      setAuthChecking(false);
      return;
    }

    let cancelled = false;
    api.getMe()
      .then((payload) => {
        if (!cancelled) setCurrentUser(payload.user);
      })
      .catch(() => {
        api.clearAuthToken();
        if (!cancelled) setCurrentUser(null);
      })
      .finally(() => {
        if (!cancelled) setAuthChecking(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const handleAuthenticated = (user: CurrentUser, nextView: View = postAuthView) => {
    setCurrentUser(user);
    setLandingAuthMode(null);
    setCurrentView(nextView);
    setPostAuthView('dashboard');
  };

  const openAuth = (mode: 'login' | 'register' = 'login', nextView: View = postAuthView) => {
    setLandingAuthMode(mode);
    setPostAuthView(nextView);
    setCurrentView('landing');
  };

  const handleLogout = () => {
    api.clearAuthToken();
    setCurrentUser(null);
    if (['alerts', 'jobs', 'settings'].includes(currentView)) {
      setCurrentView('landing');
    }
  };

  const handleSelectReport = (id: string) => {
    setSelectedReportId(id);
    setCurrentView('reportDetail');
  };

  const handleBackFromReport = () => {
    setSelectedReportId(null);
    setSelectedReport(null);
    // Go back to research or dashboard based on your preference, defaulting to research looks good
    setCurrentView('research');
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    if (term.trim() && currentView !== 'research' && currentView !== 'reportDetail') {
      setCurrentView('research');
    }
  };

  useEffect(() => {
    if (currentView !== 'reportDetail' || !selectedReportId) return;

    let cancelled = false;
    setReportLoading(true);
    Promise.all([api.getReport(selectedReportId), api.getValuation(selectedReportId)])
      .then(([report, valuationData]) => {
        if (!cancelled) setSelectedReport({ ...report, valuationData });
      })
      .finally(() => {
        if (!cancelled) setReportLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [currentView, selectedReportId]);

  const protectedViews: View[] = ['alerts', 'jobs', 'settings'];

  const renderLanding = () => (
    <Landing
      user={currentUser}
      authMode={landingAuthMode}
      onLoginClick={() => openAuth('login')}
      onRegisterClick={() => openAuth('register')}
      onExploreClick={() => setCurrentView('research')}
      onAuthenticated={handleAuthenticated}
    />
  );

  const renderView = () => {
    if (authChecking && protectedViews.includes(currentView)) {
      return <div className="text-slate-400">正在验证登录状态...</div>;
    }

    if (!currentUser && protectedViews.includes(currentView)) {
      const requestedView = currentView;
      return (
        <Auth
          title="访问受保护页面前请登录"
          message="预警、设置和任务记录会读取您的个人数据，因此需要使用真实账户登录。"
          initialMode={landingAuthMode ?? 'login'}
          onAuthenticated={(user) => handleAuthenticated(user, requestedView)}
        />
      );
    }
    if (currentView === 'reportDetail' && selectedReportId) {
      if (selectedReport) {
         return <ReportDetail report={selectedReport} onBack={handleBackFromReport} />;
      }
      return <div className="text-slate-400">{reportLoading ? '正在加载报告...' : '报告不存在。'}</div>;
    }

    switch (currentView) {
      case 'landing':
        return renderLanding();
      case 'dashboard':
        return <Dashboard onSelectReport={handleSelectReport} />;
      case 'research':
        return <Research onSelectReport={handleSelectReport} searchTerm={searchTerm} onSearch={handleSearch} />;
      case 'sentiment':
        return <Sentiment />;
      case 'marketTools':
        return <MarketTools />;
      case 'alerts':
        return <Alerts />;
      case 'jobs':
        return <Jobs />;
      case 'settings':
        return <Settings user={currentUser} onLogout={handleLogout} onUserUpdated={setCurrentUser} />;
      default:
        return renderLanding();
    }
  };

  const isLanding = currentView === 'landing';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 flex font-sans selection:bg-indigo-500/30">
      {!isLanding && (
        <Sidebar
        currentView={currentView === 'reportDetail' ? 'research' : currentView}
        user={currentUser}
        onLogout={handleLogout}
        onViewChange={(view) => {
          setSelectedReportId(null);
          if (!currentUser && protectedViews.includes(view)) {
            openAuth('login', view);
          } else {
            setCurrentView(view);
          }
          if (view !== 'research') {
            setSearchTerm('');
          }
        }} 
        />
      )}
      
      <main className="flex-1 flex flex-col min-w-0">
        {!isLanding && <Header searchTerm={searchTerm} onSearch={handleSearch} user={currentUser} onAuthClick={() => openAuth('login', 'dashboard')} onLogout={handleLogout} />}
        <div className="flex-1 overflow-auto p-8">
          <div className={isLanding ? 'w-full' : 'max-w-7xl mx-auto pb-12'}>
            {renderView()}
          </div>
        </div>
      </main>
    </div>
  );
}
