import React, { useState } from 'react';
import { AttendanceProvider, useAttendance } from './context/AttendanceContext';
import { DashboardView } from './components/DashboardView';
import { DailyAttendanceView } from './components/DailyAttendanceView';
import { AttendancePlannerView } from './components/AttendancePlannerView';
import { TimetableEditorView } from './components/TimetableEditorView';
import { LabsView } from './components/LabsView';
import { PredictorView } from './components/PredictorView';
import { CalendarView } from './components/CalendarView';
import { ImportantDatesView } from './components/ImportantDatesView';
import { SettingsView } from './components/SettingsView';
import { SetupWizardModal } from './components/SetupWizardModal';
import { CloudSyncModal } from './components/CloudSyncModal';
import { getOverallStats } from './utils/attendanceCalculations';
import {
  LayoutDashboard,
  CheckSquare,
  CalendarRange,
  Calendar,
  FlaskConical,
  Calculator,
  CalendarDays,
  Settings,
  Sparkles,
  GraduationCap,
  AlertOctagon,
  Cloud,
} from 'lucide-react';

const AppContent: React.FC = () => {
  const {
    settings,
    records,
    updateSettings,
    isSupabaseConfigured,
    cloudUser,
    cloudSyncStatus,
    isInitialLoading,
  } = useAttendance();
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isWizardOpen, setIsWizardOpen] = useState<boolean>(!settings.hasCompletedSetup);
  const [isCloudSyncOpen, setIsCloudSyncOpen] = useState<boolean>(false);

  const overall = getOverallStats(records, settings.overallTarget);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'attendance', label: "Today's Attendance", icon: CheckSquare },
    { id: 'planner', label: 'Attendance Planner', icon: CalendarRange },
    { id: 'timetable', label: 'Timetable', icon: Calendar },
    { id: 'labs', label: 'Labs (100%)', icon: FlaskConical },
    { id: 'predictor', label: 'Predictor', icon: Calculator },
    { id: 'calendar', label: 'Calendar', icon: CalendarDays },
    { id: 'dates', label: 'Important Dates', icon: GraduationCap },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col antialiased selection:bg-indigo-500 selection:text-white">
      {/* Top Application Header */}
      <header className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
        {isInitialLoading && (
          <div className="bg-indigo-600 text-white text-xs font-semibold py-1.5 px-4 text-center flex items-center justify-center gap-2 animate-fadeIn">
            <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            Fetching your unique attendance data from Supabase...
          </div>
        )}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-4">
            {/* Logo and Brand */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20 shrink-0">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-black tracking-tight text-zinc-900 dark:text-white">
                    AttendWise
                  </h1>
                </div>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 hidden sm:block">
                  Smart College Attendance & Commute Optimizer
                </p>
              </div>
            </div>

            {/* Quick Status Pill & Wizard Trigger */}
            <div className="flex items-center gap-2.5">
              {/* Cloud Sync & Multi-Device Pill */}
              <button
                type="button"
                onClick={() => setIsCloudSyncOpen(true)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl border transition-colors cursor-pointer ${
                  cloudSyncStatus === 'synced'
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100'
                    : cloudSyncStatus === 'syncing'
                    ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800'
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-200'
                }`}
                title="Supabase Cloud Backend & Cross-Device Sync"
              >
                <Cloud className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span className="hidden sm:inline">
                  {cloudUser
                    ? cloudUser.email?.split('@')[0]
                    : 'Cloud Account'}
                </span>
                <span
                  className={`w-2 h-2 rounded-full ${
                    cloudUser && cloudSyncStatus === 'synced'
                      ? 'bg-emerald-500'
                      : cloudSyncStatus === 'syncing'
                      ? 'bg-indigo-500 animate-spin'
                      : 'bg-zinc-400'
                  }`}
                />
              </button>

              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200/60 dark:border-zinc-700/60 text-xs">
                <span className="text-zinc-500 dark:text-zinc-400 font-medium">Overall:</span>
                <span
                  className={`font-mono font-black ${
                    (overall?.percentage ?? 0) >= settings.overallTarget
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-rose-600 dark:text-rose-400'
                  }`}
                >
                  {(overall?.percentage ?? 0).toFixed(1)}%
                </span>
                <span className="text-[10px] text-zinc-400 font-mono">
                  ({overall.attended}/{overall.total})
                </span>
              </div>

              <button
                type="button"
                onClick={() => setIsWizardOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-indigo-50 dark:bg-indigo-950/70 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800 transition-colors cursor-pointer"
                title="Guided Setup Wizard"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Setup Wizard</span>
              </button>
            </div>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <div className="border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <nav className="flex items-center space-x-1 overflow-x-auto py-2 scrollbar-none" aria-label="Tabs">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveTab(item.id)}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                      isActive
                        ? 'bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 shadow-xs border border-zinc-200 dark:border-zinc-700'
                        : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800/60'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content View */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'dashboard' && <DashboardView onNavigate={setActiveTab} />}
        {activeTab === 'attendance' && <DailyAttendanceView />}
        {activeTab === 'planner' && <AttendancePlannerView />}
        {activeTab === 'timetable' && <TimetableEditorView />}
        {activeTab === 'labs' && <LabsView />}
        {activeTab === 'predictor' && <PredictorView />}
        {activeTab === 'calendar' && <CalendarView />}
        {activeTab === 'dates' && <ImportantDatesView />}
        {activeTab === 'settings' && (
          <SettingsView
            onOpenWizard={() => setIsWizardOpen(true)}
            onOpenCloudSync={() => setIsCloudSyncOpen(true)}
          />
        )}
      </main>

      {/* Guided Setup Wizard Modal */}
      {isWizardOpen && (
        <SetupWizardModal onClose={() => setIsWizardOpen(false)} />
      )}

      {/* Supabase Cloud Sync Modal */}
      {isCloudSyncOpen && (
        <CloudSyncModal onClose={() => setIsCloudSyncOpen(false)} />
      )}
    </div>
  );
};

export default function App() {
  return (
    <AttendanceProvider>
      <AppContent />
    </AttendanceProvider>
  );
}
