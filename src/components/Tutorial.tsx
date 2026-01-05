import { useState, useEffect, useRef } from 'react'
import { X, ChevronRight, ChevronLeft } from 'lucide-react'

interface TutorialStep {
  id: string
  title: string
  content: string
  target: string // CSS selector or 'manual'
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center'
}

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Routine Manager! 👋',
    content: 'This app helps you manage household chores and routines. Let\'s take a quick tour of the key features.',
    target: 'manual',
    position: 'center'
  },
  {
    id: 'tabs',
    title: 'View Tasks by Time',
    content: 'Use these tabs to filter tasks: Today, This Week, All Tasks, My Tasks, Calendar, and Statistics.',
    target: '[data-tutorial="tabs"]',
    position: 'bottom'
  },
  {
    id: 'search',
    title: 'Search & Filter',
    content: 'Search tasks by name, category, or assignee. Use quick filters like "Overdue", "Today", "Quick Tasks" to find what you need.',
    target: '[data-tutorial="search"]',
    position: 'bottom'
  },
  {
    id: 'task-card',
    title: 'Task Cards',
    content: 'Swipe right to complete a task, swipe left to undo. Click the 3-dot menu for more actions like edit, reassign, or delete.',
    target: '[data-tutorial="task-card"]',
    position: 'top'
  },
  {
    id: 'create-button',
    title: 'Create New Routine',
    content: 'Click this button (or press N) to create a new routine. You can set frequency, assign to household members, and add reminders.',
    target: '[data-tutorial="create-button"]',
    position: 'top'
  },
  {
    id: 'settings',
    title: 'Settings',
    content: 'Access your profile, manage categories, leave household, or create a new household from the settings menu.',
    target: '[data-tutorial="settings"]',
    position: 'left'
  },
  {
    id: 'complete',
    title: 'You\'re All Set! 🎉',
    content: 'Start by creating your first routine or exploring existing tasks. You can always access this tutorial from Settings.',
    target: 'manual',
    position: 'center'
  }
]

