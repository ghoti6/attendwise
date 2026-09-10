import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { AppSettings, AttendanceRecord, ImportantDate, Subject, TimetableSlot } from '../types';

export const STORAGE_KEYS_SUPABASE = {
  URL: 'attendwise_supabase_url',
  ANON_KEY: 'attendwise_supabase_anon_key',
};

// Retrieve configured Supabase URL & Key from localStorage or Vite environment variables
export function getSupabaseConfig(): { url: string; anonKey: string; source: 'env' | 'custom' | 'none' } {
  const envUrl = import.meta.env.SUPABASE_URL?.trim() || '';
  const envKey = import.meta.env.SUPABASE_ANON_KEY?.trim() || '';

  let customUrl = '';
  let customKey = '';
  if (typeof window !== 'undefined') {
    try {
      customUrl = localStorage.getItem(STORAGE_KEYS_SUPABASE.URL)?.trim() || '';
      customKey = localStorage.getItem(STORAGE_KEYS_SUPABASE.ANON_KEY)?.trim() || '';
    } catch {
      // LocalStorage access fallback
    }
  }

  if (customUrl && customKey) {
    return { url: customUrl, anonKey: customKey, source: 'custom' };
  }
  if (envUrl && envKey) {
    return { url: envUrl, anonKey: envKey, source: 'env' };
  }
  return { url: '', anonKey: '', source: 'none' };
}

export function isSupabaseConfigured(): boolean {
  const { url, anonKey } = getSupabaseConfig();
  return Boolean(url && anonKey && url.startsWith('http'));
}

let supabaseInstance: SupabaseClient | null = null;
let currentConfigKey = '';

export function getSupabaseClient(): SupabaseClient | null {
  const { url, anonKey } = getSupabaseConfig();
  if (!url || !anonKey || !url.startsWith('http')) {
    supabaseInstance = null;
    currentConfigKey = '';
    return null;
  }

  const newKey = `${url}::${anonKey}`;
  if (!supabaseInstance || currentConfigKey !== newKey) {
    currentConfigKey = newKey;
    supabaseInstance = createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  }
  return supabaseInstance;
}

export function saveCustomSupabaseCredentials(url: string, anonKey: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEYS_SUPABASE.URL, url.trim());
    localStorage.setItem(STORAGE_KEYS_SUPABASE.ANON_KEY, anonKey.trim());
    supabaseInstance = null;
    currentConfigKey = '';
  }
}

export function clearCustomSupabaseCredentials(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEYS_SUPABASE.URL);
    localStorage.removeItem(STORAGE_KEYS_SUPABASE.ANON_KEY);
    supabaseInstance = null;
    currentConfigKey = '';
  }
}

export interface UserAttendancePayload {
  subjects: Subject[];
  timetable: TimetableSlot[];
  records: AttendanceRecord[];
  importantDates: ImportantDate[];
  settings: AppSettings;
  lastUpdated?: number;
}

export const SUPABASE_SQL_SETUP_SCRIPT = `-- Run this in your Supabase project's SQL Editor (supabase.com -> Dashboard -> SQL Editor)
create table if not exists public.user_attendance_state (
  user_id text primary key,
  user_email text,
  subjects jsonb not null default '[]'::jsonb,
  timetable jsonb not null default '[]'::jsonb,
  records jsonb not null default '[]'::jsonb,
  important_dates jsonb not null default '[]'::jsonb,
  settings jsonb not null default '{}'::jsonb,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table public.user_attendance_state enable row level security;

-- Drop previous policies if re-running
drop policy if exists "Allow access to attendance state" on public.user_attendance_state;
drop policy if exists "Allow authenticated and paired access to attendance state" on public.user_attendance_state;

-- Policy allowing access to attendance state
create policy "Allow access to attendance state"
  on public.user_attendance_state for all
  using (true)
  with check (true);

-- Enable Realtime for cross-device instant synchronization
alter publication supabase_realtime add table public.user_attendance_state;
`;

/**
 * Tests the connection to the Supabase project and verifies if the user_attendance_state table exists.
 */
