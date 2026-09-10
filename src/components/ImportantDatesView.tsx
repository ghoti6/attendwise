import React, { useState } from 'react';
import { useAttendance } from '../context/AttendanceContext';
import { ImportantDate, ImportantDateType } from '../types';
import {
  CalendarDays,
  Plus,
  Trash2,
  Edit2,
  Calendar,
  Sun,
  GraduationCap,
  Sparkles,
  Info,
  X,
} from 'lucide-react';
import { formatDisplayDate, formatDate } from '../utils/attendanceCalculations';

const DATE_TYPES: { type: ImportantDateType; label: string; icon: any; color: string }[] = [
  {
    type: 'semester_start',
    label: 'Semester Start',
    icon: Sparkles,
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300',
  },
  {
    type: 'semester_end',
    label: 'Semester End',
    icon: GraduationCap,
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300',
  },
  {
    type: 'vacation_range',
    label: 'Vacation Break',
    icon: Sun,
    color: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300',
  },
  {
    type: 'holiday',
    label: 'Official Holiday',
    icon: Sun,
    color: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
  },
  {
    type: 'exam',
    label: 'Semester Exam',
    icon: GraduationCap,
    color: 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300',
  },
  {
    type: 'internal_exam',
    label: 'Internal Exam',
    icon: GraduationCap,
    color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300',
  },
  {
    type: 'practical_exam',
    label: 'Practical Lab Exam',
    icon: GraduationCap,
    color: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300',
  },
  {
    type: 'no_classes',
    label: 'No Classes / Event',
    icon: CalendarDays,
    color: 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300',
  },
  {
    type: 'other',
    label: 'Other Academic Event',
    icon: Calendar,
    color: 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300',
  },
];

export const ImportantDatesView: React.FC = () => {
  const { importantDates, addImportantDate, updateImportantDate, deleteImportantDate } =
    useAttendance();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ImportantDate | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState(formatDate(new Date()));
  const [endDate, setEndDate] = useState('');
  const [type, setType] = useState<ImportantDateType>('holiday');
  const [countsAsAttendance, setCountsAsAttendance] = useState(false);
  const [notes, setNotes] = useState('');

  const openAdd = () => {
    setEditingItem(null);
    setTitle('');
    setStartDate(formatDate(new Date()));
    setEndDate('');
    setType('holiday');
    setCountsAsAttendance(false);
    setNotes('');
    setIsModalOpen(true);
  };

  const openEdit = (item: ImportantDate) => {
    setEditingItem(item);
    setTitle(item.title);
    setStartDate(item.startDate);
    setEndDate(item.endDate || '');
    setType(item.type);
    setCountsAsAttendance(!!item.countsAsAttendance);
    setNotes(item.notes || '');
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !startDate) return;

    if (editingItem) {
      updateImportantDate(editingItem.id, {
        title: title.trim(),
        startDate,
        endDate: endDate ? endDate : undefined,
        type,
        countsAsAttendance,
        notes: notes.trim() || undefined,
      });
    } else {
      addImportantDate({
        title: title.trim(),
        startDate,
        endDate: endDate ? endDate : undefined,
        type,
        countsAsAttendance,
        notes: notes.trim() || undefined,
      });
    }
    setIsModalOpen(false);
  };

  // Sort dates chronologically
  const sortedDates = [...importantDates].sort((a, b) => a.startDate.localeCompare(b.startDate));

  return (
    <div id="important-dates-view" className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            Academic Calendar & Important Dates
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Vacation breaks, exams, and holidays are automatically excluded from attendance penalty
            calculations.
          </p>
        </div>

        <button
          type="button"
          onClick={openAdd}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Add Important Date
        </button>
      </div>

      {/* Info Notice */}
      <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/60 rounded-xl p-4 flex items-start gap-3">
        <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
        <div className="text-xs text-blue-900 dark:text-blue-200">
          <p className="font-bold">Automatic Attendance Exclusion Rule</p>
          <p className="mt-0.5">
            Any date flagged as vacation, holiday, or no-class is excluded from total attendance. You
            never lose attendance during scheduled college breaks.
          </p>
        </div>
      </div>

      {/* Dates List */}
      <div className="space-y-3">
        {sortedDates.length === 0 ? (
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-8 text-center text-zinc-500">
            No important dates added yet. Click &quot;Add Important Date&quot; above.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {sortedDates.map((item) => {
              const typeConfig = DATE_TYPES.find((t) => t.type === item.type) || DATE_TYPES[7];
              const Icon = typeConfig.icon;

              return (
                <div
                  key={item.id}
                  className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between gap-3 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`p-1.5 rounded-lg ${typeConfig.color} border border-current/20`}
                        >
                          <Icon className="w-4 h-4" />
                        </span>
                        <div>
                          <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
                            {item.title}
                          </h4>
                          <span className="text-[10px] font-semibold text-zinc-500 uppercase">
                            {typeConfig.label}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => openEdit(item)}
                          className="p-1.5 text-zinc-400 hover:text-indigo-600 rounded-lg"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteImportantDate(item.id)}
                          className="p-1.5 text-zinc-400 hover:text-rose-600 rounded-lg"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center gap-2 font-mono text-xs text-zinc-700 dark:text-zinc-300">
                      <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                      <span>{formatDisplayDate(item.startDate, true)}</span>
                      {item.endDate && (
                        <span> → {formatDisplayDate(item.endDate, true)}</span>
                      )}
                    </div>
                  </div>

                  {item.notes && (
                    <p className="text-[11px] text-zinc-500 italic border-t border-zinc-100 dark:border-zinc-800 pt-2">
                      {item.notes}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto scrollbar-none">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-50">
                {editingItem ? 'Edit Important Date' : 'Add Important Date'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-zinc-400 hover:text-zinc-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Event / Date Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Mid-Term Vacation Break"
                  className="w-full px-3 py-2 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Category
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as ImportantDateType)}
                  className="w-full px-3 py-2 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl font-medium"
                >
                  {DATE_TYPES.map((t) => (
                    <option key={t.type} value={t.type}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    End Date (Optional range)
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Notes
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Campus closed; resumes Oct 31"
                  className="w-full px-3 py-2 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs"
                >
                  Save Date
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
