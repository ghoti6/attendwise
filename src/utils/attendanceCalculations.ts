import {
  AttendanceRecord,
  AttendanceStats,
  ImportantDate,
  Subject,
  SubjectStats,
  TimetableSlot,
  AppSettings,
  DayDecision,
  AttendanceStatusLevel,
} from '../types';

/**
 * Format a Date to YYYY-MM-DD in local time
 */
export function formatDate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Parse a YYYY-MM-DD string into a local Date object (at midnight)
 */
export function parseDate(str: string): Date {
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d, 0, 0, 0, 0);
}

/**
 * Format date for display, e.g. "Tuesday, Sep 15"
 */
export function formatDisplayDate(dateStr: string, includeYear = false): string {
  try {
    const d = parseDate(dateStr);
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      ...(includeYear ? { year: 'numeric' } : {}),
    };
    return d.toLocaleDateString(undefined, options);
  } catch {
    return dateStr;
  }
}

/**
 * Calculate basic attendance statistics given attended and total (attended + missed)
 */
export function calculateAttendanceStats(
  attended: number,
  missed: number,
  cancelled: number,
  target: number
): AttendanceStats {
  const total = attended + missed;
  const percentage = total === 0 ? 100 : (attended / total) * 100;
  const safetyMargin = percentage - target;

  let status: AttendanceStatusLevel = 'safe';
  // Precise check for equal to target
  if (Math.abs(percentage - target) < 0.05 && total > 0) {
    status = 'at_minimum';
  } else if (percentage < target) {
    status = 'danger';
  } else if (percentage <= target + 2.5) {
    status = 'warning';
  } else {
    status = 'safe';
  }

  // Classes that can safely be missed:
  // Find largest integer X such that: attended / (total + X) >= target / 100
  let classesCanMiss = 0;
  if (target <= 0) {
    classesCanMiss = 999;
  } else if (total === 0) {
    classesCanMiss = 0;
  } else if (percentage < target) {
    classesCanMiss = 0;
  } else {
    const r = target / 100;
    // attended / (total + X) >= r => total + X <= attended / r => X <= (attended / r) - total
    const maxX = Math.floor(attended / r - total);
    // Verify precision constraint:
    classesCanMiss = Math.max(0, maxX);
    while (classesCanMiss > 0 && attended / (total + classesCanMiss) < r - 1e-9) {
      classesCanMiss--;
    }
  }

  // Classes needed to reach target if currently below:
  // (attended + Y) / (total + Y) >= target / 100
  let classesNeededToTarget = 0;
  if (percentage < target) {
    if (target >= 100) {
      classesNeededToTarget = missed > 0 ? Infinity : 0;
    } else {
      const r = target / 100;
      // (1 - r) * Y >= r * total - attended
      const needed = Math.ceil((r * total - attended) / (1 - r));
      classesNeededToTarget = Math.max(0, needed);
      // Double check precision
      while (
        classesNeededToTarget > 0 &&
        (attended + classesNeededToTarget - 1) / (total + classesNeededToTarget - 1) >= r - 1e-9
      ) {
        classesNeededToTarget--;
      }
    }
  }

  return {
    attended,
    missed,
    cancelled,
    total,
    percentage,
    status,
    safetyMargin,
    classesCanMiss,
    classesNeededToTarget,
  };
}

/**
 * Check if a specific date falls within a holiday, vacation, or no-class period
 */
export function checkDateHolidayOrVacation(
  dateStr: string,
  importantDates: ImportantDate[]
): { isHolidayOrVacation: boolean; reason?: string; type?: string } {
  for (const item of importantDates) {
    const start = item.startDate;
    const end = item.endDate || item.startDate;

    if (dateStr >= start && dateStr <= end) {
      if (
        item.type === 'vacation_start' ||
        item.type === 'vacation_end' ||
        item.type === 'vacation_range' ||
        item.type === 'holiday' ||
        item.type === 'no_classes'
      ) {
        return {
          isHolidayOrVacation: true,
          reason: item.title,
          type: item.type,
        };
      }
      if (item.type === 'exam' && !item.countsAsAttendance) {
        return {
          isHolidayOrVacation: true,
          reason: `${item.title} (No regular classes)`,
          type: item.type,
        };
      }
    }
  }

  return { isHolidayOrVacation: false };
}

