import type { User } from '@supabase/supabase-js';
import { supabase } from './supabase';
import { isAdminEmail, isTesterEmail } from './accessControl';
import type { TrialApplicationRecord, TrialProfile, TrialStatus } from './trialTypes';

type StoredProfileRow = {
  id: string;
  email: string | null;
  full_name: string | null;
  company_name: string | null;
  role_title: string | null;
  use_case: string | null;
  trial_status: string | null;
  access_role: string | null;
  trial_submitted_at: string | null;
  updated_at: string | null;
};

function requireClient() {
  if (!supabase) {
    throw new Error('Supabase client is not configured.');
  }

  return supabase;
}

function normalizeErrorMessage(message: string) {
  if (message.includes('relation') && message.includes('does not exist')) {
    return 'Supabase 数据表还没创建，请先重新执行 supabase/schema.sql。';
  }

  if (message.includes('column') && message.includes('does not exist')) {
    return 'profiles 表结构还没更新，请重新执行 supabase/schema.sql。';
  }

  if (message.includes('row-level security') || message.includes('permission denied')) {
    return '数据库权限策略还没配置完成，请先重新执行 supabase/schema.sql。';
  }

  return message;
}

function normalizeTrialStatus(status: string | null | undefined, email?: string | null): TrialStatus {
  if (isTesterEmail(email)) return 'tester';
  if (status === 'pending' || status === 'approved' || status === 'tester' || status === 'rejected') {
    return status;
  }
  return 'not_applied';
}

function normalizeAccessRole(role: string | null | undefined, email?: string | null) {
  if (isAdminEmail(email)) return 'admin' as const;
  return role === 'admin' ? ('admin' as const) : ('user' as const);
}

function mapTrialProfile(row: StoredProfileRow | null, user: User): TrialProfile {
  return {
    fullName: row?.full_name ?? user.user_metadata?.full_name ?? user.email?.split('@')[0] ?? '',
    companyName: row?.company_name ?? '',
    roleTitle: row?.role_title ?? '',
    useCase: row?.use_case ?? '',
    trialStatus: normalizeTrialStatus(row?.trial_status, row?.email ?? user.email),
    accessRole: normalizeAccessRole(row?.access_role, row?.email ?? user.email),
  };
}

function mapTrialRecord(row: StoredProfileRow): TrialApplicationRecord {
  return {
    id: row.id,
    email: row.email ?? '',
    fullName: row.full_name ?? '',
    companyName: row.company_name ?? '',
    roleTitle: row.role_title ?? '',
    useCase: row.use_case ?? '',
    trialStatus: normalizeTrialStatus(row.trial_status, row.email),
    accessRole: normalizeAccessRole(row.access_role, row.email),
    trialSubmittedAt: row.trial_submitted_at,
    updatedAt: row.updated_at ?? '',
  };
}

async function upsertPrivilegedProfile(user: User) {
  const client = requireClient();

  const { error } = await client.from('profiles').upsert(
    {
      id: user.id,
      email: user.email ?? null,
      avatar_url: user.user_metadata?.avatar_url ?? null,
      full_name: user.user_metadata?.full_name ?? user.email?.split('@')[0] ?? null,
      trial_status: isTesterEmail(user.email) ? 'tester' : 'approved',
      access_role: isAdminEmail(user.email) ? 'admin' : 'user',
      trial_submitted_at: new Date().toISOString(),
    },
    { onConflict: 'id' },
  );

  if (error) {
    throw new Error(normalizeErrorMessage(error.message));
  }
}

export async function getTrialProfile(user: User): Promise<TrialProfile> {
  const client = requireClient();

  if (isTesterEmail(user.email) || isAdminEmail(user.email)) {
    await upsertPrivilegedProfile(user);
  }

  const { data, error } = await client
    .from('profiles')
    .select(
      'id, email, full_name, company_name, role_title, use_case, trial_status, access_role, trial_submitted_at, updated_at',
    )
    .eq('id', user.id)
    .maybeSingle();

  if (error) {
    throw new Error(normalizeErrorMessage(error.message));
  }

  return mapTrialProfile(data as StoredProfileRow | null, user);
}

export async function submitTrialApplication(
  user: User,
  payload: {
    fullName: string;
    companyName: string;
    roleTitle: string;
    useCase: string;
  },
): Promise<TrialProfile> {
  const client = requireClient();

  const nextStatus: TrialStatus = isTesterEmail(user.email) ? 'tester' : 'pending';
  const nextRole = isAdminEmail(user.email) ? 'admin' : 'user';

  const { data, error } = await client
    .from('profiles')
    .upsert(
      {
        id: user.id,
        email: user.email ?? null,
        avatar_url: user.user_metadata?.avatar_url ?? null,
        full_name: payload.fullName,
        company_name: payload.companyName,
        role_title: payload.roleTitle,
        use_case: payload.useCase,
        trial_status: nextStatus,
        access_role: nextRole,
        trial_submitted_at: new Date().toISOString(),
      },
      { onConflict: 'id' },
    )
    .select(
      'id, email, full_name, company_name, role_title, use_case, trial_status, access_role, trial_submitted_at, updated_at',
    )
    .single();

  if (error) {
    throw new Error(normalizeErrorMessage(error.message));
  }

  return mapTrialProfile(data as StoredProfileRow, user);
}

export async function listTrialApplications(user: User): Promise<TrialApplicationRecord[]> {
  const client = requireClient();

  const { data, error } = await client
    .from('profiles')
    .select(
      'id, email, full_name, company_name, role_title, use_case, trial_status, access_role, trial_submitted_at, updated_at',
    )
    .order('trial_submitted_at', { ascending: false, nullsFirst: false })
    .order('updated_at', { ascending: false });

  if (error) {
    throw new Error(normalizeErrorMessage(error.message));
  }

  return (data as StoredProfileRow[]).map(mapTrialRecord);
}

export async function updateTrialApplicationStatus(
  targetId: string,
  status: TrialStatus,
): Promise<void> {
  const client = requireClient();
  const updatePayload: Record<string, unknown> = {
    trial_status: status,
  };

  if (status === 'approved' || status === 'tester') {
    updatePayload.approved_at = new Date().toISOString();
  }

  if (status === 'tester') {
    updatePayload.access_role = 'admin';
  }

  const { error } = await client.from('profiles').update(updatePayload).eq('id', targetId);

  if (error) {
    throw new Error(normalizeErrorMessage(error.message));
  }
}
