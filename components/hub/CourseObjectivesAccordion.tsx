'use client'

import { useState } from 'react'
import { SafeHtml } from './SafeHtml'

interface CourseObjectivesAccordionProps {
  learningObjectives: string
}

export function CourseObjectivesAccordion({ learningObjectives }: CourseObjectivesAccordionProps) {
  const [objectivesOpen, setObjectivesOpen] = useState(false)

  if (!learningObjectives) return null

  return (
    <div className="mb-8 border border-gray-200 rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setObjectivesOpen(!objectivesOpen)}
        className="w-full px-6 py-4 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors duration-200"
        aria-expanded={objectivesOpen}
        aria-controls="course-learning-objectives"
      >
        <h2 className="text-lg font-semibold text-gray-900">Learning Objectives</h2>
        <span
          className={`material-symbols-sharp text-[20px] text-diligent-gray-4 transition-transform duration-300 ${
            objectivesOpen ? 'rotate-180' : ''
          }`}
          aria-hidden="true"
        >
          expand_more
        </span>
      </button>

      {objectivesOpen && (
        <div id="course-learning-objectives" className="px-6 py-4 bg-white border-t border-gray-200">
          <SafeHtml html={learningObjectives} className="text-gray-700" />
        </div>
      )}
    </div>
  )
}
