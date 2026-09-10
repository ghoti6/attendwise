import React, { useState } from 'react';
import { Subject } from '../types';
import { useAttendance } from '../context/AttendanceContext';
import { X, BookOpen, Hash, Palette, Target, FlaskConical, Trash2, AlertTriangle, Check } from 'lucide-react';

interface SubjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  subjectToEdit?: Subject | null;
  onSaved?: (savedSubject: Subject) => void;
}

const COLOR_PRESETS = [
  { label: 'Indigo', hex: '#6366F1' },
  { label: 'Emerald', hex: '#10B981' },
  { label: 'Amber', hex: '#F59E0B' },
  { label: 'Rose', hex: '#F43F5E' },
  { label: 'Purple', hex: '#8B5CF6' },
  { label: 'Sky', hex: '#0EA5E9' },
  { label: 'Teal', hex: '#14B8A6' },
  { label: 'Orange', hex: '#F97316' },
  { label: 'Violet', hex: '#7C3AED' },
  { label: 'Pink', hex: '#EC4899' },
];

export const SubjectModal: React.FC<SubjectModalProps> = ({
  isOpen,
  onClose,
  subjectToEdit,
  onSaved,
}) => {
  const { addSubject, updateSubject, deleteSubject, timetable, records } = useAttendance();

  const isEditing = Boolean(subjectToEdit);

  const [name, setName] = useState(subjectToEdit?.name || '');
  const [code, setCode] = useState(subjectToEdit?.code || '');
  const [color, setColor] = useState(subjectToEdit?.color || '#6366F1');
  const [targetPercent, setTargetPercent] = useState<number>(subjectToEdit?.targetPercent || 75);
  const [isLabSubject, setIsLabSubject] = useState<boolean>(Boolean(subjectToEdit?.isLabSubject));
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Sync initial state if subjectToEdit changes
  React.useEffect(() => {
    if (subjectToEdit) {
      setName(subjectToEdit.name || '');
      setCode(subjectToEdit.code || '');
      setColor(subjectToEdit.color || '#6366F1');
      setTargetPercent(subjectToEdit.targetPercent || 75);
      setIsLabSubject(Boolean(subjectToEdit.isLabSubject));
    } else {
      setName('');
      setCode('');
      setColor('#6366F1');
      setTargetPercent(75);
      setIsLabSubject(false);
    }
    setError(null);
    setShowDeleteConfirm(false);
  }, [subjectToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim();
    if (!cleanName) {
      setError('Please provide a subject name.');
      return;
    }

    if (isEditing && subjectToEdit) {
      updateSubject(subjectToEdit.id, {
        name: cleanName,
        code: code.trim().toUpperCase(),
        color,
        targetPercent: Number(targetPercent),
        isLabSubject,
      });
      const updated: Subject = {
        ...subjectToEdit,
        name: cleanName,
        code: code.trim().toUpperCase(),
        color,
        targetPercent: Number(targetPercent),
        isLabSubject,
      };
      if (onSaved) onSaved(updated);
    } else {
      const created = addSubject({
        name: cleanName,
        code: code.trim().toUpperCase(),
        color,
        targetPercent: Number(targetPercent),
        isLabSubject,
      });
      if (onSaved) onSaved(created);
    }

    onClose();
  };

  const handleDelete = () => {
    if (subjectToEdit) {
      deleteSubject(subjectToEdit.id);
      onClose();
    }
  };

  const linkedSlots = subjectToEdit
    ? timetable.filter((t) => t.subjectId === subjectToEdit.id).length
    : 0;
  const linkedRecords = subjectToEdit
    ? records.filter((r) => r.subjectId === subjectToEdit.id).length
    : 0;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl sm:rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden flex flex-col my-auto max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-zinc-100 dark:border-zinc-800 flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5 sm:gap-3 min-w-0 flex-1">
            <div
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl flex items-center justify-center text-white shadow-xs shrink-0 mt-0.5"
              style={{ backgroundColor: color }}
            >
              {isLabSubject ? (
                <FlaskConical className="w-4 h-4 sm:w-5 sm:h-5" />
              ) : (
                <BookOpen className="w-4 h-4 sm:w-5 sm:h-5" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-50 truncate">
                {isEditing ? 'Edit Subject Details' : 'Add New Subject'}
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 leading-relaxed">
                {isEditing
                  ? 'Update custom subject name, code, color, or target criteria'
                  : 'Define custom subject coursework, target attendance, and lab status'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer shrink-0 -mr-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-5 overflow-y-auto flex-1">
          {error && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs rounded-xl flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Subject Name Input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
              Custom Subject Name <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="e.g. Data Structures & Algorithms, Calculus III"
                autoFocus
                required
                className="w-full px-3.5 py-2.5 text-sm bg-zinc-50 dark:bg-zinc-800/70 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-50 placeholder-zinc-400 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Subject Code Input */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                Course / Subject Code
              </label>
              <span className="text-[11px] text-zinc-400">Optional</span>
            </div>
            <div className="relative flex items-center">
              <span className="absolute left-3.5 text-zinc-400">
                <Hash className="w-4 h-4" />
              </span>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="e.g. CS-301, MATH-102"
                className="w-full pl-9 pr-3.5 py-2.5 text-sm bg-zinc-50 dark:bg-zinc-800/70 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-50 placeholder-zinc-400 font-mono font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Color Palette */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-indigo-500" />
              Color Accent
            </label>
            <div className="flex flex-wrap items-center gap-2">
              {COLOR_PRESETS.map((preset) => {
                const isSelected = color.toLowerCase() === preset.hex.toLowerCase();
                return (
                  <button
                    key={preset.hex}
                    type="button"
                    onClick={() => setColor(preset.hex)}
                    title={preset.label}
                    className={`w-7 h-7 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                      isSelected
                        ? 'ring-2 ring-offset-2 ring-indigo-500 scale-110'
                        : 'hover:scale-105'
                    }`}
                    style={{ backgroundColor: preset.hex }}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                  </button>
                );
              })}
              <div className="flex items-center gap-1.5 ml-1">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-7 h-7 rounded-lg border-0 p-0 cursor-pointer bg-transparent"
                  title="Custom Color"
                />
                <span className="text-xs font-mono text-zinc-500 dark:text-zinc-400 uppercase">
                  {color}
                </span>
              </div>
            </div>
          </div>

          {/* Target Attendance Requirement */}
          <div className="space-y-3 pt-2 border-t border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-indigo-500" />
                Target Attendance Requirement
              </label>
              <span className="text-base font-extrabold font-mono text-indigo-600 dark:text-indigo-400">
                {targetPercent}%
              </span>
            </div>

            <input
              type="range"
              min="50"
              max="100"
              step="1"
              value={targetPercent}
              onChange={(e) => setTargetPercent(Number(e.target.value))}
              className="w-full accent-indigo-600 cursor-pointer"
            />

            <div className="flex flex-wrap gap-2">
              {[75, 80, 85, 90, 100].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setTargetPercent(val)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    targetPercent === val
                      ? 'bg-indigo-600 text-white shadow-2xs'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                  }`}
                >
                  {val}% {val === 75 ? '(Default)' : ''}
                </button>
              ))}
            </div>
          </div>

          {/* Compulsory Lab Switch */}
          <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/80 flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <FlaskConical className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                  Compulsory Practical / Lab Subject
                </span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Marks this course as a mandatory laboratory session. Lab sessions are guarded with 100% strict attendance requirements in the skip predictor.
              </p>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={isLabSubject}
              onClick={() => {
                const next = !isLabSubject;
                setIsLabSubject(next);
                if (next) {
                  setTargetPercent(100);
                }
              }}
              className={`w-11 h-6 rounded-full transition-colors relative shrink-0 cursor-pointer p-0.5 ${
                isLabSubject ? 'bg-purple-600' : 'bg-zinc-300 dark:bg-zinc-700'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  isLabSubject ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Delete confirmation if editing */}
          {isEditing && (
            <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800">
              {showDeleteConfirm ? (
                <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 space-y-3">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-rose-900 dark:text-rose-200">
                        Delete Subject "{name}"?
                      </h4>
                      <p className="text-xs text-rose-700/80 dark:text-rose-400 mt-0.5 leading-relaxed">
                        This will remove this subject, {linkedSlots} scheduled timetable slot(s), and {linkedRecords} recorded attendance entries. This action cannot be undone.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 justify-end">
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(false)}
                      className="px-3 py-1.5 rounded-xl text-xs font-medium bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-200 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleDelete}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white cursor-pointer"
                    >
                      Confirm Delete
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700 dark:text-rose-400 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete this subject
                </button>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-4 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors cursor-pointer"
            >
              {isEditing ? 'Save Subject Changes' : 'Create Subject'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
