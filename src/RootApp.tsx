import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { Layers3, LoaderCircle, LogOut, Sparkles } from 'lucide-react';
import AdminApplicationsScreen from './AdminApplicationsScreen';
import LegacyApp from './App';
import AuthScreen from './AuthScreen';
import LandingScreen from './LandingScreen';
import PrototypeV2 from './PrototypeV2';
import TrialApplicationScreen from './TrialApplicationScreen';
import TrialPendingScreen from './TrialPendingScreen';
import { isAdminEmail, isTesterEmail } from './lib/accessControl';
import { isSupabaseConfigured, supabase } from './lib/supabase';
import {
  getTrialProfile,
  listTrialApplications,
  submitTrialApplication,
  updateTrialApplicationStatus,
} from './lib/trialAccess';
import type { TrialApplicationRecord, TrialProfile, TrialStatus } from './lib/trialTypes';

type ViewMode = 'v2' | 'legacy';
type PublicView = 'landing' | 'auth';
type WorkspaceView = 'tool' | 'admin';

const STORAGE_KEY = 'ai_ad_ui_mode';

function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#020202] px-6 text-white">
      <div className="rounded-[28px] border border-white/10 bg-white/[0.04] px-8 py-6 text-center shadow-[0_24px_80px_rgba(0,0,0,0.42)] backdrop-blur-2xl">
        <LoaderCircle size={24} className="mx-auto animate-spin text-white/70" />
        <p className="mt-4 text-sm text-white/60">正在确认访问状态...</p>
      </div>
    </div>
  );
}

function MissingConfigScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#020202] px-6 text-white">
      <div className="max-w-xl rounded-[32px] border border-white/10 bg-white/[0.04] p-8 shadow-[0_24px_80px_rgba(0,0,0,0.42)] backdrop-blur-2xl">
        <p className="text-xs uppercase tracking-[0.3em] text-white/36">Configuration Required</p>
        <h1 className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-white">
          Supabase 环境变量还没配置完成
        </h1>
        <p className="mt-4 text-sm leading-7 text-white/60">
          请先配置 `VITE_SUPABASE_URL` 和 `VITE_SUPABASE_ANON_KEY`，然后刷新页面。当前站点已经接入登录与试用门禁，但缺少必要的前端连接参数。
        </p>
      </div>
    </div>
  );
}

