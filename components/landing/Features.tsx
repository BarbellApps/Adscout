import { LayoutTemplate, Radar, Compass, Bookmark, Sparkles, Plug } from 'lucide-react'

const features = [
  {
    icon: LayoutTemplate,
    title: 'Templates',
    description: 'A curated library of high-performing ad templates, tagged by industry and format. Open in Canva or Figma to customize.',
  },
  {
    icon: Radar,
    title: 'Scout',
    description: 'Track competitor brands and sync their ad activity via the official Meta Ad Library API — hooks, angles, and audiences.',
  },
  {
    icon: Compass,
    title: 'Explore',
    description: 'Search across every ad you’ve tracked or saved by keyword, format, or runtime to find proven concepts fast.',
  },
  {
    icon: Bookmark,
    title: 'Collections',
    description: 'Save ads into shareable team boards — no more screenshot dumps in Slack.',
  },
  {
    icon: Sparkles,
    title: 'AI Canvas',
    description: 'Generate ad script variations with Claude — different hooks and angles for the same offer, ready to test.',
  },
  {
    icon: Plug,
    title: 'Chrome extension',
    description: 'Right-click any ad you find while browsing and save it straight into a collection.',
  },
]

export function Features() {
  return (
    <section id="features" className="py-20 md:py-28" style={{ borderTop: '1px solid #26263A' }}>
      <div className="max-w-6xl mx-auto px-6">
        <div className="max-w-xl mb-14">
          <h2 className="text-3xl font-bold tracking-tight mb-3" style={{ color: '#EDEDF5' }}>
            Everything from research to production
          </h2>
          <p className="text-base" style={{ color: '#B4B4C4' }}>
            Six tools that cover the whole ad-creative workflow, so you&apos;re not juggling a
            spreadsheet, a Chrome tab, and three different subscriptions.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f) => (
            <div
              key={f.title}
              className="rounded-xl p-6 transition-colors"
              style={{ backgroundColor: '#14141E', border: '1px solid #26263A' }}
            >
              <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-4" style={{ backgroundColor: '#8B5CF622' }}>
                <f.icon className="w-4.5 h-4.5" style={{ color: '#A78BFA' }} />
              </div>
              <h3 className="text-sm font-semibold mb-1.5" style={{ color: '#EDEDF5' }}>{f.title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: '#75758A' }}>{f.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