/**
 * Get overall attendance stats from attendance records and target
 */
export function getOverallStats(
  records: AttendanceRecord[],
  target: number
): AttendanceStats {
  let attended = 0;
  let missed = 0;
  let cancelled = 0;

  for (const r of records) {
    if (r.status === 'present') attended++;
    else if (r.status === 'absent') missed++;
    else if (r.status === 'cancelled') cancelled++;
  }

  return calculateAttendanceStats(attended, missed, cancelled, target);
}

/**
 * Get subject-wise stats for all subjects
 */
export function getSubjectStatsList(
  subjects: Subject[],
  records: AttendanceRecord[],
  timetable: TimetableSlot[],
  defaultTarget: number
): SubjectStats[] {
  return subjects.map((subj) => {
    const subjRecords = records.filter((r) => r.subjectId === subj.id);
    let attended = 0;
    let missed = 0;
    let cancelled = 0;

    for (const r of subjRecords) {
      if (r.status === 'present') attended++;
      else if (r.status === 'absent') missed++;
      else if (r.status === 'cancelled') cancelled++;
    }

    const target = subj.targetPercent || defaultTarget;
    const baseStats = calculateAttendanceStats(attended, missed, cancelled, target);

    const hasCompulsoryLab = timetable.some(
      (slot) => slot.subjectId === subj.id && slot.isCompulsoryLab
    );

    return {
      ...baseStats,
      subject: subj,
      hasCompulsoryLab,
    };
  });
}

/**
 * Get lab statistics (compulsory and standard labs)
 */
export function getLabStats(records: AttendanceRecord[], timetable: TimetableSlot[]) {
  const labRecords = records.filter(
    (r) => r.classType === 'lab' || r.isCompulsoryLab
  );
  let attended = 0;
  let missed = 0;
  let cancelled = 0;

  for (const r of labRecords) {
    if (r.status === 'present') attended++;
    else if (r.status === 'absent') missed++;
    else if (r.status === 'cancelled') cancelled++;
  }

  const compulsoryRecords = labRecords.filter((r) => r.isCompulsoryLab);
  let compulsoryAttended = 0;
  let compulsoryMissed = 0;
  for (const r of compulsoryRecords) {
    if (r.status === 'present') compulsoryAttended++;
    else if (r.status === 'absent') compulsoryMissed++;
  }

  const overall = calculateAttendanceStats(attended, missed, cancelled, 75);
  const compulsoryTotal = compulsoryAttended + compulsoryMissed;
  const compulsoryPct = compulsoryTotal === 0 ? 100 : (compulsoryAttended / compulsoryTotal) * 100;
  const hasMissedCompulsoryLab = compulsoryMissed > 0;

  return {
    attended,
    missed,
    cancelled,
    total: attended + missed,
    percentage: overall.percentage,
    compulsoryAttended,
    compulsoryMissed,
    compulsoryTotal,
    compulsoryPercentage: compulsoryPct,
    hasMissedCompulsoryLab,
  };
}

/**
 * Calculate whole-day attendance decision for a specific date
 * e.g., "Should I Go To College Today / Tomorrow?"
 */
