'use client'

import { useState } from 'react'
import Link from 'next/link'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import { MapPin, Star } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { PIPELINE_STAGES } from '@/lib/types'
import type { Candidate, CandidateMissionLink, TalentMission } from '@/lib/types'

interface PipelineItem {
  candidate: Candidate
  link: CandidateMissionLink
  mission: TalentMission
}

interface PipelineBoardProps {
  items: PipelineItem[]
}

function getScoreColor(score: number) {
  if (score >= 80) return 'text-green-600'
  if (score >= 60) return 'text-yellow-600'
  return 'text-orange-500'
}

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
}

export function PipelineBoard({ items: initialItems }: PipelineBoardProps) {
  const [items, setItems] = useState(initialItems)
  const { toast } = useToast()

  function getItemsByStage(stage: string) {
    return items.filter(item => item.link.pipeline_stage === stage)
  }

  async function onDragEnd(result: DropResult) {
    if (!result.destination) return
    const { draggableId, destination } = result
    const newStage = destination.droppableId

    setItems(prev => prev.map(item =>
      item.link.id === draggableId
        ? { ...item, link: { ...item.link, pipeline_stage: newStage } }
        : item
    ))

    try {
      const res = await fetch('/api/pipeline', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ linkId: draggableId, stage: newStage }),
      })
      if (!res.ok) throw new Error()
      toast({ title: `Moved to ${newStage}` })
    } catch {
      setItems(initialItems)
      toast({ title: 'Failed to update stage', variant: 'destructive' })
    }
  }

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {PIPELINE_STAGES.map((stage) => {
          const stageItems = getItemsByStage(stage)
          return (
            <div key={stage} className="flex-shrink-0 w-64">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-700">{stage}</h3>
                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                  {stageItems.length}
                </span>
              </div>
              <Droppable droppableId={stage}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`min-h-[200px] rounded-xl p-2 transition-colors ${
                      snapshot.isDraggingOver ? 'bg-indigo-50 border-2 border-dashed border-indigo-300' : 'bg-gray-50'
                    }`}
                  >
                    {stageItems.map((item, index) => (
                      <Draggable key={item.link.id} draggableId={item.link.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`bg-white rounded-lg p-3 mb-2 border shadow-sm cursor-grab active:cursor-grabbing transition-shadow ${
                              snapshot.isDragging ? 'shadow-lg rotate-1' : 'hover:shadow-md'
                            }`}
                          >
                            <Link href={`/candidates/${item.link.id}`}>
                              <div className="flex items-center gap-2 mb-2">
                                <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                                  {getInitials(item.candidate.name)}
                                </div>
                                <div className="min-w-0">
                                  <p className="text-sm font-medium text-gray-900 truncate">{item.candidate.name}</p>
                                  <p className="text-xs text-gray-500 truncate">{item.candidate.current_role?.split(' at ')[0]}</p>
                                </div>
                              </div>
                              <div className="flex items-center justify-between text-xs text-gray-500">
                                <span className="truncate">{item.mission.title}</span>
                                <span className={`flex items-center gap-0.5 font-medium ${getScoreColor(item.link.match_score)}`}>
                                  <Star className="h-3 w-3" />
                                  {item.link.match_score}
                                </span>
                              </div>
                              {item.candidate.location && (
                                <div className="flex items-center gap-1 text-xs text-gray-400 mt-1">
                                  <MapPin className="h-3 w-3" />
                                  {item.candidate.location}
                                </div>
                              )}
                            </Link>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                    {stageItems.length === 0 && !snapshot.isDraggingOver && (
                      <div className="text-center text-xs text-gray-400 py-8">
                        Drop candidates here
                      </div>
                    )}
                  </div>
                )}
              </Droppable>
            </div>
          )
        })}
      </div>
    </DragDropContext>
  )
}
