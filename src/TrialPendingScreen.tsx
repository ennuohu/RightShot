import type { User } from '@supabase/supabase-js';
import { Clock3 } from 'lucide-react';
import type { TrialProfile } from './lib/trialTypes';

type TrialPendingScreenProps = {
  user: User;
  profile: TrialProfile;
  onSignOut: () => void;
};

export default function TrialPendingScreen({
  user,
  profile,
  onSignOut,
}: TrialPendingScreenProps) {
  const isRejected = profile.trialStatus === 'rejected';

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#020202] text-white">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.14),transparent_24%),radial-gradient(circle_at_16%_12%,rgba(244,114,182,0.14),transparent_22%),radial-gradient(circle_at_88%_4%,rgba(250,204,21,0.16),transparent_18%)]" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen max-w-[1240px] flex-col justify-center px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
          <section className="relative overflow-hidden rounded-[40px] border border-white/10 bg-[#030303]/94 px-6 py-8 shadow-[0_42px_130px_rgba(0,0,0,0.62)] backdrop-blur-2xl sm:px-8 sm:py-10">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_8%_14%,rgba(255,255,255,0.08),transparent_18%),radial-gradient(circle_at_88%_16%,rgba(147,197,253,0.10),transparent_18%),linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0))]" />
            <div className="relative">
              <div className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-white/70 backdrop-blur">
                <span className="text-[11px] uppercase tracking-[0.38em] text-white/40">Brand</span>
                <span className="font-medium text-white">拍对 RightShot</span>
              </div>

              <h1 className="mt-10 text-5xl font-semibold tracking-[-0.06em] text-white sm:text-[5rem] sm:leading-[0.92]">
                {isRejected ? '试用申请暂未通过。' : '试用申请已提交。'}
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-8 text-white/60">
                {isRejected
                  ? '当前申请暂未通过，你可以联系管理员更新资料后再重新申请。'
                  : '我们已经收到了你的试用申请。管理员审核通过后，这个账号就可以直接进入工具页。'}
              </p>
            </div>
          </section>

          <section className="rounded-[36px] border border-white/10 bg-[#050505]/94 p-6 shadow-[0_42px_130px_rgba(0,0,0,0.54)] backdrop-blur-2xl sm:p-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-white/70">
              <Clock3 size={14} />
              当前状态：{isRejected ? '未通过' : '待审核'}
            </div>

            <div className="mt-8 space-y-4">
              <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-5">
                <p className="text-sm font-medium text-white">账号</p>
                <p className="mt-3 text-sm leading-7 text-white/58">{user.email ?? '未识别邮箱'}</p>
              </div>
              <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-5">
                <p className="text-sm font-medium text-white">申请信息</p>
                <p className="mt-3 text-sm leading-7 text-white/58">姓名：{profile.fullName || '-'}</p>
                <p className="mt-1 text-sm leading-7 text-white/58">公司 / 团队：{profile.companyName || '-'}</p>
                <p className="mt-1 text-sm leading-7 text-white/58">角色：{profile.roleTitle || '-'}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={onSignOut}
              className="mt-8 inline-flex w-full items-center justify-center rounded-full border border-white/10 bg-white/[0.04] px-5 py-4 text-sm text-white/72 transition hover:border-white/20 hover:bg-white/[0.08]"
            >
              退出当前账号
            </button>
          </section>
        </div>
      </div>
    </div>
  );
}
