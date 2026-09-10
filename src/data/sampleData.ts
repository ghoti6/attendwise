import {
  Subject,
  TimetableSlot,
  ImportantDate,
  AppSettings,
  AttendanceRecord,
} from '../types';

export const INITIAL_SUBJECTS: Subject[] = [
  {
    id: 'subj-dbms',
    name: 'DBMS',
    code: 'CS401',
    color: '#3B82F6', // Blue
    targetPercent: 75,
  },
  {
    id: 'subj-ml',
    name: 'ML Algo',
    code: 'CS402',
    color: '#8B5CF6', // Purple
    targetPercent: 75,
  },
  {
    id: 'subj-da',
    name: 'Data Analytics',
    code: 'CS403',
    color: '#10B981', // Emerald
    targetPercent: 75,
  },
  {
    id: 'subj-bc',
    name: 'Blockchain',
    code: 'CS404',
    color: '#F59E0B', // Amber
    targetPercent: 75,
  },
  {
    id: 'subj-webapp',
    name: 'Web App',
    code: 'CS405',
    color: '#06B6D4', // Cyan
    targetPercent: 75,
  },
  {
    id: 'subj-dbms-lab',
    name: 'DBMS Lab',
    code: 'CS401L',
    color: '#2563EB',
    targetPercent: 100,
    isLabSubject: true,
  },
  {
    id: 'subj-ml-lab',
    name: 'ML Lab',
    code: 'CS402L',
    color: '#7C3AED',
    targetPercent: 100,
    isLabSubject: true,
  },
  {
    id: 'subj-webapp-lab',
    name: 'Web App Lab',
    code: 'CS405L',
    color: '#0891B2',
    targetPercent: 100,
    isLabSubject: true,
  },
];

