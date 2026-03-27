import { LoaderCircle, RefreshCcw, ShieldCheck } from 'lucide-react';
import type { TrialApplicationRecord, TrialStatus } from './lib/trialTypes';

type AdminApplicationsScreenProps = {
  applications: TrialApplicationRecord[];
  isLoading: boolean;
  isUpdating: boolean;
  message: string;
  onRefresh: () => void;
  onUpdateStatus: (id: string, status: TrialStatus) => void;
};

function statusLabel(status: TrialStatus) {
  switch (status) {
    case 'pending':
      return '待审核';
    case 'approved':
      return '已通过';
    case 'tester':
      return '测试账号';
    case 'rejected':
      return '未通过';
    default:
      return '未申请';
  }
}

export default function AdminApplicationsScreen({
  applications,
  isLoading,
  isUpdating,
  message,
  onRefresh,
  onUpdateStatus,
}: AdminApplicationsScreenProps) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#020202] px-4 pb-28 pt-28 text-white sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.14),transparent_24%),radial-gradient(circle_at_16%_12%,rgba(244,114,182,0.14),transparent_22%),radial-gradient(circle_at_88%_4%,rgba(250,204,21,0.16),transparent_18%)]" />
      </div>

      <div className="relative z-10 mx-auto max-w-[1480px]">
        <header className="relative overflow-hidden rounded-[40px] border border-white/10 bg-[#030303]/94 px-6 py-6 shadow-[0_42px_130px_rgba(0,0,0,0.62)] backdrop-blur-2xl">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_8%_14%,rgba(255,255,255,0.08),transparent_18%),radial-gradient(circle_at_88%_16%,rgba(147,197,253,0.10),transparent_18%),linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0))]" />
          <div className="relative flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-white/70">
                <ShieldCheck size={14} />
                试用申请后台
              </div>
              <h1 className="mt-6 text-4xl font-semibold tracking-[-0.05em] text-white sm:text-[4rem] sm:leading-[0.94]">
                管理试用申请和测试账号
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-8 text-white/60">
                这里会列出当前所有试用申请。你可以直接通过、拒绝，或者把账号升级成测试账号。
              </p>
            </div>

            <button
              type="button"
              onClick={onRefresh}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-5 py-3 text-sm text-white/72 transition hover:border-white/20 hover:bg-white/[0.08]"
            >
              {isLoading ? <LoaderCircle size={15} className="animate-spin" /> : <RefreshCcw size={15} />}
              刷新列表
            </button>
          </div>
        </header>

        {message && (
          <div className="mt-6 rounded-[24px] border border-white/10 bg-white/[0.04] px-5 py-4 text-sm leading-7 text-white/62">
            {message}
          </div>
        )}

        <section className="mt-6 grid gap-4">
          {applications.map((application) => (
            <article
              key={application.id}
              className="rounded-[28px] border border-white/10 bg-[#060606]/92 p-5 shadow-[0_24px_70px_rgba(0,0,0,0.36)] backdrop-blur-xl"
            >
              <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-xl font-semibold text-white">{application.fullName || '未填写姓名'}</h2>
                    <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-white/56">
                      {statusLabel(application.trialStatus)}
                    </span>
                    <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-white/56">
                      {application.accessRole === 'admin' ? '管理员' : '普通账号'}
                    </span>
                  </div>

                  <div className="mt-3 grid gap-2 text-sm leading-7 text-white/58 lg:grid-cols-2">
                    <p>邮箱：{application.email || '-'}</p>
                    <p>公司 / 团队：{application.companyName || '-'}</p>
                    <p>角色：{application.roleTitle || '-'}</p>
                    <p>
                      提交时间：
                      {application.trialSubmittedAt
                        ? new Date(application.trialSubmittedAt).toLocaleString('zh-CN', {
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : '-'}
                    </p>
                  </div>

                  <div className="mt-4 rounded-[20px] border border-white/10 bg-white/[0.03] p-4 text-sm leading-7 text-white/62">
                    {application.useCase || '未填写使用场景'}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 lg:max-w-[280px] lg:justify-end">
                  <button
                    type="button"
                    disabled={isUpdating}
                    onClick={() => onUpdateStatus(application.id, 'approved')}
                    className="rounded-full bg-white px-4 py-2 text-sm font-medium text-[#050505] transition hover:bg-white/90 disabled:opacity-50"
                  >
                    通过
                  </button>
                  <button
                    type="button"
                    disabled={isUpdating}
                    onClick={() => onUpdateStatus(application.id, 'rejected')}
                    className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-white/72 transition hover:border-white/20 hover:bg-white/[0.08] disabled:opacity-50"
                  >
                    拒绝
                  </button>
                  <button
                    type="button"
                    disabled={isUpdating}
                    onClick={() => onUpdateStatus(application.id, 'tester')}
                    className="rounded-full border border-[#f59e0b]/20 bg-[#f59e0b]/10 px-4 py-2 text-sm text-amber-100 transition hover:bg-[#f59e0b]/16 disabled:opacity-50"
                  >
                    设为测试账号
                  </button>
                </div>
              </div>
            </article>
          ))}
        </section>

        {applications.length === 0 && !isLoading && (
          <div className="mt-6 rounded-[24px] border border-white/10 bg-white/[0.04] px-5 py-5 text-sm leading-7 text-white/58">
            目前还没有试用申请。
          </div>
        )}
      </div>
    </div>
  );
}