export default function RootApp() {
  const [mode, setMode] = useState<ViewMode>('v2');
  const [publicView, setPublicView] = useState<PublicView>('landing');
  const [authReady, setAuthReady] = useState(!isSupabaseConfigured);
  const [session, setSession] = useState<Session | null>(null);
  const [trialProfile, setTrialProfile] = useState<TrialProfile | null>(null);
  const [trialReady, setTrialReady] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [workspaceView, setWorkspaceView] = useState<WorkspaceView>('tool');
  const [applications, setApplications] = useState<TrialApplicationRecord[]>([]);
  const [applicationsReady, setApplicationsReady] = useState(false);
  const [applicationsMessage, setApplicationsMessage] = useState('');
  const [isUpdatingApplication, setIsUpdatingApplication] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY) as ViewMode | null;
    if (saved === 'v2' || saved === 'legacy') {
      setMode(saved);
    }
  }, []);

  useEffect(() => {
    if (!supabase) {
      return;
    }

    let active = true;

    void supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session ?? null);
      setAuthReady(true);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!active) return;
      setSession(nextSession);
      setTrialReady(false);
      setIsSigningOut(false);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!session) {
      setTrialProfile(null);
      setTrialReady(true);
      setApplications([]);
      setApplicationsReady(false);
      return;
    }

    let active = true;
    setTrialReady(false);

    void getTrialProfile(session.user)
      .then((profile) => {
        if (!active) return;
        setTrialProfile(profile);
      })
      .catch(() => {
        if (!active) return;
        setTrialProfile({
          fullName:
            session.user.user_metadata?.full_name ??
            session.user.email?.split('@')[0] ??
            '',
          companyName: '',
          roleTitle: '',
          useCase: '',
          trialStatus: isTesterEmail(session.user.email) ? 'tester' : 'not_applied',
          accessRole: isAdminEmail(session.user.email) ? 'admin' : 'user',
        });
      })
      .finally(() => {
        if (!active) return;
        setTrialReady(true);
      });

    return () => {
      active = false;
    };
  }, [session]);

  useEffect(() => {
    if (!session || !isAdminEmail(session.user.email)) {
      setApplications([]);
      setApplicationsReady(true);
      return;
    }

    let active = true;
    setApplicationsReady(false);

    void listTrialApplications(session.user)
      .then((nextApplications) => {
        if (!active) return;
        setApplications(nextApplications);
        setApplicationsMessage('');
      })
      .catch((error) => {
        if (!active) return;
        setApplicationsMessage(error instanceof Error ? error.message : '读取申请列表失败。');
      })
      .finally(() => {
        if (!active) return;
        setApplicationsReady(true);
      });

    return () => {
      active = false;
    };
  }, [session, trialProfile?.trialStatus]);

  const handleModeChange = (nextMode: ViewMode) => {
    setMode(nextMode);
    window.localStorage.setItem(STORAGE_KEY, nextMode);
  };

  const handleSignOut = async () => {
    if (!supabase) return;

    setIsSigningOut(true);
    const { error } = await supabase.auth.signOut();

    if (error) {
      setIsSigningOut(false);
      return;
    }

    setSession(null);
    setTrialProfile(null);
    setTrialReady(true);
    setWorkspaceView('tool');
    setPublicView('landing');
    setIsSigningOut(false);
  };

  const handleTrialSubmit = async (payload: {
    fullName: string;
    companyName: string;
    roleTitle: string;
    useCase: string;
  }) => {
    if (!session) return;
    const nextProfile = await submitTrialApplication(session.user, payload);
    setTrialProfile(nextProfile);
  };

  const refreshApplications = async () => {
    if (!session) return;

    setApplicationsReady(false);

    try {
      const nextApplications = await listTrialApplications(session.user);
      setApplications(nextApplications);
      setApplicationsMessage('');
    } catch (error) {
      setApplicationsMessage(error instanceof Error ? error.message : '读取申请列表失败。');
    } finally {
      setApplicationsReady(true);
    }
  };

  const handleUpdateApplicationStatus = async (targetId: string, status: TrialStatus) => {
    setIsUpdatingApplication(true);

    try {
      await updateTrialApplicationStatus(targetId, status);
      await refreshApplications();

      if (session && targetId === session.user.id) {
        const nextProfile = await getTrialProfile(session.user);
        setTrialProfile(nextProfile);
      }
    } catch (error) {
      setApplicationsMessage(error instanceof Error ? error.message : '更新申请状态失败。');
    } finally {
      setIsUpdatingApplication(false);
    }
  };

  if (!isSupabaseConfigured) {
    return <MissingConfigScreen />;
  }

  if (!authReady) {
    return <LoadingScreen />;
  }

  if (!session) {
    if (publicView === 'landing') {
      return (
        <LandingScreen
          onApplyTrial={() => setPublicView('auth')}
          onLogin={() => setPublicView('auth')}
        />
      );
    }

    return <AuthScreen onBack={() => setPublicView('landing')} />;
  }

  if (!trialReady) {
    return <LoadingScreen />;
  }

  const isPrivileged = isTesterEmail(session.user.email) || isAdminEmail(session.user.email);
  const canUseTool =
    isPrivileged ||
    trialProfile?.trialStatus === 'approved' ||
    trialProfile?.trialStatus === 'tester';

  if ((!trialProfile || trialProfile.trialStatus === 'not_applied') && !isPrivileged) {
    return (
      <TrialApplicationScreen
        user={session.user}
        initialProfile={trialProfile}
        onSubmit={handleTrialSubmit}
        onSignOut={() => void handleSignOut()}
      />
    );
  }

  if (!canUseTool) {
    return (
      <TrialPendingScreen
        user={session.user}
        profile={trialProfile}
        onSignOut={() => void handleSignOut()}
      />
    );
  }

  const userLabel =
    trialProfile?.fullName ||
    session.user.user_metadata?.full_name ||
    session.user.email ||
    session.user.phone ||
    '已登录';

  return (
    <div className="relative">
      {workspaceView === 'admin' ? (
        <AdminApplicationsScreen
          applications={applications}
          isLoading={!applicationsReady}
          isUpdating={isUpdatingApplication}
          message={applicationsMessage}
          onRefresh={() => void refreshApplications()}
          onUpdateStatus={(id, status) => void handleUpdateApplicationStatus(id, status)}
        />
      ) : mode === 'v2' ? (
        <PrototypeV2 user={session.user} />
      ) : (
        <LegacyApp />
      )}

      <div className="fixed right-4 top-4 z-[60] rounded-[24px] border border-white/10 bg-black/60 p-2 shadow-[0_18px_50px_rgba(0,0,0,0.28)] backdrop-blur-2xl">
        <div className="flex flex-wrap items-center gap-2 rounded-[18px] bg-white/[0.04] p-1">
          <div className="hidden items-center gap-2 rounded-[14px] border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white/70 sm:inline-flex">
            <span className="max-w-[180px] truncate">{userLabel}</span>
          </div>

          <button
            type="button"
            onClick={() => {
              setWorkspaceView('tool');
              handleModeChange('v2');
            }}
            className={`inline-flex items-center gap-2 rounded-[14px] px-4 py-2 text-sm transition ${
              workspaceView !== 'admin' && mode === 'v2'
                ? 'bg-white text-[#050505] shadow-md'
                : 'text-white/64 hover:bg-white/[0.08]'
            }`}
          >
            <Sparkles size={14} />
            拍对
          </button>

          {workspaceView !== 'admin' && (
            <button
              type="button"
              onClick={() => {
                setWorkspaceView('tool');
                handleModeChange('legacy');
              }}
              className={`inline-flex items-center gap-2 rounded-[14px] px-4 py-2 text-sm transition ${
                mode === 'legacy'
                  ? 'bg-white text-[#050505] shadow-md'
                  : 'text-white/64 hover:bg-white/[0.08]'
              }`}
            >
              <Layers3 size={14} />
              旧版
            </button>
          )}

          {isAdminEmail(session.user.email) && (
            <button
              type="button"
              onClick={() => setWorkspaceView((current) => (current === 'tool' ? 'admin' : 'tool'))}
              className={`inline-flex items-center gap-2 rounded-[14px] px-4 py-2 text-sm transition ${
                workspaceView === 'admin'
                  ? 'bg-white text-[#050505] shadow-md'
                  : 'text-white/64 hover:bg-white/[0.08]'
              }`}
            >
              <Sparkles size={14} />
              后台
            </button>
          )}

          <button
            type="button"
            onClick={() => void handleSignOut()}
            disabled={isSigningOut}
            className="inline-flex items-center gap-2 rounded-[14px] px-4 py-2 text-sm text-white/64 transition hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSigningOut ? <LoaderCircle size={14} className="animate-spin" /> : <LogOut size={14} />}
            退出
          </button>
        </div>
      </div>
    </div>
  );
}
