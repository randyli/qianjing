import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Dashboard } from './components/views/Dashboard';
import { Research } from './components/views/Research';
import { Sentiment } from './components/views/Sentiment';
import { Alerts } from './components/views/Alerts';
import { ReportDetail } from './components/views/ReportDetail';
import { View } from './types';
import { mockReports } from './mockData';

export default function App() {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const handleSelectReport = (id: string) => {
    setSelectedReportId(id);
    setCurrentView('reportDetail');
  };

  const handleBackFromReport = () => {
    setSelectedReportId(null);
    // Go back to research or dashboard based on your preference, defaulting to research looks good
    setCurrentView('research');
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    if (term.trim() && currentView !== 'research' && currentView !== 'reportDetail') {
      setCurrentView('research');
    }
  };

  const renderView = () => {
    if (currentView === 'reportDetail' && selectedReportId) {
      const report = mockReports.find(r => r.id === selectedReportId);
      if (report) {
         return <ReportDetail report={report} onBack={handleBackFromReport} />;
      }
    }

    switch (currentView) {
      case 'dashboard':
        return <Dashboard onSelectReport={handleSelectReport} />;
      case 'research':
        return <Research onSelectReport={handleSelectReport} searchTerm={searchTerm} onSearch={handleSearch} />;
      case 'sentiment':
        return <Sentiment />;
      case 'alerts':
        return <Alerts />;
      default:
        return <Dashboard onSelectReport={handleSelectReport} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 flex font-sans selection:bg-indigo-500/30">
      <Sidebar 
        currentView={currentView === 'reportDetail' ? 'research' : currentView} 
        onViewChange={(view) => {
          setSelectedReportId(null);
          setCurrentView(view);
          if (view !== 'research') {
            setSearchTerm('');
          }
        }} 
      />
      
      <main className="flex-1 flex flex-col min-w-0">
        <Header searchTerm={searchTerm} onSearch={handleSearch} />
        <div className="flex-1 overflow-auto p-8">
          <div className="max-w-7xl mx-auto pb-12">
            {renderView()}
          </div>
        </div>
      </main>
    </div>
  );
}