export function calculateWholeDayDecision(
  dateStr: string,
  records: AttendanceRecord[],
  timetable: TimetableSlot[],
  subjects: Subject[],
  importantDates: ImportantDate[],
  settings: AppSettings
): DayDecision {
  const dateObj = parseDate(dateStr);
  const dayOfWeek = dateObj.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat

  // Check if working day
  const isWorkingDay = settings.workingDays.includes(dayOfWeek);

  // Check holiday or vacation
  const holidayCheck = checkDateHolidayOrVacation(dateStr, importantDates);

  // Get current stats
  const overall = getOverallStats(records, settings.overallTarget);
  const currentAttended = overall.attended;
  const currentTotal = overall.total;

  if (holidayCheck.isHolidayOrVacation) {
    return {
      date: dateStr,
      dayOfWeek,
      isCollegeDay: false,
      isHolidayOrVacation: true,
      holidayReason: holidayCheck.reason,
      slots: [],
      totalClasses: 0,
      currentAttendancePct: overall.percentage,
      projectedIfAttend: overall.percentage,
      projectedIfSkip: overall.percentage,
      decision: 'HOLIDAY',
      reason: `No college today — ${holidayCheck.reason}. Dates marked as holidays/vacations do not count toward attendance.`,
      containsCompulsoryLab: false,
      compulsoryLabNames: [],
    };
  }

  if (!isWorkingDay) {
    return {
      date: dateStr,
      dayOfWeek,
      isCollegeDay: false,
      isHolidayOrVacation: false,
      slots: [],
      totalClasses: 0,
      currentAttendancePct: overall.percentage,
      projectedIfAttend: overall.percentage,
      projectedIfSkip: overall.percentage,
      decision: 'NO_CLASSES',
      reason: 'No regular classes scheduled on this day.',
      containsCompulsoryLab: false,
      compulsoryLabNames: [],
    };
  }

  // Find slots for this day of week
  const daySlots = timetable
    .filter((slot) => slot.dayOfWeek === dayOfWeek)
    .sort((a, b) => a.startTime.localeCompare(b.startTime))
    .map((slot) => {
      const subject = subjects.find((s) => s.id === slot.subjectId);
      const record = records.find((r) => r.date === dateStr && r.slotId === slot.id);
      return {
        ...slot,
        subject,
        attendanceRecord: record,
      };
    });

  const totalClasses = daySlots.length;

  if (totalClasses === 0) {
    return {
      date: dateStr,
      dayOfWeek,
      isCollegeDay: false,
      isHolidayOrVacation: false,
      slots: [],
      totalClasses: 0,
      currentAttendancePct: overall.percentage,
      projectedIfAttend: overall.percentage,
      projectedIfSkip: overall.percentage,
      decision: 'NO_CLASSES',
      reason: 'No classes are scheduled on your timetable for this day.',
      containsCompulsoryLab: false,
      compulsoryLabNames: [],
    };
  }

  // Check if all classes on this date are marked cancelled
  const cancelledSlotsCount = daySlots.filter(
    (s) => s.attendanceRecord?.status === 'cancelled'
  ).length;
  const isEntireDayCancelled = totalClasses > 0 && cancelledSlotsCount === totalClasses;

  if (isEntireDayCancelled) {
    return {
      date: dateStr,
      dayOfWeek,
      isCollegeDay: true,
      isHolidayOrVacation: false,
      slots: daySlots,
      totalClasses,
      currentAttendancePct: overall.percentage,
      projectedIfAttend: overall.percentage,
      projectedIfSkip: overall.percentage,
      decision: 'CANCELLED',
      reason: `All ${totalClasses} scheduled class${
        totalClasses === 1 ? '' : 'es'
      } for this day are marked as cancelled. Cancelled classes do not penalize your attendance.`,
      containsCompulsoryLab: false,
      compulsoryLabNames: [],
    };
  }

  // Active (non-cancelled) slots for projection
  const activeSlots = daySlots.filter(
    (s) => s.attendanceRecord?.status !== 'cancelled'
  );
  const activeClassesCount = activeSlots.length;

  // Check active compulsory labs
  const compulsorySlots = activeSlots.filter((s) => s.isCompulsoryLab);
  const containsCompulsoryLab = compulsorySlots.length > 0;
  const compulsoryLabNames = compulsorySlots.map((s) => s.subject?.name || 'Lab');

  // Calculate scenarios
  // If user attends this day:
  const attendTotal = currentTotal + activeClassesCount;
  const attendAttended = currentAttended + activeClassesCount;
  const projectedIfAttend = attendTotal === 0 ? 100 : (attendAttended / attendTotal) * 100;

  // If user skips this day:
  const skipTotal = currentTotal + activeClassesCount;
  const skipAttended = currentAttended;
  const projectedIfSkip = skipTotal === 0 ? 100 : (skipAttended / skipTotal) * 100;

  let decision: 'ATTEND' | 'CAN_SKIP' | 'OPTIONAL' = 'ATTEND';
  let reason = '';

  if (containsCompulsoryLab) {
    decision = 'ATTEND';
    reason = `You have a compulsory lab today (${compulsoryLabNames.join(
      ', '
    )} requires 100% attendance). Skipping is strictly discouraged.`;
  } else if (projectedIfSkip < settings.overallTarget) {
    decision = 'ATTEND';
    reason = `Skipping this day (${totalClasses} classes) would drop your attendance to ${projectedIfSkip.toFixed(
      1
    )}%, which is below your ${settings.overallTarget}% target.`;
  } else if (projectedIfSkip === settings.overallTarget) {
    decision = 'OPTIONAL';
    reason = `Skipping puts your attendance at exactly ${settings.overallTarget}%. You will have zero safety margin left.`;
  } else {
    decision = 'CAN_SKIP';
    const marginAfterSkip = projectedIfSkip - settings.overallTarget;
    reason = `You can safely skip this entire day. Your projected attendance will remain at ${projectedIfSkip.toFixed(
      1
    )}% (+${marginAfterSkip.toFixed(1)}% above your ${settings.overallTarget}% target).`;
  }

  return {
    date: dateStr,
    dayOfWeek,
    isCollegeDay: true,
    isHolidayOrVacation: false,
    slots: daySlots,
    totalClasses,
    currentAttendancePct: overall.percentage,
    projectedIfAttend,
    projectedIfSkip,
    decision,
    reason,
    containsCompulsoryLab,
    compulsoryLabNames,
  };
}

