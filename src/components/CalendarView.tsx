import React, { useState } from 'react';
import { useAttendance } from '../context/AttendanceContext';
import {
  parseDate,
  formatDate,
  formatDisplayDate,
  checkDateHolidayOrVacation,
} from '../utils/attendanceCalculations';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  CheckCircle2,
  XCircle,
  Slash,
  Clock,
  FlaskConical,
  Sun,
} from 'lucide-react';
import { AttendanceStatus } from '../types';

export const CalendarView: React.FC = () => {
  const {
    records,
    timetable,
    subjects,
    importantDates,
    settings,
    currentDate,
    markAttendance,
    bulkMarkDay,
  } = useAttendance();

  // Current viewed month: defaults to current date's month
  const [viewDate, setViewDate] = useState<Date>(() => parseDate(currentDate));
  // Selected date to inspect details
  const [selectedDateStr, setSelectedDateStr] = useState<string>(currentDate);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth(); // 0-indexed

  const monthName = viewDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });

  // Navigation handlers
  const prevMonth = () => {
    setViewDate(new Date(year, month - 1, 1));
  };
  const nextMonth = () => {
    setViewDate(new Date(year, month + 1, 1));
  };
  const goToCurrentMonth = () => {
    setViewDate(parseDate(currentDate));
    setSelectedDateStr(currentDate);
  };

  // Calendar grid math
  const firstDayOfMonth = new Date(year, month, 1);
  const startingDayOfWeek = firstDayOfMonth.getDay(); // 0 = Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Inspect selected date's classes & records
  const selectedDateObj = parseDate(selectedDateStr);
  const selectedDayOfWeek = selectedDateObj.getDay();
  const selectedHoliday = checkDateHolidayOrVacation(selectedDateStr, importantDates);
  const isSelectedWorking = settings.workingDays.includes(selectedDayOfWeek);

  const selectedSlots = timetable
    .filter((s) => s.dayOfWeek === selectedDayOfWeek)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  const selectedRecords = records.filter((r) => r.date === selectedDateStr);

  return (
    <div id="calendar-view" className="space-y-6">
      {/* Calendar Card */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-xs">
        {/* Month Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-100 dark:border-zinc-800 pb-4">
          <div className="flex items-center gap-2.5">
            <CalendarIcon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">{monthName}</h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={goToCurrentMonth}
              className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition-colors"
            >
              Current Month
            </button>
            <div className="flex items-center bg-zinc-100 dark:bg-zinc-800 rounded-xl p-0.5">
              <button
                type="button"
                onClick={prevMonth}
                className="p-1.5 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 rounded-lg hover:bg-white dark:hover:bg-zinc-700 transition-colors"
                title="Previous month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={nextMonth}
                className="p-1.5 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 rounded-lg hover:bg-white dark:hover:bg-zinc-700 transition-colors"
                title="Next month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs text-zinc-500 dark:text-zinc-400 py-3 flex-wrap border-b border-zinc-100 dark:border-zinc-800">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Attended
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Absent
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Mixed
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500" /> Vacation / Holiday
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-zinc-300 dark:bg-zinc-700" /> Scheduled
          </span>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2 mt-4 text-center">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
            <div
              key={d}
              className="text-xs font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 pb-2"
            >
              {d}
            </div>
          ))}

          {/* Empty cells before month start */}
          {Array.from({ length: startingDayOfWeek }).map((_, i) => (
            <div key={`empty-${i}`} className="min-h-[70px] sm:min-h-[85px] p-1 opacity-20" />
          ))}

          {/* Day cells */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const dayNum = i + 1;
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(
              dayNum
            ).padStart(2, '0')}`;
            const isToday = dateStr === currentDate;
            const isSelected = dateStr === selectedDateStr;

            const dObj = new Date(year, month, dayNum);
            const dayOfWeek = dObj.getDay();
            const hol = checkDateHolidayOrVacation(dateStr, importantDates);
            const isWorking = settings.workingDays.includes(dayOfWeek);

            // Records on this date
            const dayRecs = records.filter((r) => r.date === dateStr);
            const attendedCount = dayRecs.filter((r) => r.status === 'present').length;
            const missedCount = dayRecs.filter((r) => r.status === 'absent').length;
            const scheduledCount = timetable.filter((s) => s.dayOfWeek === dayOfWeek).length;

            let statusColor = 'bg-transparent';
            let statusLabel = '';

            if (hol.isHolidayOrVacation) {
              statusColor = 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300';
              statusLabel = 'Vacation';
            } else if (attendedCount > 0 && missedCount === 0) {
              statusColor = 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300';
              statusLabel = 'Attended';
            } else if (missedCount > 0 && attendedCount === 0) {
              statusColor = 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300';
              statusLabel = 'Absent';
            } else if (attendedCount > 0 && missedCount > 0) {
              statusColor = 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300';
              statusLabel = 'Mixed';
            } else if (isWorking && scheduledCount > 0) {
              statusColor = 'hover:bg-zinc-50 dark:hover:bg-zinc-800/50';
              statusLabel = `${scheduledCount} classes`;
            }

            return (
              <div
                key={dayNum}
                onClick={() => setSelectedDateStr(dateStr)}
                className={`min-h-[70px] sm:min-h-[85px] p-1.5 rounded-xl border flex flex-col justify-between text-left transition-all cursor-pointer ${statusColor} ${
                  isSelected
                    ? 'ring-2 ring-indigo-500 border-indigo-500'
                    : isToday
                    ? 'border-indigo-300 dark:border-indigo-700'
                    : 'border-zinc-200/70 dark:border-zinc-800/70'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs font-mono font-bold ${
                      isToday
                        ? 'w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center'
                        : 'text-zinc-800 dark:text-zinc-200'
                    }`}
                  >
                    {dayNum}
                  </span>

                  {/* Status Indicator Dot */}
                  {hol.isHolidayOrVacation ? (
                    <Sun className="w-3 h-3 text-purple-500" />
                  ) : attendedCount > 0 && missedCount === 0 ? (
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                  ) : missedCount > 0 && attendedCount === 0 ? (
                    <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                  ) : attendedCount > 0 && missedCount > 0 ? (
                    <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                  ) : null}
                </div>

                <div className="mt-1">
                  {statusLabel && (
                    <span className="block text-[10px] font-semibold truncate leading-tight">
                      {statusLabel}
                    </span>
                  )}
                  {dayRecs.length > 0 && (
                    <span className="text-[9px] text-zinc-400 font-mono">
                      {attendedCount}P / {missedCount}A
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Day Inspection & Quick Logging Drawer */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-100 dark:border-zinc-800 pb-3">
          <div>
            <span className="text-xs uppercase font-bold text-zinc-400">Selected Date</span>
            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
              {formatDisplayDate(selectedDateStr, true)}
            </h3>
          </div>

          {selectedSlots.length > 0 && !selectedHoliday.isHolidayOrVacation && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => bulkMarkDay(selectedDateStr, 'present')}
                className="px-3 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs"
              >
                Mark Day Present
              </button>
              <button
                type="button"
                onClick={() => bulkMarkDay(selectedDateStr, 'absent')}
                className="px-3 py-1.5 text-xs font-bold bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 text-zinc-800 dark:text-zinc-200 rounded-xl"
              >
                Mark Day Absent
              </button>
            </div>
          )}
        </div>

        {selectedHoliday.isHolidayOrVacation ? (
          <p className="text-xs text-purple-700 dark:text-purple-300 font-medium">
            🏖️ {selectedHoliday.reason} — Excluded from attendance calculations.
          </p>
        ) : !isSelectedWorking ? (
          <p className="text-xs text-zinc-500">
            Non-working day / Weekend according to academic settings.
          </p>
        ) : selectedSlots.length === 0 ? (
          <p className="text-xs text-zinc-500">No classes scheduled on this day.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {selectedSlots.map((slot) => {
              const subject = subjects.find((s) => s.id === slot.subjectId);
              const record = selectedRecords.find((r) => r.slotId === slot.id);
              const currentStatus = record?.status;

              return (
                <div
                  key={slot.id}
                  className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-800/60 flex flex-col justify-between gap-2.5"
                >
                  <div>
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                        {subject?.name || 'Class'}
                      </span>
                      {slot.isCompulsoryLab && (
                        <span className="text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 px-1.5 py-0.2 rounded">
                          100% REQUIRED
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-zinc-500 font-mono">
                      {slot.startTime} – {slot.endTime} • {slot.classType}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 pt-1 border-t border-zinc-200/50 dark:border-zinc-700/50">
                    <button
                      type="button"
                      onClick={() =>
                        markAttendance({
                          date: selectedDateStr,
                          slotId: slot.id,
                          subjectId: slot.subjectId,
                          status: 'present',
                          classType: slot.classType,
                          isCompulsoryLab: slot.isCompulsoryLab,
                        })
                      }
                      className={`flex-1 py-1 text-[11px] font-bold rounded-lg ${
                        currentStatus === 'present'
                          ? 'bg-emerald-600 text-white'
                          : 'bg-zinc-200/70 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300'
                      }`}
                    >
                      Present
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        markAttendance({
                          date: selectedDateStr,
                          slotId: slot.id,
                          subjectId: slot.subjectId,
                          status: 'absent',
                          classType: slot.classType,
                          isCompulsoryLab: slot.isCompulsoryLab,
                        })
                      }
                      className={`flex-1 py-1 text-[11px] font-bold rounded-lg ${
                        currentStatus === 'absent'
                          ? 'bg-rose-600 text-white'
                          : 'bg-zinc-200/70 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300'
                      }`}
                    >
                      Absent
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        markAttendance({
                          date: selectedDateStr,
                          slotId: slot.id,
                          subjectId: slot.subjectId,
                          status: 'cancelled',
                          classType: slot.classType,
                          isCompulsoryLab: slot.isCompulsoryLab,
                        })
                      }
                      className={`px-2 py-1 text-[11px] font-semibold rounded-lg ${
                        currentStatus === 'cancelled'
                          ? 'bg-zinc-600 text-white'
                          : 'bg-zinc-200/70 dark:bg-zinc-700 text-zinc-500'
                      }`}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
