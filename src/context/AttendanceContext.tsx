import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import {
  AppSettings,
  AttendanceRecord,
  ImportantDate,
  Subject,
  TimetableSlot,
  AttendanceStatus,
  ClassType,
} from '../types';
import {
  INITIAL_IMPORTANT_DATES,
  INITIAL_SETTINGS,
  INITIAL_SUBJECTS,
  INITIAL_TIMETABLE,
  generateSampleRecords,
} from '../data/sampleData';
import { formatDate } from '../utils/attendanceCalculations';
import {
  isSupabaseConfigured as checkSupabaseConfigured,
  getSupabaseConfig,
  saveCustomSupabaseCredentials,
  clearCustomSupabaseCredentials,
  testSupabaseConnection,
  fetchRemoteAttendance,
  saveRemoteAttendance,
  clearRemoteAttendance,
  subscribeToRemoteAttendance,
  UserAttendancePayload,
  getSupabaseClient,
} from '../lib/supabase';

export type CloudSyncStatus = 'synced' | 'syncing' | 'offline' | 'error' | 'local_only';

interface AttendanceContextType {
  subjects: Subject[];
  timetable: TimetableSlot[];
  records: AttendanceRecord[];
  importantDates: ImportantDate[];
  settings: AppSettings;
  currentDate: string; // YYYY-MM-DD
  setCurrentDate: (date: string) => void;
  // Supabase authentication, database credentials and cloud sync
  isInitialLoading: boolean;
  isSupabaseConfigured: boolean;
  supabaseConfig: { url: string; anonKey: string; source: 'env' | 'custom' | 'none' };
  updateSupabaseCredentials: (url: string, anonKey: string) => void;
  clearSupabaseCredentials: () => void;
  testDatabaseConnection: () => Promise<{ ok: boolean; message: string; isMissingTable?: boolean }>;
  cloudUser: { id: string; email?: string } | null;
  cloudSyncStatus: CloudSyncStatus;
  lastCloudSyncTime: number | null;
  cloudErrorMessage: string | null;
  deviceSyncId: string;
  setDeviceSyncId: (id: string) => void;
  activeIdentifier: string;
  syncNow: () => Promise<void>;
  commitToRemote: (overridePayload?: Partial<UserAttendancePayload>) => Promise<{ success: boolean; error?: string }>;
  uploadLocalToCloud: () => Promise<{ success: boolean; message: string }>;
  signUpWithEmail: (email: string, pass: string) => Promise<{ error?: string }>;
  signInWithEmail: (email: string, pass: string) => Promise<{ error?: string }>;
  signOutCloud: () => Promise<void>;
  // Attendance actions
  markAttendance: (params: {
    date: string;
    slotId?: string;
    subjectId: string;
    status: AttendanceStatus;
    classType: ClassType;
    isCompulsoryLab?: boolean;
    notes?: string;
  }) => void;
  bulkMarkDay: (date: string, status: AttendanceStatus) => void;
  clearDayAttendance: (date: string) => void;
  deleteRecord: (id: string) => void;
  // Subject actions
  addSubject: (subject: Omit<Subject, 'id'>) => Subject;
  updateSubject: (id: string, updates: Partial<Subject>) => void;
  deleteSubject: (id: string) => void;
  // Timetable actions
  addTimetableSlot: (slot: Omit<TimetableSlot, 'id'>) => void;
  updateTimetableSlot: (id: string, updates: Partial<TimetableSlot>) => void;
  deleteTimetableSlot: (id: string) => void;
  // Important Dates actions
  addImportantDate: (item: Omit<ImportantDate, 'id'>) => void;
  updateImportantDate: (id: string, updates: Partial<ImportantDate>) => void;
  deleteImportantDate: (id: string) => void;
  // Settings actions
  updateSettings: (updates: Partial<AppSettings>) => void;
  // Import / Export / Reset / Clear
  exportData: () => void;
  exportDataJSON: () => void;
  exportDataCSV: () => void;
  importData: (jsonData: string) => boolean;
  importDataJSON: (jsonData: string) => boolean;
  resetToSampleData: () => void;
  clearAllData: (options?: { recordsOnly?: boolean }) => Promise<{ success: boolean; message: string }>;
}

const STORAGE_KEYS = {
  DEVICE_ID: 'attendwise_device_sync_id',
};