export async function testSupabaseConnection(): Promise<{ ok: boolean; message: string; isMissingTable?: boolean }> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { ok: false, message: 'Supabase URL or Anon Key is missing or invalid.' };
  }

  try {
    const { error } = await supabase
      .from('user_attendance_state')
      .select('user_id')
      .limit(1);

    if (error) {
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        return {
          ok: false,
          isMissingTable: true,
          message: 'Connected to Supabase project, but table "user_attendance_state" does not exist yet. Please run the SQL setup script in your Supabase SQL Editor.',
        };
      }
      return {
        ok: false,
        message: `Database error (${error.code || 'Notice'}): ${error.message}`,
      };
    }

    return { ok: true, message: 'Successfully connected to Supabase and verified attendance table!' };
  } catch (err: any) {
    return { ok: false, message: err?.message || 'Network connection error while contacting Supabase.' };
  }
}

export interface RemoteAttendanceResult {
  data: UserAttendancePayload | null;
  error?: string;
  isNotFound?: boolean;
}

/**
 * Fetch remote state from Supabase for a given user or sync code
 */
export async function fetchRemoteAttendance(
  identifier: string,
  userEmail?: string
): Promise<RemoteAttendanceResult> {
  if (!identifier) return { data: null, error: 'No user ID provided' };
  const supabase = getSupabaseClient();
  if (!supabase) return { data: null, error: 'Supabase client is not configured' };

  try {
    // 1. First attempt: Query with the exact identifier
    const { data: primaryData, error: primaryError } = await supabase
      .from('user_attendance_state')
      .select('user_id, user_email, subjects, timetable, records, important_dates, settings, updated_at')
      .eq('user_id', identifier)
      .maybeSingle();

    if (primaryError) {
      console.warn('Supabase fetch notice on primary identifier:', primaryError.message);
    }

    let chosenRow = primaryData;

    // Check if primary row is empty or missing (e.g., subjects is [] and records is [])
    const isPrimaryEmpty =
      !chosenRow ||
      ((!Array.isArray(chosenRow.subjects) || chosenRow.subjects.length === 0) &&
        (!Array.isArray(chosenRow.records) || chosenRow.records.length === 0));

    // 2. If primary row is empty or not found, search for candidate rows (e.g. usr_ prefix or user_email)
    if (isPrimaryEmpty) {
      const alternateId = identifier.startsWith('usr_')
        ? identifier.replace(/^usr_/, '')
        : `usr_${identifier}`;

      // Try alternate identifier with or without usr_
      const { data: altData } = await supabase
        .from('user_attendance_state')
        .select('user_id, user_email, subjects, timetable, records, important_dates, settings, updated_at')
        .eq('user_id', alternateId)
        .maybeSingle();

      if (altData && Array.isArray(altData.subjects) && altData.subjects.length > 0) {
        chosenRow = altData;
      } else if (userEmail) {
        // Try searching by user_email
        const { data: emailRows } = await supabase
          .from('user_attendance_state')
          .select('user_id, user_email, subjects, timetable, records, important_dates, settings, updated_at')
          .eq('user_email', userEmail)
          .order('updated_at', { ascending: false });

        if (Array.isArray(emailRows) && emailRows.length > 0) {
          const populatedRow = emailRows.find(
            (r) => Array.isArray(r.subjects) && r.subjects.length > 0
          );
          if (populatedRow) {
            chosenRow = populatedRow;
          }
        }
      }
    }

    if (!chosenRow) {
      if (primaryError) {
        return { data: null, error: primaryError.message };
      }
      return { data: null, isNotFound: true };
    }

    const payload: UserAttendancePayload = {
      subjects: Array.isArray(chosenRow.subjects) ? chosenRow.subjects : [],
      timetable: Array.isArray(chosenRow.timetable) ? chosenRow.timetable : [],
      records: Array.isArray(chosenRow.records) ? chosenRow.records : [],
      importantDates: Array.isArray(chosenRow.important_dates) ? chosenRow.important_dates : [],
      settings:
        typeof chosenRow.settings === 'object' && chosenRow.settings !== null
          ? chosenRow.settings
          : ({} as AppSettings),
      lastUpdated: chosenRow.updated_at ? new Date(chosenRow.updated_at).getTime() : Date.now(),
    };

    return { data: payload };
  } catch (err: any) {
    console.error('Failed to fetch from Supabase:', err);
    return { data: null, error: err?.message || 'Network error while fetching from Supabase' };
  }
}

