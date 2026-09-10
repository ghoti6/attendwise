import React, { useState } from 'react';
import { SubjectStats, AttendanceRecord, AttendanceStatus, Subject } from '../types';
import { useAttendance } from '../context/AttendanceContext';
import {
  X,
  Plus,
  Trash2,
  CheckCircle2,
  XCircle,
  Slash,
  Calendar,
  Settings as SettingsIcon,
  FlaskConical,
  Edit3,
  AlertTriangle,
} from 'lucide-react';
import { formatDisplayDate, formatDate } from '../utils/attendanceCalculations';
import { SubjectModal } from './SubjectModal';

interface SubjectDetailsModalProps {
  stats: SubjectStats;
  onClose: () => void;
}

export const SubjectDetailsModal: React.FC<SubjectDetailsModalProps> = ({ stats, onClose }) => {
  const { records, subjects, updateSubject, deleteSubject, markAttendance, deleteRecord } = useAttendance();

  // Retrieve freshest subject from context in case it was updated
  const liveSubject = subjects.find((s) => s.id === stats?.subject?.id) || stats?.subject || {
    id: '',
    name: 'Subject',
    color: '#6366F1',
    targetPercent: 75,
  };

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const percentage = typeof stats?.percentage === 'number' ? stats.percentage : 0;
  const attended = stats?.attended ?? 0;
  const total = stats?.total ?? 0;
  const missed = stats?.missed ?? 0;
  const cancelled = stats?.cancelled ?? 0;
  const classesCanMiss = stats?.classesCanMiss ?? 0;
  const target = liveSubject.targetPercent || 75;

  const [isEditingTarget, setIsEditingTarget] = useState(false);
  const [newTarget, setNewTarget] = useState(target);
  const [showAddRecord, setShowAddRecord] = useState(false);
  const [newRecordDate, setNewRecordDate] = useState(formatDate(new Date()));
  const [newRecordStatus, setNewRecordStatus] = useState<AttendanceStatus>('present');

  // Filter attendance records for this subject, sorted newest first
  const subjectRecords = records
    .filter((r) => r.subjectId === liveSubject.id)
    .sort((a, b) => b.date.localeCompare(a.date) || b.timestamp - a.timestamp);

  // Classes needed to reach custom milestones (80%, 85%, 90%)
  const calculateClassesNeededFor = (desiredTarget: number): number => {
    if (percentage >= desiredTarget) return 0;
    if (desiredTarget >= 100) return missed > 0 ? Infinity : 0;
    const r = desiredTarget / 100;
    const needed = Math.ceil((r * total - attended) / (1 - r));
    return Math.max(0, needed);
  };

  const neededFor80 = calculateClassesNeededFor(80);
  const neededForTarget = calculateClassesNeededFor(target);

  const handleSaveTarget = () => {
    updateSubject(liveSubject.id, { targetPercent: Number(newTarget) });
    setIsEditingTarget(false);
  };

  const handleAddManualRecord = (e: React.FormEvent) => {
    e.preventDefault();
    markAttendance({
      date: newRecordDate,
      subjectId: liveSubject.id,
      status: newRecordStatus,
      classType: liveSubject.isLabSubject ? 'lab' : 'lecture',
      isCompulsoryLab: liveSubject.targetPercent === 100,
    });
    setShowAddRecord(false);
  };

  const handleDeleteSubject = () => {
    deleteSubject(liveSubject.id);
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl sm:rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden my-auto max-h-[90vh] flex flex-col">
          {/* Modal Header */}
          <div className="p-4 sm:p-6 border-b border-zinc-100 dark:border-zinc-800 flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
              <span
                className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full shrink-0"
                style={{ backgroundColor: liveSubject.color || '#6366F1' }}
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-base sm:text-xl font-bold text-zinc-900 dark:text-zinc-50 truncate">
                    {liveSubject.name}
                  </h2>
                  {liveSubject.isLabSubject && (
                    <span className="text-[10px] sm:text-[11px] font-bold bg-purple-100 text-purple-800 dark:bg-purple-950/70 dark:text-purple-300 px-2 py-0.5 rounded-full shrink-0">
                      <FlaskConical className="w-3 h-3 inline mr-0.5" />
                      Lab
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  {liveSubject.code && (
                    <span className="text-xs text-zinc-500 dark:text-zinc-400 font-mono">
                      {liveSubject.code}
                    </span>
                  )}
                  {liveSubject.code && <span className="text-xs text-zinc-400 dark:text-zinc-500">•</span>}
                  <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                    Target: {liveSubject.targetPercent}%
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setIsEditModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 border border-indigo-200 dark:border-indigo-800 transition-colors cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Edit Subject</span>
                <span className="sm:hidden">Edit</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Delete confirmation banner if active */}
          {showDeleteConfirm && (
            <div className="p-4 bg-rose-50 dark:bg-rose-950/50 border-b border-rose-200 dark:border-rose-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-rose-900 dark:text-rose-200">
                    Confirm deletion of "{liveSubject.name}"?
                  </h4>
                  <p className="text-xs text-rose-700/90 dark:text-rose-300 mt-0.5">
                    This will delete all scheduled timetable slots and attendance records associated with this subject.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 self-end sm:self-auto">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteSubject}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white cursor-pointer shadow-xs"
                >
                  Delete Subject
                </button>
              </div>
            </div>
          )}

          {/* Modal Body */}
          <div className="p-6 space-y-6 overflow-y-auto flex-1">
            {/* Top Big Metric & Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-zinc-50 dark:bg-zinc-800/60 rounded-2xl p-3.5 text-center border border-zinc-200/60 dark:border-zinc-700/60">
                <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">Current Attendance</span>
                <p className="text-2xl font-black text-zinc-900 dark:text-zinc-50 font-mono mt-0.5">
                  {percentage.toFixed(1)}%
                </p>
              </div>
              <div className="bg-zinc-50 dark:bg-zinc-800/60 rounded-2xl p-3.5 text-center border border-zinc-200/60 dark:border-zinc-700/60">
                <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">Classes Attended</span>
                <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">
                  {attended}
                </p>
              </div>
              <div className="bg-zinc-50 dark:bg-zinc-800/60 rounded-2xl p-3.5 text-center border border-zinc-200/60 dark:border-zinc-700/60">
                <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">Total Conducted</span>
                <p className="text-2xl font-black text-zinc-900 dark:text-zinc-50 font-mono mt-0.5">
                  {total}
                </p>
              </div>
              <div className="bg-zinc-50 dark:bg-zinc-800/60 rounded-2xl p-3.5 text-center border border-zinc-200/60 dark:border-zinc-700/60">
                <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">Classes Missed</span>
                <p className="text-2xl font-black text-rose-600 dark:text-rose-400 font-mono mt-0.5">
                  {missed}
                </p>
              </div>
            </div>

            {/* Mathematical Thresholds Card */}
            <div className="bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/80 dark:border-zinc-700/80 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                  Target & Buffer Thresholds
                </span>
                <button
                  type="button"
                  onClick={() => setIsEditingTarget(!isEditingTarget)}
                  className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-semibold cursor-pointer"
                >
                  {isEditingTarget ? 'Close' : 'Adjust Target %'}
                </button>
              </div>

              {isEditingTarget ? (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min="50"
                      max="100"
                      value={newTarget}
                      onChange={(e) => setNewTarget(Number(e.target.value))}
                      className="flex-1 accent-indigo-600 cursor-pointer"
                    />
                    <span className="text-sm font-bold font-mono text-zinc-800 dark:text-zinc-200 w-12 text-right">
                      {newTarget}%
                    </span>
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsEditingTarget(false)}
                      className="px-3 py-1 text-xs text-zinc-500"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveTarget}
                      className="px-3 py-1 text-xs font-bold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 cursor-pointer"
                    >
                      Apply Target
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="p-3 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
                    <span className="text-xs text-zinc-500 dark:text-zinc-400">
                      Margin for Target ({target}%)
                    </span>
                    <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mt-1">
                      {percentage >= target ? (
                        <span className="text-emerald-600 dark:text-emerald-400">
                          Can miss {classesCanMiss} more class{classesCanMiss === 1 ? '' : 'es'} safely
                        </span>
                      ) : (
                        <span className="text-rose-600 dark:text-rose-400">
                          Attend {neededForTarget} consecutive class{neededForTarget === 1 ? '' : 'es'} to recover
                        </span>
                      )}
                    </p>
                  </div>

                  <div className="p-3 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
                    <span className="text-xs text-zinc-500 dark:text-zinc-400">
                      Buffer for 80% Merit Target
                    </span>
                    <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mt-1">
                      {percentage >= 80 ? (
                        <span className="text-emerald-600 dark:text-emerald-400">
                          Comfortably safe above 80%
                        </span>
                      ) : (
                        <span className="text-amber-600 dark:text-amber-400">
                          Need {neededFor80} class{neededFor80 === 1 ? '' : 'es'} to reach 80%
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Attendance History Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  Attendance History ({subjectRecords.length} entries)
                </h3>
                <button
                  type="button"
                  onClick={() => setShowAddRecord(!showAddRecord)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 rounded-xl hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  {showAddRecord ? 'Cancel' : 'Log Extra Class'}
                </button>
              </div>

              {/* Add Manual Record Form */}
              {showAddRecord && (
                <form
                  onSubmit={handleAddManualRecord}
                  className="p-4 bg-zinc-50 dark:bg-zinc-800/60 border border-indigo-200 dark:border-indigo-800 rounded-2xl space-y-3"
                >
                  <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                    Log Past or Extra Class for {liveSubject.name}
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-zinc-500 uppercase">Date</label>
                      <input
                        type="date"
                        value={newRecordDate}
                        onChange={(e) => setNewRecordDate(e.target.value)}
                        className="w-full mt-1 px-3 py-2 text-xs bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-xl font-mono text-zinc-900 dark:text-zinc-100 font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-zinc-500 uppercase">Status</label>
                      <select
                        value={newRecordStatus}
                        onChange={(e) => setNewRecordStatus(e.target.value as AttendanceStatus)}
                        className="w-full mt-1 px-3 py-2 text-xs bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100 font-semibold"
                      >
                        <option value="present">Present (Attended)</option>
                        <option value="absent">Absent (Bunked / Missed)</option>
                        <option value="cancelled">Cancelled (No Penalty)</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowAddRecord(false)}
                      className="px-3 py-1.5 text-xs text-zinc-500 font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 text-xs font-bold bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 cursor-pointer shadow-xs"
                    >
                      Save Entry
                    </button>
                  </div>
                </form>
              )}

              {/* Records List Table */}
              {subjectRecords.length === 0 ? (
                <p className="text-xs text-zinc-400 dark:text-zinc-500 py-8 text-center italic">
                  No attendance records logged for {liveSubject.name} yet.
                </p>
              ) : (
                <div className="border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden divide-y divide-zinc-100 dark:divide-zinc-800 max-h-60 overflow-y-auto">
                  {subjectRecords.map((rec) => (
                    <div
                      key={rec.id}
                      className="p-3 bg-white dark:bg-zinc-900 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Calendar className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                        <span className="font-mono text-zinc-700 dark:text-zinc-300 font-semibold">
                          {formatDisplayDate(rec.date)}
                        </span>
                        <span className="text-zinc-400 dark:text-zinc-500 uppercase text-[10px]">
                          {rec.classType}
                        </span>
                        {rec.notes && (
                          <span className="text-zinc-500 italic truncate max-w-[120px]">
                            ({rec.notes})
                          </span>
                        )}
                      </div>

                      {/* Status Pill & Action */}
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          title="Click to toggle status"
                          onClick={() => {
                            const nextStatus: AttendanceStatus =
                              rec.status === 'present'
                                ? 'absent'
                                : rec.status === 'absent'
                                ? 'cancelled'
                                : 'present';
                            markAttendance({
                              date: rec.date,
                              slotId: rec.slotId,
                              subjectId: rec.subjectId,
                              status: nextStatus,
                              classType: rec.classType,
                              isCompulsoryLab: rec.isCompulsoryLab,
                            });
                          }}
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold uppercase text-[10px] border transition-colors cursor-pointer ${
                            rec.status === 'present'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                              : rec.status === 'absent'
                              ? 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800'
                              : 'bg-zinc-100 text-zinc-700 border-zinc-300 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700'
                          }`}
                        >
                          {rec.status === 'present' && <CheckCircle2 className="w-3 h-3" />}
                          {rec.status === 'absent' && <XCircle className="w-3 h-3" />}
                          {rec.status === 'cancelled' && <Slash className="w-3 h-3" />}
                          {rec.status}
                        </button>

                        <button
                          type="button"
                          onClick={() => deleteRecord(rec.id)}
                          title="Delete record"
                          className="p-1 text-zinc-400 hover:text-rose-600 rounded-lg cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Modal Footer */}
          <div className="p-4 bg-zinc-50 dark:bg-zinc-800/40 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="text-xs text-rose-600 hover:text-rose-700 font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete Subject
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 text-xs font-bold bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600 text-zinc-800 dark:text-zinc-100 rounded-xl transition-colors cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      </div>

      {/* Embedded Subject Editor Modal */}
      {isEditModalOpen && (
        <SubjectModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          subjectToEdit={liveSubject}
        />
      )}
    </>
  );
};
