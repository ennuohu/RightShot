import type { User } from '@supabase/supabase-js';
import { supabase } from './supabase';

export type PersistProjectStatus = 'draft' | 'strategy_selected' | 'storyboard_ready' | 'submitted';

export type ProjectSummary = {
  id: string;
  name: string;
  category: string;
  status: PersistProjectStatus;
  updatedAt: string;
  previewUrl: string | null;
  currentVersionId: string | null;
};

export type ProjectVersionSummary = {
  id: string;
  versionIndex: number;
  status: PersistProjectStatus;
  createdAt: string;
  updatedAt: string;
};

export type LoadedProjectSnapshot = {
  projectId: string;
  versionId: string;
  status: PersistProjectStatus;
  recognitionSource: string;
  previews: string[];
  formSnapshot: {
    productName: string;
    category: string;
    goal: number;
    ageRange: [number, number];
    sellingPoints: string[];
    note: string;
  };
  strategyMode: string | null;
  activeTweaks: string[];
  advancedPrompt: string;
  scenes: Array<{
    id: string;
    visual: string;
    commands: string[];
  }>;
  updatedAt: string;
};

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

type StoredProjectRow = {
  id: string;
  name: string;
  category: string;
  status: PersistProjectStatus;
  updated_at: string;
  previews: unknown;
  current_version_id: string | null;
};

type StoredVersionRow = {
  id: string;
  version_index: number;
  status: PersistProjectStatus;
  strategy_mode: string | null;
  active_tweaks: unknown;
  advanced_prompt: string | null;
  form_snapshot: unknown;
  scenes: unknown;
  created_at: string;
  updated_at: string;
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

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

function asAgeRange(value: unknown): [number, number] {
  if (
    Array.isArray(value) &&
    value.length >= 2 &&
    typeof value[0] === 'number' &&
    typeof value[1] === 'number'
  ) {
    return [value[0], value[1]];
  }

  return [22, 40];
}

function asSceneArray(value: unknown) {
  if (!Array.isArray(value)) return [];

  return value
    .map((scene) => {
      if (!scene || typeof scene !== 'object') return null;
      const nextScene = scene as Record<string, unknown>;

      return {
        id: typeof nextScene.id === 'string' ? nextScene.id : '',
        visual: typeof nextScene.visual === 'string' ? nextScene.visual : '',
        commands: asStringArray(nextScene.commands),
      };
    })
    .filter(
      (scene): scene is { id: string; visual: string; commands: string[] } =>
        Boolean(scene && scene.id),
    );
}

function mapProjectSummary(row: StoredProjectRow): ProjectSummary {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    status: row.status,
    updatedAt: row.updated_at,
    previewUrl: asStringArray(row.previews)[0] ?? null,
    currentVersionId: row.current_version_id,
  };
}

export async function listProjectsForUser(user: User): Promise<ProjectSummary[]> {
  const client = requireClient();

  const { data, error } = await client
    .from('projects')
    .select('id, name, category, status, updated_at, previews, current_version_id')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false });

  if (error) {
    throw new Error(normalizeErrorMessage(error.message));
  }

  return (data as StoredProjectRow[]).map(mapProjectSummary);
}

export async function listVersionsForProject(
  user: User,
  projectId: string,
): Promise<ProjectVersionSummary[]> {
  const client = requireClient();

  const { data: project, error: projectError } = await client
    .from('projects')
    .select('id')
    .eq('id', projectId)
    .eq('user_id', user.id)
    .single();

  if (projectError || !project) {
    throw new Error(
      normalizeErrorMessage(projectError?.message ?? '没有找到这个项目，或者它不属于当前账号。'),
    );
  }

  const { data, error } = await client
    .from('project_versions')
    .select('id, version_index, status, created_at, updated_at')
    .eq('project_id', projectId)
    .order('version_index', { ascending: false });

  if (error) {
    throw new Error(normalizeErrorMessage(error.message));
  }

  return (data as Array<{
    id: string;
    version_index: number;
    status: PersistProjectStatus;
    created_at: string;
    updated_at: string;
  }>).map((row) => ({
    id: row.id,
    versionIndex: row.version_index,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

export async function loadProjectSnapshot(
  user: User,
  projectId: string,
  versionId?: string,
): Promise<LoadedProjectSnapshot> {
  const client = requireClient();

  const { data: project, error: projectError } = await client
    .from('projects')
    .select('id, recognition_source, previews, current_version_id, user_id')
    .eq('id', projectId)
    .eq('user_id', user.id)
    .single();

  if (projectError || !project) {
    throw new Error(
      normalizeErrorMessage(projectError?.message ?? '没有找到这个项目，或者它不属于当前账号。'),
    );
  }

  const targetVersionId = versionId ?? project.current_version_id;

  if (!targetVersionId) {
    throw new Error('这个项目还没有可恢复的版本。');
  }

  const { data: version, error: versionError } = await client
    .from('project_versions')
    .select(
      'id, version_index, status, strategy_mode, active_tweaks, advanced_prompt, form_snapshot, scenes, created_at, updated_at',
    )
    .eq('id', targetVersionId)
    .eq('project_id', projectId)
    .single();

  if (versionError || !version) {
    throw new Error(normalizeErrorMessage(versionError?.message ?? '没有找到这个版本。'));
  }

  const formSnapshot =
    version.form_snapshot && typeof version.form_snapshot === 'object'
      ? (version.form_snapshot as Record<string, unknown>)
      : {};

  return {
    projectId,
    versionId: version.id,
    status: version.status,
    recognitionSource:
      typeof project.recognition_source === 'string' ? project.recognition_source : '已恢复历史项目',
    previews: asStringArray(project.previews),
    formSnapshot: {
      productName:
        typeof formSnapshot.productName === 'string' ? formSnapshot.productName : '',
      category: typeof formSnapshot.category === 'string' ? formSnapshot.category : 'tool',
      goal: typeof formSnapshot.goal === 'number' ? formSnapshot.goal : 50,
      ageRange: asAgeRange(formSnapshot.ageRange),
      sellingPoints: asStringArray(formSnapshot.sellingPoints),
      note: typeof formSnapshot.note === 'string' ? formSnapshot.note : '',
    },
    strategyMode: version.strategy_mode,
    activeTweaks: asStringArray(version.active_tweaks),
    advancedPrompt: version.advanced_prompt ?? '',
    scenes: asSceneArray(version.scenes),
    updatedAt: version.updated_at,
  };
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
    const { data: existingVersion, error: existingVersionError } = await client
      .from('project_versions')
      .select('id, version_index, status')
      .eq('id', nextVersionId)
      .eq('project_id', nextProjectId)
      .single();

    if (existingVersionError || !existingVersion) {
      throw new Error(
        normalizeErrorMessage(existingVersionError?.message ?? '没有找到当前版本。'),
      );
    }

    if (existingVersion.status !== input.status) {
      const { data, error } = await client
        .from('project_versions')
        .insert({
          ...versionPayload,
          version_index: existingVersion.version_index + 1,
        })
        .select('id')
        .single();

      if (error) {
        throw new Error(normalizeErrorMessage(error.message));
      }

      nextVersionId = data.id;
    } else {
      const { error } = await client
        .from('project_versions')
        .update(versionPayload)
        .eq('id', nextVersionId);

      if (error) {
        throw new Error(normalizeErrorMessage(error.message));
      }
    }
  } else {
    const { data, error } = await client
      .from('project_versions')
      .insert({ ...versionPayload, version_index: 1 })
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
