import React, { useState } from 'react';
import { useAttendance } from '../context/AttendanceContext';
import { CustomAcademicDate } from '../types';
import {
  Sparkles,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  Calendar,
  Layers,
  FlaskConical,
  Target,
  Sun,
  X,
  Plus,
  Trash2,
  Edit2,
  CalendarDays,
} from 'lucide-react';
import { formatDate, formatDisplayDate } from '../utils/attendanceCalculations';

interface SetupWizardModalProps {
  onClose: () => void;
}

export const SetupWizardModal: React.FC<SetupWizardModalProps> = ({ onClose }) => {
  const { settings, updateSettings, subjects, timetable, importantDates, resetToSampleData } =
    useAttendance();

  const [step, setStep] = useState<number>(1);
  const totalSteps = 7;

  // Local wizard form values
  const [target, setTarget] = useState<number>(settings.overallTarget || 75);
  const [semStart, setSemStart] = useState<string>(settings.semesterStart || '2026-09-10');
  const [semStartName, setSemStartName] = useState<string>(
    settings.semesterStartName || 'Semester Start Date'
  );
  const [semEnd, setSemEnd] = useState<string>(settings.semesterEnd || '2026-11-20');
  const [semEndName, setSemEndName] = useState<string>(
    settings.semesterEndName || 'Semester Concluding Date'
  );
  const [examDate, setExamDate] = useState<string>(settings.examDate || '2026-11-10');
  const [examDateName, setExamDateName] = useState<string>(
    settings.examDateName || 'Semester Exam Date'
  );
  const [customDates, setCustomDates] = useState<CustomAcademicDate[]>(
    settings.customAcademicDates || []
  );

  const handleAddCustomDate = (name = 'New Academic Milestone') => {
    const newItem: CustomAcademicDate = {
      id: `custom-date-${Date.now()}`,
      name,
      date: formatDate(new Date()),
    };
    setCustomDates((prev) => [...prev, newItem]);
  };

  const handleNext = () => {
    if (step === 1) {
      updateSettings({ overallTarget: Number(target) });
    } else if (step === 2) {
      updateSettings({
        semesterStart: semStart,
        semesterEnd: semEnd,
        examDate,
        semesterStartName: semStartName,
        semesterEndName: semEndName,
        examDateName,
        customAcademicDates: customDates,
      });
    } else if (step === totalSteps) {
      updateSettings({ hasCompletedSetup: true });
      onClose();
      return;
    }
    setStep((s) => Math.min(totalSteps, s + 1));
  };

  const handleBack = () => {
    setStep((s) => Math.max(1, s - 1));
  };

  const handleLoadSample = () => {
    resetToSampleData();
    updateSettings({ hasCompletedSetup: true });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl max-w-xl w-full shadow-2xl overflow-hidden flex flex-col my-8 max-h-[90vh]">
        {/* Wizard Header */}
        <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm">
              {step}
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-50">
                AttendWise Setup Wizard
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Step {step} of {totalSteps}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-1.5">
          <div
            className="bg-indigo-600 h-full transition-all duration-300"
            style={{ width: `${(step / totalSteps) * 100}%` }}
          />
        </div>

        {/* Step Content */}
        <div className="p-6 flex-1 overflow-y-auto space-y-5 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {/* Step 1: Attendance Target */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                <Target className="w-6 h-6" />
                <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
                  Set Your Attendance Target
                </h3>
              </div>
              <p className="text-xs text-zinc-500 leading-relaxed">
                Most universities and college departments mandate a minimum 75% attendance threshold
                to remain eligible for final examinations.
              </p>

              <div className="bg-zinc-50 dark:bg-zinc-800/60 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-700 space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-bold text-zinc-800 dark:text-zinc-200">
                    Overall Minimum Attendance:
                  </label>
                  <span className="text-2xl font-black font-mono text-indigo-600 dark:text-indigo-400">
                    {target}%
                  </span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="90"
                  value={target}
                  onChange={(e) => setTarget(Number(e.target.value))}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
                <div className="flex justify-between text-[11px] text-zinc-400 font-mono">
                  <span>50%</span>
                  <span className="text-indigo-600 font-bold">75% (Default)</span>
                  <span>90%</span>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Academic Dates */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                  <CalendarDays className="w-5 h-5" />
                  <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
                    Set Academic Term Dates & Milestones
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => handleAddCustomDate('Midterm Exams')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-2xs transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add New
                </button>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Define semester milestones. Click any name to customize or rename it (e.g. Midterms, Submissions).
              </p>

              <div className="space-y-3 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                {/* Core 1: Start Date */}
                <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700/80 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-1">
                      <input
                        type="text"
                        value={semStartName}
                        onChange={(e) => setSemStartName(e.target.value)}
                        placeholder="Semester Start"
                        className="text-xs font-bold text-zinc-900 dark:text-zinc-50 bg-transparent hover:bg-white dark:hover:bg-zinc-700 focus:bg-white dark:focus:bg-zinc-900 border border-transparent hover:border-zinc-300 dark:hover:border-zinc-600 focus:border-indigo-500 rounded-lg px-2 py-1 flex-1 transition-colors"
                      />
                      <Edit2 className="w-3 h-3 text-zinc-400 shrink-0" />
                    </div>
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800/60">
                      Start
                    </span>
                  </div>
                  <input
                    type="date"
                    value={semStart}
                    onChange={(e) => setSemStart(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-xl font-mono text-zinc-900 dark:text-zinc-100 font-bold"
                  />
                  {semStart && (
                    <span className="block text-[11px] text-zinc-500 dark:text-zinc-400">
                      {formatDisplayDate(semStart, true)}
                    </span>
                  )}
                </div>

                {/* Core 2: Exam Date */}
                <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700/80 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-1">
                      <input
                        type="text"
                        value={examDateName}
                        onChange={(e) => setExamDateName(e.target.value)}
                        placeholder="Semester Exam Date"
                        className="text-xs font-bold text-zinc-900 dark:text-zinc-50 bg-transparent hover:bg-white dark:hover:bg-zinc-700 focus:bg-white dark:focus:bg-zinc-900 border border-transparent hover:border-zinc-300 dark:hover:border-zinc-600 focus:border-indigo-500 rounded-lg px-2 py-1 flex-1 transition-colors"
                      />
                      <Edit2 className="w-3 h-3 text-zinc-400 shrink-0" />
                    </div>
                    <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 rounded-md border border-rose-200 dark:border-rose-800/60">
                      Exams
                    </span>
                  </div>
                  <input
                    type="date"
                    value={examDate}
                    onChange={(e) => setExamDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-xl font-mono text-zinc-900 dark:text-zinc-100 font-bold"
                  />
                  {examDate && (
                    <span className="block text-[11px] text-zinc-500 dark:text-zinc-400">
                      {formatDisplayDate(examDate, true)}
                    </span>
                  )}
                </div>

                {/* Core 3: Concluding Date */}
                <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700/80 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-1">
                      <input
                        type="text"
                        value={semEndName}
                        onChange={(e) => setSemEndName(e.target.value)}
                        placeholder="Semester Concluding Date"
                        className="text-xs font-bold text-zinc-900 dark:text-zinc-50 bg-transparent hover:bg-white dark:hover:bg-zinc-700 focus:bg-white dark:focus:bg-zinc-900 border border-transparent hover:border-zinc-300 dark:hover:border-zinc-600 focus:border-indigo-500 rounded-lg px-2 py-1 flex-1 transition-colors"
                      />
                      <Edit2 className="w-3 h-3 text-zinc-400 shrink-0" />
                    </div>
                    <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider bg-purple-50 dark:bg-purple-950/60 px-2 py-0.5 rounded-md border border-purple-200 dark:border-purple-800/60">
                      End
                    </span>
                  </div>
                  <input
                    type="date"
                    value={semEnd}
                    onChange={(e) => setSemEnd(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-xl font-mono text-zinc-900 dark:text-zinc-100 font-bold"
                  />
                  {semEnd && (
                    <span className="block text-[11px] text-zinc-500 dark:text-zinc-400">
                      {formatDisplayDate(semEnd, true)}
                    </span>
                  )}
                </div>

                {/* Custom Dates in Wizard */}
                {customDates.map((cd) => (
                  <div
                    key={cd.id}
                    className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/80 border border-indigo-200 dark:border-indigo-800/60 space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-1">
                        <input
                          type="text"
                          value={cd.name}
                          onChange={(e) =>
                            setCustomDates((prev) =>
                              prev.map((item) =>
                                item.id === cd.id ? { ...item, name: e.target.value } : item
                              )
                            )
                          }
                          placeholder="Milestone Name..."
                          className="text-xs font-bold text-zinc-900 dark:text-zinc-50 bg-transparent hover:bg-white dark:hover:bg-zinc-700 focus:bg-white dark:focus:bg-zinc-900 border border-transparent hover:border-zinc-300 dark:hover:border-zinc-600 focus:border-indigo-500 rounded-lg px-2 py-1 flex-1 transition-colors"
                        />
                        <Edit2 className="w-3 h-3 text-zinc-400 shrink-0" />
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setCustomDates((prev) => prev.filter((item) => item.id !== cd.id))
                        }
                        className="p-1 text-zinc-400 hover:text-rose-600 rounded-lg cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <input
                      type="date"
                      value={cd.date}
                      onChange={(e) =>
                        setCustomDates((prev) =>
                          prev.map((item) =>
                            item.id === cd.id ? { ...item, date: e.target.value } : item
                          )
                        )
                      }
                      className="w-full px-3 py-2 text-xs bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-xl font-mono text-zinc-900 dark:text-zinc-100 font-bold"
                    />
                    {cd.date && (
                      <span className="block text-[11px] text-zinc-500 dark:text-zinc-400">
                        {formatDisplayDate(cd.date, true)}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Vacation / Holiday Dates */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                <Sun className="w-6 h-6" />
                <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
                  Vacation & Holiday Safeguards
                </h3>
              </div>
              <p className="text-xs text-zinc-500">
                Dates marked as holidays or vacations are automatically exempted from all attendance
                penalty calculations.
              </p>

              <div className="space-y-2 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 bg-zinc-50 dark:bg-zinc-800/40">
                <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  Current Scheduled Breaks ({importantDates.length})
                </span>
                <div className="space-y-1.5 mt-2 max-h-40 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                  {importantDates.map((d) => (
                    <div
                      key={d.id}
                      className="p-2 bg-white dark:bg-zinc-900 rounded-lg text-xs flex items-center justify-between"
                    >
                      <span className="font-semibold text-zinc-800 dark:text-zinc-200">{d.title}</span>
                      <span className="text-zinc-400 font-mono text-[11px]">{d.startDate}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Subjects */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                <Layers className="w-6 h-6" />
                <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
                  Academic Subjects
                </h3>
              </div>
              <p className="text-xs text-zinc-500">
                You have {subjects.length} subjects configured. You can edit their individual target
                percentages and color tags anytime.
              </p>

              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                {subjects.map((s) => (
                  <div
                    key={s.id}
                    className="p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center gap-2 text-xs"
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: s.color }}
                    />
                    <span className="font-bold text-zinc-800 dark:text-zinc-200 truncate">
                      {s.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 5: Weekly Timetable */}
          {step === 5 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                <Calendar className="w-6 h-6" />
                <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
                  Weekly Class Schedule
                </h3>
              </div>
              <p className="text-xs text-zinc-500">
                Your timetable currently has {timetable.length} scheduled slots across the week.
              </p>

              <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800 text-xs space-y-1.5">
                <p>
                  <strong>Monday:</strong> DBMS, ML Algo, Data Analytics, Blockchain (4 classes)
                </p>
                <p>
                  <strong>Tuesday:</strong> Web App, Data Analytics, DBMS, Blockchain, ML Algo (5
                  classes)
                </p>
                <p>
                  <strong>Wednesday:</strong> DA, ML, BC, Web App, DBMS Lab 100% (5 classes)
                </p>
                <p>
                  <strong>Thursday:</strong> DBMS, Web App, ML Lab 100% (3 classes)
                </p>
                <p>
                  <strong>Friday:</strong> Web App Lab 100% (1 intensive lab)
                </p>
              </div>
            </div>
          )}

          {/* Step 6: Compulsory Labs */}
          {step === 6 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
                <FlaskConical className="w-6 h-6" />
                <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
                  100% Compulsory Labs
                </h3>
              </div>
              <p className="text-xs text-zinc-500">
                AttendWise treats compulsory practical labs with strict safeguards. Days containing
                compulsory labs are always prioritized in your attendance planner.
              </p>

              <div className="space-y-2">
                {timetable
                  .filter((s) => s.isCompulsoryLab)
                  .map((slot) => {
                    const sub = subjects.find((sb) => sb.id === slot.subjectId);
                    return (
                      <div
                        key={slot.id}
                        className="p-3 bg-rose-50/70 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl flex items-center justify-between text-xs"
                      >
                        <div>
                          <span className="font-bold text-rose-900 dark:text-rose-200">
                            {sub?.name || 'Lab'}
                          </span>
                          <p className="text-zinc-500">
                            Day {slot.dayOfWeek} • {slot.startTime} – {slot.endTime}
                          </p>
                        </div>
                        <span className="text-[10px] font-extrabold bg-rose-200 dark:bg-rose-900 text-rose-900 dark:text-rose-100 px-2 py-0.5 rounded-full">
                          100% REQUIRED
                        </span>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* Step 7: Ready to Go */}
          {step === 7 && (
            <div className="space-y-4 text-center py-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-extrabold text-zinc-900 dark:text-zinc-50">
                You&apos;re All Set!
              </h3>
              <p className="text-xs text-zinc-500 max-w-sm mx-auto leading-relaxed">
                AttendWise will now monitor your attendance, calculate whole-day travel decisions, and
                protect your {target}% target.
              </p>
            </div>
          )}
        </div>

        {/* Wizard Footer */}
        <div className="p-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-800/30">
          <div>
            {step === 1 && (
              <button
                type="button"
                onClick={handleLoadSample}
                className="text-xs text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
              >
                Quick Start: Load Sample College Data
              </button>
            )}
            {step > 1 && (
              <button
                type="button"
                onClick={handleBack}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-zinc-600 hover:bg-zinc-200 dark:hover:bg-zinc-700"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={handleNext}
            className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors"
          >
            {step === totalSteps ? 'Start Tracking' : 'Next Step'}
            {step < totalSteps && <ChevronRight className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
};