/**
 * Save remote state to Supabase
 */
export async function saveRemoteAttendance(
  identifier: string,
  userEmail: string | undefined,
  payload: UserAttendancePayload
): Promise<{ success: boolean; error?: string }> {
  if (!identifier) {
    return { success: false, error: 'No user ID provided to update database.' };
  }
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { success: false, error: 'Supabase client is not configured with valid credentials.' };
  }

  try {
    const updatePayload = {
      user_id: identifier,
      user_email: userEmail || null,
      subjects: payload.subjects ?? [],
      timetable: payload.timetable ?? [],
      records: payload.records ?? [],
      important_dates: payload.importantDates ?? [],
      settings: payload.settings ?? {},
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('user_attendance_state')
      .upsert(updatePayload, { onConflict: 'user_id' });

    if (error) {
      console.error('Supabase upsert error:', error);
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        return {
          success: false,
          error: 'Table "user_attendance_state" does not exist in your Supabase project. Run the SQL script from Settings.',
        };
      }

      // Fallback: If onConflict failed or RLS constraint mismatch, try check and update/insert
      if (error.message?.includes('conflict') || error.code === '42P10') {
        const { data: existing } = await supabase
          .from('user_attendance_state')
          .select('user_id')
          .eq('user_id', identifier)
          .maybeSingle();

        if (existing) {
          const { error: updateError } = await supabase
            .from('user_attendance_state')
            .update(updatePayload)
            .eq('user_id', identifier);
          if (!updateError) return { success: true };
          return { success: false, error: updateError.message };
        } else {
          const { error: insertError } = await supabase
            .from('user_attendance_state')
            .insert(updatePayload);
          if (!insertError) return { success: true };
          return { success: false, error: insertError.message };
        }
      }

      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    console.error('Failed to save to Supabase:', err);
    return { success: false, error: err?.message || 'Network error while saving to Supabase' };
  }
}

/**
 * Clear/reset remote state in Supabase for a given user or sync code
 */
export async function clearRemoteAttendance(
  identifier: string
): Promise<{ success: boolean; error?: string }> {
  if (!identifier) {
    return { success: false, error: 'No user ID provided.' };
  }
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { success: false, error: 'Supabase client is not configured.' };
  }

  try {
    // Attempt upsert with empty data so that the row is preserved with empty records
    const { error: upsertError } = await supabase
      .from('user_attendance_state')
      .upsert(
        {
          user_id: identifier,
          subjects: [],
          timetable: [],
          records: [],
          important_dates: [],
          settings: {},
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      );

    if (upsertError) {
      // Fallback: try direct delete
      const { error: delError } = await supabase
        .from('user_attendance_state')
        .delete()
        .eq('user_id', identifier);

      if (delError) {
        return { success: false, error: delError.message };
      }
    }

    return { success: true };
  } catch (err: any) {
    console.error('Failed to clear remote attendance in Supabase:', err);
    return { success: false, error: err?.message || 'Error clearing database records' };
  }
}

/**
 * Subscribe to realtime updates for a user/device ID
 */
export function subscribeToRemoteAttendance(
  identifier: string,
  onRemoteUpdate: (payload: UserAttendancePayload) => void
): () => void {
  if (!identifier) return () => {};
  const supabase = getSupabaseClient();
  if (!supabase) return () => {};

  try {
    const channel = supabase
      .channel(`attendance-${identifier}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_attendance_state',
          filter: `user_id=eq.${identifier}`,
        },
        (payload) => {
          const newData = payload.new as any;
          if (newData) {
            onRemoteUpdate({
              subjects: Array.isArray(newData.subjects) ? newData.subjects : [],
              timetable: Array.isArray(newData.timetable) ? newData.timetable : [],
              records: Array.isArray(newData.records) ? newData.records : [],
              importantDates: Array.isArray(newData.important_dates) ? newData.important_dates : [],
              settings: typeof newData.settings === 'object' && newData.settings !== null ? newData.settings : ({} as AppSettings),
              lastUpdated: newData.updated_at ? new Date(newData.updated_at).getTime() : Date.now(),
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  } catch (err) {
    console.error('Failed to subscribe to realtime attendance:', err);
    return () => {};
  }
}
