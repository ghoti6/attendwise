import React, { useState } from 'react';
import { useAttendance } from '../context/AttendanceContext';
import {
  getOverallStats,
  getSubjectStatsList,
  formatDisplayDate,
  checkDateHolidayOrVacation,
} from '../utils/attendanceCalculations';
import { CircularProgress } from './CircularProgress';
import { ShouldIGoCard } from './ShouldIGoCard';
import { SubjectCard } from './SubjectCard';
import { SubjectDetailsModal } from './SubjectDetailsModal';
import { SubjectModal } from './SubjectModal';
import { Subject } from '../types';
import {
  Calendar,
  FlaskConical,
  Sparkles,
  ArrowRight,
  TrendingUp,
  AlertOctagon,
  CheckCircle2,
  Clock,
  ChevronRight,
  CalendarRange,
  Plus,
  BookOpen,
} from 'lucide-react';

interface DashboardViewProps {
  onNavigate: (tab: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate }) => {
  const {
    records,
    timetable,
    subjects,
    importantDates,
    settings,
    currentDate,
    markAttendance,
  } = useAttendance();

  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
  const [subjectToEdit, setSubjectToEdit] = useState<Subject | null>(null);

  // Subject-wise stats list
  const subjectStatsList = getSubjectStatsList(
    subjects,
    records,
    timetable,
    settings.overallTarget
  );
  const selectedSubjectStats =
    subjectStatsList.find((s) => s.subject.id === selectedSubjectId) || null;

  // Overall attendance metrics
  const overallStats = getOverallStats(records, settings.overallTarget);
  const target = settings.overallTarget;
  const { attended, total, percentage, classesCanMiss, classesNeededToTarget } =
    overallStats;

  // Today's scheduled classes
  const todayDateObj = new Date(currentDate + 'T00:00:00');
  const dayOfWeek = todayDateObj.getDay();
  const todaySlots = timetable
    .filter((s) => s.dayOfWeek === dayOfWeek)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  const holidayInfo = checkDateHolidayOrVacation(currentDate, importantDates);

  // Compulsory lab stats check
  const compulsoryLabRecords = records.filter((r) => r.isCompulsoryLab);
  const missedCompulsoryLabs = compulsoryLabRecords.filter((r) => r.status === 'absent').length;

  return (
    <div id="dashboard-view" className="space-y-6">
      {/* Top Banner: Date & Academic Quick Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-zinc-600 dark:text-zinc-400 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-xs">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <span className="font-semibold text-zinc-900 dark:text-zinc-100">
            {formatDisplayDate(currentDate, true)}
          </span>
          {holidayInfo.isHolidayOrVacation && (
            <span className="bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 font-bold px-2 py-0.5 rounded-full text-[11px]">
              🏖️ {holidayInfo.reason}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <span>
            Target: <strong>{settings.overallTarget}%</strong>
          </span>
          {settings.examDate && (
            <span className="hidden sm:inline">
              Exams:{' '}
              <strong className="font-mono">
                {formatDisplayDate(settings.examDate)}
              </strong>
            </span>
          )}
          <button
            type="button"
            onClick={() => onNavigate('planner')}
            className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline inline-flex items-center gap-1"
          >
            Open Attendance Planner
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Primary Decision Hero: Should I Go To College Today? */}
      <section aria-label="Attendance Decision">
        <ShouldIGoCard
          onOpenPlanner={() => onNavigate('planner')}
          onOpenAttendance={() => onNavigate('attendance')}
        />
      </section>

      {/* Missed Lab Emergency Notice if any */}
      {missedCompulsoryLabs > 0 && (
        <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 rounded-2xl p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertOctagon className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
            <div>
              <p className="text-xs font-bold text-rose-900 dark:text-rose-200">
                ⚠️ Compulsory Lab Attendance Alert: {missedCompulsoryLabs} missed lab recorded!
              </p>
              <p className="text-[11px] text-rose-800 dark:text-rose-300">
                Labs require 100% attendance for exam hall ticket approval.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('labs')}
            className="px-3 py-1.5 text-xs font-bold rounded-xl bg-rose-600 text-white shrink-0 hover:bg-rose-700 shadow-xs"
          >
            Review Labs
          </button>
        </div>
      )}

      {/* Overall Attendance Summary Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Overall Gauge & Analytical Insights */}
        <div className="lg:col-span-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-6">
          {/* Radial Circular Progress Gauge */}
          <div className="flex flex-col items-center shrink-0">
            <CircularProgress
              percentage={percentage}
              target={target}
              size={175}
              strokeWidth={14}
            />
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mt-2 font-mono">
              Target: {target}%
            </span>
          </div>

          {/* Key Metrics Breakdown */}
          <div className="flex-1 w-full space-y-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                Cumulative Performance
              </span>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
                {percentage >= target ? 'Comfortably in the Safe Zone' : 'Below Attendance Target'}
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                You have attended{' '}
                <strong className="text-zinc-800 dark:text-zinc-200 font-mono">
                  {attended} of {total}
                </strong>{' '}
                scheduled classes (excluding cancelled and vacation breaks).
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-100 dark:border-zinc-700/60">
                <span className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium block">
                  Safe Classes to Miss
                </span>
                <span className="text-2xl font-black font-mono text-zinc-900 dark:text-zinc-50">
                  {classesCanMiss}
                </span>
                <span className="text-[10px] text-zinc-400 block mt-0.5">
                  while staying &gt;= {target}%
                </span>
              </div>

              <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-100 dark:border-zinc-700/60">
                <span className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium block">
                  Attendance Buffer
                </span>
                <span
                  className={`text-2xl font-black font-mono ${
                    percentage >= target
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-rose-600 dark:text-rose-400'
                  }`}
                >
                  {percentage >= target ? `+${(percentage - target).toFixed(1)}%` : `-${classesNeededToTarget} cls`}
                </span>
                <span className="text-[10px] text-zinc-400 block mt-0.5">
                  relative to {target}% cutoff
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-zinc-100 dark:border-zinc-800 text-xs">
              <button
                type="button"
                onClick={() => onNavigate('predictor')}
                className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline inline-flex items-center gap-1"
              >
                Simulate missed classes & projections
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Right Col: Today's Class Quick Glance */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-600" />
                Today&apos;s Classes ({todaySlots.length})
              </h3>
              <button
                type="button"
                onClick={() => onNavigate('attendance')}
                className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
              >
                Log Attendance
              </button>
            </div>

            {holidayInfo.isHolidayOrVacation ? (
              <p className="text-xs text-purple-700 dark:text-purple-300 mt-4">
                🏖️ College closed: {holidayInfo.reason}.
              </p>
            ) : todaySlots.length === 0 ? (
              <p className="text-xs text-zinc-500 mt-4">
                No classes scheduled for today in your timetable.
              </p>
            ) : (
              <div className="space-y-2 mt-3 max-h-56 overflow-y-auto pr-1 scrollbar-none">
                {todaySlots.map((slot) => {
                  const sub = subjects.find((s) => s.id === slot.subjectId);
                  const record = records.find(
                    (r) => r.date === currentDate && r.slotId === slot.id
                  );

                  return (
                    <div
                      key={slot.id}
                      className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-100 dark:border-zinc-700/60 flex items-center justify-between text-xs"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: sub?.color || '#3B82F6' }}
                          />
                          <span className="font-bold text-zinc-800 dark:text-zinc-200 truncate">
                            {sub?.name || 'Class'}
                          </span>
                          {slot.isCompulsoryLab && (
                            <span className="text-[10px] font-extrabold text-rose-600 bg-rose-100 dark:bg-rose-950 px-1.5 py-0.2 rounded">
                              LAB
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-zinc-400 font-mono">
                          {slot.startTime} – {slot.endTime}
                        </span>
                      </div>

                      <div className="shrink-0">
                        {record?.status === 'present' ? (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 rounded-md">
                            Present
                          </span>
                        ) : record?.status === 'absent' ? (
                          <span className="text-[10px] font-bold text-rose-700 bg-rose-100 dark:bg-rose-950 px-2 py-0.5 rounded-md">
                            Absent
                          </span>
                        ) : record?.status === 'cancelled' ? (
                          <span className="text-[10px] font-bold text-zinc-500 bg-zinc-200 dark:bg-zinc-700 px-2 py-0.5 rounded-md">
                            Cancelled
                          </span>
                        ) : (
                          <span className="text-[10px] text-zinc-400 font-medium">
                            Not logged
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => onNavigate('attendance')}
            className="w-full py-2 px-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 text-xs font-bold transition-colors flex items-center justify-center gap-1"
          >
            Open Daily Attendance View
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Individual Subjects Grid (Requirement #3) */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-50">
              Subject-by-Subject Attendance
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Click any subject to view detailed history, log past sessions, or adjust custom targets.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setSubjectToEdit(null);
                setIsSubjectModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Subject
            </button>
            <button
              type="button"
              onClick={() => onNavigate('timetable')}
              className="px-3 py-2 rounded-xl text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
            >
              Timetable
            </button>
          </div>
        </div>

        {subjectStatsList.length === 0 ? (
          <div className="p-8 text-center bg-white dark:bg-zinc-900 rounded-3xl border border-dashed border-zinc-300 dark:border-zinc-800 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                No subjects configured yet
              </h4>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Add your academic subjects, labs, and attendance targets to get started.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setSubjectToEdit(null);
                setIsSubjectModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Add Your First Subject
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {subjectStatsList.map((stat) => (
              <SubjectCard
                key={stat.subject.id}
                stats={stat}
                onClick={() => setSelectedSubjectId(stat.subject.id)}
                onEdit={() => {
                  setSubjectToEdit(stat.subject);
                  setIsSubjectModalOpen(true);
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Subject Details Modal */}
      {selectedSubjectStats && (
        <SubjectDetailsModal
          stats={selectedSubjectStats}
          onClose={() => setSelectedSubjectId(null)}
        />
      )}

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
