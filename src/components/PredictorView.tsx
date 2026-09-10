import React, { useState, useMemo } from 'react';
import { useAttendance } from '../context/AttendanceContext';
import {
  getOverallStats,
  calculateFutureProjections,
} from '../utils/attendanceCalculations';
import {
  Calculator,
  AlertTriangle,
  CheckCircle2,
  TrendingDown,
  Sparkles,
  Calendar,
  Layers,
} from 'lucide-react';

export const PredictorView: React.FC = () => {
  const { records, timetable, importantDates, settings, currentDate } = useAttendance();

  const overall = getOverallStats(records, settings.overallTarget);
  const { attended, total, percentage, classesCanMiss } = overall;

  // Custom hypothetical missed slider / input state
  const [hypotheticalMissed, setHypotheticalMissed] = useState<number>(3);

  // Dynamic range table from 1 to max(15, classesCanMiss + 5)
  const progressionList = useMemo(() => {
    const list: {
      missCount: number;
      projectedAttended: number;
      projectedTotal: number;
      projectedPct: number;
      isAboveTarget: boolean;
      margin: number;
    }[] = [];

    const upperLimit = Math.max(15, classesCanMiss + 4);
    for (let x = 1; x <= upperLimit; x++) {
      const projTotal = total + x;
      const projPct = (attended / projTotal) * 100;
      list.push({
        missCount: x,
        projectedAttended: attended,
        projectedTotal: projTotal,
        projectedPct: projPct,
        isAboveTarget: projPct >= settings.overallTarget,
        margin: projPct - settings.overallTarget,
      });
    }
    return list;
  }, [attended, total, classesCanMiss, settings.overallTarget]);

  // Specific simulation for slider value
  const sliderProjTotal = total + hypotheticalMissed;
  const sliderProjPct = sliderProjTotal > 0 ? (attended / sliderProjTotal) * 100 : 100;
  const sliderMargin = sliderProjPct - settings.overallTarget;

  // Future semester projections
  const futureProjections = useMemo(() => {
    return calculateFutureProjections(
      records,
      timetable,
      importantDates,
      settings,
      currentDate
    );
  }, [records, timetable, importantDates, settings, currentDate]);

  return (
    <div id="attendance-predictor-view" className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-xs">
        <div className="flex items-center gap-3 border-b border-zinc-100 dark:border-zinc-800 pb-4">
          <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900">
            <Calculator className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
              Attendance Simulator & Cutoff Predictor
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Exact mathematical simulation: calculates the exact impact of missed classes on your
              attendance.
            </p>
          </div>
        </div>

        {/* Highlight Safety Maximum */}
        <div className="mt-5 p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Maximum Safe Skips Available
            </span>
            <p className="text-2xl font-black text-zinc-900 dark:text-zinc-50 font-mono mt-0.5">
              {classesCanMiss} Classes
            </p>
            <p className="text-xs text-zinc-600 dark:text-zinc-300 mt-0.5">
              You can miss up to <strong>{classesCanMiss}</strong> more classes while keeping your
              attendance at or above {settings.overallTarget}%.
            </p>
          </div>

          <div className="text-right self-start sm:self-auto bg-white dark:bg-zinc-900 p-3 rounded-xl border border-zinc-200/80 dark:border-zinc-800">
            <span className="text-[10px] uppercase font-bold text-zinc-400">Current Attendance</span>
            <p className="text-xl font-extrabold text-indigo-600 dark:text-indigo-400 font-mono">
              {percentage.toFixed(1)}%
            </p>
            <span className="text-[10px] text-zinc-500 font-mono">
              {attended} / {total} classes
            </span>
          </div>
        </div>
      </div>

      {/* Interactive "What if I miss X classes?" Tool */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-xs space-y-5">
        <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
          <TrendingDown className="w-5 h-5 text-rose-500" />
          Interactive Miss Simulator: &quot;What if I miss {hypotheticalMissed} classes?&quot;
        </h3>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              Hypothetical missed classes:
            </label>
            <span className="text-lg font-bold font-mono px-3 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100">
              +{hypotheticalMissed} classes
            </span>
          </div>
          <input
            type="range"
            min="1"
            max={Math.max(20, classesCanMiss + 8)}
            value={hypotheticalMissed}
            onChange={(e) => setHypotheticalMissed(Number(e.target.value))}
            className="w-full accent-indigo-600 cursor-pointer"
          />
        </div>

        {/* Live Simulation Card */}
        <div
          className={`p-5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${
            sliderProjPct >= settings.overallTarget
              ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900'
              : 'bg-rose-50/70 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900'
          }`}
        >
          <div>
            <span className="text-xs uppercase font-bold tracking-wider text-zinc-500 dark:text-zinc-400">
              Projected Attendance Result
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-4xl font-black font-mono tracking-tight text-zinc-900 dark:text-zinc-50">
                {sliderProjPct.toFixed(1)}%
              </span>
              <span
                className={`text-xs font-bold ${
                  sliderMargin >= 0
                    ? 'text-emerald-700 dark:text-emerald-400'
                    : 'text-rose-700 dark:text-rose-400'
                }`}
              >
                ({sliderMargin >= 0 ? `+${sliderMargin.toFixed(1)}%` : `${sliderMargin.toFixed(1)}%`}{' '}
                from {settings.overallTarget}%)
              </span>
            </div>
            <p className="text-xs text-zinc-700 dark:text-zinc-300 mt-1">
              Formula: {attended} attended / ({total} + {hypotheticalMissed}) total ={' '}
              {sliderProjPct.toFixed(1)}%
            </p>
          </div>

          <div className="shrink-0">
            {sliderProjPct >= settings.overallTarget ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold bg-emerald-600 text-white shadow-xs">
                <CheckCircle2 className="w-4 h-4" />
                STILL SAFE
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold bg-rose-600 text-white shadow-xs">
                <AlertTriangle className="w-4 h-4" />
                BELOW TARGET
              </span>
            )}
          </div>
        </div>

        {/* Exact Threshold Table */}
        <div className="pt-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-3">
            Mathematical Cutoff Breakdown (Table progression)
          </h4>

          <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden divide-y divide-zinc-100 dark:divide-zinc-800 text-xs">
            {progressionList.map((row) => {
              const isCutoff = row.missCount === classesCanMiss;
              const isFirstDanger = row.missCount === classesCanMiss + 1;

              return (
                <div
                  key={row.missCount}
                  className={`p-3 flex items-center justify-between gap-3 ${
                    isCutoff
                      ? 'bg-amber-50/80 dark:bg-amber-950/40 font-bold'
                      : isFirstDanger
                      ? 'bg-rose-50/80 dark:bg-rose-950/40 font-bold'
                      : 'bg-white dark:bg-zinc-900'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-zinc-700 dark:text-zinc-300 font-semibold w-28">
                      If I miss {row.missCount} class{row.missCount === 1 ? '' : 'es'}:
                    </span>
                    {isCutoff && (
                      <span className="text-[10px] bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-100 px-2 py-0.2 rounded-full font-bold">
                        MAXIMUM SAFE LIMIT
                      </span>
                    )}
                    {isFirstDanger && (
                      <span className="text-[10px] bg-rose-200 dark:bg-rose-900 text-rose-900 dark:text-rose-100 px-2 py-0.2 rounded-full font-bold">
                        FIRST BREACH BELOW 75%
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="text-zinc-400 font-mono hidden sm:inline text-[11px]">
                      {row.projectedAttended} / {row.projectedTotal}
                    </span>
                    <span
                      className={`font-mono text-sm font-bold w-16 text-right ${
                        row.isAboveTarget
                          ? 'text-emerald-700 dark:text-emerald-400'
                          : 'text-rose-700 dark:text-rose-400'
                      }`}
                    >
                      {row.projectedPct.toFixed(1)}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Future Attendance Projections until Semester End (Requirement #11) */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2.5">
          <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-50">
            Future Attendance Projections (Remaining Term)
          </h3>
        </div>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Simulates dynamic trajectories based on your active weekly timetable until semester end (
          {settings.semesterEnd || '2026-11-20'}).
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          {/* Scenario 1: Attend every remaining class */}
          <div className="bg-zinc-50 dark:bg-zinc-800/60 p-4 rounded-xl border border-zinc-200/80 dark:border-zinc-700/60 space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Attend Every Class
            </span>
            <p className="text-3xl font-black font-mono text-zinc-900 dark:text-zinc-50">
              {(futureProjections?.ifAttendAllPct ?? 0).toFixed(1)}%
            </p>
            <p className="text-xs text-zinc-600 dark:text-zinc-300">
              If you attend 100% of the remaining {futureProjections?.remainingTotalClasses ?? 0} classes.
            </p>
          </div>

          {/* Scenario 2: Attend only compulsory labs */}
          <div className="bg-zinc-50 dark:bg-zinc-800/60 p-4 rounded-xl border border-zinc-200/80 dark:border-zinc-700/60 space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400 flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" />
              Only Compulsory Labs
            </span>
            <p className="text-3xl font-black font-mono text-rose-600 dark:text-rose-400">
              {(futureProjections?.ifAttendLabsOnlyPct ?? 0).toFixed(1)}%
            </p>
            <p className="text-xs text-zinc-600 dark:text-zinc-300">
              Skip all lectures and only travel for mandatory 100% lab sessions.
            </p>
          </div>

          {/* Scenario 3: Attend Tuesday to Friday only */}
          <div className="bg-zinc-50 dark:bg-zinc-800/60 p-4 rounded-xl border border-zinc-200/80 dark:border-zinc-700/60 space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5" />
              Attend Tuesday – Friday
            </span>
            <p className="text-3xl font-black font-mono text-indigo-600 dark:text-indigo-400">
              {(futureProjections?.ifAttendTueFriPct ?? 0).toFixed(1)}%
            </p>
            <p className="text-xs text-zinc-600 dark:text-zinc-300">
              Skip Mondays permanently to save travel and attend Tue through Fri.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
