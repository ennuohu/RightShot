import type { User } from '@supabase/supabase-js';
import { supabase } from './supabase';
import type { TrialProfile } from '../TrialApplicationScreen';

type StoredProfileRow = {
  id: string;
  full_name: string | null;
  company_name: string | null;
  role_title: string | null;
  use_case: string | null;
  trial_status: string | null;
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

function mapTrialProfile(row: StoredProfileRow | null, user: User): TrialProfile {
  return {
    fullName: row?.full_name ?? user.user_metadata?.full_name ?? user.email?.split('@')[0] ?? '',
    companyName: row?.company_name ?? '',
    roleTitle: row?.role_title ?? '',
    useCase: row?.use_case ?? '',
    trialStatus: row?.trial_status === 'applied' ? 'applied' : 'not_applied',
  };
}

export async function getTrialProfile(user: User): Promise<TrialProfile> {
  const client = requireClient();

  const { data, error } = await client
    .from('profiles')
    .select('id, full_name, company_name, role_title, use_case, trial_status')
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
        trial_status: 'applied',
        trial_submitted_at: new Date().toISOString(),
      },
      { onConflict: 'id' },
    )
    .select('id, full_name, company_name, role_title, use_case, trial_status')
    .single();

  if (error) {
    throw new Error(normalizeErrorMessage(error.message));
  }

  return mapTrialProfile(data as StoredProfileRow, user);
}
