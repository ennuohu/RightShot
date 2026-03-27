import { ArrowRight, BadgeCheck, ImagePlus, LayoutTemplate, Sparkles } from 'lucide-react';

type LandingScreenProps = {
  onApplyTrial: () => void;
  onLogin: () => void;
};

const featureCardClass =
  'rounded-[28px] border border-white/10 bg-white/[0.04] p-5 shadow-[0_18px_50px_rgba(0,0,0,0.22)] backdrop-blur';

export default function LandingScreen({ onApplyTrial, onLogin }: LandingScreenProps) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#020202] text-white">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.14),transparent_24%),radial-gradient(circle_at_16%_12%,rgba(244,114,182,0.14),transparent_22%),radial-gradient(circle_at_88%_4%,rgba(250,204,21,0.16),transparent_18%)]" />
        <div className="absolute left-[-10%] top-[6%] h-[28rem] w-[28rem] rounded-full bg-[#3b82f6]/10 blur-[150px]" />
        <div className="absolute right-[-8%] top-[-4%] h-[26rem] w-[26rem] rounded-full bg-[#f97316]/10 blur-[150px]" />
        <div className="absolute bottom-[-14%] left-[18%] h-[32rem] w-[32rem] rounded-full bg-[#8b5cf6]/10 blur-[180px]" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen max-w-[1480px] flex-col px-4 py-6 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between gap-4">
          <div className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-white/70 backdrop-blur">
            <span className="text-[11px] uppercase tracking-[0.38em] text-white/40">Brand</span>
            <span className="font-medium text-white">拍对 RightShot</span>
          </div>

          <button
            type="button"
            onClick={onLogin}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-5 py-3 text-sm text-white/72 transition hover:border-white/20 hover:bg-white/[0.08]"
          >
            已有账号
            <ArrowRight size={15} />
          </button>
        </header>

        <main className="flex flex-1 flex-col justify-center py-10">
          <section className="relative overflow-hidden rounded-[40px] border border-white/10 bg-[#030303]/94 px-6 py-8 shadow-[0_42px_130px_rgba(0,0,0,0.62)] backdrop-blur-2xl sm:px-8 sm:py-10">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_8%_14%,rgba(255,255,255,0.08),transparent_18%),radial-gradient(circle_at_88%_16%,rgba(147,197,253,0.10),transparent_18%),linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0))]" />
            <div className="relative grid gap-8 xl:grid-cols-[1fr_0.92fr] xl:items-end">
              <div className="max-w-4xl">
                <p className="text-[11px] uppercase tracking-[0.42em] text-white/36">
                  AI storyboard direction engine
                </p>
                <h1 className="mt-4 text-5xl font-semibold tracking-[-0.06em] text-white sm:text-[5.4rem] sm:leading-[0.92]">
                  先把产品拍对，
                  <br />
                  再把视频做对。
                </h1>
                <p className="mt-6 max-w-2xl text-base leading-8 text-white/60">
                  拍对是一个面向品牌、电商和内容团队的 AI 创意工具。先理解你的产品、卖点和视频目标，再生成更接近真实商业场景的叙事方向与分镜方案。
                </p>

                <div className="mt-8 flex flex-wrap gap-3">
                  <span className="rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-sm text-white/70">
                    先判断，再生成
                  </span>
                  <span className="rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-sm text-white/70">
                    面向真实广告工作流
                  </span>
                  <span className="rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-sm text-white/70">
                    支持项目保存与版本恢复
                  </span>
                </div>

                <div className="mt-8 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={onApplyTrial}
                    className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-medium text-[#050505] transition hover:bg-white/90"
                  >
                    注册并申请试用
                    <ArrowRight size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={onLogin}
                    className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-6 py-3 text-sm text-white/72 transition hover:border-white/20 hover:bg-white/[0.08]"
                  >
                    我已有账号
                  </button>
                </div>
              </div>

              <div className="grid gap-4">
                <div className="relative overflow-hidden rounded-[30px] border border-white/10 bg-white/[0.04] p-5 shadow-[0_20px_55px_rgba(0,0,0,0.32)]">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.10),transparent_34%)]" />
                  <p className="text-xs uppercase tracking-[0.24em] text-white/36">For teams</p>
                  <h2 className="mt-3 text-2xl font-semibold text-white">把脚本、策略和分镜拉回同一条线</h2>
                  <p className="mt-3 text-sm leading-7 text-white/58">
                    不再从空白 prompt 开始，而是从产品理解、传播目标和卖点取舍开始。
                  </p>
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  <div className={featureCardClass}>
                    <ImagePlus size={18} className="text-white/72" />
                    <h3 className="mt-4 text-lg font-semibold text-white">上传产品图</h3>
                    <p className="mt-3 text-sm leading-7 text-white/58">
                      先用图片启动，而不是先写复杂需求。
                    </p>
                  </div>
                  <div className={featureCardClass}>
                    <Sparkles size={18} className="text-white/72" />
                    <h3 className="mt-4 text-lg font-semibold text-white">挑方向</h3>
                    <p className="mt-3 text-sm leading-7 text-white/58">
                      系统先解释理解结果，再给 3 套叙事方向。
                    </p>
                  </div>
                  <div className={featureCardClass}>
                    <LayoutTemplate size={18} className="text-white/72" />
                    <h3 className="mt-4 text-lg font-semibold text-white">看分镜</h3>
                    <p className="mt-3 text-sm leading-7 text-white/58">
                      先看画面感，再决定要不要继续生成。
                    </p>
                  </div>
                  <div className={featureCardClass}>
                    <BadgeCheck size={18} className="text-white/72" />
                    <h3 className="mt-4 text-lg font-semibold text-white">保存项目</h3>
                    <p className="mt-3 text-sm leading-7 text-white/58">
                      支持恢复项目和版本，不会每次都从头开始。
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