// Helper for user-scoped local persistence to guarantee complete data isolation between users
const getUserStorageKey = (prefix: string, userId: string) => `attendwise_${userId || 'guest'}_${prefix}`;

const AttendanceContext = createContext<AttendanceContextType | undefined>(undefined);

export const AttendanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Current active date in app, defaults to today's date in local time
  const [currentDate, setCurrentDate] = useState<string>(() => {
    return formatDate(new Date());
  });

  // Persistent device / sync identifier for unauthenticated sync
  const [deviceSyncId, setDeviceSyncIdState] = useState<string>(() => {
    let saved = '';
    if (typeof window !== 'undefined') {
      saved = localStorage.getItem(STORAGE_KEYS.DEVICE_ID) || '';
      if (!saved) {
        saved = `client_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
        localStorage.setItem(STORAGE_KEYS.DEVICE_ID, saved);
      }
    }
    return saved || `client_${Date.now()}`;
  });

  const setDeviceSyncId = (newId: string) => {
    const cleanId = newId.trim();
    if (cleanId) {
      localStorage.setItem(STORAGE_KEYS.DEVICE_ID, cleanId);
      setDeviceSyncIdState(cleanId);
    }
  };

  // Supabase authentication and cloud state
  const [cloudUser, setCloudUser] = useState<{ id: string; email?: string } | null>(null);
  const [supabaseConfigState, setSupabaseConfigState] = useState(getSupabaseConfig());
  const [isInitialLoading, setIsInitialLoading] = useState<boolean>(() => checkSupabaseConfigured());
  const [cloudSyncStatus, setCloudSyncStatus] = useState<CloudSyncStatus>(() =>
    checkSupabaseConfigured() ? 'syncing' : 'local_only'
  );
  const [lastCloudSyncTime, setLastCloudSyncTime] = useState<number | null>(null);
  const [cloudErrorMessage, setCloudErrorMessage] = useState<string | null>(null);

  // Active identifier for Supabase sync: user.id when logged in, or deviceSyncId
  const activeIdentifier = cloudUser ? cloudUser.id : deviceSyncId;

  // In-memory application state
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [timetable, setTimetable] = useState<TimetableSlot[]>([]);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [importantDates, setImportantDates] = useState<ImportantDate[]>(INITIAL_IMPORTANT_DATES);
  const [settings, setSettings] = useState<AppSettings>(INITIAL_SETTINGS);

  // Guard ref to prevent loopbacks during remote synchronization
  const isRemoteSyncInProgress = useRef<boolean>(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Helper to persist user-scoped local storage cache
  const persistUserLocalCache = useCallback((userId: string, data: {
    subjects: Subject[];
    timetable: TimetableSlot[];
    records: AttendanceRecord[];
    importantDates: ImportantDate[];
    settings: AppSettings;
  }) => {
    try {
      localStorage.setItem(getUserStorageKey('subjects', userId), JSON.stringify(data.subjects));
      localStorage.setItem(getUserStorageKey('timetable', userId), JSON.stringify(data.timetable));
      localStorage.setItem(getUserStorageKey('records', userId), JSON.stringify(data.records));
      localStorage.setItem(getUserStorageKey('dates', userId), JSON.stringify(data.importantDates));
      localStorage.setItem(getUserStorageKey('settings', userId), JSON.stringify(data.settings));
    } catch (e) {
      console.error('Failed to write user local storage cache', e);
    }
  }, []);

  // Helper to read user-scoped local storage cache
  const readUserLocalCache = useCallback((userId: string) => {
    try {
      const s = localStorage.getItem(getUserStorageKey('subjects', userId));
      const t = localStorage.getItem(getUserStorageKey('timetable', userId));
      const r = localStorage.getItem(getUserStorageKey('records', userId));
      const d = localStorage.getItem(getUserStorageKey('dates', userId));
      const cfg = localStorage.getItem(getUserStorageKey('settings', userId));

      return {
        subjects: s ? JSON.parse(s) : null,
        timetable: t ? JSON.parse(t) : null,
        records: r ? JSON.parse(r) : null,
        importantDates: d ? JSON.parse(d) : null,
        settings: cfg ? JSON.parse(cfg) : null,
      };
    } catch {
      return null;
    }
  }, []);

  // Update Supabase configuration credentials
  const updateSupabaseCredentials = (url: string, anonKey: string) => {
    saveCustomSupabaseCredentials(url, anonKey);
    setSupabaseConfigState(getSupabaseConfig());
    setCloudSyncStatus(checkSupabaseConfigured() ? 'syncing' : 'local_only');
  };

  const clearSupabaseCredentials = () => {
    clearCustomSupabaseCredentials();
    setSupabaseConfigState(getSupabaseConfig());
    setCloudSyncStatus('local_only');
  };

  const testDatabaseConnection = async () => {
    return await testSupabaseConnection();
  };

  /**
   * Commit application state to Supabase for the current user
   */
  const commitToRemote = useCallback(async (
    overridePayload?: Partial<UserAttendancePayload>
  ): Promise<{ success: boolean; error?: string }> => {
    if (!checkSupabaseConfigured() || !activeIdentifier) {
      return { success: false, error: 'Supabase is not configured' };
    }

    const payload: UserAttendancePayload = {
      subjects: overridePayload?.subjects ?? subjects,
      timetable: overridePayload?.timetable ?? timetable,
      records: overridePayload?.records ?? records,
      importantDates: overridePayload?.importantDates ?? importantDates,
      settings: overridePayload?.settings ?? settings,
    };

    setCloudSyncStatus('syncing');
    const res = await saveRemoteAttendance(activeIdentifier, cloudUser?.email, payload);
    if (res.success) {
      setCloudSyncStatus('synced');
      setLastCloudSyncTime(Date.now());
      setCloudErrorMessage(null);
    } else {
      setCloudSyncStatus('error');
      setCloudErrorMessage(res.error || 'Failed to save changes to Supabase.');
    }
    return res;
  }, [activeIdentifier, cloudUser?.email, importantDates, records, settings, subjects, timetable]);

  /**
   * Core function: Fetch and load data from Supabase for a specific user.
   * Ensures each user only sees their own unique data.
   */
  const loadUserDataForIdentifier = useCallback(async (identifier: string, userEmail?: string) => {
    if (!identifier) {
      setIsInitialLoading(false);
      return;
    }

    isRemoteSyncInProgress.current = true;
    setCloudSyncStatus('syncing');
    setCloudErrorMessage(null);

    try {
      const res = await fetchRemoteAttendance(identifier, userEmail);
      if (res.data) {
        // User data retrieved from Supabase
        const remote = res.data;
        const sub = Array.isArray(remote.subjects) ? remote.subjects : [];
        const tt = Array.isArray(remote.timetable) ? remote.timetable : [];
        const rec = Array.isArray(remote.records) ? remote.records : [];
        const dates = Array.isArray(remote.importantDates) ? remote.importantDates : [];
        const st = remote.settings && typeof remote.settings === 'object' && Object.keys(remote.settings).length > 0
          ? { ...INITIAL_SETTINGS, ...remote.settings }
          : { ...INITIAL_SETTINGS, hasCompletedSetup: false };

        setSubjects(sub);
        setTimetable(tt);
        setRecords(rec);
        setImportantDates(dates);
        setSettings(st);

        // Cache for offline resilience
        persistUserLocalCache(identifier, {
          subjects: sub,
          timetable: tt,
          records: rec,
          importantDates: dates,
          settings: st,
        });

        // If data was recovered from an alternate key or row, ensure primary row is updated too
        if (sub.length > 0 || rec.length > 0) {
          saveRemoteAttendance(identifier, userEmail, remote).catch((err) =>
            console.warn('Sync update notice:', err)
          );
        }

        setLastCloudSyncTime(remote.lastUpdated || Date.now());
        setCloudSyncStatus('synced');
        setCloudErrorMessage(null);
      } else if (res.isNotFound) {
        // Brand new user in Supabase: Start with a clean/fresh state so they DO NOT see someone else's data!
        const local = readUserLocalCache(identifier);
        const sub = Array.isArray(local?.subjects) ? local.subjects : [];
        const tt = Array.isArray(local?.timetable) ? local.timetable : [];
        const rec = Array.isArray(local?.records) ? local.records : [];
        const dates = Array.isArray(local?.importantDates) ? local.importantDates : INITIAL_IMPORTANT_DATES;
        const st = local?.settings || { ...INITIAL_SETTINGS, hasCompletedSetup: false };

        setSubjects(sub);
        setTimetable(tt);
        setRecords(rec);
        setImportantDates(dates);
        setSettings(st);

        // Only commit if there is actual content to save
        if (sub.length > 0 || rec.length > 0) {
          await saveRemoteAttendance(identifier, userEmail, {
            subjects: sub,
            timetable: tt,
            records: rec,
            importantDates: dates,
            settings: st,
          });
        }

        setLastCloudSyncTime(Date.now());
        setCloudSyncStatus('synced');
        setCloudErrorMessage(null);
      } else if (res.error) {
        // Encountered an error (e.g. table not created or network glitch)
        setCloudSyncStatus('error');
        setCloudErrorMessage(res.error);

        // Fall back to per-user local cache
        const local = readUserLocalCache(identifier);
        if (local) {
          if (Array.isArray(local.subjects)) setSubjects(local.subjects);
          if (Array.isArray(local.timetable)) setTimetable(local.timetable);
          if (Array.isArray(local.records)) setRecords(local.records);
          if (Array.isArray(local.importantDates)) setImportantDates(local.importantDates);
          if (local.settings) setSettings(local.settings);
        } else {
          setSubjects(INITIAL_SUBJECTS);
          setTimetable(INITIAL_TIMETABLE);
          setRecords(generateSampleRecords());
          setImportantDates(INITIAL_IMPORTANT_DATES);
          setSettings(INITIAL_SETTINGS);
        }
      }
    } catch (err: any) {
      console.error('Error loading user data from Supabase:', err);
      setCloudSyncStatus('error');
      setCloudErrorMessage(err?.message || 'Error loading attendance data');
    } finally {
      setTimeout(() => {
        isRemoteSyncInProgress.current = false;
        setIsInitialLoading(false);
      }, 300);
    }
  }, [persistUserLocalCache, readUserLocalCache]);

  // Initial load effect: Check session from Supabase on startup and load specific user data
  useEffect(() => {
    let isMounted = true;

    if (!checkSupabaseConfigured()) {
      // Local storage mode only
      const local = readUserLocalCache(deviceSyncId);
      if (local && (local.subjects || local.records)) {
        if (Array.isArray(local.subjects)) setSubjects(local.subjects);
        if (Array.isArray(local.timetable)) setTimetable(local.timetable);
        if (Array.isArray(local.records)) setRecords(local.records);
        if (Array.isArray(local.importantDates)) setImportantDates(local.importantDates);
        if (local.settings) setSettings(local.settings);
      } else {
        setSubjects(INITIAL_SUBJECTS);
        setTimetable(INITIAL_TIMETABLE);
        setRecords(generateSampleRecords());
        setImportantDates(INITIAL_IMPORTANT_DATES);
        setSettings(INITIAL_SETTINGS);
      }
      setIsInitialLoading(false);
      setCloudSyncStatus('local_only');
      return;
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      setIsInitialLoading(false);
      setCloudSyncStatus('local_only');
      return;
    }

    // 1. Fetch authenticated session
    supabase.auth.getSession().then(async ({ data, error }) => {
      if (!isMounted) return;
      if (error) {
        console.warn('Error checking Supabase session:', error.message);
      }
      if (data?.session?.user) {
        const user = data.session.user;
        setCloudUser({ id: user.id, email: user.email });
        await loadUserDataForIdentifier(user.id, user.email);
      } else {
        // No authenticated session, load for deviceSyncId
        await loadUserDataForIdentifier(deviceSyncId, undefined);
      }
    }).catch((err) => {
      if (!isMounted) return;
      console.error('Session retrieval failure:', err);
      setIsInitialLoading(false);
      setCloudSyncStatus('error');
      setCloudErrorMessage(err?.message || 'Failed to check Supabase session');
    });

    // 2. Listen to Auth State Changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;
      if (session?.user) {
        const user = session.user;
        setCloudUser({ id: user.id, email: user.email });
        if (event === 'SIGNED_IN') {
          setIsInitialLoading(true);
          await loadUserDataForIdentifier(user.id, user.email);
        }
      } else if (event === 'SIGNED_OUT') {
        setCloudUser(null);
        // Clear previous user's records from memory so data never leaks to other users
        setSubjects([]);
        setTimetable([]);
        setRecords([]);
        setImportantDates(INITIAL_IMPORTANT_DATES);
        setSettings({ ...INITIAL_SETTINGS, hasCompletedSetup: false });
        setCloudSyncStatus(checkSupabaseConfigured() ? 'synced' : 'local_only');
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [deviceSyncId, loadUserDataForIdentifier, readUserLocalCache, supabaseConfigState]);

  // Realtime subscription to receive remote updates for this specific user
  useEffect(() => {
    if (!checkSupabaseConfigured() || !activeIdentifier || isInitialLoading) return;

    const unsubscribe = subscribeToRemoteAttendance(activeIdentifier, (remote) => {
      isRemoteSyncInProgress.current = true;
      if (Array.isArray(remote.subjects)) setSubjects(remote.subjects);
      if (Array.isArray(remote.timetable)) setTimetable(remote.timetable);
      if (Array.isArray(remote.records)) setRecords(remote.records);
      if (Array.isArray(remote.importantDates)) setImportantDates(remote.importantDates);
      if (remote.settings && typeof remote.settings === 'object') {
        setSettings((prev) => ({ ...prev, ...remote.settings }));
      }
      setLastCloudSyncTime(remote.lastUpdated || Date.now());
      setCloudSyncStatus('synced');
      setTimeout(() => {
        isRemoteSyncInProgress.current = false;
      }, 500);
    });

    return () => {
      unsubscribe();
    };
  }, [activeIdentifier, isInitialLoading]);

  // Auto-sync effect: Cache to localStorage and commit changes to Supabase
  useEffect(() => {
    // Write to per-user localStorage cache on any state change
    if (activeIdentifier) {
      persistUserLocalCache(activeIdentifier, {
        subjects,
        timetable,
        records,
        importantDates,
        settings,
      });
    }

    // Do NOT auto-save to Supabase if initial load is still fetching or remote sync is in progress
    if (isInitialLoading || isRemoteSyncInProgress.current || !checkSupabaseConfigured() || !activeIdentifier) {
      return;
    }

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(async () => {
      await commitToRemote();
    }, 600);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [subjects, timetable, records, importantDates, settings, activeIdentifier, isInitialLoading, persistUserLocalCache, commitToRemote]);

  // Pull latest remote state manually
  const syncNow = useCallback(async () => {
    if (!checkSupabaseConfigured() || !activeIdentifier) {
      setCloudSyncStatus('local_only');
      return;
    }
    await loadUserDataForIdentifier(activeIdentifier, cloudUser?.email);
  }, [activeIdentifier, cloudUser?.email, loadUserDataForIdentifier]);

  // Force push local data to cloud
  const uploadLocalToCloud = async (): Promise<{ success: boolean; message: string }> => {
    if (!checkSupabaseConfigured()) {
      return { success: false, message: 'Database credentials are not configured yet.' };
    }
    if (!activeIdentifier) {
      return { success: false, message: 'No identifier found to associate attendance state.' };
    }
    const res = await commitToRemote();
    if (res.success) {
      return { success: true, message: 'Successfully uploaded all local data to Supabase.' };
    }
    return { success: false, message: res.error || 'Failed to upload to Supabase.' };
  };

  // Auth methods
  const signUpWithEmail = async (email: string, pass: string) => {
    const supabase = getSupabaseClient();
    if (!supabase) return { error: 'Supabase is not configured' };
    const { data, error } = await supabase.auth.signUp({ email, password: pass });
    if (error) return { error: error.message };
    if (data.user) {
      setCloudUser({ id: data.user.id, email: data.user.email });
      setIsInitialLoading(true);
      await loadUserDataForIdentifier(data.user.id, data.user.email);
    }
    return {};
  };

  const signInWithEmail = async (email: string, pass: string) => {
    const supabase = getSupabaseClient();
    if (!supabase) return { error: 'Supabase is not configured' };
    const { data, error } = await supabase.auth.signInWithPassword({ email, password: pass });
    if (error) return { error: error.message };
    if (data.user) {
      setCloudUser({ id: data.user.id, email: data.user.email });
      setIsInitialLoading(true);
      await loadUserDataForIdentifier(data.user.id, data.user.email);
    }
    return {};
  };

  const signOutCloud = async () => {
    const supabase = getSupabaseClient();
    if (supabase) {
      await supabase.auth.signOut();
    }
    setCloudUser(null);
    // Reset state to clean so user's data is wiped from active memory
    setSubjects([]);
    setTimetable([]);
    setRecords([]);
    setImportantDates(INITIAL_IMPORTANT_DATES);
    setSettings({ ...INITIAL_SETTINGS, hasCompletedSetup: false });
    setCloudSyncStatus(checkSupabaseConfigured() ? 'synced' : 'local_only');
  };

  // Mark attendance for a single slot or standalone class
  const markAttendance: AttendanceContextType['markAttendance'] = ({
    date,
    slotId,
    subjectId,
    status,
    classType,
    isCompulsoryLab,
    notes,
  }) => {
    setRecords((prev) => {
      const existingIndex = prev.findIndex(
        (r) => r.date === date && ((slotId && r.slotId === slotId) || (!slotId && r.subjectId === subjectId))
      );

      let updated: AttendanceRecord[];
      if (existingIndex >= 0) {
        updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          status,
          classType,
          isCompulsoryLab: isCompulsoryLab ?? updated[existingIndex].isCompulsoryLab,
          notes: notes !== undefined ? notes : updated[existingIndex].notes,
          timestamp: Date.now(),
        };
      } else {
        const newRecord: AttendanceRecord = {
          id: `rec-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          date,
          slotId,
          subjectId,
          status,
          classType,
          isCompulsoryLab,
          notes,
          timestamp: Date.now(),
        };
        updated = [newRecord, ...prev];
      }
      commitToRemote({ records: updated });
      return updated;
    });
  };

  // Bulk mark all scheduled classes on a day
  const bulkMarkDay = (date: string, status: AttendanceStatus) => {
    const d = new Date(`${date}T00:00:00`);
    const dayOfWeek = d.getDay();
    const daySlots = timetable.filter((s) => s.dayOfWeek === dayOfWeek);

    setRecords((prev) => {
      let updated = [...prev];
      for (const slot of daySlots) {
        const existingIndex = updated.findIndex(
          (r) => r.date === date && r.slotId === slot.id
        );
        if (existingIndex >= 0) {
          updated[existingIndex] = {
            ...updated[existingIndex],
            status,
            timestamp: Date.now(),
          };
        } else {
          updated.push({
            id: `rec-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            date,
            slotId: slot.id,
            subjectId: slot.subjectId,
            status,
            classType: slot.classType,
            isCompulsoryLab: slot.isCompulsoryLab,
            timestamp: Date.now(),
          });
        }
      }
      commitToRemote({ records: updated });
      return updated;
    });
  };

  // Clear/cancel all marked records for a specific date (resets to unlogged)
  const clearDayAttendance = (date: string) => {
    setRecords((prev) => {
      const updated = prev.filter((r) => r.date !== date);
      commitToRemote({ records: updated });
      return updated;
    });
  };

  const deleteRecord = (id: string) => {
    setRecords((prev) => {
      const updated = prev.filter((r) => r.id !== id);
      commitToRemote({ records: updated });
      return updated;
    });
  };

  // Subject actions: Add, Update, Delete with custom names & code
  const addSubject = (sub: Omit<Subject, 'id'>): Subject => {
    const newSub: Subject = {
      ...sub,
      id: `subj-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: sub.name.trim() || 'New Subject',
      code: sub.code ? sub.code.trim().toUpperCase() : '',
      color: sub.color || '#6366F1',
      targetPercent: Number(sub.targetPercent) || 75,
      isLabSubject: Boolean(sub.isLabSubject),
    };
    setSubjects((prev) => {
      const updated = [...prev, newSub];
      commitToRemote({ subjects: updated });
      return updated;
    });
    return newSub;
  };

  const updateSubject = (id: string, updates: Partial<Subject>) => {
    setSubjects((prev) => {
      const updated = prev.map((s) => {
        if (s.id === id) {
          return {
            ...s,
            ...updates,
            name: updates.name !== undefined ? updates.name.trim() || s.name : s.name,
            code: updates.code !== undefined ? updates.code.trim().toUpperCase() : s.code,
            targetPercent: updates.targetPercent !== undefined ? Number(updates.targetPercent) : s.targetPercent,
          };
        }
        return s;
      });
      commitToRemote({ subjects: updated });
      return updated;
    });
  };

  const deleteSubject = (id: string) => {
    const updatedSubjects = subjects.filter((s) => s.id !== id);
    const updatedTimetable = timetable.filter((t) => t.subjectId !== id);
    const updatedRecords = records.filter((r) => r.subjectId !== id);

    setSubjects(updatedSubjects);
    setTimetable(updatedTimetable);
    setRecords(updatedRecords);

    commitToRemote({
      subjects: updatedSubjects,
      timetable: updatedTimetable,
      records: updatedRecords,
    });
  };

  // Timetable actions
  const addTimetableSlot = (slot: Omit<TimetableSlot, 'id'>) => {
    const newSlot: TimetableSlot = {
      ...slot,
      id: `slot-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    };
    setTimetable((prev) => {
      const updated = [...prev, newSlot];
      commitToRemote({ timetable: updated });
      return updated;
    });
  };

  const updateTimetableSlot = (id: string, updates: Partial<TimetableSlot>) => {
    setTimetable((prev) => {
      const updated = prev.map((t) => (t.id === id ? { ...t, ...updates } : t));
      commitToRemote({ timetable: updated });
      return updated;
    });
  };

  const deleteTimetableSlot = (id: string) => {
    setTimetable((prev) => {
      const updated = prev.filter((t) => t.id !== id);
      commitToRemote({ timetable: updated });
      return updated;
    });
  };

  // Important Dates actions
  const addImportantDate = (item: Omit<ImportantDate, 'id'>) => {
    const newItem: ImportantDate = {
      ...item,
      id: `date-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    };
    setImportantDates((prev) => {
      const updated = [...prev, newItem];
      commitToRemote({ importantDates: updated });
      return updated;
    });
  };

  const updateImportantDate = (id: string, updates: Partial<ImportantDate>) => {
    setImportantDates((prev) => {
      const updated = prev.map((d) => (d.id === id ? { ...d, ...updates } : d));
      commitToRemote({ importantDates: updated });
      return updated;
    });
  };

  const deleteImportantDate = (id: string) => {
    setImportantDates((prev) => {
      const updated = prev.filter((d) => d.id !== id);
      commitToRemote({ importantDates: updated });
      return updated;
    });
  };

  // Settings
  const updateSettings = (updates: Partial<AppSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...updates };
      commitToRemote({ settings: updated });
      return updated;
    });
  };

  // Export JSON
  const exportData = () => {
    const payload = {
      version: 1,
      exportTimestamp: new Date().toISOString(),
      subjects,
      timetable,
      records,
      importantDates,
      settings,
    };
    const jsonStr = JSON.stringify(payload, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `attendwise-backup-${formatDate(new Date())}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Import JSON
  const importData = (jsonData: string): boolean => {
    try {
      const parsed = JSON.parse(jsonData);
      if (parsed.subjects && Array.isArray(parsed.subjects)) {
        setSubjects(parsed.subjects);
      }
      if (parsed.timetable && Array.isArray(parsed.timetable)) {
        setTimetable(parsed.timetable);
      }
      if (parsed.records && Array.isArray(parsed.records)) {
        setRecords(parsed.records);
      }
      if (parsed.importantDates && Array.isArray(parsed.importantDates)) {
        setImportantDates(parsed.importantDates);
      }
      if (parsed.settings) {
        setSettings((prev) => ({ ...prev, ...parsed.settings }));
      }
      commitToRemote({
        subjects: parsed.subjects || subjects,
        timetable: parsed.timetable || timetable,
        records: parsed.records || records,
        importantDates: parsed.importantDates || importantDates,
        settings: parsed.settings || settings,
      });
      return true;
    } catch (e) {
      console.error('Import error', e);
      return false;
    }
  };

  // Export CSV
  const exportDataCSV = () => {
    const headers = ['Date', 'Subject Name', 'Subject Code', 'Status', 'Class Type', 'Compulsory Lab', 'Notes'];
    const subjectMap = new Map<string, Subject>(subjects.map((s) => [s.id, s]));
    const rows = records.map((r) => {
      const sub = subjectMap.get(r.subjectId);
      return [
        r.date,
        `"${(sub?.name || 'Unknown').replace(/"/g, '""')}"`,
        `"${(sub?.code || '').replace(/"/g, '""')}"`,
        r.status,
        r.classType,
        r.isCompulsoryLab ? 'Yes' : 'No',
        `"${(r.notes || '').replace(/"/g, '""')}"`,
      ].join(',');
    });
    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `attendwise-attendance-${formatDate(new Date())}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Reset to initial college sample data
  const resetToSampleData = () => {
    setSubjects(INITIAL_SUBJECTS);
    setTimetable(INITIAL_TIMETABLE);
    setRecords(generateSampleRecords());
    setImportantDates(INITIAL_IMPORTANT_DATES);
    setSettings(INITIAL_SETTINGS);
    commitToRemote({
      subjects: INITIAL_SUBJECTS,
      timetable: INITIAL_TIMETABLE,
      records: generateSampleRecords(),
      importantDates: INITIAL_IMPORTANT_DATES,
      settings: INITIAL_SETTINGS,
    });
  };

  // Clear all data (with cloud database synchronization)
  const clearAllData = async (options?: { recordsOnly?: boolean }): Promise<{ success: boolean; message: string }> => {
    isRemoteSyncInProgress.current = true;
    try {
      if (options?.recordsOnly) {
        setRecords([]);
        if (activeIdentifier) {
          persistUserLocalCache(activeIdentifier, {
            subjects,
            timetable,
            records: [],
            importantDates,
            settings,
          });
        }

        if (checkSupabaseConfigured() && activeIdentifier) {
          setCloudSyncStatus('syncing');
          const payload: UserAttendancePayload = {
            subjects,
            timetable,
            records: [],
            importantDates,
            settings,
          };
          await saveRemoteAttendance(activeIdentifier, cloudUser?.email, payload);
          setCloudSyncStatus('synced');
          setLastCloudSyncTime(Date.now());
        }
        return { success: true, message: 'All attendance history records have been cleared from local storage and backend database.' };
      } else {
        setSubjects([]);
        setTimetable([]);
        setRecords([]);
        setImportantDates([]);
        const cleanSettings = {
          ...INITIAL_SETTINGS,
          hasCompletedSetup: false,
        };
        setSettings(cleanSettings);

        if (activeIdentifier) {
          persistUserLocalCache(activeIdentifier, {
            subjects: [],
            timetable: [],
            records: [],
            importantDates: [],
            settings: cleanSettings,
          });
        }

        if (checkSupabaseConfigured() && activeIdentifier) {
          setCloudSyncStatus('syncing');
          await clearRemoteAttendance(activeIdentifier);
          setCloudSyncStatus('synced');
          setLastCloudSyncTime(Date.now());
        }
        return { success: true, message: 'Entire database cleared: all records, timetable slots, and subjects have been erased.' };
      }
    } catch (err: any) {
      console.error('Failed to clear data:', err);
      return { success: false, message: err?.message || 'Error occurred while clearing database.' };
    } finally {
      setTimeout(() => {
        isRemoteSyncInProgress.current = false;
      }, 700);
    }
  };

  return (
    <AttendanceContext.Provider
      value={{
        subjects,
        timetable,
        records,
        importantDates,
        settings,
        currentDate,
        setCurrentDate,
        isInitialLoading,
        isSupabaseConfigured: checkSupabaseConfigured(),
        supabaseConfig: supabaseConfigState,
        updateSupabaseCredentials,
        clearSupabaseCredentials,
        testDatabaseConnection,
        cloudUser,
        cloudSyncStatus,
        lastCloudSyncTime,
        cloudErrorMessage,
        deviceSyncId,
        setDeviceSyncId,
        activeIdentifier,
        syncNow,
        commitToRemote,
        uploadLocalToCloud,
        signUpWithEmail,
        signInWithEmail,
        signOutCloud,
        markAttendance,
        bulkMarkDay,
        clearDayAttendance,
        deleteRecord,
        addSubject,
        updateSubject,
        deleteSubject,
        addTimetableSlot,
        updateTimetableSlot,
        deleteTimetableSlot,
        addImportantDate,
        updateImportantDate,
        deleteImportantDate,
        updateSettings,
        exportData,
        exportDataJSON: exportData,
        exportDataCSV,
        importData,
        importDataJSON: importData,
        resetToSampleData,
        clearAllData,
      }}
    >
      {children}
    </AttendanceContext.Provider>
  );
};

export function useAttendance() {
  const context = useContext(AttendanceContext);
  if (!context) {
    throw new Error('useAttendance must be used within an AttendanceProvider');
  }
  return context;
}
