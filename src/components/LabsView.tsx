import React, { useState } from 'react';
import { useAttendance } from '../context/AttendanceContext';
import { getLabStats, formatDisplayDate } from '../utils/attendanceCalculations';
import {
  FlaskConical,
  ShieldCheck,
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Calendar,
  Plus,
} from 'lucide-react';
import { TimetableSlot } from '../types';

export const LabsView: React.FC = () => {
  const { timetable, subjects, records, updateTimetableSlot, markAttendance, currentDate } =
    useAttendance();

  // Lab slots from timetable
  const labSlots = timetable.filter((s) => s.classType === 'lab' || s.isCompulsoryLab);

  // Overall lab stats
  const labStats = getLabStats(records, timetable);

  // Filter distinct lab subjects
  const labSubjects = subjects.filter(
    (s) => s.isLabSubject || labSlots.some((slot) => slot.subjectId === s.id)
  );

  return (
    <div id="labs-view" className="space-y-6">
      {/* Header & Lab KPI Card */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-100 dark:border-zinc-800 pb-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 border border-purple-100 dark:border-purple-900">
              <FlaskConical className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
                Compulsory Labs & Practicals
                <span className="text-xs bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 font-bold px-2 py-0.5 rounded-full border border-rose-200 dark:border-rose-800">
                  100% Policy
                </span>
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Lab sessions carry strict 100% attendance requirements for university practical
                eligibility.
              </p>
            </div>
          </div>
        </div>

        {/* Missed Warning Alert Banner (Requirement #13) */}
        {labStats.hasMissedCompulsoryLab ? (
          <div className="mt-5 bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 rounded-xl p-4 flex items-start gap-3">
            <AlertOctagon className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-rose-900 dark:text-rose-200">
                ⚠️ Lab attendance below required level.
              </p>
              <p className="text-xs text-rose-800 dark:text-rose-300 mt-0.5">
                You have missed {labStats.compulsoryMissed} compulsory lab session(s). Compulsory labs
                mandate 100% attendance. Meet with your lab instructor immediately to schedule a
                makeup practical.
              </p>
            </div>
          </div>
        ) : (
          <div className="mt-5 bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 rounded-xl p-4 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-emerald-900 dark:text-emerald-200">
                100% Lab Compliance Maintained
              </p>
              <p className="text-xs text-emerald-800 dark:text-emerald-300 mt-0.5">
                All compulsory practical sessions are fully attended ({labStats.compulsoryAttended} /{' '}
                {labStats.compulsoryTotal}).
              </p>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
          <div className="bg-zinc-50 dark:bg-zinc-800/60 p-3 rounded-xl border border-zinc-200/60 dark:border-zinc-700/60 text-center">
            <span className="text-xs text-zinc-500 font-medium">Compulsory Labs</span>
            <p className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-50 font-mono mt-0.5">
              {labStats.compulsoryTotal}
            </p>
          </div>
          <div className="bg-zinc-50 dark:bg-zinc-800/60 p-3 rounded-xl border border-zinc-200/60 dark:border-zinc-700/60 text-center">
            <span className="text-xs text-zinc-500 font-medium">Attended</span>
            <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">
              {labStats.compulsoryAttended}
            </p>
          </div>
          <div className="bg-zinc-50 dark:bg-zinc-800/60 p-3 rounded-xl border border-zinc-200/60 dark:border-zinc-700/60 text-center">
            <span className="text-xs text-zinc-500 font-medium">Missed</span>
            <p
              className={`text-2xl font-extrabold font-mono mt-0.5 ${
                labStats.compulsoryMissed > 0
                  ? 'text-rose-600 dark:text-rose-400'
                  : 'text-zinc-900 dark:text-zinc-50'
              }`}
            >
              {labStats.compulsoryMissed}
            </p>
          </div>
          <div className="bg-zinc-50 dark:bg-zinc-800/60 p-3 rounded-xl border border-zinc-200/60 dark:border-zinc-700/60 text-center">
            <span className="text-xs text-zinc-500 font-medium">Lab Percentage</span>
            <p className="text-2xl font-extrabold text-purple-600 dark:text-purple-400 font-mono mt-0.5">
              {(labStats?.compulsoryPercentage ?? 100).toFixed(0)}%
            </p>
          </div>
        </div>
      </div>

      {/* Lab Subject Cards (DBMS Lab, ML Lab, Web App Lab, etc.) */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 px-1">
          Registered Labs & Attendance Progress
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {labSubjects.map((sub) => {
            const subRecords = records.filter(
              (r) => r.subjectId === sub.id && (r.classType === 'lab' || r.isCompulsoryLab)
            );
            const subAttended = subRecords.filter((r) => r.status === 'present').length;
            const subMissed = subRecords.filter((r) => r.status === 'absent').length;
            const subTotal = subAttended + subMissed;
            const subPct = subTotal === 0 ? 100 : (subAttended / subTotal) * 100;
            const isSafe = subPct >= (sub.targetPercent || 100);

            // Related slots
            const slots = timetable.filter((s) => s.subjectId === sub.id);

            return (
              <div
                key={sub.id}
                className={`bg-white dark:bg-zinc-900 border rounded-2xl p-5 shadow-xs flex flex-col justify-between gap-4 transition-all ${
                  isSafe
                    ? 'border-zinc-200 dark:border-zinc-800'
                    : 'border-rose-300 dark:border-rose-900 bg-rose-50/20'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: sub.color || '#8B5CF6' }}
                      />
                      <h4 className="text-base font-bold text-zinc-900 dark:text-zinc-50">
                        {sub.name}
                      </h4>
                    </div>
                    <span className="text-[10px] font-extrabold uppercase bg-rose-100 dark:bg-rose-950/70 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800 px-2 py-0.5 rounded-full">
                      100% Required
                    </span>
                  </div>

                  <div className="mt-4 flex items-baseline justify-between">
                    <span className="text-3xl font-extrabold font-mono text-zinc-900 dark:text-zinc-50">
                      {(subPct ?? 100).toFixed(0)}%
                    </span>
                    <span className="text-xs font-semibold text-zinc-500 font-mono">
                      {subAttended} / {subTotal} attended
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="mt-2 w-full h-2 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        isSafe ? 'bg-purple-600 dark:bg-purple-500' : 'bg-rose-600'
                      }`}
                      style={{ width: `${Math.min(100, subPct)}%` }}
                    />
                  </div>

                  {/* Timetable Schedule info */}
                  <div className="mt-3 space-y-1 text-xs text-zinc-500 dark:text-zinc-400">
                    {slots.map((sl) => {
                      const dayName = [
                        'Sunday',
                        'Monday',
                        'Tuesday',
                        'Wednesday',
                        'Thursday',
                        'Friday',
                        'Saturday',
                      ][sl.dayOfWeek];
                      return (
                        <p key={sl.id} className="text-[11px]">
                          <strong>{dayName}</strong>: {sl.startTime} – {sl.endTime}{' '}
                          {sl.room ? `(${sl.room})` : ''}
                        </p>
                      );
                    })}
                  </div>
                </div>

                {/* Status footnote */}
                <div className="border-t border-zinc-100 dark:border-zinc-800 pt-3 flex items-center justify-between text-xs">
                  {subMissed > 0 ? (
                    <span className="text-rose-600 font-bold flex items-center gap-1">
                      <AlertOctagon className="w-3.5 h-3.5" />
                      {subMissed} missed practical
                    </span>
                  ) : (
                    <span className="text-emerald-600 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      100% Perfect Attendance
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      markAttendance({
                        date: currentDate,
                        subjectId: sub.id,
                        status: 'present',
                        classType: 'lab',
                        isCompulsoryLab: true,
                      });
                    }}
                    className="text-[11px] font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
                  >
                    + Log Lab Today
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