export const INITIAL_TIMETABLE: TimetableSlot[] = [
  // Monday (dayOfWeek: 1)
  {
    id: 'slot-mon-1',
    dayOfWeek: 1,
    startTime: '09:00',
    endTime: '10:00',
    subjectId: 'subj-dbms',
    classType: 'lecture',
    isCompulsoryLab: false,
    room: 'Hall 201',
    notes: 'Database normalization & query optimization',
  },
  {
    id: 'slot-mon-2',
    dayOfWeek: 1,
    startTime: '10:00',
    endTime: '11:00',
    subjectId: 'subj-ml',
    classType: 'lecture',
    isCompulsoryLab: false,
    room: 'Hall 305',
    notes: 'Supervised learning & gradient descent',
  },
  {
    id: 'slot-mon-3',
    dayOfWeek: 1,
    startTime: '11:15',
    endTime: '12:15',
    subjectId: 'subj-da',
    classType: 'lecture',
    isCompulsoryLab: false,
    room: 'Hall 204',
    notes: 'Pandas & exploratory data analysis',
  },
  {
    id: 'slot-mon-4',
    dayOfWeek: 1,
    startTime: '12:15',
    endTime: '13:15',
    subjectId: 'subj-bc',
    classType: 'lecture',
    isCompulsoryLab: false,
    room: 'Hall 108',
    notes: 'Smart contracts & Ethereum architecture',
  },

  // Tuesday (dayOfWeek: 2)
  {
    id: 'slot-tue-1',
    dayOfWeek: 2,
    startTime: '09:00',
    endTime: '10:00',
    subjectId: 'subj-webapp',
    classType: 'lecture',
    isCompulsoryLab: false,
    room: 'Hall 102',
    notes: 'REST APIs & client architecture',
  },
  {
    id: 'slot-tue-2',
    dayOfWeek: 2,
    startTime: '10:00',
    endTime: '11:00',
    subjectId: 'subj-da',
    classType: 'lecture',
    isCompulsoryLab: false,
    room: 'Hall 204',
  },
  {
    id: 'slot-tue-3',
    dayOfWeek: 2,
    startTime: '11:15',
    endTime: '12:15',
    subjectId: 'subj-dbms',
    classType: 'lecture',
    isCompulsoryLab: false,
    room: 'Hall 201',
  },
  {
    id: 'slot-tue-4',
    dayOfWeek: 2,
    startTime: '12:15',
    endTime: '13:15',
    subjectId: 'subj-bc',
    classType: 'lecture',
    isCompulsoryLab: false,
    room: 'Hall 108',
  },
  {
    id: 'slot-tue-5',
    dayOfWeek: 2,
    startTime: '14:00',
    endTime: '15:00',
    subjectId: 'subj-ml',
    classType: 'lecture',
    isCompulsoryLab: false,
    room: 'Hall 305',
  },

  // Wednesday (dayOfWeek: 3)
  {
    id: 'slot-wed-1',
    dayOfWeek: 3,
    startTime: '09:00',
    endTime: '10:00',
    subjectId: 'subj-da',
    classType: 'lecture',
    isCompulsoryLab: false,
    room: 'Hall 204',
  },
  {
    id: 'slot-wed-2',
    dayOfWeek: 3,
    startTime: '10:00',
    endTime: '11:00',
    subjectId: 'subj-ml',
    classType: 'lecture',
    isCompulsoryLab: false,
    room: 'Hall 305',
  },
  {
    id: 'slot-wed-3',
    dayOfWeek: 3,
    startTime: '11:15',
    endTime: '12:15',
    subjectId: 'subj-bc',
    classType: 'lecture',
    isCompulsoryLab: false,
    room: 'Hall 108',
  },
  {
    id: 'slot-wed-4',
    dayOfWeek: 3,
    startTime: '12:15',
    endTime: '13:15',
    subjectId: 'subj-webapp',
    classType: 'lecture',
    isCompulsoryLab: false,
    room: 'Hall 102',
  },
  {
    id: 'slot-wed-5',
    dayOfWeek: 3,
    startTime: '14:00',
    endTime: '16:00',
    subjectId: 'subj-dbms-lab',
    classType: 'lab',
    isCompulsoryLab: true, // 100% REQUIRED
    room: 'CS Lab 3',
    notes: 'SQL transactions & trigger procedures — 100% REQUIRED',
  },

  // Thursday (dayOfWeek: 4)
  {
    id: 'slot-thu-1',
    dayOfWeek: 4,
    startTime: '09:00',
    endTime: '10:00',
    subjectId: 'subj-dbms',
    classType: 'lecture',
    isCompulsoryLab: false,
    room: 'Hall 201',
  },
  {
    id: 'slot-thu-2',
    dayOfWeek: 4,
    startTime: '10:00',
    endTime: '11:00',
    subjectId: 'subj-webapp',
    classType: 'lecture',
    isCompulsoryLab: false,
    room: 'Hall 102',
  },
  {
    id: 'slot-thu-3',
    dayOfWeek: 4,
    startTime: '11:15',
    endTime: '13:15',
    subjectId: 'subj-ml-lab',
    classType: 'lab',
    isCompulsoryLab: true, // 100% REQUIRED
    room: 'AI/ML Lab 1',
    notes: 'Model evaluation & confusion matrices — 100% REQUIRED',
  },

  // Friday (dayOfWeek: 5)
  {
    id: 'slot-fri-1',
    dayOfWeek: 5,
    startTime: '09:00',
    endTime: '12:00',
    subjectId: 'subj-webapp-lab',
    classType: 'lab',
    isCompulsoryLab: true, // 100% REQUIRED
    room: 'Web Studio 2',
    notes: 'Full-stack integration project — 100% REQUIRED',
  },
];

export const INITIAL_IMPORTANT_DATES: ImportantDate[] = [
  {
    id: 'date-sem-start',
    title: 'Semester Start & Attendance Tracking',
    startDate: '2026-09-10',
    type: 'semester_start',
    notes: 'Official start of academic term',
  },
  {
    id: 'date-vacation',
    title: 'Mid-Term Vacation',
    startDate: '2026-10-15',
    endDate: '2026-10-30',
    type: 'vacation_range',
    notes: 'Autumn semester break. No classes counted.',
  },
  {
    id: 'date-resume',
    title: 'Classes Resume',
    startDate: '2026-10-31',
    type: 'other',
    notes: 'College reopens after vacation',
  },
  {
    id: 'date-exam',
    title: 'Semester Final Exams',
    startDate: '2026-11-10',
    endDate: '2026-11-18',
    type: 'exam',
    countsAsAttendance: false,
    notes: 'Regular timetable suspended during examinations',
  },
  {
    id: 'date-gandhi-jayanti',
    title: 'Gandhi Jayanti Holiday',
    startDate: '2026-10-02',
    type: 'holiday',
    notes: 'National holiday',
  },
  {
    id: 'date-tech-fest',
    title: 'Annual College Tech Fest',
    startDate: '2026-11-05',
    type: 'no_classes',
    notes: 'Classes suspended for campus symposium',
  },
];

