import React, { useState } from 'react';
import { useAttendance } from '../context/AttendanceContext';
import {
  formatDate,
  formatDisplayDate,
  parseDate,
  checkDateHolidayOrVacation,
} from '../utils/attendanceCalculations';
import { AttendanceStatus, TimetableSlot } from '../types';
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  FlaskConical,
  CheckCircle2,
  XCircle,
  Slash,
  AlertTriangle,
  Info,
  Clock,
  MapPin,
} from 'lucide-react';

export const DailyAttendanceView: React.FC = () => {
  const {
    currentDate,
    setCurrentDate,
    timetable,
    subjects,
    records,
    importantDates,
    settings,
    markAttendance,
    bulkMarkDay,
  } = useAttendance();

  // Dialog state for compulsory lab warning
  const [compulsoryWarningSlot, setCompulsoryWarningSlot] = useState<TimetableSlot | null>(null);

  const dateObj = parseDate(currentDate);
  const dayOfWeek = dateObj.getDay();

  // Step day backwards or forwards
  const handlePrevDay = () => {
    const d = parseDate(currentDate);
    d.setDate(d.getDate() - 1);
    setCurrentDate(formatDate(d));
  };

  const handleNextDay = () => {
    const d = parseDate(currentDate);
    d.setDate(d.getDate() + 1);
    setCurrentDate(formatDate(d));
  };

  const handleToday = () => {
    setCurrentDate(formatDate(new Date()));
  };

  // Holiday check
  const holiday = checkDateHolidayOrVacation(currentDate, importantDates);
  const isWorkingDay = settings.workingDays.includes(dayOfWeek);

  // Slots scheduled for this day of week
  const scheduledSlots = timetable
    .filter((s) => s.dayOfWeek === dayOfWeek)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  const handleStatusClick = (slot: TimetableSlot, status: AttendanceStatus) => {
    if (status === 'absent' && slot.isCompulsoryLab) {
      // Trigger confirmation warning as mandated by requirement #5
      setCompulsoryWarningSlot(slot);
      return;
    }

    markAttendance({
      date: currentDate,
      slotId: slot.id,
      subjectId: slot.subjectId,
      status,
      classType: slot.classType,
      isCompulsoryLab: slot.isCompulsoryLab,
    });
  };

  const confirmCompulsoryAbsence = () => {
    if (!compulsoryWarningSlot) return;
    markAttendance({
      date: currentDate,
      slotId: compulsoryWarningSlot.id,
      subjectId: compulsoryWarningSlot.subjectId,
      status: 'absent',
      classType: compulsoryWarningSlot.classType,
      isCompulsoryLab: compulsoryWarningSlot.isCompulsoryLab,
    });
    setCompulsoryWarningSlot(null);
  };

  return (
    <div id="daily-attendance-view" className="space-y-6">
      {/* Top Date Bar & Navigation */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl">
            <button
              type="button"
              onClick={handlePrevDay}
              className="p-1.5 rounded-lg text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-white dark:hover:bg-zinc-700 transition-colors"
              title="Previous day"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={handleToday}
              className="px-2.5 py-1 text-xs font-semibold rounded-lg text-zinc-700 dark:text-zinc-300 hover:bg-white dark:hover:bg-zinc-700 transition-colors"
            >
              Today
            </button>
            <button
              type="button"
              onClick={handleNextDay}
              className="p-1.5 rounded-lg text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-white dark:hover:bg-zinc-700 transition-colors"
              title="Next day"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <div>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              {formatDisplayDate(currentDate, true)}
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              One-tap class attendance logging
            </p>
          </div>
        </div>

        {/* Date Input & Bulk Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <input
            type="date"
            value={currentDate}
            onChange={(e) => e.target.value && setCurrentDate(e.target.value)}
            className="text-xs px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-800 dark:text-zinc-200 font-medium"
          />

          {scheduledSlots.length > 0 && !holiday.isHolidayOrVacation && (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => bulkMarkDay(currentDate, 'present')}
                className="px-3 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs transition-colors"
              >
                All Present
              </button>
              <button
                type="button"
                onClick={() => bulkMarkDay(currentDate, 'absent')}
                className="px-3 py-1.5 text-xs font-bold bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 rounded-xl transition-colors"
              >
                All Absent
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Holiday / Vacation notice */}
      {holiday.isHolidayOrVacation && (
        <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-2xl p-5 flex items-start gap-3.5">
          <Info className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-bold text-amber-900 dark:text-amber-200">
              {holiday.reason}
            </h3>
            <p className="text-xs text-amber-800 dark:text-amber-300 mt-1">
              This date is marked as a holiday, vacation, or no-class day. Dates in this range are
              automatically excluded from all attendance calculations.
            </p>
          </div>
        </div>
      )}

      {/* Weekend / Off day notice */}
      {!holiday.isHolidayOrVacation && !isWorkingDay && (
        <div className="bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-2xl p-5 flex items-start gap-3.5">
          <Info className="w-5 h-5 text-zinc-500 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              Weekend / Non-Working Day
            </h3>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
              According to your academic calendar settings, this day has no regularly scheduled
              classes. You can adjust working days in Settings.
            </p>
          </div>
        </div>
      )}

      {/* Classes List */}
      {!holiday.isHolidayOrVacation && scheduledSlots.length === 0 && isWorkingDay && (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-8 text-center">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            No classes scheduled for this day in your timetable.
          </p>
        </div>
      )}

      {scheduledSlots.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Scheduled Classes ({scheduledSlots.length})
            </span>
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              Cancelled classes do not penalize attendance
            </span>
          </div>

          {scheduledSlots.map((slot) => {
            const subject = subjects.find((s) => s.id === slot.subjectId);
            const record = records.find(
              (r) => r.date === currentDate && r.slotId === slot.id
            );
            const currentStatus = record?.status;

            return (
              <div
                key={slot.id}
                className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all hover:border-zinc-300 dark:hover:border-zinc-700"
              >
                {/* Left: Class details */}
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: subject?.color || '#3B82F6' }}
                    />
                    <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-50">
                      {subject?.name || 'Unknown Subject'}
                    </h3>
                    <span className="text-xs px-2 py-0.5 rounded-md font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 uppercase">
                      {slot.classType}
                    </span>
                    {slot.isCompulsoryLab && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-extrabold bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-200 border border-rose-300 dark:border-rose-700 px-2 py-0.5 rounded-full">
                        <FlaskConical className="w-3.5 h-3.5" />
                        100% REQUIRED
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-4 text-xs text-zinc-500 dark:text-zinc-400 flex-wrap">
                    <span className="flex items-center gap-1 font-mono">
                      <Clock className="w-3.5 h-3.5 text-zinc-400" />
                      {slot.startTime} – {slot.endTime}
                    </span>
                    {slot.room && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-zinc-400" />
                        {slot.room}
                      </span>
                    )}
                    {slot.notes && (
                      <span className="italic text-zinc-400 dark:text-zinc-500">
                        {slot.notes}
                      </span>
                    )}
                  </div>
                </div>

                {/* Right: One-tap action buttons */}
                <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                  {/* Present */}
                  <button
                    type="button"
                    onClick={() => handleStatusClick(slot, 'present')}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                      currentStatus === 'present'
                        ? 'bg-emerald-600 text-white shadow-xs scale-102 ring-2 ring-emerald-400 dark:ring-emerald-700'
                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-700 dark:hover:text-emerald-300'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Present
                  </button>

                  {/* Absent */}
                  <button
                    type="button"
                    onClick={() => handleStatusClick(slot, 'absent')}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                      currentStatus === 'absent'
                        ? 'bg-rose-600 text-white shadow-xs scale-102 ring-2 ring-rose-400 dark:ring-rose-700'
                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-700 dark:hover:text-rose-300'
                    }`}
                  >
                    <XCircle className="w-4 h-4" />
                    Absent
                  </button>

                  {/* Cancelled */}
                  <button
                    type="button"
                    onClick={() => handleStatusClick(slot, 'cancelled')}
                    title="Cancelled classes do not affect total attendance"
                    className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                      currentStatus === 'cancelled'
                        ? 'bg-zinc-600 text-white shadow-xs scale-102 ring-2 ring-zinc-400'
                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                    }`}
                  >
                    <Slash className="w-3.5 h-3.5" />
                    Cancelled
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Compulsory Lab Warning Confirmation Modal (Requirement #5) */}
      {compulsoryWarningSlot && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-rose-300 dark:border-rose-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-50">
                  Compulsory Lab Absence Warning
                </h3>
                <p className="text-xs text-rose-700 dark:text-rose-400 font-semibold mt-0.5">
                  100% Attendance Required
                </p>
              </div>
            </div>

            <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
              <strong>Warning: This lab requires 100% attendance.</strong> Missing a compulsory lab
              session violates the curriculum minimum and may disqualify you from practical
              assessments.
            </p>

            <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-xs">
              <p className="font-bold text-zinc-800 dark:text-zinc-200">
                {subjects.find((s) => s.id === compulsoryWarningSlot.subjectId)?.name}
              </p>
              <p className="text-zinc-500 dark:text-zinc-400">
                {compulsoryWarningSlot.startTime} – {compulsoryWarningSlot.endTime} •{' '}
                {compulsoryWarningSlot.room || 'Lab'}
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCompulsoryWarningSlot(null)}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 transition-colors"
              >
                Cancel (Keep Present)
              </button>
              <button
                type="button"
                onClick={confirmCompulsoryAbsence}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition-colors"
              >
                Record Absence Anyway
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