/**
 * Attendance Strategy Planner:
 * Calculates day-by-day optimal schedule across a date range (e.g. Sep 10 -> Nov 9)
 * Prioritizes compulsory labs and maintains cumulative overall attendance >= target
 */
export interface PlannedDay {
  date: string;
  displayDate: string;
  dayName: string;
  totalClasses: number;
  containsCompulsoryLab: boolean;
  compulsoryLabNames: string[];
  recommendation: 'ATTEND' | 'SKIP' | 'HOLIDAY' | 'WEEKEND';
  reason: string;
  projectedCumulativeAttendance: number;
  classesList: string[];
}

export function calculateAttendancePlan(
  startDateStr: string,
  endDateStr: string,
  records: AttendanceRecord[],
  timetable: TimetableSlot[],
  subjects: Subject[],
  importantDates: ImportantDate[],
  settings: AppSettings,
  userOverrides: Record<string, 'ATTEND' | 'SKIP'> = {}
): {
  days: PlannedDay[];
  totalCollegeDays: number;
  recommendedAttendDays: number;
  recommendedSkipDays: number;
  compulsoryLabDays: number;
  finalProjectedAttendance: number;
  totalClassesInRange: number;
} {
  const start = parseDate(startDateStr);
  const end = parseDate(endDateStr);

  const days: PlannedDay[] = [];
  const currentStats = getOverallStats(records, settings.overallTarget);
  let cumulativeAttended = currentStats.attended;
  let cumulativeTotal = currentStats.total;

  let totalCollegeDays = 0;
  let recommendedAttendDays = 0;
  let recommendedSkipDays = 0;
  let compulsoryLabDays = 0;
  let totalClassesInRange = 0;

  const cur = new Date(start.getTime());

  while (cur <= end) {
    const dateStr = formatDate(cur);
    const dayOfWeek = cur.getDay();
    const isWorkingDay = settings.workingDays.includes(dayOfWeek);
    const holidayCheck = checkDateHolidayOrVacation(dateStr, importantDates);

    const dayName = cur.toLocaleDateString(undefined, { weekday: 'long' });
    const displayDate = cur.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

    if (holidayCheck.isHolidayOrVacation) {
      days.push({
        date: dateStr,
        displayDate,
        dayName,
        totalClasses: 0,
        containsCompulsoryLab: false,
        compulsoryLabNames: [],
        recommendation: 'HOLIDAY',
        reason: `${holidayCheck.reason} — No classes`,
        projectedCumulativeAttendance:
          cumulativeTotal === 0 ? 100 : (cumulativeAttended / cumulativeTotal) * 100,
        classesList: [],
      });
    } else if (!isWorkingDay) {
      days.push({
        date: dateStr,
        displayDate,
        dayName,
        totalClasses: 0,
        containsCompulsoryLab: false,
        compulsoryLabNames: [],
        recommendation: 'WEEKEND',
        reason: 'Weekend / Off day',
        projectedCumulativeAttendance:
          cumulativeTotal === 0 ? 100 : (cumulativeAttended / cumulativeTotal) * 100,
        classesList: [],
      });
    } else {
      // Working day
      const daySlots = timetable
        .filter((slot) => slot.dayOfWeek === dayOfWeek)
        .sort((a, b) => a.startTime.localeCompare(b.startTime));

      const numClasses = daySlots.length;
      if (numClasses === 0) {
        days.push({
          date: dateStr,
          displayDate,
          dayName,
          totalClasses: 0,
          containsCompulsoryLab: false,
          compulsoryLabNames: [],
          recommendation: 'WEEKEND',
          reason: 'No classes on schedule',
          projectedCumulativeAttendance:
            cumulativeTotal === 0 ? 100 : (cumulativeAttended / cumulativeTotal) * 100,
          classesList: [],
        });
      } else {
        totalCollegeDays++;
        totalClassesInRange += numClasses;

        const compulsorySlots = daySlots.filter((s) => s.isCompulsoryLab);
        const hasCompulsory = compulsorySlots.length > 0;
        const compNames = compulsorySlots.map((s) => {
          const sub = subjects.find((sb) => sb.id === s.subjectId);
          return sub ? `${sub.name} Lab` : 'Lab';
        });
        if (hasCompulsory) compulsoryLabDays++;

        const classNames = daySlots.map((s) => {
          const sub = subjects.find((sb) => sb.id === s.subjectId);
          return sub ? sub.name : 'Class';
        });

        // Determine recommendation
        let action: 'ATTEND' | 'SKIP' = 'ATTEND';
        let reason = '';

        // Check user override first if any
        if (userOverrides[dateStr]) {
          action = userOverrides[dateStr];
          reason = `Custom choice: ${action}`;
        } else if (hasCompulsory) {
          action = 'ATTEND';
          reason = `Recommended: Contains compulsory lab (${compNames.join(', ')}) with 100% requirement.`;
        } else {
          // Check what happens if we skip this day
          const testTotal = cumulativeTotal + numClasses;
          const testAttended = cumulativeAttended;
          const testPct = (testAttended / testTotal) * 100;

          // Safe to skip if projected remains above target with a small safety cushion (e.g. >= 75%)
          if (testPct >= settings.overallTarget) {
            action = 'SKIP';
            reason = `Optional: Skipping this whole day keeps projected attendance at ${testPct.toFixed(
              1
            )}% (above ${settings.overallTarget}%).`;
          } else {
            action = 'ATTEND';
            reason = `Must Attend: Skipping would take cumulative attendance down to ${testPct.toFixed(
              1
            )}% (below ${settings.overallTarget}% target).`;
          }
        }

        // Apply action to running cumulative numbers
        cumulativeTotal += numClasses;
        if (action === 'ATTEND') {
          cumulativeAttended += numClasses;
          recommendedAttendDays++;
        } else {
          recommendedSkipDays++;
        }

        const projectedCum = (cumulativeAttended / cumulativeTotal) * 100;

        days.push({
          date: dateStr,
          displayDate,
          dayName,
          totalClasses: numClasses,
          containsCompulsoryLab: hasCompulsory,
          compulsoryLabNames: compNames,
          recommendation: action,
          reason,
          projectedCumulativeAttendance: projectedCum,
          classesList: classNames,
        });
      }
    }

    cur.setDate(cur.getDate() + 1);
  }

  const finalProjectedAttendance =
    cumulativeTotal === 0 ? 100 : (cumulativeAttended / cumulativeTotal) * 100;

  return {
    days,
    totalCollegeDays,
    recommendedAttendDays,
    recommendedSkipDays,
    compulsoryLabDays,
    finalProjectedAttendance,
    totalClassesInRange,
  };
}

