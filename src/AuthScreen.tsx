import { useState, type FormEvent } from 'react';
import { ArrowRight, Mail, ShieldCheck, Sparkles } from 'lucide-react';
import { isSupabaseConfigured, supabase } from './lib/supabase';

const glassPanelClass =
  'relative overflow-hidden rounded-[32px] border border-white/10 bg-white/[0.04] p-6 shadow-[0_30px_80px_rgba(0,0,0,0.38)] backdrop-blur-2xl';

export default function AuthScreen() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleEmailSignIn = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!supabase) {
      setError('Supabase 尚未配置完成，暂时无法发送登录链接。');
      return;
    }

    setIsSubmitting(true);
    setError('');
    setMessage('');

    const { error: otpError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: window.location.origin,
      },
    });

    if (otpError) {
      setError(otpError.message);
      setIsSubmitting(false);
      return;
    }

    setMessage('登录链接已发送到你的邮箱，打开邮件继续即可。');
    setIsSubmitting(false);
  };

  const handleGoogleSignIn = async () => {
    if (!supabase) {
      setError('Supabase 尚未配置完成，暂时无法使用 Google 登录。');
      return;
    }

    setIsSubmitting(true);
    setError('');
    setMessage('');

    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    });

    if (oauthError) {
      setError(oauthError.message);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#020202] text-white">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.14),transparent_24%),radial-gradient(circle_at_16%_12%,rgba(244,114,182,0.14),transparent_22%),radial-gradient(circle_at_88%_4%,rgba(250,204,21,0.16),transparent_18%)]" />
        <div className="absolute left-[-10%] top-[6%] h-[28rem] w-[28rem] rounded-full bg-[#3b82f6]/10 blur-[150px]" />
        <div className="absolute right-[-8%] top-[-4%] h-[26rem] w-[26rem] rounded-full bg-[#f97316]/10 blur-[150px]" />
        <div className="absolute bottom-[-14%] left-[18%] h-[32rem] w-[32rem] rounded-full bg-[#8b5cf6]/10 blur-[180px]" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen max-w-[1440px] flex-col justify-center px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-6 xl:grid-cols-[1.12fr_0.88fr]">
          <section className="relative overflow-hidden rounded-[40px] border border-white/10 bg-[#030303]/94 px-6 py-8 shadow-[0_42px_130px_rgba(0,0,0,0.62)] backdrop-blur-2xl sm:px-8 sm:py-10">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_8%_14%,rgba(255,255,255,0.08),transparent_18%),radial-gradient(circle_at_88%_16%,rgba(147,197,253,0.10),transparent_18%),linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0))]" />
            <div className="relative">
              <div className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-white/70 backdrop-blur">
                <span className="text-[11px] uppercase tracking-[0.38em] text-white/40">Brand</span>
                <span className="font-medium text-white">拍对 RightShot</span>
              </div>

              <div className="mt-12 max-w-4xl">
                <p className="text-[11px] uppercase tracking-[0.42em] text-white/36">
                  AI storyboard direction engine
                </p>
                <h1 className="mt-4 text-5xl font-semibold tracking-[-0.06em] text-white sm:text-[5rem] sm:leading-[0.92]">
                  先把产品拍对，
                  <br />
                  再把视频做对。
                </h1>
                <p className="mt-6 max-w-2xl text-base leading-8 text-white/60">
                  上传产品图，系统先理解你的产品和目标，再给出更接近真实商业场景的叙事方向和分镜草案。先把判断做对，再开始生成。
                </p>
              </div>

              <div className="mt-10 grid gap-4 lg:grid-cols-3">
                <div className={glassPanelClass}>
                  <p className="text-xs uppercase tracking-[0.28em] text-white/36">01</p>
                  <h2 className="mt-4 text-xl font-semibold text-white">上传产品</h2>
                  <p className="mt-3 text-sm leading-7 text-white/62">
                    先看图，再补充少量信息，减少一开始就写复杂提示词的门槛。
                  </p>
                </div>
                <div className={glassPanelClass}>
                  <p className="text-xs uppercase tracking-[0.28em] text-white/36">02</p>
                  <h2 className="mt-4 text-xl font-semibold text-white">选择方向</h2>
                  <p className="mt-3 text-sm leading-7 text-white/62">
                    系统会先用大白话解释理解结果，再给你 3 种不同的拍法选择。
                  </p>
                </div>
                <div className={glassPanelClass}>
                  <p className="text-xs uppercase tracking-[0.28em] text-white/36">03</p>
                  <h2 className="mt-4 text-xl font-semibold text-white">编辑分镜</h2>
                  <p className="mt-3 text-sm leading-7 text-white/62">
                    只看分镜，不看冗长脚本。每一镜都能放大、改单句、下口语指令。
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="relative overflow-hidden rounded-[36px] border border-white/10 bg-[#050505]/94 p-6 shadow-[0_42px_130px_rgba(0,0,0,0.54)] backdrop-blur-2xl sm:p-8">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.06),transparent_24%)]" />
            <div className="relative">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-white/70">
                <ShieldCheck size={14} />
                登录后保存项目和后续生成记录
              </div>

              <div className="mt-8">
                <h2 className="text-3xl font-semibold tracking-[-0.04em] text-white">
                  先登录，再继续创作
                </h2>
                <p className="mt-3 text-sm leading-7 text-white/58">
                  支持 Google 登录，也支持邮箱魔法链接。登录成功后会自动回到当前站点。
                </p>
              </div>

              <div className="mt-8 space-y-4">
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={isSubmitting || !isSupabaseConfigured}
                  className="inline-flex w-full items-center justify-center gap-3 rounded-full bg-white px-5 py-4 text-sm font-medium text-[#050505] transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Sparkles size={16} />
                  使用 Google 登录
                </button>

                <div className="flex items-center gap-4 text-xs uppercase tracking-[0.3em] text-white/26">
                  <span className="h-px flex-1 bg-white/10" />
                  或
                  <span className="h-px flex-1 bg-white/10" />
                </div>

                <form onSubmit={handleEmailSignIn} className="space-y-3">
                  <label className="block">
                    <span className="mb-2 block text-sm text-white/60">工作邮箱</span>
                    <div className="relative">
                      <Mail
                        size={16}
                        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/28"
                      />
                      <input
                        type="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        placeholder="name@company.com"
                        required
                        className="w-full rounded-[20px] border border-white/10 bg-white/[0.04] py-4 pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-white/24 focus:border-white/22"
                      />
                    </div>
                  </label>

                  <button
                    type="submit"
                    disabled={isSubmitting || !email || !isSupabaseConfigured}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-5 py-4 text-sm font-medium text-white transition hover:border-white/20 hover:bg-white/[0.1] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    发送登录链接
                    <ArrowRight size={16} />
                  </button>
                </form>
              </div>

              {(message || error || !isSupabaseConfigured) && (
                <div
                  className={`mt-5 rounded-[22px] border px-4 py-3 text-sm leading-6 ${
                    error || !isSupabaseConfigured
                      ? 'border-[#ef4444]/20 bg-[#ef4444]/10 text-[#fecaca]'
                      : 'border-emerald-500/20 bg-emerald-500/10 text-emerald-100'
                  }`}
                >
                  {!isSupabaseConfigured
                    ? '当前环境变量还没配好，需先设置 VITE_SUPABASE_URL 和 VITE_SUPABASE_ANON_KEY。'
                    : error || message}
                </div>
              )}

              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-4">
                  <p className="text-xs uppercase tracking-[0.24em] text-white/36">登录后可用</p>
                  <p className="mt-3 text-sm leading-7 text-white/62">
                    保存项目、回看选择过的方向、保留分镜编辑记录，后面接后端后也能承接真实生成任务。
                  </p>
                </div>
                <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-4">
                  <p className="text-xs uppercase tracking-[0.24em] text-white/36">当前状态</p>
                  <p className="mt-3 text-sm leading-7 text-white/62">
                    这一步先把登录接进站点，下一步再继续接数据库、上传存储和正式生成接口。
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
