import React, { useState } from 'react';
import { useAttendance } from '../context/AttendanceContext';
import { TimetableSlot, ClassType } from '../types';
import {
  Calendar,
  Plus,
  Trash2,
  Edit2,
  Clock,
  MapPin,
  FlaskConical,
  BookOpen,
  X,
} from 'lucide-react';

const DAYS = [
  { id: 1, name: 'Monday' },
  { id: 2, name: 'Tuesday' },
  { id: 3, name: 'Wednesday' },
  { id: 4, name: 'Thursday' },
  { id: 5, name: 'Friday' },
  { id: 6, name: 'Saturday' },
  { id: 0, name: 'Sunday' },
];

export const TimetableEditorView: React.FC = () => {
  const {
    timetable,
    subjects,
    settings,
    addTimetableSlot,
    updateTimetableSlot,
    deleteTimetableSlot,
    addSubject,
  } = useAttendance();

  const [activeDay, setActiveDay] = useState<number>(1); // Default to Monday
  const [editingSlot, setEditingSlot] = useState<TimetableSlot | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Modal form states
  const [slotDay, setSlotDay] = useState<number>(1);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [subjectId, setSubjectId] = useState(subjects[0]?.id || '');
  const [classType, setClassType] = useState<ClassType>('lecture');
  const [isCompulsoryLab, setIsCompulsoryLab] = useState(false);
  const [room, setRoom] = useState('');
  const [notes, setNotes] = useState('');

  // Quick subject creation
  const [isCreatingNewSubject, setIsCreatingNewSubject] = useState(false);
  const [newSubName, setNewSubName] = useState('');

  const openAddModal = (day: number) => {
    setEditingSlot(null);
    setSlotDay(day);
    setStartTime('09:00');
    setEndTime('10:00');
    setSubjectId(subjects[0]?.id || '');
    setClassType('lecture');
    setIsCompulsoryLab(false);
    setRoom('');
    setNotes('');
    setIsModalOpen(true);
  };

  const openEditModal = (slot: TimetableSlot) => {
    setEditingSlot(slot);
    setSlotDay(slot.dayOfWeek);
    setStartTime(slot.startTime);
    setEndTime(slot.endTime);
    setSubjectId(slot.subjectId);
    setClassType(slot.classType);
    setIsCompulsoryLab(slot.isCompulsoryLab);
    setRoom(slot.room || '');
    setNotes(slot.notes || '');
    setIsModalOpen(true);
  };

  const handleSaveSlot = (e: React.FormEvent) => {
    e.preventDefault();
    let finalSubjectId = subjectId;

    if (isCreatingNewSubject && newSubName.trim()) {
      const newSub = {
        name: newSubName.trim(),
        color: '#6366F1',
        targetPercent: isCompulsoryLab ? 100 : 75,
        isLabSubject: classType === 'lab',
      };
      addSubject(newSub);
      // We will let subjectId default or pick
    }

    if (editingSlot) {
      updateTimetableSlot(editingSlot.id, {
        dayOfWeek: slotDay,
        startTime,
        endTime,
        subjectId: finalSubjectId,
        classType,
        isCompulsoryLab,
        room: room.trim() || undefined,
        notes: notes.trim() || undefined,
      });
    } else {
      addTimetableSlot({
        dayOfWeek: slotDay,
        startTime,
        endTime,
        subjectId: finalSubjectId,
        classType,
        isCompulsoryLab,
        room: room.trim() || undefined,
        notes: notes.trim() || undefined,
      });
    }
    setIsModalOpen(false);
  };

  // Filter slots for the active tab
  const daySlots = timetable
    .filter((s) => s.dayOfWeek === activeDay)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  return (
    <div id="timetable-editor-view" className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            Weekly Timetable
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Customize your academic timetable. Changes automatically update daily schedules and
            decision predictions.
          </p>
        </div>

        <button
          type="button"
          onClick={() => openAddModal(activeDay)}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Add Class Slot
        </button>
      </div>

      {/* Day Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {DAYS.map((day) => {
          const isSelected = activeDay === day.id;
          const count = timetable.filter((s) => s.dayOfWeek === day.id).length;
          const isWorking = settings.workingDays.includes(day.id);

          return (
            <button
              key={day.id}
              type="button"
              onClick={() => setActiveDay(day.id)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 ${
                isSelected
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800'
              }`}
            >
              <span>{day.name}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  isSelected
                    ? 'bg-white/20 text-white'
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'
                }`}
              >
                {count}
              </span>
              {!isWorking && (
                <span className="text-[9px] opacity-75 font-normal">Off</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Slots List for Selected Day */}
      <div className="space-y-3">
        {daySlots.length === 0 ? (
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-10 text-center space-y-3">
            <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
              No classes scheduled on {DAYS.find((d) => d.id === activeDay)?.name}
            </p>
            <p className="text-xs text-zinc-400">
              Add lectures, tutorials, or compulsory labs for this day.
            </p>
            <button
              type="button"
              onClick={() => openAddModal(activeDay)}
              className="inline-flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-200"
            >
              <Plus className="w-3.5 h-3.5" />
              Add First Class
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {daySlots.map((slot) => {
              const subject = subjects.find((s) => s.id === slot.subjectId);

              return (
                <div
                  key={slot.id}
                  className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between gap-3 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all"
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ backgroundColor: subject?.color || '#3B82F6' }}
                        />
                        <h4 className="text-base font-bold text-zinc-900 dark:text-zinc-50">
                          {subject?.name || 'Unknown Class'}
                        </h4>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => openEditModal(slot)}
                          className="p-1.5 text-zinc-400 hover:text-indigo-600 rounded-lg transition-colors"
                          title="Edit slot"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteTimetableSlot(slot.id)}
                          className="p-1.5 text-zinc-400 hover:text-rose-600 rounded-lg transition-colors"
                          title="Delete slot"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Badges */}
                    <div className="flex items-center gap-1.5 flex-wrap mt-2">
                      <span className="text-xs px-2 py-0.5 rounded-md font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 uppercase">
                        {slot.classType}
                      </span>
                      {slot.isCompulsoryLab && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-200 border border-rose-300 dark:border-rose-700 px-2 py-0.5 rounded-full">
                          <FlaskConical className="w-3 h-3" />
                          100% REQUIRED
                        </span>
                      )}
                      {subject?.code && (
                        <span className="text-xs font-mono text-zinc-400">
                          {subject.code}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Footer details */}
                  <div className="border-t border-zinc-100 dark:border-zinc-800 pt-3 text-xs text-zinc-500 dark:text-zinc-400 flex items-center justify-between gap-2 flex-wrap">
                    <span className="flex items-center gap-1 font-mono font-medium">
                      <Clock className="w-3.5 h-3.5 text-zinc-400" />
                      {slot.startTime} – {slot.endTime}
                    </span>
                    {slot.room && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-zinc-400" />
                        {slot.room}
                      </span>
                    )}
                  </div>
                  {slot.notes && (
                    <p className="text-[11px] text-zinc-400 italic">
                      {slot.notes}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add / Edit Slot Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto scrollbar-none">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-50">
                {editingSlot ? 'Edit Class Slot' : 'Add Class Slot'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-zinc-400 hover:text-zinc-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSlot} className="space-y-4">
              {/* Day Selection */}
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Day of the Week
                </label>
                <select
                  value={slotDay}
                  onChange={(e) => setSlotDay(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl font-medium"
                >
                  {DAYS.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Subject Selection */}
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Subject
                </label>
                <select
                  value={subjectId}
                  onChange={(e) => setSubjectId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl font-medium"
                  required
                >
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} {s.code ? `(${s.code})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Times */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    End Time
                  </label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl font-mono"
                    required
                  />
                </div>
              </div>

              {/* Class Type & Lab Compulsory */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Class Type
                  </label>
                  <select
                    value={classType}
                    onChange={(e) => {
                      const val = e.target.value as ClassType;
                      setClassType(val);
                      if (val === 'lab') {
                        setIsCompulsoryLab(true);
                      }
                    }}
                    className="w-full px-3 py-2 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl font-medium"
                  >
                    <option value="lecture">Lecture</option>
                    <option value="lab">Lab / Practical</option>
                  </select>
                </div>

                <div className="flex flex-col justify-end">
                  <label className="flex items-center gap-2 p-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isCompulsoryLab}
                      onChange={(e) => setIsCompulsoryLab(e.target.checked)}
                      className="rounded text-rose-600 focus:ring-rose-500"
                    />
                    <span className="text-xs font-bold text-rose-700 dark:text-rose-300">
                      100% Compulsory Lab
                    </span>
                  </label>
                </div>
              </div>

              {/* Room & Notes */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Room / Location
                  </label>
                  <input
                    type="text"
                    value={room}
                    onChange={(e) => setRoom(e.target.value)}
                    placeholder="e.g. Hall 201"
                    className="w-full px-3 py-2 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Notes
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. Bring record book"
                    className="w-full px-3 py-2 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl"
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs"
                >
                  Save Slot
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