export default function Tutorial() {
  const [isActive, setIsActive] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null)
  const overlayRef = useRef<HTMLDivElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Check if user has seen tutorial
    const hasSeenTutorial = localStorage.getItem('has-seen-tutorial')
    if (!hasSeenTutorial) {
      // Show tutorial after a short delay
      setTimeout(() => {
        setIsActive(true)
      }, 1000)
    }
  }, [])

  useEffect(() => {
    if (!isActive) return

    const step = TUTORIAL_STEPS[currentStep]
    
    if (step.target === 'manual') {
      setTargetElement(null)
      return
    }

    // Find target element
    const element = document.querySelector(step.target) as HTMLElement
    setTargetElement(element)

    // Scroll element into view if needed (with mobile-friendly options)
    if (element) {
      // Use 'nearest' for mobile to avoid excessive scrolling
      const isMobile = window.innerWidth < 640
      element.scrollIntoView({ 
        behavior: 'smooth', 
        block: isMobile ? 'nearest' : 'center',
        inline: 'nearest'
      })
    }
  }, [isActive, currentStep])

  const handleNext = () => {
    if (currentStep < TUTORIAL_STEPS.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      handleComplete()
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSkip = () => {
    handleComplete()
  }

  const handleComplete = () => {
    setIsActive(false)
    localStorage.setItem('has-seen-tutorial', 'true')
  }


  if (!isActive) return null

  const step = TUTORIAL_STEPS[currentStep]
  const isFirstStep = currentStep === 0
  const isLastStep = currentStep === TUTORIAL_STEPS.length - 1

  // Calculate tooltip position
  let tooltipStyle: React.CSSProperties = {}
  if (targetElement && step.target !== 'manual') {
    const rect = targetElement.getBoundingClientRect()
    const scrollY = window.scrollY
    const scrollX = window.scrollX
    const viewportHeight = window.innerHeight
    const viewportWidth = window.innerWidth
    const isMobile = viewportWidth < 640
    const tooltipHeight = isMobile ? 150 : 200 // Smaller on mobile
    const tooltipWidth = isMobile ? Math.min(viewportWidth - 40, 320) : 384 // Responsive width

    // Determine best position based on available space
    let finalPosition = step.position
    const spaceBelow = viewportHeight - rect.bottom
    const spaceAbove = rect.top
    const spaceRight = viewportWidth - rect.right
    const spaceLeft = rect.left

    // Auto-adjust position if default would go off-screen
    if (step.position === 'bottom' && spaceBelow < tooltipHeight + 100) {
      finalPosition = 'top'
    } else if (step.position === 'top' && spaceAbove < tooltipHeight + 100) {
      finalPosition = 'bottom'
    } else if (step.position === 'right' && spaceRight < tooltipWidth + 20) {
      finalPosition = 'left'
    } else if (step.position === 'left' && spaceLeft < tooltipWidth + 20) {
      finalPosition = 'right'
    }

    switch (finalPosition) {
      case 'top':
        tooltipStyle = {
          top: `${rect.top + scrollY - 10}px`,
          left: `${rect.left + scrollX + rect.width / 2}px`,
          transform: 'translate(-50%, -100%)',
          maxHeight: `${spaceAbove - 20}px`,
          overflowY: 'auto'
        }
        break
      case 'bottom':
        tooltipStyle = {
          top: `${rect.bottom + scrollY + 10}px`,
          left: `${rect.left + scrollX + rect.width / 2}px`,
          transform: 'translateX(-50%)',
          maxHeight: `${Math.min(spaceBelow - 20, 300)}px`,
          overflowY: 'auto'
        }
        break
      case 'left':
        tooltipStyle = {
          top: `${rect.top + scrollY + rect.height / 2}px`,
          left: `${rect.left + scrollX - 10}px`,
          transform: 'translate(-100%, -50%)',
          maxWidth: `${spaceLeft - 20}px`
        }
        break
      case 'right':
        tooltipStyle = {
          top: `${rect.top + scrollY + rect.height / 2}px`,
          left: `${rect.right + scrollX + 10}px`,
          transform: 'translateY(-50%)',
          maxWidth: `${Math.min(spaceRight - 20, 384)}px`
        }
        break
    }

    // Ensure tooltip stays within viewport
    const tooltipTop = finalPosition === 'top' 
      ? rect.top + scrollY - 10 
      : finalPosition === 'bottom'
      ? rect.bottom + scrollY + 10
      : rect.top + scrollY + rect.height / 2
    
    const tooltipLeft = finalPosition === 'left'
      ? rect.left + scrollX - 10
      : finalPosition === 'right'
      ? rect.right + scrollX + 10
      : rect.left + scrollX + rect.width / 2

    // Adjust if tooltip would go off-screen
    if (tooltipTop + tooltipHeight > viewportHeight + scrollY) {
      tooltipStyle.top = `${viewportHeight + scrollY - tooltipHeight - 20}px`
    }
    if (tooltipTop < scrollY) {
      tooltipStyle.top = `${scrollY + 20}px`
    }
    if (tooltipLeft + tooltipWidth / 2 > viewportWidth + scrollX) {
      tooltipStyle.left = `${viewportWidth + scrollX - tooltipWidth / 2 - 20}px`
    }
    if (tooltipLeft - tooltipWidth / 2 < scrollX) {
      tooltipStyle.left = `${scrollX + tooltipWidth / 2 + 20}px`
    }
  } else if (step.target === 'manual') {
    tooltipStyle = {
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      maxHeight: '90vh',
      overflowY: 'auto'
    }
  }

  return (
    <>
      {/* Overlay */}
      <div
        ref={overlayRef}
        className="fixed inset-0 bg-black bg-opacity-50 z-[10000]"
        onClick={handleSkip}
      />

      {/* Highlight overlay for target element */}
      {targetElement && step.target !== 'manual' && (
        <div
          className="fixed z-[10001] pointer-events-none"
          style={{
            top: `${targetElement.getBoundingClientRect().top}px`,
            left: `${targetElement.getBoundingClientRect().left}px`,
            width: `${targetElement.getBoundingClientRect().width}px`,
            height: `${targetElement.getBoundingClientRect().height}px`,
            boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5), 0 0 0 4px #6366f1'
          }}
        />
      )}

      {/* Tooltip */}
      <div
        ref={tooltipRef}
        className="fixed z-[10002] bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-4 sm:p-6 max-w-[90vw] sm:max-w-sm flex flex-col"
        style={{
          ...tooltipStyle,
          maxHeight: 'calc(100vh - 40px)',
          maxWidth: 'calc(100vw - 40px)',
          // Ensure tooltip stays within viewport on mobile
          ...(step.target === 'manual' ? {
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            position: 'fixed'
          } : {})
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-3 sm:mb-4">
          <div className="flex-1 pr-2">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1 sm:mb-2">
              {step.title}
            </h3>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
              {step.content}
            </p>
          </div>
          <button
            onClick={handleSkip}
            className="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 sm:gap-0">
          <div className="text-xs text-gray-500 dark:text-gray-400 text-center sm:text-left">
            Step {currentStep + 1} of {TUTORIAL_STEPS.length}
          </div>
          <div className="flex gap-2 justify-end">
            {!isFirstStep && (
              <button
                onClick={handlePrevious}
                className="px-3 py-1.5 text-xs sm:text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors flex items-center gap-1"
              >
                <ChevronLeft className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Previous</span>
                <span className="sm:hidden">Prev</span>
              </button>
            )}
            <button
              onClick={isLastStep ? handleComplete : handleNext}
              className="px-3 sm:px-4 py-1.5 text-xs sm:text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-1"
            >
              {isLastStep ? 'Get Started' : 'Next'}
              {!isLastStep && <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

// Export function to restart tutorial
export const restartTutorial = () => {
  localStorage.removeItem('has-seen-tutorial')
  window.location.reload()
}

