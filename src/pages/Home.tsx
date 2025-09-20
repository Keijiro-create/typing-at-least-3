const features = [
  {
    title: '練習セッション',
    description: 'カスタム時間や語彙セットでタイピング練習を開始できます。',
  },
  {
    title: '詳細な統計',
    description: 'スピードと精度を追跡し、推移をチャートで確認しましょう。',
  },
  {
    title: '柔軟な設定',
    description: 'テーマやキーバインドなど、トレーニング環境をあなた好みに。',
  },
]

export function HomePage() {
  return (
    <section className="space-y-10">
      <header className="space-y-4 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-sky-600 dark:text-sky-300">
          Typing Trainer へようこそ
        </h1>
        <p className="mx-auto max-w-2xl text-lg text-slate-600 dark:text-slate-300">
          日々の練習から実戦まで。進捗を追跡しながら、集中できる UI でブラインドタッチ力を磨きましょう。
        </p>
      </header>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((feature) => (
          <article
            key={feature.title}
            className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg dark:border-slate-700 dark:bg-slate-800"
          >
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
              {feature.title}
            </h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{feature.description}</p>
          </article>
        ))}
      </div>
    </section>
  )
}
