import { useState, type FormEvent } from 'react';
import type { User } from '@supabase/supabase-js';
import { ArrowRight, LoaderCircle, ShieldCheck } from 'lucide-react';
import type { TrialProfile } from './lib/trialTypes';

type TrialApplicationScreenProps = {
  user: User;
  initialProfile: TrialProfile | null;
  onSubmit: (payload: {
    fullName: string;
    companyName: string;
    roleTitle: string;
    useCase: string;
  }) => Promise<void>;
  onSignOut: () => void;
};

export default function TrialApplicationScreen({
  user,
  initialProfile,
  onSubmit,
  onSignOut,
}: TrialApplicationScreenProps) {
  const [fullName, setFullName] = useState(
    initialProfile?.fullName || user.user_metadata?.full_name || user.email?.split('@')[0] || '',
  );
  const [companyName, setCompanyName] = useState(initialProfile?.companyName || '');
  const [roleTitle, setRoleTitle] = useState(initialProfile?.roleTitle || '');
  const [useCase, setUseCase] = useState(initialProfile?.useCase || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      await onSubmit({
        fullName: fullName.trim(),
        companyName: companyName.trim(),
        roleTitle: roleTitle.trim(),
        useCase: useCase.trim(),
      });
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : '提交试用申请失败，请稍后再试。');
      setIsSubmitting(false);
      return;
    }

    setIsSubmitting(false);
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#020202] text-white">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.14),transparent_24%),radial-gradient(circle_at_16%_12%,rgba(244,114,182,0.14),transparent_22%),radial-gradient(circle_at_88%_4%,rgba(250,204,21,0.16),transparent_18%)]" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen max-w-[1320px] flex-col px-4 py-6 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between gap-4">
          <div className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-white/70 backdrop-blur">
            <span className="text-[11px] uppercase tracking-[0.38em] text-white/40">Brand</span>
            <span className="font-medium text-white">拍对 RightShot</span>
          </div>

          <button
            type="button"
            onClick={onSignOut}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-5 py-3 text-sm text-white/72 transition hover:border-white/20 hover:bg-white/[0.08]"
          >
            退出当前账号
          </button>
        </header>

        <main className="flex flex-1 items-center py-10">
          <div className="grid w-full gap-6 xl:grid-cols-[0.92fr_1.08fr]">
            <section className="relative overflow-hidden rounded-[40px] border border-white/10 bg-[#030303]/94 px-6 py-8 shadow-[0_42px_130px_rgba(0,0,0,0.62)] backdrop-blur-2xl sm:px-8 sm:py-10">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_8%_14%,rgba(255,255,255,0.08),transparent_18%),radial-gradient(circle_at_88%_16%,rgba(147,197,253,0.10),transparent_18%),linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0))]" />
              <div className="relative">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-white/70">
                  <ShieldCheck size={14} />
                  申请试用后即可进入工具页
                </div>

                <h1 className="mt-8 text-4xl font-semibold tracking-[-0.05em] text-white sm:text-[4.4rem] sm:leading-[0.94]">
                  再补一份简单信息，
                  <br />
                  就可以开始使用。
                </h1>
                <p className="mt-6 max-w-xl text-base leading-8 text-white/60">
                  这一步主要用来确认你的团队和使用场景。提交后会进入试用审核列表，审核通过后即可进入工具页。
                </p>

                <div className="mt-8 space-y-3">
                  <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-5">
                    <p className="text-sm font-medium text-white">你会获得什么</p>
                    <p className="mt-3 text-sm leading-7 text-white/58">
                      审核通过后进入工具页、保存项目、恢复历史版本，并继续后续的图片上传、策略选择和分镜编辑流程。
                    </p>
                  </div>
                  <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-5">
                    <p className="text-sm font-medium text-white">为什么需要这一步</p>
                    <p className="mt-3 text-sm leading-7 text-white/58">
                      帮我们区分品牌方、电商团队和代理商的真实需求，后面才能把产品打磨得更贴近你的工作方式。
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-[36px] border border-white/10 bg-[#050505]/94 p-6 shadow-[0_42px_130px_rgba(0,0,0,0.54)] backdrop-blur-2xl sm:p-8">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-white/36">Trial Application</p>
                <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-white">
                  注册并申请试用
                </h2>
                <p className="mt-3 text-sm leading-7 text-white/58">
                  当前账号：{user.email ?? '未识别邮箱'}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="mt-8 space-y-4">
                <label className="block">
                  <span className="mb-2 block text-sm text-white/60">姓名</span>
                  <input
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
                    required
                    className="w-full rounded-[20px] border border-white/10 bg-white/[0.04] px-4 py-4 text-sm text-white outline-none transition placeholder:text-white/24 focus:border-white/22"
                    placeholder="例如：Nuo"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm text-white/60">公司 / 团队名称</span>
                  <input
                    value={companyName}
                    onChange={(event) => setCompanyName(event.target.value)}
                    required
                    className="w-full rounded-[20px] border border-white/10 bg-white/[0.04] px-4 py-4 text-sm text-white outline-none transition placeholder:text-white/24 focus:border-white/22"
                    placeholder="例如：RightShot Studio"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm text-white/60">你的角色</span>
                  <input
                    value={roleTitle}
                    onChange={(event) => setRoleTitle(event.target.value)}
                    required
                    className="w-full rounded-[20px] border border-white/10 bg-white/[0.04] px-4 py-4 text-sm text-white outline-none transition placeholder:text-white/24 focus:border-white/22"
                    placeholder="例如：品牌负责人 / 电商运营 / 创意总监"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm text-white/60">你想怎么用拍对</span>
                  <textarea
                    value={useCase}
                    onChange={(event) => setUseCase(event.target.value)}
                    required
                    rows={5}
                    className="w-full rounded-[20px] border border-white/10 bg-white/[0.04] px-4 py-4 text-sm text-white outline-none transition placeholder:text-white/24 focus:border-white/22"
                    placeholder="例如：我们想用它快速验证产品视频方向，减少脚本和分镜来回返工。"
                  />
                </label>

                {error && (
                  <div className="rounded-[22px] border border-[#ef4444]/20 bg-[#ef4444]/10 px-4 py-3 text-sm leading-6 text-[#fecaca]">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting || !fullName || !companyName || !roleTitle || !useCase}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-white px-5 py-4 text-sm font-medium text-[#050505] transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting ? <LoaderCircle size={16} className="animate-spin" /> : <ArrowRight size={16} />}
                  提交申请并进入工具
                </button>
              </form>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
