import type { User } from '@supabase/supabase-js';
import { supabase } from './supabase';

export type PersistProjectStatus = 'draft' | 'strategy_selected' | 'storyboard_ready' | 'submitted';

type PersistProjectInput = {
  user: User;
  projectId?: string | null;
  versionId?: string | null;
  projectName: string;
  category: string;
  recognitionSource: string;
  previews: string[];
  goal: number;
  ageRange: [number, number];
  sellingPoints: string[];
  note: string;
  status: PersistProjectStatus;
  strategyMode?: string | null;
  activeTweaks?: string[];
  advancedPrompt?: string;
  formSnapshot: Record<string, unknown>;
  strategySnapshot?: Record<string, unknown> | null;
  scenes?: Array<Record<string, unknown>>;
};

type PersistProjectResult = {
  projectId: string;
  versionId: string;
};

function requireClient() {
  if (!supabase) {
    throw new Error('Supabase client is not configured.');
  }

  return supabase;
}

function normalizeErrorMessage(message: string) {
  if (message.includes('relation') && message.includes('does not exist')) {
    return 'Supabase 数据表还没创建，请先执行 supabase/schema.sql。';
  }

  if (message.includes('row-level security') || message.includes('permission denied')) {
    return '数据库权限策略还没配置完成，请先执行 supabase/schema.sql。';
  }

  return message;
}

async function ensureProfile(user: User) {
  const client = requireClient();
  const fullName =
    user.user_metadata?.full_name ??
    user.user_metadata?.name ??
    user.email?.split('@')[0] ??
    null;

  const { error } = await client.from('profiles').upsert(
    {
      id: user.id,
      email: user.email ?? null,
      full_name: fullName,
      avatar_url: user.user_metadata?.avatar_url ?? null,
    },
    { onConflict: 'id' },
  );

  if (error) {
    throw new Error(normalizeErrorMessage(error.message));
  }
}

export async function persistProjectSnapshot(
  input: PersistProjectInput,
): Promise<PersistProjectResult> {
  const client = requireClient();
  await ensureProfile(input.user);

  const now = new Date().toISOString();
  const projectPayload = {
    user_id: input.user.id,
    name: input.projectName,
    category: input.category,
    status: input.status,
    recognition_source: input.recognitionSource,
    goal: input.goal,
    age_range: input.ageRange,
    selling_points: input.sellingPoints,
    previews: input.previews,
    note: input.note,
    updated_at: now,
  };

  let nextProjectId = input.projectId ?? null;

  if (nextProjectId) {
    const { error } = await client
      .from('projects')
      .update(projectPayload)
      .eq('id', nextProjectId)
      .eq('user_id', input.user.id);

    if (error) {
      throw new Error(normalizeErrorMessage(error.message));
    }
  } else {
    const { data, error } = await client
      .from('projects')
      .insert(projectPayload)
      .select('id')
      .single();

    if (error) {
      throw new Error(normalizeErrorMessage(error.message));
    }

    nextProjectId = data.id;
  }

  const versionPayload = {
    project_id: nextProjectId,
    version_index: 1,
    status: input.status,
    strategy_mode: input.strategyMode ?? null,
    active_tweaks: input.activeTweaks ?? [],
    advanced_prompt: input.advancedPrompt ?? '',
    form_snapshot: input.formSnapshot,
    strategy_snapshot: input.strategySnapshot ?? null,
    scenes: input.scenes ?? [],
    updated_at: now,
  };

  let nextVersionId = input.versionId ?? null;

  if (nextVersionId) {
    const { error } = await client
      .from('project_versions')
      .update(versionPayload)
      .eq('id', nextVersionId);

    if (error) {
      throw new Error(normalizeErrorMessage(error.message));
    }
  } else {
    const { data, error } = await client
      .from('project_versions')
      .insert(versionPayload)
      .select('id')
      .single();

    if (error) {
      throw new Error(normalizeErrorMessage(error.message));
    }

    nextVersionId = data.id;
  }

  const { error: linkError } = await client
    .from('projects')
    .update({ current_version_id: nextVersionId, updated_at: now })
    .eq('id', nextProjectId)
    .eq('user_id', input.user.id);

  if (linkError) {
    throw new Error(normalizeErrorMessage(linkError.message));
  }

  return {
    projectId: nextProjectId,
    versionId: nextVersionId,
  };
}
