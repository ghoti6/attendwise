import React, { useState } from 'react';
import { useAttendance } from '../context/AttendanceContext';
import {
  calculateWholeDayDecision,
  formatDate,
  formatDisplayDate,
  parseDate,
} from '../utils/attendanceCalculations';
import {
  Bus,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Calendar,
  FlaskConical,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Info,
  Slash,
  RotateCcw,
} from 'lucide-react';

export const ShouldIGoCard: React.FC<{ onNavigateToDaily?: () => void }> = ({
  onNavigateToDaily,
}) => {
  const {
    records,
    timetable,
    subjects,
    importantDates,
    settings,
    currentDate,
    markAttendance,
    bulkMarkDay,
    clearDayAttendance,
    deleteRecord,
  } = useAttendance();

  // Selected date for decision: defaults to today
  const [selectedDate, setSelectedDate] = useState<string>(currentDate);

  // Quick helper to jump between Today and Tomorrow
  const todayStr = currentDate;
  const tomorrowObj = parseDate(currentDate);
  tomorrowObj.setDate(tomorrowObj.getDate() + 1);
  const tomorrowStr = formatDate(tomorrowObj);

  const decision = calculateWholeDayDecision(
    selectedDate,
    records,
    timetable,
    subjects,
    importantDates,
    settings
  );

  const isToday = selectedDate === todayStr;
  const isTomorrow = selectedDate === tomorrowStr;

  // Day's attendance status calculation across scheduled slots
  const totalDaySlots = decision.slots.length;
  const markedRecords = decision.slots
    .map((s) => s.attendanceRecord)
    .filter((r): r is NonNullable<typeof r> => Boolean(r));
  const markedCount = markedRecords.length;
  const presentCount = markedRecords.filter((r) => r.status === 'present').length;
  const absentCount = markedRecords.filter((r) => r.status === 'absent').length;
  const cancelledCount = markedRecords.filter((r) => r.status === 'cancelled').length;

  const isAllPresent = totalDaySlots > 0 && presentCount === totalDaySlots;
  const isAllAbsent = totalDaySlots > 0 && absentCount === totalDaySlots;
  const isAllCancelled = totalDaySlots > 0 && cancelledCount === totalDaySlots;
  const hasAnyMarked = markedCount > 0;

  return (
    <div
      id="should-i-go-card"
      className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-xs relative overflow-hidden"
    >
      {/* Top Header & Date Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-100 dark:border-zinc-800 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900">
            <Bus className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
              Should I Go To College?
              <span className="text-[11px] font-semibold uppercase tracking-wider bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 px-2 py-0.5 rounded-full">
                Whole-Day Planner
              </span>
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Whole-day commute calculation considering all scheduled classes & compulsory labs
            </p>
          </div>
        </div>

        {/* Date Quick Switcher */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto bg-zinc-100 dark:bg-zinc-800/80 p-1 rounded-xl border border-zinc-200/60 dark:border-zinc-700/60">
          <button
            type="button"
            onClick={() => setSelectedDate(todayStr)}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
              isToday
                ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50 shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
            }`}
          >
            Today
          </button>
          <button
            type="button"
            onClick={() => setSelectedDate(tomorrowStr)}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
              isTomorrow
                ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50 shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
            }`}
          >
            Tomorrow
          </button>
          <div className="relative">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => e.target.value && setSelectedDate(e.target.value)}
              className="text-xs px-2 py-1 bg-transparent text-zinc-700 dark:text-zinc-300 font-medium rounded cursor-pointer focus:outline-hidden"
              title="Pick specific date"
            />
          </div>
        </div>
      </div>

      {/* Main Decision Display */}
      <div className="mt-5 space-y-5">
        {/* Date Banner */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-zinc-400" />
            <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
              {formatDisplayDate(selectedDate, true)}
            </span>
            {isToday && (
              <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-800">
                Today
              </span>
            )}
            {isTomorrow && (
              <span className="text-[10px] font-bold uppercase tracking-wider bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded-full border border-purple-200 dark:border-purple-800">
                Tomorrow
              </span>
            )}
          </div>
          <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
            Total classes: <strong>{decision.totalClasses}</strong>
          </span>
        </div>

        {/* Big Verdict Pill / Banner */}
        {decision.isHolidayOrVacation ? (
          <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl p-4 flex items-start gap-3">
            <Info className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-amber-900 dark:text-amber-200">
                College Closed / Vacation
              </p>
              <p className="text-xs text-amber-800 dark:text-amber-300 mt-0.5">
                {decision.reason}
              </p>
            </div>
          </div>
        ) : decision.totalClasses === 0 ? (
          <div className="bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-xl p-4 flex items-start gap-3">
            <Info className="w-5 h-5 text-zinc-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200">
                No Classes Scheduled
              </p>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5">
                {decision.reason}
              </p>
            </div>
          </div>
        ) : (
          <div
            id="should-i-go-decision-banner"
            className={`rounded-2xl p-4 sm:p-5 border transition-all ${
              decision.decision === 'CANCELLED'
                ? 'bg-zinc-100/90 dark:bg-zinc-800/80 border-zinc-300 dark:border-zinc-700'
                : decision.decision === 'ATTEND'
                ? decision.containsCompulsoryLab
                  ? 'bg-rose-50/80 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900'
                  : 'bg-amber-50/80 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900'
                : decision.decision === 'OPTIONAL'
                ? 'bg-amber-50/80 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900'
                : 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900'
            }`}
          >
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              {/* Left: Status Icon + Recommendation text */}
              <div className="flex items-start sm:items-center gap-3 min-w-0">
                <button
                  type="button"
                  id="decision-banner-cancel-button"
                  onClick={() => {
                    if (isAllCancelled) {
                      clearDayAttendance(selectedDate);
                    } else {
                      bulkMarkDay(selectedDate, 'cancelled');
                    }
                  }}
                  title={
                    isAllCancelled
                      ? 'Classes are cancelled. Click to un-cancel and restore classes.'
                      : 'Click to cancel all classes for this day'
                  }
                  aria-label={
                    isAllCancelled
                      ? 'Classes are cancelled. Click to un-cancel and restore classes.'
                      : 'Click to cancel all classes for this day'
                  }
                  className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center font-bold shrink-0 shadow-xs cursor-pointer transition-all duration-150 hover:scale-105 active:scale-95 focus:outline-hidden focus:ring-2 focus:ring-offset-2 ${
                    decision.decision === 'CANCELLED'
                      ? 'bg-zinc-700 text-white dark:bg-zinc-600 ring-2 ring-zinc-400 dark:ring-zinc-500 hover:bg-zinc-800'
                      : decision.decision === 'ATTEND'
                      ? 'bg-rose-600 text-white dark:bg-rose-500 hover:bg-rose-700 focus:ring-rose-400'
                      : decision.decision === 'OPTIONAL'
                      ? 'bg-amber-600 text-white dark:bg-amber-500 hover:bg-amber-700 focus:ring-amber-400'
                      : 'bg-emerald-600 text-white dark:bg-emerald-500 hover:bg-emerald-700 focus:ring-emerald-400'
                  }`}
                >
                  {decision.decision === 'CANCELLED' ? (
                    <Slash className="w-5 h-5 sm:w-6 sm:h-6" />
                  ) : decision.decision === 'ATTEND' ? (
                    <XCircle className="w-5 h-5 sm:w-6 sm:h-6" />
                  ) : decision.decision === 'OPTIONAL' ? (
                    <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6" />
                  ) : (
                    <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6" />
                  )}
                </button>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[11px] uppercase tracking-wider font-bold text-zinc-500 dark:text-zinc-400">
                      Recommendation
                    </span>
                    {decision.decision === 'CANCELLED' && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-zinc-200 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-200 px-2 py-0.5 rounded-full">
                        <Slash className="w-3 h-3" />
                        No Penalty
                      </span>
                    )}
                    {decision.containsCompulsoryLab && decision.decision !== 'CANCELLED' && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-rose-100 dark:bg-rose-900/60 text-rose-800 dark:text-rose-200 px-2 py-0.5 rounded-full border border-rose-300 dark:border-rose-700">
                        <FlaskConical className="w-3 h-3" />
                        100% Compulsory Lab
                      </span>
                    )}
                  </div>
                  <h3
                    className={`text-xl sm:text-2xl font-black tracking-tight mt-0.5 ${
                      decision.decision === 'CANCELLED'
                        ? 'text-zinc-900 dark:text-zinc-100'
                        : decision.decision === 'ATTEND'
                        ? 'text-rose-800 dark:text-rose-200'
                        : decision.decision === 'OPTIONAL'
                        ? 'text-amber-800 dark:text-amber-200'
                        : 'text-emerald-800 dark:text-emerald-200'
                    }`}
                  >
                    {decision.decision === 'CANCELLED'
                      ? 'CLASSES CANCELLED'
                      : decision.decision === 'ATTEND'
                      ? 'MUST ATTEND'
                      : decision.decision === 'OPTIONAL'
                      ? 'ATTENDANCE TIGHT'
                      : 'YOU CAN SKIP'}
                  </h3>
                </div>
              </div>

              {/* Right: Whole-day Quick Log Actions */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 pt-2 lg:pt-0 border-t lg:border-t-0 border-black/5 dark:border-white/5 shrink-0">
                <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 shrink-0">
                  Mark Whole Day:
                </span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {/* Mark All Present */}
                  <button
                    type="button"
                    onClick={() => {
                      if (isAllPresent) {
                        clearDayAttendance(selectedDate);
                      } else {
                        bulkMarkDay(selectedDate, 'present');
                      }
                    }}
                    title={isAllPresent ? 'Click to unmark / reset' : 'Mark all classes as Present'}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer shadow-xs ${
                      isAllPresent
                        ? 'bg-emerald-600 text-white ring-2 ring-emerald-400 dark:ring-emerald-500'
                        : 'bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-700 dark:hover:text-emerald-300 border border-zinc-200 dark:border-zinc-700'
                    }`}
                  >
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                    <span>All Present</span>
                  </button>

                  {/* Mark All Absent */}
                  <button
                    type="button"
                    onClick={() => {
                      if (isAllAbsent) {
                        clearDayAttendance(selectedDate);
                      } else {
                        bulkMarkDay(selectedDate, 'absent');
                      }
                    }}
                    title={isAllAbsent ? 'Click to unmark / reset' : 'Mark all classes as Absent'}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer shadow-xs ${
                      isAllAbsent
                        ? 'bg-rose-600 text-white ring-2 ring-rose-400 dark:ring-rose-500'
                        : 'bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-700 dark:hover:text-rose-300 border border-zinc-200 dark:border-zinc-700'
                    }`}
                  >
                    <XCircle className="w-3.5 h-3.5 text-rose-500" />
                    <span>All Absent</span>
                  </button>

                  {/* Cancelled (Classes Cancelled by College) */}
                  <button
                    type="button"
                    onClick={() => {
                      if (isAllCancelled) {
                        clearDayAttendance(selectedDate);
                      } else {
                        bulkMarkDay(selectedDate, 'cancelled');
                      }
                    }}
                    title={
                      isAllCancelled
                        ? 'Click to unmark / reset'
                        : 'Mark all scheduled classes as Cancelled (no penalty)'
                    }
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer shadow-xs ${
                      isAllCancelled
                        ? 'bg-zinc-700 text-white ring-2 ring-zinc-400 dark:bg-zinc-600'
                        : 'bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-700'
                    }`}
                  >
                    <Slash className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Cancelled</span>
                  </button>

                  {/* Clear / Reset Button (Shown when any attendance is logged for this day) */}
                  {hasAnyMarked && (
                    <button
                      type="button"
                      onClick={() => clearDayAttendance(selectedDate)}
                      title="Clear / Reset all logged attendance marks for this day"
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 bg-white/70 dark:bg-zinc-900/60 hover:bg-white dark:hover:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-700 transition-colors cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Clear</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Explanation Reason */}
            <div className="mt-3.5 bg-white/80 dark:bg-zinc-900/70 p-3 sm:p-3.5 rounded-xl border border-black/5 dark:border-white/5 flex items-start gap-2.5">
              <Info className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
              <p className="text-xs sm:text-sm font-medium text-zinc-800 dark:text-zinc-200 leading-relaxed">
                {decision.reason}
              </p>
            </div>
          </div>
        )}

        {/* Side-by-side Attend vs Skip Scenarios (if classes scheduled) */}
        {decision.totalClasses > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* If I Attend */}
            <div className="bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/60 rounded-xl p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4" />
                    If I Attend Entire Day
                  </span>
                  <span className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">
                    +{decision.totalClasses} classes attended
                  </span>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-emerald-900 dark:text-emerald-200 font-mono">
                    {(decision.projectedIfAttend ?? 0).toFixed(1)}%
                  </span>
                  <span className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold">
                    (
                    {(decision.projectedIfAttend ?? 0) >= (decision.currentAttendancePct ?? 0) ? '+' : ''}
                    {((decision.projectedIfAttend ?? 0) - (decision.currentAttendancePct ?? 0)).toFixed(1)}% shift)
                  </span>
                </div>
              </div>
              <p className="text-xs text-emerald-800 dark:text-emerald-300 mt-2">
                Secures attendance for all {decision.totalClasses} class
                {decision.totalClasses === 1 ? '' : 'es'} today, increasing your safety buffer.
              </p>
            </div>

            {/* If I Skip */}
            <div className="bg-rose-50/50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/60 rounded-xl p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-rose-800 dark:text-rose-300 flex items-center gap-1.5">
                    <TrendingDown className="w-4 h-4" />
                    If I Skip Entire Day
                  </span>
                  <span className="text-xs text-rose-700 dark:text-rose-400 font-medium">
                    +{decision.totalClasses} missed
                  </span>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span
                    className={`text-3xl font-extrabold font-mono ${
                      (decision.projectedIfSkip ?? 0) >= settings.overallTarget
                        ? 'text-zinc-800 dark:text-zinc-200'
                        : 'text-rose-800 dark:text-rose-300'
                    }`}
                  >
                    {(decision.projectedIfSkip ?? 0).toFixed(1)}%
                  </span>
                  <span className="text-xs text-rose-700 dark:text-rose-400 font-semibold">
                    ({((decision.projectedIfSkip ?? 0) - (decision.currentAttendancePct ?? 0)).toFixed(1)}% drop)
                  </span>
                </div>
              </div>
              <p className="text-xs text-rose-800 dark:text-rose-300 mt-2">
                {(decision.projectedIfSkip ?? 0) >= settings.overallTarget ? (
                  <span>
                    Stays above minimum {settings.overallTarget}% target by +
                    {((decision.projectedIfSkip ?? 0) - settings.overallTarget).toFixed(1)}%.
                  </span>
                ) : (
                  <span>
                    Takes you <strong>below</strong> your {settings.overallTarget}% target by{' '}
                    {(settings.overallTarget - (decision.projectedIfSkip ?? 0)).toFixed(1)}%.
                  </span>
                )}
              </p>
            </div>
          </div>
        )}

        {/* Scheduled Classes List For This Day */}
        {decision.slots.length > 0 && (
          <div className="border-t border-zinc-100 dark:border-zinc-800 pt-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Scheduled Classes ({decision.slots.length})
              </h4>
              {onNavigateToDaily && (
                <button
                  type="button"
                  onClick={onNavigateToDaily}
                  className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                >
                  Mark individual attendance
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {decision.slots.map((slot) => {
                const status = slot.attendanceRecord?.status;
                return (
                  <div
                    key={slot.id}
                    className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/70 border border-zinc-200/70 dark:border-zinc-700/60 flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                          {slot.subject?.name || 'Unknown Class'}
                        </span>
                        {slot.isCompulsoryLab && (
                          <span className="text-[10px] font-bold bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 px-1.5 py-0.5 rounded border border-rose-300 dark:border-rose-800">
                            100% REQUIRED
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                        {slot.startTime} – {slot.endTime} • {slot.classType === 'lab' ? 'Lab' : 'Lecture'}
                        {slot.room ? ` • ${slot.room}` : ''}
                      </p>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {status ? (
                        <button
                          type="button"
                          onClick={() => {
                            if (status === 'present') {
                              markAttendance({
                                date: selectedDate,
                                slotId: slot.id,
                                subjectId: slot.subjectId,
                                status: 'absent',
                                classType: slot.classType,
                                isCompulsoryLab: slot.isCompulsoryLab,
                              });
                            } else if (status === 'absent') {
                              markAttendance({
                                date: selectedDate,
                                slotId: slot.id,
                                subjectId: slot.subjectId,
                                status: 'cancelled',
                                classType: slot.classType,
                                isCompulsoryLab: slot.isCompulsoryLab,
                              });
                            } else {
                              if (slot.attendanceRecord) {
                                deleteRecord(slot.attendanceRecord.id);
                              }
                            }
                          }}
                          title="Click to cycle: Present → Absent → Cancelled → Clear"
                          className={`text-[11px] font-bold px-2 py-1 rounded-lg capitalize shrink-0 transition-colors cursor-pointer flex items-center gap-1 ${
                            status === 'present'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 hover:bg-emerald-200 dark:hover:bg-emerald-900'
                              : status === 'absent'
                              ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 hover:bg-rose-200 dark:hover:bg-rose-900'
                              : 'bg-zinc-200 text-zinc-800 dark:bg-zinc-700 dark:text-zinc-300 hover:bg-zinc-300 dark:hover:bg-zinc-600'
                          }`}
                        >
                          {status === 'cancelled' && <Slash className="w-3 h-3" />}
                          {status}
                        </button>
                      ) : (
                        <div className="flex items-center gap-0.5">
                          <button
                            type="button"
                            onClick={() =>
                              markAttendance({
                                date: selectedDate,
                                slotId: slot.id,
                                subjectId: slot.subjectId,
                                status: 'present',
                                classType: slot.classType,
                                isCompulsoryLab: slot.isCompulsoryLab,
                              })
                            }
                            className="p-1 rounded-md text-zinc-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 cursor-pointer"
                            title="Mark Present"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              markAttendance({
                                date: selectedDate,
                                slotId: slot.id,
                                subjectId: slot.subjectId,
                                status: 'absent',
                                classType: slot.classType,
                                isCompulsoryLab: slot.isCompulsoryLab,
                              })
                            }
                            className="p-1 rounded-md text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                            title="Mark Absent"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              markAttendance({
                                date: selectedDate,
                                slotId: slot.id,
                                subjectId: slot.subjectId,
                                status: 'cancelled',
                                classType: slot.classType,
                                isCompulsoryLab: slot.isCompulsoryLab,
                              })
                            }
                            className="p-1 rounded-md text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-700 cursor-pointer"
                            title="Mark Cancelled"
                          >
                            <Slash className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
