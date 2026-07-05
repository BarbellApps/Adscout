const steps = [
  {
    step: '01',
    title: 'Track',
    description: 'Add competitor brands to Scout and sync their ad activity from the Meta Ad Library.',
  },
  {
    step: '02',
    title: 'Research',
    description: 'Explore the ads you’ve collected, spot the hooks and angles that keep showing up, and save the best ones.',
  },
  {
    step: '03',
    title: 'Produce',
    description: 'Feed a winning angle into AI Canvas and get script variations back in seconds — ready for your team to review.',
  },
]

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20 md:py-28" style={{ borderTop: '1px solid #26263A' }}>
      <div className="max-w-6xl mx-auto px-6">
        <div className="max-w-xl mb-14">
          <h2 className="text-3xl font-bold tracking-tight mb-3" style={{ color: '#EDEDF5' }}>
            How it works
          </h2>
          <p className="text-base" style={{ color: '#B4B4C4' }}>
            Three steps, one workspace.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((s) => (
            <div key={s.step}>
              <span className="text-xs font-mono block mb-3" style={{ color: '#8B5CF6' }}>{s.step}</span>
              <h3 className="text-lg font-semibold mb-2" style={{ color: '#EDEDF5' }}>{s.title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: '#75758A' }}>{s.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
