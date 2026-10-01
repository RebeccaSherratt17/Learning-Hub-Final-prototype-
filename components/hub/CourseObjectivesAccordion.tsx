'use client'

import { useState } from 'react'

interface CourseObjectivesAccordionProps {
  learningObjectives: string
}

export function CourseObjectivesAccordion({ learningObjectives }: CourseObjectivesAccordionProps) {
  const [objectivesOpen, setObjectivesOpen] = useState(false)

  return (
    <>
      {learningObjectives && (
        <div className="mb-8 border border-gray-200 rounded-lg overflow-hidden">
          <button
            onClick={() => setObjectivesOpen(!objectivesOpen)}
            className="w-full px-6 py-4 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors duration-200"
            aria-expanded={objectivesOpen}
          >
            <h2 className="text-lg font-semibold text-gray-900">Learning Objectives</h2>
           <span 
  className={`material-symbols-sharp text-[20px] text-diligent-gray-4 transition-transform duration-300 ${
    objectivesOpen ? 'rotate-180' : ''
  }`}
>
  expand_more
</span>
          </button>

          {objectivesOpen && (
            <div className="px-6 py-4 bg-white border-t border-gray-200">
              <div
                className="prose prose-sm max-w-none text-gray-700"
                dangerouslySetInnerHTML={{ __html: learningObjectives }}
              />
            </div>
          )}
        </div>
      )}
    </>
  )
}