export const INITIAL_SETTINGS: AppSettings = {
  overallTarget: 75,
  semesterStart: '2026-09-10',
  semesterEnd: '2026-11-20',
  examDate: '2026-11-10',
  workingDays: [1, 2, 3, 4, 5], // Monday through Friday
  includeExamDaysInTotal: false,
  hasCompletedSetup: true,
};

/**
 * Generate realistic past sample attendance records.
 * Exact numbers from prompt requirement #2 & #3:
 * Attended: 89
 * Missed: 19
 * Total: 108
 * Overall Percentage: 89 / 108 = 82.407% -> 82.4%
 * Safety margin: +7.4% above minimum
 * Subjects:
 * - DBMS: 23 / 28 (82%)
 * - Web App: 19 / 25 (76%)
 * - ML Lab: 8 / 8 (100% compulsory)
 * - DBMS Lab: 6 / 6 (100% compulsory)
 * - Web App Lab: 6 / 6 (100% compulsory)
 * - ML Algo: 14 / 18 (77.8%)
 * - Data Analytics: 13 / 17 (76.5%)
 * Total attended: 23 + 19 + 8 + 6 + 6 + 14 + 13 = 89
 * Total classes: 28 + 25 + 8 + 6 + 6 + 18 + 17 = 108
 * Missed: 108 - 89 = 19
 */
export function generateSampleRecords(): AttendanceRecord[] {
  const records: AttendanceRecord[] = [];
  let recordId = 1;

  // Helper to add records
  const addRecords = (
    subjectId: string,
    attendedCount: number,
    missedCount: number,
    classType: 'lecture' | 'lab',
    isCompulsoryLab = false,
    baseDate = '2026-09-01'
  ) => {
    // Generate dates backwards from Sep 9, 2026
    let day = 1;
    for (let i = 0; i < attendedCount; i++) {
      const dStr = `2026-09-${String((day % 9) + 1).padStart(2, '0')}`;
      records.push({
        id: `rec-${recordId++}`,
        date: dStr,
        subjectId,
        status: 'present',
        classType,
        isCompulsoryLab,
        timestamp: Date.now() - (10 - (day % 9)) * 86400000,
      });
      day++;
    }
    for (let i = 0; i < missedCount; i++) {
      const dStr = `2026-09-${String((day % 9) + 1).padStart(2, '0')}`;
      records.push({
        id: `rec-${recordId++}`,
        date: dStr,
        subjectId,
        status: 'absent',
        classType,
        isCompulsoryLab,
        timestamp: Date.now() - (10 - (day % 9)) * 86400000,
      });
      day++;
    }
  };

  // DBMS: 23 attended, 5 missed = 28 total (82%)
  addRecords('subj-dbms', 23, 5, 'lecture', false);

  // Web App: 19 attended, 6 missed = 25 total (76%)
  addRecords('subj-webapp', 19, 6, 'lecture', false);

  // ML Lab: 8 attended, 0 missed = 8 total (100% compulsory)
  addRecords('subj-ml-lab', 8, 0, 'lab', true);

  // DBMS Lab: 6 attended, 0 missed = 6 total (100% compulsory)
  addRecords('subj-dbms-lab', 6, 0, 'lab', true);

  // Web App Lab: 6 attended, 0 missed = 6 total (100% compulsory)
  addRecords('subj-webapp-lab', 6, 0, 'lab', true);

  // ML Algo: 14 attended, 4 missed = 18 total (77.8%)
  addRecords('subj-ml', 14, 4, 'lecture', false);

  // Data Analytics: 13 attended, 4 missed = 17 total (76.5%)
  addRecords('subj-da', 13, 4, 'lecture', false);

  // Plus 2 cancelled classes that don't count towards total
  records.push({
    id: `rec-${recordId++}`,
    date: '2026-09-08',
    subjectId: 'subj-bc',
    status: 'cancelled',
    classType: 'lecture',
    isCompulsoryLab: false,
    notes: 'Professor on official leave',
    timestamp: Date.now() - 2 * 86400000,
  });

  return records;
}
