'use client'

import { motion } from 'framer-motion'
import { Radar, Sparkles, MessageSquare } from 'lucide-react'

function ScoutCard() {
  return (
    <div className="rounded-xl p-4 shadow-2xl" style={{ backgroundColor: '#14141E', border: '1px solid #26263A' }}>
      <div className="flex items-center gap-2 mb-3">
        <div className="w-6 h-6 rounded-md flex items-center justify-center shrink-0" style={{ backgroundColor: '#8B5CF6' }}>
          <Radar className="w-3.5 h-3.5 text-white" />
        </div>
        <span className="text-xs font-medium" style={{ color: '#EDEDF5' }}>Competitor Scout</span>
      </div>
      <div className="space-y-2">
        {[
          { name: 'Gymshark', ads: 42 },
          { name: 'Blume Skincare', ads: 18 },
        ].map((b) => (
          <div key={b.name} className="flex items-center justify-between rounded-lg px-2.5 py-2" style={{ backgroundColor: '#1D1D2A' }}>
            <span className="text-xs" style={{ color: '#EDEDF5' }}>{b.name}</span>
            <span className="text-[10px] font-mono shrink-0 ml-2" style={{ color: '#75758A' }}>{b.ads} ads</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function CanvasCard() {
  return (
    <div className="rounded-xl p-4 shadow-2xl" style={{ backgroundColor: '#14141E', border: '1px solid #26263A' }}>
      <div className="flex items-center justify-between mb-3 gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-6 h-6 rounded-md flex items-center justify-center shrink-0" style={{ backgroundColor: '#8B5CF6' }}>
            <Sparkles className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-xs font-medium truncate" style={{ color: '#EDEDF5' }}>AI Canvas</span>
        </div>
        <span
          className="px-1.5 py-0.5 rounded text-[9px] font-mono shrink-0"
          style={{ backgroundColor: '#1D1D2A', color: '#75758A', border: '1px solid #26263A' }}
        >
          claude-sonnet-5
        </span>
      </div>
      <p className="text-xs font-medium mb-1" style={{ color: '#EDEDF5' }}>&ldquo;Woke up at 3am again?&rdquo;</p>
      <p className="text-[10px] italic mb-2" style={{ color: '#A78BFA' }}>Problem-agitate, sleep-quality angle</p>
      <p className="text-[10px] leading-relaxed" style={{ color: '#75758A' }}>
        You know the feeling. Wide awake, mind racing, full day ahead. Formulated for exactly this—
      </p>
    </div>
  )
}

function NoteCard() {
  return (
    <div className="rounded-xl p-3.5 shadow-2xl" style={{ backgroundColor: '#14141E', border: '1px solid #26263A' }}>
      <div className="flex items-center gap-2 mb-2">
        <MessageSquare className="w-3.5 h-3.5" style={{ color: '#75758A' }} />
        <span className="text-[10px]" style={{ color: '#75758A' }}>Team note</span>
      </div>
      <p className="text-[11px]" style={{ color: '#EDEDF5' }}>
        &ldquo;Love this hook — let&apos;s test it against control this week.&rdquo;
      </p>
    </div>
  )
}

function CreditsBadge() {
  return (
    <div
      className="inline-flex rounded-full px-4 py-2 shadow-2xl items-center gap-2"
      style={{ backgroundColor: '#1D1D2A', border: '1px solid #8B5CF6' }}
    >
      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: '#22C55E' }} />
      <span className="text-xs font-mono" style={{ color: '#EDEDF5' }}>700 credits left</span>
    </div>
  )
}

export function MockupCards() {
  return (
    <>
      {/* Floating layout — enough width for cards to not collide */}
      <div className="hidden sm:block relative w-full max-w-xl mx-auto h-[440px] sm:h-[480px]">
        <div
          className="absolute inset-0 rounded-[2rem] blur-3xl opacity-40"
          style={{ background: 'radial-gradient(circle at 50% 40%, #8B5CF6, transparent 70%)' }}
        />

        <motion.div
          initial={{ opacity: 0, y: 24, rotate: -3 }}
          animate={{ opacity: 1, y: 0, rotate: -3 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="absolute left-0 top-10 w-56 z-10"
        >
          <ScoutCard />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24, rotate: 2 }}
          animate={{ opacity: 1, y: 0, rotate: 2 }}
          transition={{ duration: 0.6, delay: 0.15, ease: 'easeOut' }}
          className="absolute right-0 top-0 w-64 z-20"
        >
          <CanvasCard />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24, rotate: -1 }}
          animate={{ opacity: 1, y: 0, rotate: -1 }}
          transition={{ duration: 0.6, delay: 0.3, ease: 'easeOut' }}
          className="absolute left-8 bottom-4 w-60"
        >
          <NoteCard />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.45, ease: 'easeOut' }}
          className="absolute right-6 bottom-10"
        >
          <CreditsBadge />
        </motion.div>
      </div>

      {/* Stacked layout for narrow viewports — the floating layout's fixed
          card widths don't fit below the sm breakpoint */}
      <div className="sm:hidden space-y-3 relative">
        <div
          className="absolute inset-0 rounded-[2rem] blur-3xl opacity-30 -z-10"
          style={{ background: 'radial-gradient(circle at 50% 30%, #8B5CF6, transparent 70%)' }}
        />
        <ScoutCard />
        <CanvasCard />
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            <NoteCard />
          </div>
          <CreditsBadge />
        </div>
      </div>
    </>
  )
}
