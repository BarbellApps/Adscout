import { notFound } from 'next/navigation'
import { GenerateForm } from '@/components/canvas/GenerateForm'
import { GenerationCard } from '@/components/canvas/GenerationCard'
import { createClient } from '@/lib/supabase/server'
import type { CanvasGeneration, CanvasGenerationNote } from '@/types'

export default async function CanvasProjectPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) notFound()

  const { data: project } = await supabase
    .from('canvas_projects')
    .select('id, name')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!project) notFound()

  const { data: generations } = await supabase
    .from('canvas_generations')
    .select('id, canvas_project_id, model, credits_used, content, output_url, created_at')
    .eq('canvas_project_id', id)
    .order('created_at', { ascending: false })

  const generationRows = (generations ?? []) as CanvasGeneration[]
  const generationIds = generationRows.map((g) => g.id)

  const { data: notes } = generationIds.length
    ? await supabase
        .from('canvas_generation_notes')
        .select('id, canvas_generation_id, user_id, body, created_at')
        .in('canvas_generation_id', generationIds)
    : { data: [] }

  const notesByGeneration = new Map<string, CanvasGenerationNote[]>()
  for (const note of (notes ?? []) as CanvasGenerationNote[]) {
    const list = notesByGeneration.get(note.canvas_generation_id) ?? []
    list.push(note)
    notesByGeneration.set(note.canvas_generation_id, list)
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-[28px] font-semibold tracking-tight text-foreground">{project.name}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Generate ad script variations and leave notes for your team.
        </p>
      </div>

      <GenerateForm canvasProjectId={id} />

      {generationRows.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {generationRows.map((g) => (
            <GenerationCard
              key={g.id}
              generation={g}
              initialNotes={notesByGeneration.get(g.id) ?? []}
            />
          ))}
        </div>
      )}
    </div>
  )
}
