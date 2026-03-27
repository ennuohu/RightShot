import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { Layers3, LoaderCircle, LogOut, Sparkles } from 'lucide-react';
import LegacyApp from './App';
import AuthScreen from './AuthScreen';
import LandingScreen from './LandingScreen';
import PrototypeV2 from './PrototypeV2';
import TrialApplicationScreen, { type TrialProfile } from './TrialApplicationScreen';
import { isSupabaseConfigured, supabase } from './lib/supabase';
import { getTrialProfile, submitTrialApplication } from './lib/trialAccess';

type ViewMode = 'v2' | 'legacy';
type PublicView = 'landing' | 'auth';

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
          trialStatus: 'not_applied',
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

  if (!trialProfile || trialProfile.trialStatus !== 'applied') {
    return (
      <TrialApplicationScreen
        user={session.user}
        initialProfile={trialProfile}
        onSubmit={handleTrialSubmit}
        onSignOut={() => void handleSignOut()}
      />
    );
  }

  const userLabel =
    trialProfile.fullName ||
    session.user.user_metadata?.full_name ||
    session.user.email ||
    session.user.phone ||
    '已登录';

  return (
    <div className="relative">
      {mode === 'v2' ? <PrototypeV2 user={session.user} /> : <LegacyApp />}

      <div className="fixed right-4 top-4 z-[60] rounded-[24px] border border-white/10 bg-black/60 p-2 shadow-[0_18px_50px_rgba(0,0,0,0.28)] backdrop-blur-2xl">
        <div className="flex flex-wrap items-center gap-2 rounded-[18px] bg-white/[0.04] p-1">
          <div className="hidden items-center gap-2 rounded-[14px] border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white/70 sm:inline-flex">
            <span className="max-w-[180px] truncate">{userLabel}</span>
          </div>

          <button
            type="button"
            onClick={() => handleModeChange('v2')}
            className={`inline-flex items-center gap-2 rounded-[14px] px-4 py-2 text-sm transition ${
              mode === 'v2'
                ? 'bg-white text-[#050505] shadow-md'
                : 'text-white/64 hover:bg-white/[0.08]'
            }`}
          >
            <Sparkles size={14} />
            拍对
          </button>

          <button
            type="button"
            onClick={() => handleModeChange('legacy')}
            className={`inline-flex items-center gap-2 rounded-[14px] px-4 py-2 text-sm transition ${
              mode === 'legacy'
                ? 'bg-white text-[#050505] shadow-md'
                : 'text-white/64 hover:bg-white/[0.08]'
            }`}
          >
            <Layers3 size={14} />
            旧版
          </button>

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
