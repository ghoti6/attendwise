import React, { useState, useMemo } from 'react';
import { useAttendance } from '../context/AttendanceContext';
import { calculateAttendancePlan } from '../utils/attendanceCalculations';
import {
  CalendarRange,
  Sparkles,
  FlaskConical,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Sun,
  Coffee,
  RotateCcw,
} from 'lucide-react';

export const AttendancePlannerView: React.FC = () => {
  const {
    records,
    timetable,
    subjects,
    importantDates,
    settings,
    currentDate,
  } = useAttendance();

  // Date range state: defaults to current date -> exam date or semester end
  const [startDate, setStartDate] = useState<string>(
    settings.semesterStart && settings.semesterStart <= currentDate
      ? currentDate
      : settings.semesterStart || '2026-09-10'
  );
  const [endDate, setEndDate] = useState<string>(
    settings.examDate || settings.semesterEnd || '2026-11-09'
  );

  // User manual overrides for specific days
  const [userOverrides, setUserOverrides] = useState<Record<string, 'ATTEND' | 'SKIP'>>({});

  const plan = useMemo(() => {
    return calculateAttendancePlan(
      startDate,
      endDate,
      records,
      timetable,
      subjects,
      importantDates,
      settings,
      userOverrides
    );
  }, [
    startDate,
    endDate,
    records,
    timetable,
    subjects,
    importantDates,
    settings,
    userOverrides,
  ]);

  const toggleDayAction = (dateStr: string, currentRec: string) => {
    if (currentRec === 'HOLIDAY' || currentRec === 'WEEKEND') return;
    const nextAction = currentRec === 'ATTEND' ? 'SKIP' : 'ATTEND';
    setUserOverrides((prev) => ({
      ...prev,
      [dateStr]: nextAction,
    }));
  };

  const handleResetOverrides = () => {
    setUserOverrides({});
  };

  return (
    <div id="attendance-planner-view" className="space-y-6">
      {/* Planner Header & Controls */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-zinc-100 dark:border-zinc-800 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                <CalendarRange className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
                Attendance Strategy Planner
              </h2>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-2xl leading-relaxed">
              Calculates whole-day travel optimization across your academic calendar. Prioritizes
              mandatory 100% labs and schedules safe skip days to protect your {settings.overallTarget}% target.
            </p>
          </div>

          {/* Date Range Selector */}
          <div className="flex flex-wrap items-center gap-2">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
                From Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => e.target.value && setStartDate(e.target.value)}
                className="px-3 py-1.5 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl font-medium"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
                To Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => e.target.value && setEndDate(e.target.value)}
                className="px-3 py-1.5 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl font-medium"
              />
            </div>
            {Object.keys(userOverrides).length > 0 && (
              <button
                type="button"
                onClick={handleResetOverrides}
                className="self-end px-3 py-1.5 text-xs font-semibold rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 text-zinc-700 dark:text-zinc-300 flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                Reset Overrides
              </button>
            )}
          </div>
        </div>

        {/* Strategy Highlights / KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
          <div className="bg-zinc-50 dark:bg-zinc-800/60 p-3.5 rounded-xl border border-zinc-200/60 dark:border-zinc-700/60">
            <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
              College Days
            </span>
            <p className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-50 font-mono mt-0.5">
              {plan.totalCollegeDays}
            </p>
            <span className="text-[11px] text-zinc-400">{plan.totalClassesInRange} classes total</span>
          </div>

          <div className="bg-emerald-50/70 dark:bg-emerald-950/30 p-3.5 rounded-xl border border-emerald-200/60 dark:border-emerald-900/40">
            <span className="text-xs text-emerald-800 dark:text-emerald-300 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Attend Days
            </span>
            <p className="text-2xl font-extrabold text-emerald-800 dark:text-emerald-300 font-mono mt-0.5">
              {plan.recommendedAttendDays}
            </p>
            <span className="text-[11px] text-emerald-700 dark:text-emerald-400">
              Includes {plan.compulsoryLabDays} lab days
            </span>
          </div>

          <div className="bg-amber-50/70 dark:bg-amber-950/30 p-3.5 rounded-xl border border-amber-200/60 dark:border-amber-900/40">
            <span className="text-xs text-amber-800 dark:text-amber-300 font-semibold flex items-center gap-1">
              <Coffee className="w-3.5 h-3.5" />
              Safe Skip Days
            </span>
            <p className="text-2xl font-extrabold text-amber-800 dark:text-amber-300 font-mono mt-0.5">
              {plan.recommendedSkipDays}
            </p>
            <span className="text-[11px] text-amber-700 dark:text-amber-400">
              Saves full-day commute
            </span>
          </div>

          <div className="bg-indigo-50/70 dark:bg-indigo-950/30 p-3.5 rounded-xl border border-indigo-200/60 dark:border-indigo-900/40">
            <span className="text-xs text-indigo-800 dark:text-indigo-300 font-semibold flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              Projected Outcome
            </span>
            <p className="text-2xl font-extrabold text-indigo-800 dark:text-indigo-300 font-mono mt-0.5">
              {(plan?.finalProjectedAttendance ?? 0).toFixed(1)}%
            </p>
            <span className="text-[11px] text-indigo-700 dark:text-indigo-400">
              {(plan?.finalProjectedAttendance ?? 0) >= settings.overallTarget
                ? `+${((plan?.finalProjectedAttendance ?? 0) - settings.overallTarget).toFixed(1)}% buffer`
                : 'Warning: Below target'}
            </span>
          </div>
        </div>
      </div>

      {/* Day by Day Recommendations Roadmap */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Day-by-Day Schedule & Recommendations (Click to override)
          </h3>
          <span className="text-xs text-zinc-400">
            {plan.days.length} days analyzed
          </span>
        </div>

        <div className="border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden divide-y divide-zinc-100 dark:divide-zinc-800 bg-white dark:bg-zinc-900 shadow-xs">
          {plan.days.map((day) => {
            const isCollege = day.recommendation === 'ATTEND' || day.recommendation === 'SKIP';

            return (
              <div
                key={day.date}
                onClick={() => isCollege && toggleDayAction(day.date, day.recommendation)}
                className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                  isCollege ? 'cursor-pointer hover:bg-zinc-50/80 dark:hover:bg-zinc-800/50' : ''
                } ${
                  day.recommendation === 'ATTEND'
                    ? 'border-l-4 border-l-emerald-500'
                    : day.recommendation === 'SKIP'
                    ? 'border-l-4 border-l-amber-500'
                    : 'border-l-4 border-l-zinc-300 dark:border-l-zinc-700'
                }`}
              >
                {/* Left Date and Classes */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
                      {day.dayName}
                    </span>
                    <span className="text-xs text-zinc-500 font-mono font-medium">
                      {day.displayDate}
                    </span>

                    {day.containsCompulsoryLab && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-200 px-2 py-0.5 rounded-full border border-rose-300 dark:border-rose-800">
                        <FlaskConical className="w-3 h-3" />
                        Compulsory Lab
                      </span>
                    )}

                    {userOverrides[day.date] && (
                      <span className="text-[10px] font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 px-1.5 py-0.5 rounded">
                        Custom Choice
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-zinc-600 dark:text-zinc-300 mt-1 font-medium">
                    {day.reason}
                  </p>

                  {day.classesList.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap mt-1.5">
                      {day.classesList.map((c, i) => (
                        <span
                          key={i}
                          className="text-[10px] font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 px-1.5 py-0.5 rounded"
                        >
                          {c}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Right Status Badge & Running Projected Cumulative */}
                <div className="flex items-center gap-3 shrink-0 self-start sm:self-center">
                  {isCollege && (
                    <div className="text-right">
                      <span className="block text-[10px] uppercase font-bold text-zinc-400">
                        Projected
                      </span>
                      <span className="text-xs font-extrabold font-mono text-zinc-800 dark:text-zinc-200">
                        {(day.projectedCumulativeAttendance ?? 0).toFixed(1)}%
                      </span>
                    </div>
                  )}

                  <div
                    className={`px-3 py-1.5 rounded-xl text-xs font-extrabold tracking-wide uppercase flex items-center gap-1.5 ${
                      day.recommendation === 'ATTEND'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                        : day.recommendation === 'SKIP'
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                        : day.recommendation === 'HOLIDAY'
                        ? 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                        : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400'
                    }`}
                  >
                    {day.recommendation === 'ATTEND' && <CheckCircle2 className="w-3.5 h-3.5" />}
                    {day.recommendation === 'SKIP' && <Coffee className="w-3.5 h-3.5" />}
                    {day.recommendation === 'HOLIDAY' && <Sun className="w-3.5 h-3.5" />}
                    {day.recommendation}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
