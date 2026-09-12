import React, { useState } from 'react';
import { useAttendance } from '../context/AttendanceContext';
import { CustomAcademicDate, Subject } from '../types';
import {
  Settings as SettingsIcon,
  Download,
  Upload,
  RotateCcw,
  Sparkles,
  Calendar,
  CalendarDays,
  Check,
  FileSpreadsheet,
  FileCode,
  Plus,
  Trash2,
  Edit2,
  Edit3,
  Target,
  GraduationCap,
  Flag,
  Cloud,
  User,
  RefreshCw,
  UploadCloud,
  CheckCircle2,
  BookOpen,
  FlaskConical,
  Database,
  Key,
  Copy,
  AlertTriangle,
  ExternalLink,
} from 'lucide-react';
import { formatDisplayDate, formatDate } from '../utils/attendanceCalculations';
import { SubjectModal } from './SubjectModal';
import { SUPABASE_SQL_SETUP_SCRIPT } from '../lib/supabase';

interface SettingsViewProps {
  onOpenWizard: () => void;
  onOpenCloudSync?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ onOpenWizard, onOpenCloudSync }) => {
  const {
    settings,
    updateSettings,
    importantDates,
    addImportantDate,
    updateImportantDate,
    exportDataJSON,
    exportDataCSV,
    importDataJSON,
    resetToSampleData,
    clearAllData,
    isSupabaseConfigured,
    supabaseConfig,
    updateSupabaseCredentials,
    clearSupabaseCredentials,
    testDatabaseConnection,
    deviceSyncId,
    activeIdentifier,
    cloudUser,
    cloudSyncStatus,
    syncNow,
    uploadLocalToCloud,
    subjects,
    timetable,
    deleteSubject,
  } = useAttendance();

  // Subject modal management
  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
  const [subjectToEdit, setSubjectToEdit] = useState<Subject | null>(null);
  const [deletingSubjectId, setDeletingSubjectId] = useState<string | null>(null);

  // Sync & Database test feedback
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);
  const [isSyncingLocal, setIsSyncingLocal] = useState<boolean>(false);
  const [dbTestResult, setDbTestResult] = useState<{
    status: 'idle' | 'testing' | 'success' | 'table_missing' | 'failed';
    message: string;
  }>({ status: 'idle', message: '' });

  // Custom Supabase Credentials editor
  const [showCredsEditor, setShowCredsEditor] = useState(false);
  const [customUrl, setCustomUrl] = useState(supabaseConfig.url || '');
  const [customAnonKey, setCustomAnonKey] = useState(supabaseConfig.anonKey || '');
  const [showSqlScript, setShowSqlScript] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  // Danger zone confirmation states
  const [confirmSampleReset, setConfirmSampleReset] = useState(false);
  const [confirmClearRecords, setConfirmClearRecords] = useState(false);
  const [confirmFullReset, setConfirmFullReset] = useState(false);
  const [isClearingData, setIsClearingData] = useState(false);
  const [dangerFeedback, setDangerFeedback] = useState<string | null>(null);

  // Local state for target
  const [overallTarget, setOverallTarget] = useState<number>(settings.overallTarget ?? 75);

  // Core dates & their editable names
  const [semesterStart, setSemesterStart] = useState<string>(settings.semesterStart || '2026-09-10');
  const [semesterStartName, setSemesterStartName] = useState<string>(
    settings.semesterStartName || 'Semester Start'
  );

  const [examDate, setExamDate] = useState<string>(settings.examDate || '2026-11-10');
  const [examDateName, setExamDateName] = useState<string>(
    settings.examDateName || 'Semester Exams Start'
  );

  const [semesterEnd, setSemesterEnd] = useState<string>(settings.semesterEnd || '2026-11-30');
  const [semesterEndName, setSemesterEndName] = useState<string>(
    settings.semesterEndName || 'Semester End'
  );

  // Custom added dates list
  const [customDates, setCustomDates] = useState<CustomAcademicDate[]>(
    settings.customAcademicDates || []
  );

  // Working days & feedback states
  const [workingDays, setWorkingDays] = useState<number[]>(settings.workingDays || [1, 2, 3, 4, 5]);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const toggleDay = (day: number) => {
    if (workingDays.includes(day)) {
      setWorkingDays(workingDays.filter((d) => d !== day));
    } else {
      setWorkingDays([...workingDays, day].sort());
    }
  };

  // Add a new custom date
  const handleAddCustomDate = (defaultName = 'New Academic Milestone') => {
    const newId = `custom-date-${Date.now()}`;
    const newDateItem: CustomAcademicDate = {
      id: newId,
      name: defaultName,
      date: formatDate(new Date()),
    };
    setCustomDates((prev) => [...prev, newDateItem]);
  };

  // Update a custom date's name
  const handleUpdateCustomDateName = (id: string, newName: string) => {
    setCustomDates((prev) =>
      prev.map((d) => (d.id === id ? { ...d, name: newName } : d))
    );
  };

  // Update a custom date's date value
  const handleUpdateCustomDateValue = (id: string, newDate: string) => {
    setCustomDates((prev) =>
      prev.map((d) => (d.id === id ? { ...d, date: newDate } : d))
    );
  };

  // Remove a custom date
  const handleRemoveCustomDate = (id: string) => {
    setCustomDates((prev) => prev.filter((d) => d.id !== id));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      overallTarget: Number(overallTarget),
      semesterStart,
      semesterEnd,
      examDate,
      semesterStartName,
      examDateName,
      semesterEndName,
      customAcademicDates: customDates,
      workingDays,
    });

    // Sync any custom dates with importantDates for calendar integration
    customDates.forEach((cd) => {
      if (cd.name.trim() && cd.date) {
        const existing = importantDates.find((idItem) => idItem.id === cd.id);
        if (existing) {
          updateImportantDate(cd.id, { title: cd.name, startDate: cd.date });
        } else {
          addImportantDate({
            title: cd.name,
            startDate: cd.date,
            type: 'other',
            notes: 'Added via Academic Calendar Settings',
          });
        }
      }
    });

    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const success = importDataJSON(content);
      if (success) {
        setDangerFeedback('Settings and attendance data restored successfully.');
      } else {
        setDangerFeedback('Failed to import backup JSON. Check file format.');
      }
      setTimeout(() => setDangerFeedback(null), 4000);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleTestDatabase = async () => {
    setDbTestResult({ status: 'testing', message: 'Verifying Supabase connectivity...' });
    const res = await testDatabaseConnection();
    if (res.connected) {
      setDbTestResult({ status: 'success', message: res.message });
    } else if (res.tableMissing) {
      setDbTestResult({ status: 'table_missing', message: res.message });
    } else {
      setDbTestResult({ status: 'failed', message: res.message });
    }
  };

  const handleSaveCustomCredentials = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customUrl.trim() || !customAnonKey.trim()) return;
    updateSupabaseCredentials(customUrl.trim(), customAnonKey.trim());
    setSyncFeedback('Updated custom Supabase credentials.');
    setTimeout(() => setSyncFeedback(null), 3500);
    setShowCredsEditor(false);
  };

  const handleResetCredentials = () => {
    clearSupabaseCredentials();
    setCustomUrl(import.meta.env.VITE_SUPABASE_URL || '');
    setCustomAnonKey(import.meta.env.VITE_SUPABASE_ANON_KEY || '');
    setSyncFeedback('Reset Supabase configuration to default environment.');
    setTimeout(() => setSyncFeedback(null), 3500);
    setShowCredsEditor(false);
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SETUP_SCRIPT);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  const handleExecuteClearRecords = async () => {
    setIsClearingData(true);
    await clearAllData({ recordsOnly: true });
    setIsClearingData(false);
    setConfirmClearRecords(false);
    setDangerFeedback('All past attendance records have been cleared from local storage and the database.');
    setTimeout(() => setDangerFeedback(null), 4500);
  };

  const handleExecuteFullReset = async () => {
    setIsClearingData(true);
    await clearAllData({ recordsOnly: false });
    setIsClearingData(false);
    setConfirmFullReset(false);
    setDangerFeedback('Full reset complete: all subjects, timetable, and attendance records have been cleared.');
    setTimeout(() => setDangerFeedback(null), 4500);
  };

  const handleExecuteSampleReset = () => {
    resetToSampleData();
    setConfirmSampleReset(false);
    setDangerFeedback('Default college schedule, 5 subjects, and sample dates have been restored.');
    setTimeout(() => setDangerFeedback(null), 4500);
  };

  const DAYS = [
    { id: 1, label: 'Mon' },
    { id: 2, label: 'Tue' },
    { id: 3, label: 'Wed' },
    { id: 4, label: 'Thu' },
    { id: 5, label: 'Fri' },
    { id: 6, label: 'Sat' },
    { id: 0, label: 'Sun' },
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* View Header */}
      <div>
        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
          <SettingsIcon className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
          Attendance & Academic Settings
        </h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
          Configure semester milestones, manage subjects, connect cloud storage, or backup your history.
        </p>
      </div>

      {/* Global Feedback Banner */}
      {dangerFeedback && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold text-emerald-800 dark:text-emerald-300 flex items-center justify-between">
          <span>{dangerFeedback}</span>
          <button
            type="button"
            onClick={() => setDangerFeedback(null)}
            className="text-xs text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* SECTION: Coursework & Subjects Manager */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              Coursework & Subjects Manager
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Add new courses, change subject names, configure lab requirements, or adjust minimum targets.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setSubjectToEdit(null);
              setIsSubjectModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            Add New Subject
          </button>
        </div>

        {subjects.length === 0 ? (
          <div className="p-6 text-center rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 text-xs text-zinc-500">
            No subjects created yet. Click "+ Add New Subject" to begin.
          </div>
        ) : (
          <div className="border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden divide-y divide-zinc-100 dark:divide-zinc-800">
            {subjects.map((sub) => {
              const assignedSlots = timetable.filter((t) => t.subjectId === sub.id).length;
              const isDeleting = deletingSubjectId === sub.id;

              return (
                <div
                  key={sub.id}
                  className="p-4 bg-white dark:bg-zinc-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className="w-3.5 h-3.5 rounded-full shrink-0 shadow-xs"
                      style={{ backgroundColor: sub.color || '#6366F1' }}
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">
                          {sub.name}
                        </span>
                        {sub.isLabSubject && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] font-bold bg-purple-100 dark:bg-purple-950/70 text-purple-800 dark:text-purple-300 px-2 py-0.5 rounded-full shrink-0">
                            <FlaskConical className="w-3 h-3" />
                            Lab {sub.targetPercent === 100 ? '(100% Req)' : ''}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                        {sub.code && <span className="font-mono">{sub.code}</span>}
                        <span>•</span>
                        <span>Target: {sub.targetPercent}%</span>
                        <span>•</span>
                        <span>{assignedSlots} weekly class{assignedSlots === 1 ? '' : 'es'}</span>
                      </div>
                    </div>
                  </div>

                  {isDeleting ? (
                    <div className="flex items-center gap-2 self-end sm:self-auto bg-rose-50 dark:bg-rose-950/50 p-2 rounded-xl border border-rose-200 dark:border-rose-900">
                      <span className="text-xs font-semibold text-rose-800 dark:text-rose-300">
                        Delete "{sub.name}"?
                      </span>
                      <button
                        type="button"
                        onClick={() => setDeletingSubjectId(null)}
                        className="px-2.5 py-1 text-xs font-medium text-zinc-600 dark:text-zinc-300 hover:underline cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          deleteSubject(sub.id);
                          setDeletingSubjectId(null);
                        }}
                        className="px-2.5 py-1 text-xs font-bold bg-rose-600 text-white rounded-lg hover:bg-rose-700 cursor-pointer shadow-xs"
                      >
                        Confirm
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setSubjectToEdit(sub);
                          setIsSubjectModalOpen(true);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-950/60 dark:hover:text-indigo-400 transition-colors cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        Edit / Rename
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletingSubjectId(sub.id)}
                        className="p-1.5 rounded-xl text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors cursor-pointer"
                        title="Delete Subject"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Main Settings Form */}
      <form
        onSubmit={handleSave}
        className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-xs space-y-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-100 dark:border-zinc-800 pb-4">
          <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-50">
            Attendance Targets & College Calendar
          </h3>
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
          >
            <Check className="w-4 h-4" />
            {saveSuccess ? 'Saved!' : 'Save Calendar Settings'}
          </button>
        </div>

        {/* SECTION 1: Minimum Attendance Target */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
              <Target className="w-4 h-4 text-indigo-600" />
              Minimum Attendance Percentage Target
            </label>
            <span className="text-base font-bold font-mono text-indigo-600 dark:text-indigo-400">
              {overallTarget}%
            </span>
          </div>
          <input
            type="range"
            min="50"
            max="100"
            step="1"
            value={overallTarget}
            onChange={(e) => setOverallTarget(Number(e.target.value))}
            className="w-full accent-indigo-600 cursor-pointer"
          />
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Default university threshold. Individual subjects can have their own custom targets.
          </p>
        </div>

        {/* SECTION 2: Academic Milestone Dates */}
        <div className="border-t border-zinc-100 dark:border-zinc-800 pt-6 space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-indigo-600" />
              Academic Semester Milestones
            </label>
            <button
              type="button"
              onClick={() => handleAddCustomDate()}
              className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Add Milestone
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Semester Start */}
            <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-700 space-y-2">
              <input
                type="text"
                value={semesterStartName}
                onChange={(e) => setSemesterStartName(e.target.value)}
                className="w-full text-xs font-bold bg-transparent border-b border-transparent hover:border-zinc-300 dark:hover:border-zinc-600 focus:border-indigo-600 dark:focus:border-indigo-400 outline-hidden py-0.5 text-zinc-900 dark:text-zinc-100"
                placeholder="Semester Start"
              />
              <input
                type="date"
                value={semesterStart}
                onChange={(e) => setSemesterStart(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-xl font-mono text-zinc-900 dark:text-zinc-100"
              />
            </div>

            {/* Exam Date */}
            <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-700 space-y-2">
              <input
                type="text"
                value={examDateName}
                onChange={(e) => setExamDateName(e.target.value)}
                className="w-full text-xs font-bold bg-transparent border-b border-transparent hover:border-zinc-300 dark:hover:border-zinc-600 focus:border-indigo-600 dark:focus:border-indigo-400 outline-hidden py-0.5 text-zinc-900 dark:text-zinc-100"
                placeholder="Semester Exams Start"
              />
              <input
                type="date"
                value={examDate}
                onChange={(e) => setExamDate(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-xl font-mono text-zinc-900 dark:text-zinc-100"
              />
            </div>

            {/* Semester End */}
            <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-700 space-y-2">
              <input
                type="text"
                value={semesterEndName}
                onChange={(e) => setSemesterEndName(e.target.value)}
                className="w-full text-xs font-bold bg-transparent border-b border-transparent hover:border-zinc-300 dark:hover:border-zinc-600 focus:border-indigo-600 dark:focus:border-indigo-400 outline-hidden py-0.5 text-zinc-900 dark:text-zinc-100"
                placeholder="Semester End"
              />
              <input
                type="date"
                value={semesterEnd}
                onChange={(e) => setSemesterEnd(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-xl font-mono text-zinc-900 dark:text-zinc-100"
              />
            </div>
          </div>

          {/* Custom Dates List */}
          {customDates.length > 0 && (
            <div className="space-y-2 pt-2">
              <span className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase">
                Additional Milestones
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {customDates.map((cd) => (
                  <div
                    key={cd.id}
                    className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-700 flex items-center justify-between gap-2"
                  >
                    <div className="flex-1 space-y-1">
                      <input
                        type="text"
                        value={cd.name}
                        onChange={(e) => handleUpdateCustomDateName(cd.id, e.target.value)}
                        className="w-full text-xs font-bold bg-transparent outline-hidden text-zinc-800 dark:text-zinc-200"
                        placeholder="Milestone title"
                      />
                      <input
                        type="date"
                        value={cd.date}
                        onChange={(e) => handleUpdateCustomDateValue(cd.id, e.target.value)}
                        className="text-xs bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg px-2 py-1 font-mono text-zinc-800 dark:text-zinc-200"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveCustomDate(cd.id)}
                      className="p-1 text-zinc-400 hover:text-rose-600 rounded-lg cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* SECTION 3: College Working Days */}
        <div className="border-t border-zinc-100 dark:border-zinc-800 pt-6 space-y-3">
          <label className="block text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
            College Working Days
          </label>
          <div className="flex flex-wrap gap-2">
            {DAYS.map((d) => {
              const isSelected = workingDays.includes(d.id);
              return (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => toggleDay(d.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                  }`}
                >
                  {d.label}
                </button>
              );
            })}
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Unselected days are treated as non-working weekends and will not penalize your attendance.
          </p>
        </div>
      </form>

      {/* Supabase Cloud Backend Card */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-800/80 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-50">
                  Supabase Cloud Database
                </h3>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                    isSupabaseConfigured
                      ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300'
                      : 'bg-amber-100 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300'
                  }`}
                >
                  {isSupabaseConfigured ? 'Database Connected' : 'Local Storage Mode'}
                </span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Persistent cloud storage for attendance records, timetables, and subjects across your devices.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleTestDatabase}
              disabled={dbTestResult.status === 'testing'}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 transition-colors cursor-pointer"
            >
              <Database className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              {dbTestResult.status === 'testing' ? 'Testing...' : 'Test Connection'}
            </button>

            {onOpenCloudSync && (
              <button
                type="button"
                onClick={onOpenCloudSync}
                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors shrink-0 cursor-pointer"
              >
                <User className="w-4 h-4" />
                {cloudUser ? 'Account & Sync' : 'Sign In'}
              </button>
            )}
          </div>
        </div>

        {/* Database Diagnostic Status Alert */}
        {dbTestResult.status !== 'idle' && (
          <div
            className={`p-4 rounded-2xl text-xs space-y-2 border ${
              dbTestResult.status === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                : dbTestResult.status === 'table_missing'
                ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200'
                : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200'
            }`}
          >
            <div className="flex items-start gap-2">
              {dbTestResult.status === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <span className="font-bold">{dbTestResult.message}</span>
                {dbTestResult.status === 'table_missing' && (
                  <p className="mt-1">
                    Your database is accessible, but needs the <code>user_attendance_state</code> table. Run the SQL script below in the Supabase SQL Editor.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Database Status Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-700 text-xs space-y-1">
            <span className="font-bold text-zinc-700 dark:text-zinc-300">Target Database:</span>
            <div className="font-mono text-zinc-600 dark:text-zinc-400 truncate text-[11px]">
              {'configured' || 'Not configured'}
            </div>
            {supabaseConfig.isCustom && (
              <span className="inline-block text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                (Custom User Credentials)
              </span>
            )}
          </div>

          <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-700 text-xs space-y-1">
            <span className="font-bold text-zinc-700 dark:text-zinc-300">Sync Identifier:</span>
            <div className="font-mono text-zinc-600 dark:text-zinc-400 truncate text-[11px]">
              {activeIdentifier}
            </div>
            <span className="text-[10px] text-zinc-400">
              {cloudUser ? 'Authenticated User UID' : 'Guest Device ID'}
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-700 text-xs space-y-1">
            <span className="font-bold text-zinc-700 dark:text-zinc-300">Sync Status:</span>
            <div className="flex items-center gap-2 font-medium text-zinc-800 dark:text-zinc-200">
              <span
                className={`w-2 h-2 rounded-full ${
                  cloudSyncStatus === 'synced'
                    ? 'bg-emerald-500'
                    : cloudSyncStatus === 'syncing'
                    ? 'bg-indigo-500 animate-spin'
                    : 'bg-zinc-400'
                }`}
              />
              <span className="capitalize">{cloudSyncStatus.replace('_', ' ')}</span>
            </div>
          </div>
        </div>

        {/* Sync Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-zinc-100 dark:border-zinc-800">
          <div className="flex flex-wrap gap-2.5">
            <button
              type="button"
              disabled={isSyncingLocal || !isSupabaseConfigured}
              onClick={async () => {
                setIsSyncingLocal(true);
                const res = await uploadLocalToCloud();
                setIsSyncingLocal(false);
                setSyncFeedback(res.message);
                setTimeout(() => setSyncFeedback(null), 4000);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 transition-colors cursor-pointer disabled:opacity-50"
            >
              <UploadCloud className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              Upload Local State to DB
            </button>

            <button
              type="button"
              disabled={isSyncingLocal || !isSupabaseConfigured}
              onClick={async () => {
                setIsSyncingLocal(true);
                await syncNow();
                setIsSyncingLocal(false);
                setSyncFeedback('Fetched and synchronized latest cloud state.');
                setTimeout(() => setSyncFeedback(null), 4000);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 transition-colors cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 text-emerald-600 dark:text-emerald-400 ${isSyncingLocal ? 'animate-spin' : ''}`} />
              Fetch from DB
            </button>

            <button
              type="button"
              onClick={() => setShowCredsEditor(!showCredsEditor)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
            >
              <Key className="w-3.5 h-3.5" />
              {showCredsEditor ? 'Hide Credentials' : 'Edit Credentials'}
            </button>
          </div>

          <button
            type="button"
            onClick={() => setShowSqlScript(!showSqlScript)}
            className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
          >
            {showSqlScript ? 'Hide SQL Script' : 'View SQL Table Setup'}
          </button>
        </div>

        {/* Custom Credentials Form */}
        {/* {showCredsEditor && (
          <form
            onSubmit={handleSaveCustomCredentials}
            className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-700 space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                Configure Custom Supabase Credentials
              </span>
              {supabaseConfig.isCustom && (
                <button
                  type="button"
                  onClick={handleResetCredentials}
                  className="text-xs text-rose-600 hover:underline cursor-pointer"
                >
                  Reset to Environment Default
                </button>
              )}
            </div>
            <div className="space-y-2">
              <div>
                <label className="text-[11px] font-bold text-zinc-500 uppercase">Supabase Project URL</label>
                <input
                  type="text"
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                  placeholder="https://your-project.supabase.co"
                  className="w-full mt-1 px-3 py-2 text-xs bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-xl font-mono text-zinc-900 dark:text-zinc-100"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-zinc-500 uppercase">Supabase Anon Key</label>
                <input
                  type="password"
                  value={customAnonKey}
                  onChange={(e) => setCustomAnonKey(e.target.value)}
                  placeholder="eyJhbGciOiJIUzI1NiIsIn..."
                  className="w-full mt-1 px-3 py-2 text-xs bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-xl font-mono text-zinc-900 dark:text-zinc-100"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowCredsEditor(false)}
                className="px-3 py-1.5 text-xs text-zinc-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 text-xs font-bold bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 cursor-pointer shadow-xs"
              >
                Save & Connect
              </button>
            </div>
          </form>
        )} */}

        {/* SQL Setup Script Box */}
        {/* {showSqlScript && (
          <div className="p-4 rounded-2xl bg-zinc-900 text-zinc-100 text-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-mono font-bold text-emerald-400">
                SQL Schema Setup for Supabase
              </span>
              <button
                type="button"
                onClick={handleCopySql}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                {copiedSql ? 'Copied!' : 'Copy SQL Script'}
              </button>
            </div>
            <pre className="p-3 rounded-xl bg-black/50 overflow-x-auto text-[11px] font-mono text-zinc-300 whitespace-pre-wrap max-h-48 overflow-y-auto">
              {SUPABASE_SQL_SETUP_SCRIPT}
            </pre>
          </div>
        )}

        {syncFeedback && (
          <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-xs font-medium text-indigo-700 dark:text-indigo-300">
            {syncFeedback}
          </div>
        )}
      </div>*/}

      {/* Data Backup & Export */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-xs space-y-4">
        <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
          <Download className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          Backup, Export & Import
        </h3>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Save an offline copy of your timetable, subjects, and records or import previous data backups.
        </p>

        <div className="flex flex-wrap gap-3 pt-1">
          {/* Export JSON */}
          <button
            type="button"
            onClick={exportDataJSON}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 transition-colors cursor-pointer"
          >
            <FileCode className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            Export JSON Backup
          </button>

          {/* Export CSV */}
          <button
            type="button"
            onClick={exportDataCSV}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            Export Attendance CSV
          </button>

          {/* Import JSON */}
          <label className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 cursor-pointer transition-colors">
            <Upload className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <span>Restore / Import JSON</span>
            <input
              type="file"
              accept=".json,application/json"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Reset & Danger Zone */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-xs space-y-4">
        <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
          <RotateCcw className="w-5 h-5 text-amber-500" />
          Reset & Danger Zone
        </h3>

        {/* Reset to Sample College Data */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-700">
          <div>
            <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
              Reset to Prompt Sample College Schedule
            </span>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Restores the default 5 subjects (Mathematics, Physics, Electronics, etc.), timetable, and academic dates.
            </p>
          </div>

          {confirmSampleReset ? (
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setConfirmSampleReset(false)}
                className="px-3 py-1.5 rounded-xl text-xs font-medium text-zinc-600 hover:bg-zinc-200 dark:hover:bg-zinc-700 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteSampleReset}
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-amber-600 text-white shadow-xs cursor-pointer"
              >
                Confirm Load
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmSampleReset(true)}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600 text-zinc-800 dark:text-zinc-200 shrink-0 cursor-pointer"
            >
              Load Sample Data
            </button>
          )}
        </div>

        {/* Clear Attendance Records Only */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900">
          <div>
            <span className="text-xs font-bold text-amber-900 dark:text-amber-200">
              Clear Attendance Records Only
            </span>
            <p className="text-xs text-amber-800/80 dark:text-amber-300 mt-0.5">
              Erase past attendance marks from local storage and the database while preserving your subjects and timetable.
            </p>
          </div>

          {confirmClearRecords ? (
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                disabled={isClearingData}
                onClick={() => setConfirmClearRecords(false)}
                className="px-3 py-1.5 rounded-xl text-xs font-medium text-zinc-600 hover:bg-zinc-200 dark:hover:bg-zinc-700 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isClearingData}
                onClick={handleExecuteClearRecords}
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-amber-600 text-white shadow-xs cursor-pointer disabled:opacity-50"
              >
                {isClearingData ? 'Clearing...' : 'Confirm Erase Records'}
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmClearRecords(true)}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shrink-0 transition-colors shadow-xs cursor-pointer"
            >
              Clear Records
            </button>
          )}
        </div>

        {/* Full Factory Reset */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900">
          <div>
            <span className="text-xs font-bold text-rose-800 dark:text-rose-300">
              Full Factory Reset (Clean Slate)
            </span>
            <p className="text-xs text-rose-700/80 dark:text-rose-400 mt-0.5">
              Completely wipe all subjects, timetables, and attendance logs from your device and Supabase database.
            </p>
          </div>

          {confirmFullReset ? (
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                disabled={isClearingData}
                onClick={() => setConfirmFullReset(false)}
                className="px-3 py-1.5 rounded-xl text-xs font-medium text-zinc-600 hover:bg-zinc-200 dark:hover:bg-zinc-700 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isClearingData}
                onClick={handleExecuteFullReset}
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-rose-600 text-white shadow-xs cursor-pointer disabled:opacity-50"
              >
                {isClearingData ? 'Erasing Everything...' : 'Confirm Factory Reset'}
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmFullReset(true)}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shrink-0 transition-colors shadow-xs cursor-pointer"
            >
              Clear All Data
            </button>
          )}
        </div>
      </div>

      {/* Onboarding & Setup Re-run */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            Setup & Onboarding Wizard
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Need to adjust targets or review initial setup instructions? Re-launch the guided wizard step-by-step.
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenWizard}
          className="px-4 py-2.5 rounded-xl text-xs font-bold bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 shrink-0 transition-colors cursor-pointer"
        >
          Launch Setup Wizard
        </button>
      </div>

      {/* Add / Edit Subject Modal */}
      {isSubjectModalOpen && (
        <SubjectModal
          isOpen={isSubjectModalOpen}
          onClose={() => {
            setIsSubjectModalOpen(false);
            setSubjectToEdit(null);
          }}
          subjectToEdit={subjectToEdit}
        />
      )}
    </div>
  );
};