/**
 * Future attendance scenarios until semester end
 */
export function calculateFutureProjections(
  records: AttendanceRecord[],
  timetable: TimetableSlot[],
  importantDates: ImportantDate[],
  settings: AppSettings,
  currentDateStr: string
) {
  const currentStats = getOverallStats(records, settings.overallTarget);
  const curAttended = currentStats.attended;
  const curTotal = currentStats.total;

  const today = parseDate(currentDateStr);
  const end = parseDate(settings.semesterEnd || '2026-11-20');

  let remainingTotalClasses = 0;
  let remainingCompulsoryLabClasses = 0;
  let remainingTueFriClasses = 0;

  const runner = new Date(today.getTime());
  // Step from tomorrow to end of semester
  runner.setDate(runner.getDate() + 1);

  while (runner <= end) {
    const dStr = formatDate(runner);
    const dayOfWeek = runner.getDay();
    const isWorkingDay = settings.workingDays.includes(dayOfWeek);
    const hol = checkDateHolidayOrVacation(dStr, importantDates);

    if (isWorkingDay && !hol.isHolidayOrVacation) {
      const slots = timetable.filter((s) => s.dayOfWeek === dayOfWeek);
      remainingTotalClasses += slots.length;

      for (const slot of slots) {
        if (slot.isCompulsoryLab) {
          remainingCompulsoryLabClasses++;
        }
        if (dayOfWeek >= 2 && dayOfWeek <= 5) {
          // Tue - Fri
          remainingTueFriClasses++;
        }
      }
    }
    runner.setDate(runner.getDate() + 1);
  }

  // 1. If attend every remaining class:
  const ifAttendAllTotal = curTotal + remainingTotalClasses;
  const ifAttendAllAttended = curAttended + remainingTotalClasses;
  const ifAttendAllPct =
    ifAttendAllTotal === 0 ? 100 : (ifAttendAllAttended / ifAttendAllTotal) * 100;

  // 2. If attend only compulsory labs:
  const ifAttendLabsOnlyTotal = curTotal + remainingTotalClasses;
  const ifAttendLabsOnlyAttended = curAttended + remainingCompulsoryLabClasses;
  const ifAttendLabsOnlyPct =
    ifAttendLabsOnlyTotal === 0 ? 100 : (ifAttendLabsOnlyAttended / ifAttendLabsOnlyTotal) * 100;

  // 3. If attend Tuesday - Friday only:
  const ifAttendTueFriTotal = curTotal + remainingTotalClasses;
  const ifAttendTueFriAttended = curAttended + remainingTueFriClasses;
  const ifAttendTueFriPct =
    ifAttendTueFriTotal === 0 ? 100 : (ifAttendTueFriAttended / ifAttendTueFriTotal) * 100;

  return {
    currentPct: currentStats.percentage,
    remainingTotalClasses,
    ifAttendAllPct,
    ifAttendLabsOnlyPct,
    ifAttendTueFriPct,
  };
}
