import React from 'react';
import { SubjectStats } from '../types';
import { ShieldCheck, AlertTriangle, AlertOctagon, FlaskConical, ChevronRight, Edit3 } from 'lucide-react';

interface SubjectCardProps {
  stats: SubjectStats;
  onClick: () => void;
  onEdit?: () => void;
}

export const SubjectCard: React.FC<SubjectCardProps> = ({ stats, onClick, onEdit }) => {
  const subject = stats?.subject ?? { id: '', name: 'Subject', color: '#6366F1' };
  const percentage = typeof stats?.percentage === 'number' ? stats.percentage : 0;
  const attended = stats?.attended ?? 0;
  const total = stats?.total ?? 0;
  const status = stats?.status ?? 'safe';
  const classesCanMiss = stats?.classesCanMiss ?? 0;
  const classesNeededToTarget = stats?.classesNeededToTarget ?? 0;
  const target = subject.targetPercent || 75;

  const statusConfigMap = {
    safe: {
      border: 'border-zinc-200 dark:border-zinc-800 hover:border-emerald-300 dark:hover:border-emerald-700',
      badge: 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800',
      bar: 'bg-emerald-600 dark:bg-emerald-500',
      icon: ShieldCheck,
      label: 'Safe',
    },
    warning: {
      border: 'border-amber-200 dark:border-amber-900/60 hover:border-amber-400',
      badge: 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800',
      bar: 'bg-amber-500 dark:bg-amber-400',
      icon: AlertTriangle,
      label: 'Warning',
    },
    at_minimum: {
      border: 'border-amber-300 dark:border-amber-800 hover:border-amber-500',
      badge: 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-900/50 dark:text-amber-200 dark:border-amber-700',
      bar: 'bg-amber-600 dark:bg-amber-500',
      icon: AlertTriangle,
      label: 'At Minimum',
    },
    danger: {
      border: 'border-rose-200 dark:border-rose-900/60 hover:border-rose-400',
      badge: 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800',
      bar: 'bg-rose-600 dark:bg-rose-500',
      icon: AlertOctagon,
      label: 'Danger',
    },
  };

  const statusConfig = statusConfigMap[status] || statusConfigMap.safe;
  const StatusIcon = statusConfig.icon;

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onClick()}
      className={`bg-white dark:bg-zinc-900 border ${statusConfig.border} rounded-2xl p-5 shadow-xs transition-all duration-200 cursor-pointer flex flex-col justify-between group hover:shadow-md relative`}
    >
      <div>
        {/* Subject Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 pr-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: subject.color || '#3B82F6' }}
              />
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-50 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                {subject.name}
              </h3>
            </div>
            {subject.code && (
              <p className="text-xs text-zinc-400 dark:text-zinc-500 font-mono mt-0.5">
                {subject.code}
              </p>
            )}
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {onEdit && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit();
                }}
                title="Edit subject details"
                className="p-1 rounded-lg text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
            )}
            {subject.isLabSubject && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-purple-50 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800 px-2 py-0.5 rounded-full">
                <FlaskConical className="w-3 h-3" />
                Lab
              </span>
            )}
            <span
              className={`inline-flex items-center gap-1 text-xs font-bold border px-2 py-0.5 rounded-full ${statusConfig.badge}`}
            >
              <StatusIcon className="w-3 h-3" />
              {statusConfig.label}
            </span>
          </div>
        </div>

        {/* Big Percentage & Counts */}
        <div className="mt-4 flex items-baseline justify-between">
          <div>
            <span className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-50 font-mono tracking-tight">
              {percentage.toFixed(0)}%
            </span>
            <span className="text-xs text-zinc-500 dark:text-zinc-400 ml-2">
              (Req: {target}%)
            </span>
          </div>
          <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-300 font-mono">
            {attended} / {total} attended
          </span>
        </div>

        {/* Progress Bar */}
        <div className="mt-2.5 w-full h-2 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden relative">
          {/* Target marker line */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-zinc-400 dark:bg-zinc-500 z-10"
            style={{ left: `${Math.min(100, Math.max(0, target))}%` }}
            title={`Required: ${target}%`}
          />
          <div
            className={`h-full rounded-full ${statusConfig.bar} transition-all duration-500`}
            style={{ width: `${Math.min(100, Math.max(0, percentage))}%` }}
          />
        </div>
      </div>

      {/* Footer Info / Safety Buffer */}
      <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
        {percentage >= target ? (
          <span>
            Can miss:{' '}
            <strong className="text-zinc-800 dark:text-zinc-200 font-bold">
              {classesCanMiss}
            </strong>{' '}
            more
          </span>
        ) : (
          <span className="text-rose-600 dark:text-rose-400 font-semibold">
            Need <strong>{classesNeededToTarget}</strong> to recover
          </span>
        )}
        <span className="text-zinc-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 flex items-center font-medium gap-0.5 text-[11px] transition-colors">
          History <ChevronRight className="w-3.5 h-3.5" />
        </span>
      </div>
    </div>
  );
};
