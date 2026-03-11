import Link from "next/link";

const quickActions = [
  {
    title: "학생 등록",
    description: "신규 학생 기본 정보와 목표를 먼저 등록합니다.",
    href: "/students/new",
    cta: "학생 추가",
  },
  {
    title: "주간 리포트 생성",
    description: "학생별 주간 학습 데이터를 입력하고 AI 초안을 생성합니다.",
    href: "/reports/new",
    cta: "리포트 만들기",
  },
  {
    title: "리포트 검수/발송",
    description: "생성된 문장을 다듬고 학부모 전송 상태를 관리합니다.",
    href: "/reports",
    cta: "이력 보기",
  },
];

export default function HomePage() {
  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-surface-200 bg-white p-6 lg:p-8 shadow-sm">
        <p className="text-sm font-medium text-brand-700">PlanIt Report AI</p>
        <h1 className="mt-2 text-2xl lg:text-3xl font-bold text-surface-900">
          학원 주간 리포트 생성 MVP 대시보드
        </h1>
        <p className="mt-3 text-sm lg:text-base text-surface-600 max-w-3xl leading-relaxed">
          이번 주에 바로 운영 가능한 최소 기능 흐름은 <strong>학생 등록 → 학습 데이터 입력 → AI 리포트 생성/수정 → 발송 체크</strong>입니다.
          아래 단계 버튼으로 빠르게 진입해 첫 버전을 검증해보세요.
        </p>

        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href="/students/new"
            className="inline-flex items-center rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 transition-colors"
          >
            첫 학생 등록 시작
          </Link>
          <Link
            href="/reports/new"
            className="inline-flex items-center rounded-lg border border-surface-300 bg-white px-4 py-2 text-sm font-semibold text-surface-700 hover:bg-surface-50 transition-colors"
          >
            주간 리포트 생성으로 이동
          </Link>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {quickActions.map((item, index) => (
          <article key={item.title} className="rounded-xl border border-surface-200 bg-white p-5 shadow-sm">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-brand-100 text-brand-700 text-xs font-bold">
              {index + 1}
            </span>
            <h2 className="mt-3 text-lg font-semibold text-surface-900">{item.title}</h2>
            <p className="mt-2 text-sm text-surface-600 leading-relaxed">{item.description}</p>
            <Link href={item.href} className="mt-4 inline-block text-sm font-semibold text-brand-700 hover:text-brand-800">
              {item.cta} →
            </Link>
          </article>
        ))}
      </section>

      <section className="rounded-xl border border-dashed border-surface-300 bg-surface-50 p-5">
        <h2 className="text-base font-semibold text-surface-900">MVP 검증 체크리스트</h2>
        <ul className="mt-3 space-y-2 text-sm text-surface-700 list-disc list-inside">
          <li>학생 3명 이상 등록하고 각각 주간 데이터 1회 이상 입력</li>
          <li>국문 학부모용/영문 교사용 리포트를 각각 1건 이상 생성</li>
          <li>생성 결과를 수정 후 sent 상태 토글까지 완료</li>
        </ul>
      </section>
    </div>
  );
}
