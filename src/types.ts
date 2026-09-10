export type ClassType = 'lecture' | 'lab';

export type AttendanceStatus = 'present' | 'absent' | 'cancelled';

export interface Subject {
  id: string;
  name: string;
  code?: string;
  color: string;
  targetPercent: number; // e.g. 75
  isLabSubject?: boolean;
}

export interface TimetableSlot {
  id: string;
  dayOfWeek: number; // 0 = Sun, 1 = Mon, 2 = Tue, 3 = Wed, 4 = Thu, 5 = Fri, 6 = Sat
  startTime: string; // "09:00"
  endTime: string;   // "10:00"
  subjectId: string;
  classType: ClassType;
  isCompulsoryLab: boolean;
  room?: string;
  notes?: string;
}

export interface AttendanceRecord {
  id: string;
  date: string; // YYYY-MM-DD
  slotId?: string;
  subjectId: string;
  status: AttendanceStatus;
  classType: ClassType;
  isCompulsoryLab?: boolean;
  notes?: string;
  timestamp: number;
}

export type ImportantDateType =
  | 'semester_start'
  | 'semester_end'
  | 'exam'
  | 'vacation_start'
  | 'vacation_end'
  | 'vacation_range'
  | 'holiday'
  | 'no_classes'
  | 'internal_exam'
  | 'practical_exam'
  | 'other';

export interface ImportantDate {
  id: string;
  title: string;
  startDate: string; // YYYY-MM-DD
  endDate?: string;   // YYYY-MM-DD for ranges
  type: ImportantDateType;
  countsAsAttendance?: boolean;
  notes?: string;
}

export interface CustomAcademicDate {
  id: string;
  name: string;
  date: string;
}

export interface AppSettings {
  overallTarget: number; // default 75
  semesterStart: string; // YYYY-MM-DD
  semesterEnd: string;   // YYYY-MM-DD
  examDate?: string;
  semesterStartName?: string;
  semesterEndName?: string;
  examDateName?: string;
  customAcademicDates?: CustomAcademicDate[];
  workingDays: number[]; // e.g. [1, 2, 3, 4, 5]
  includeExamDaysInTotal: boolean;
  hasCompletedSetup: boolean;
}

export type AttendanceStatusLevel = 'safe' | 'warning' | 'danger' | 'at_minimum';

export interface AttendanceStats {
  attended: number;
  missed: number;
  cancelled: number;
  total: number; // attended + missed (cancelled is excluded from total)
  percentage: number;
  status: AttendanceStatusLevel;
  safetyMargin: number; // percentage - target
  classesCanMiss: number;
  classesNeededToTarget: number;
}

export interface SubjectStats extends AttendanceStats {
  subject: Subject;
  hasCompulsoryLab: boolean;
}

export interface DayDecision {
  date: string; // YYYY-MM-DD
  dayOfWeek: number;
  isCollegeDay: boolean;
  isHolidayOrVacation: boolean;
  holidayReason?: string;
  slots: (TimetableSlot & { subject?: Subject; attendanceRecord?: AttendanceRecord })[];
  totalClasses: number;
  currentAttendancePct: number;
  projectedIfAttend: number;
  projectedIfSkip: number;
  decision: 'ATTEND' | 'CAN_SKIP' | 'OPTIONAL' | 'HOLIDAY' | 'NO_CLASSES' | 'CANCELLED';
  reason: string;
  containsCompulsoryLab: boolean;
  compulsoryLabNames: string[];
}
