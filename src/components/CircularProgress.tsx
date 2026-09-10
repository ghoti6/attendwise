import React from 'react';
import { AttendanceStatusLevel } from '../types';
import { ShieldCheck, AlertTriangle, AlertOctagon, CheckCircle2 } from 'lucide-react';

interface CircularProgressProps {
  percentage: number;
  target: number;
  status: AttendanceStatusLevel;
  attended: number;
  total: number;
  missed: number;
  safetyMargin: number;
  classesCanMiss: number;
  classesNeededToTarget: number;
}

export const CircularProgress: React.FC<CircularProgressProps> = ({
  percentage: rawPercentage,
  target: rawTarget,
  status = 'safe',
  attended = 0,
  total = 0,
  missed = 0,
  safetyMargin: rawSafetyMargin,
  classesCanMiss = 0,
  classesNeededToTarget = 0,
}) => {
  const percentage = typeof rawPercentage === 'number' && !isNaN(rawPercentage) ? rawPercentage : 0;
  const target = typeof rawTarget === 'number' && !isNaN(rawTarget) ? rawTarget : 75;
  const safetyMargin = typeof rawSafetyMargin === 'number' && !isNaN(rawSafetyMargin) ? rawSafetyMargin : 0;

  // SVG circular gauge calculations
  const size = 220;
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  // Cap visual clamp at 100 for SVG stroke, but show real %
  const clampedPercent = Math.min(100, Math.max(0, percentage));
  const strokeDashoffset = circumference - (clampedPercent / 100) * circumference;

  // Status visual attributes
  const statusConfigMap = {
    safe: {
      color: 'stroke-emerald-600 dark:stroke-emerald-500',
      badgeBg: 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800',
      icon: ShieldCheck,
      text: 'SAFE',
      description: `Safe margin of +${safetyMargin.toFixed(1)}% above your requirement.`,
    },
    warning: {
      color: 'stroke-amber-500 dark:stroke-amber-400',
      badgeBg: 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800',
      icon: AlertTriangle,
      text: 'WARNING',
      description: `Approaching minimum! Only +${safetyMargin.toFixed(1)}% buffer left.`,
    },
    at_minimum: {
      color: 'stroke-amber-600 dark:stroke-amber-500',
      badgeBg: 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-900/50 dark:text-amber-200 dark:border-amber-700',
      icon: AlertTriangle,
      text: 'AT MINIMUM',
      description: 'Exactly at required target. Any missed class will push you into danger.',
    },
    danger: {
      color: 'stroke-rose-600 dark:stroke-rose-500',
      badgeBg: 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800',
      icon: AlertOctagon,
      text: 'DANGER',
      description: `${Math.abs(safetyMargin).toFixed(1)}% below required ${target}% target!`,
    },
  };

  const statusConfig = statusConfigMap[status] || statusConfigMap.safe;

  const StatusIcon = statusConfig.icon;

  return (
    <div id="attendance-gauge-card" className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 sm:p-8 shadow-xs">
      <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
        {/* SVG Circular Progress */}
        <div className="relative flex items-center justify-center shrink-0">
          <svg
            width={size}
            height={size}
            className="transform -rotate-90"
            role="img"
            aria-label={`Attendance progress: ${percentage.toFixed(1)}%`}
          >
            {/* Background Track */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              className="stroke-zinc-100 dark:stroke-zinc-800"
              strokeWidth={strokeWidth}
              fill="transparent"
            />
            {/* Target Marker Arc / Reference */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              className="stroke-zinc-300 dark:stroke-zinc-700 stroke-dash-2"
              strokeWidth={strokeWidth}
              strokeDasharray={`${circumference * (target / 100)} ${circumference}`}
              strokeDashoffset={0}
              fill="transparent"
              strokeLinecap="round"
              opacity="0.3"
            />
            {/* Active Progress Bar */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              className={`${statusConfig.color} transition-all duration-700 ease-out`}
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
            />
          </svg>

          {/* Center Text Stats */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
            <span className="text-4xl sm:text-5xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 font-mono">
              {percentage.toFixed(1)}%
            </span>
            <span className="text-xs uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-semibold mt-1">
              Overall Attendance
            </span>
            <div className="mt-2">
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${statusConfig.badgeBg}`}
              >
                <StatusIcon className="w-3.5 h-3.5" />
                {statusConfig.text}
              </span>
            </div>
          </div>
        </div>

        {/* Detailed Metrics Breakdown */}
        <div className="flex-1 w-full flex flex-col justify-center gap-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-100 dark:border-zinc-800 pb-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Attendance Requirement
              </p>
              <p className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                Minimum {target}%
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Safety Margin
              </p>
              <p
                className={`text-lg font-bold ${
                  safetyMargin >= 0
                    ? 'text-emerald-700 dark:text-emerald-400'
                    : 'text-rose-700 dark:text-rose-400'
                }`}
              >
                {safetyMargin >= 0 ? `+${safetyMargin.toFixed(1)}%` : `${safetyMargin.toFixed(1)}%`}
                <span className="text-xs font-normal text-zinc-500 dark:text-zinc-400 ml-1">
                  {safetyMargin >= 0 ? 'above minimum' : 'below minimum'}
                </span>
              </p>
            </div>
          </div>

          {/* Counts Grid */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-zinc-50 dark:bg-zinc-800/60 rounded-xl p-3 text-center border border-zinc-100 dark:border-zinc-800">
              <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">Attended</p>
              <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                {attended}
              </p>
            </div>
            <div className="bg-zinc-50 dark:bg-zinc-800/60 rounded-xl p-3 text-center border border-zinc-100 dark:border-zinc-800">
              <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">Total Classes</p>
              <p className="text-xl font-bold text-zinc-900 dark:text-zinc-100 font-mono">
                {total}
              </p>
            </div>
            <div className="bg-zinc-50 dark:bg-zinc-800/60 rounded-xl p-3 text-center border border-zinc-100 dark:border-zinc-800">
              <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">Missed</p>
              <p className="text-xl font-bold text-rose-600 dark:text-rose-400 font-mono">
                {missed}
              </p>
            </div>
          </div>

          {/* Mathematical Insight Note */}
          <div className="bg-zinc-50 dark:bg-zinc-800/40 rounded-xl p-3.5 border border-zinc-200/80 dark:border-zinc-700/60 flex items-start gap-3">
            <div className="mt-0.5 text-zinc-600 dark:text-zinc-300">
              {safetyMargin >= 0 ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              ) : (
                <AlertOctagon className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
              )}
            </div>
            <div className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed">
              {safetyMargin >= 0 ? (
                <span>
                  You can currently miss approximately{' '}
                  <strong className="font-bold text-zinc-900 dark:text-white underline decoration-emerald-500 decoration-2">
                    {classesCanMiss} more class{classesCanMiss === 1 ? '' : 'es'}
                  </strong>{' '}
                  while remaining safely at or above your {target}% target.
                </span>
              ) : (
                <span>
                  You must attend the next{' '}
                  <strong className="font-bold text-rose-700 dark:text-rose-300 underline decoration-rose-500 decoration-2">
                    {classesNeededToTarget} consecutive class{classesNeededToTarget === 1 ? '' : 'es'}
                  </strong>{' '}
                  without absence to recover your attendance back to {target}%.
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
