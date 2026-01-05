import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Home, ChefHat, Droplet, Bed, Car, 
  TreePine, Shirt, CheckCircle2, 
  ChevronRight, ChevronLeft, Sparkles, ArrowRight,
  X
} from 'lucide-react'
import { useRoutineStore } from '@/store/useRoutineStore'
import { useAuthStore } from '@/store/useAuthStore'
import { useHouseholdStore } from '@/store/useHouseholdStore'
import { getTaskSuggestions } from '@/services/aiService'
import { Frequency } from '@/types'
import { useTranslation } from '@/hooks/useTranslation'
import { useLanguageStore } from '@/store/useLanguageStore'
import toast from 'react-hot-toast'

interface OnboardingWizardProps {
  isOpen: boolean
  onClose: () => void
  onComplete: () => void
}

interface HouseArea {
  id: string
  name: string
  icon: React.ReactNode
  color: string
  commonTasks: string[]
}

// Base house areas structure (without translations)
const HOUSE_AREAS_BASE = [
  {
    id: 'kitchen',
    icon: ChefHat,
    color: 'bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 border-orange-300 dark:border-orange-700'
  },
  {
    id: 'bathroom',
    icon: Droplet,
    color: 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700'
  },
  {
    id: 'bedroom',
    icon: Bed,
    color: 'bg-pink-100 dark:bg-pink-900 text-pink-700 dark:text-pink-300 border-pink-300 dark:border-pink-700'
  },
  {
    id: 'living-room',
    icon: Home,
    color: 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 border-green-300 dark:border-green-700'
  },
  {
    id: 'laundry',
    icon: Shirt,
    color: 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-700'
  },
  {
    id: 'garage',
    icon: Car,
    color: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-700'
  },
  {
    id: 'outdoor',
    icon: TreePine,
    color: 'bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700'
  }
]

interface SuggestedTask {
  name: string
  frequency: Frequency
  category: string
  reason: string
  selected: boolean
}

export default function OnboardingWizard({ isOpen, onClose, onComplete }: OnboardingWizardProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [selectedAreas, setSelectedAreas] = useState<string[]>([])
  const [suggestedTasks, setSuggestedTasks] = useState<SuggestedTask[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const { t } = useTranslation()
  const language = useLanguageStore(state => state.language)
  
  const { userData } = useAuthStore()
  const { household } = useHouseholdStore()
  const { createRoutine, routines, categories, fetchCategories } = useRoutineStore()

  // Get translated house areas based on current language
  const HOUSE_AREAS: HouseArea[] = useMemo(() => {
    return HOUSE_AREAS_BASE.map(area => {
      const IconComponent = area.icon
      const commonTasks = t(`onboarding.commonTasks.${area.id}`, { returnObjects: true })
      return {
        id: area.id,
        name: t(`onboarding.houseAreas.${area.id}`),
        icon: <IconComponent className="w-6 h-6" />,
        color: area.color,
        commonTasks: Array.isArray(commonTasks) ? commonTasks : []
      }
    })
  }, [t, language])

  useEffect(() => {
    if (isOpen && household?.id) {
      fetchCategories(household.id)
    }
  }, [isOpen, household?.id, fetchCategories])

  const handleAreaToggle = (areaId: string) => {
    setSelectedAreas(prev => 
      prev.includes(areaId) 
        ? prev.filter(id => id !== areaId)
        : [...prev, areaId]
    )
  }


  const handleSuggestedTaskToggle = (taskName: string) => {
    setSuggestedTasks(prev =>
      prev.map(task =>
        task.name === taskName ? { ...task, selected: !task.selected } : task
      )
    )
  }

  const generateSuggestions = async () => {
    if (selectedAreas.length === 0) {
      toast.error(t('onboarding.selectAtLeastOne'))
      return
    }

    setIsGenerating(true)
    try {
      const selectedAreaData = HOUSE_AREAS.filter(area => selectedAreas.includes(area.id))

      // Get existing routine names to avoid duplicates
      const existingRoutineNames = routines.map(r => r.name.toLowerCase().trim())

      // Use AI to generate smart suggestions based on selected areas
      // Pass existing routines to avoid duplicates
      let suggestions: any[] = []
      try {
        const result = await getTaskSuggestions(
          routines,
          categories,
          [],
          household?.id || '',
          selectedAreas // Pass selected areas to focus AI suggestions
        )
        suggestions = result || []
      } catch (error: any) {
        console.log('AI suggestions failed:', error)
        // If rate limited, show helpful message but continue with fallback
        if (error?.code === 'resource-exhausted' || error?.message?.includes('Rate limit')) {
          toast.error('Rate limit reached. Using common tasks from selected areas. You can regenerate suggestions in an hour.')
        } else if (error?.code === 'functions/not-found') {
          toast.error('AI features not deployed. Using common tasks from selected areas.')
        } else {
          // Silent fail - will use fallback tasks
          console.log('AI suggestions unavailable, using fallback')
        }
        suggestions = []
      }

      // Transform suggestions into our format and filter out duplicates
      const transformed: SuggestedTask[] = suggestions
        .filter(suggestion => {
          const nameLower = suggestion.name.toLowerCase().trim()
          return !existingRoutineNames.includes(nameLower)
        })
        .map(suggestion => ({
          name: suggestion.name,
          frequency: suggestion.frequency as Frequency,
          category: suggestion.category || 'General',
          reason: suggestion.reason,
          selected: true // Auto-select all initially
        }))

      // Add common tasks from selected areas (prioritize these)
      selectedAreaData.forEach(area => {
        area.commonTasks.forEach(taskName => {
          const nameLower = taskName.toLowerCase().trim()
          // Check if it doesn't exist in transformed or existing routines
          if (!transformed.find(t => t.name.toLowerCase().trim() === nameLower) &&
              !existingRoutineNames.includes(nameLower)) {
            transformed.unshift({ // Add to beginning for priority
              name: taskName,
              frequency: 'weekly' as Frequency,
              category: area.name,
              reason: t('onboarding.houseAreas.commonTaskReason', { area: area.name }),
              selected: true
            })
          }
        })
      })

      setSuggestedTasks(transformed)
      if (currentStep < 2) {
        setCurrentStep(2)
      }
    } catch (error: any) {
      console.error('Error generating suggestions:', error)
      toast.error(t('onboarding.failedToGenerate'))
      
      // Fallback to common tasks (also filter duplicates)
      const existingRoutineNames = routines.map(r => r.name.toLowerCase().trim())
      const selectedAreaData = HOUSE_AREAS.filter(area => selectedAreas.includes(area.id))
      const fallback: SuggestedTask[] = selectedAreaData.flatMap(area =>
        area.commonTasks
          .filter(taskName => !existingRoutineNames.includes(taskName.toLowerCase().trim()))
          .map(taskName => ({
            name: taskName,
            frequency: 'weekly' as Frequency,
            category: area.name,
            reason: t('onboarding.houseAreas.commonTaskReason', { area: area.name }),
            selected: true
          }))
      )
      setSuggestedTasks(fallback)
      if (currentStep < 2) {
        setCurrentStep(2)
      }
    } finally {
      setIsGenerating(false)
    }
  }

  const handleCreateRoutines = async () => {
    const tasksToCreate = suggestedTasks.filter(task => task.selected)
    
    if (tasksToCreate.length === 0) {
      toast.error(t('onboarding.selectAtLeastOneTask'))
      return
    }

    setIsCreating(true)
    try {
      // Group tasks by category
      const tasksByCategory = tasksToCreate.reduce((acc, task) => {
        if (!acc[task.category]) {
          acc[task.category] = []
        }
        acc[task.category].push(task)
        return acc
      }, {} as Record<string, SuggestedTask[]>)

      // Create routines with spread start dates (3 per day max)
      let created = 0
      const { createCategory } = useRoutineStore.getState()
      
      // Flatten all tasks and group by category
      const allTasksFlat: Array<{ task: SuggestedTask; categoryName: string }> = []
      for (const [categoryName, tasks] of Object.entries(tasksByCategory)) {
        tasks.forEach(task => {
          allTasksFlat.push({ task, categoryName })
        })
      }

      // Spread tasks across days (3 per day)
      const TASKS_PER_DAY = 3
      const tasksByDay: Array<Array<{ task: SuggestedTask; categoryName: string }>> = []
      for (let i = 0; i < allTasksFlat.length; i += TASKS_PER_DAY) {
        tasksByDay.push(allTasksFlat.slice(i, i + TASKS_PER_DAY))
      }

      // Process each day's tasks
      for (let dayIndex = 0; dayIndex < tasksByDay.length; dayIndex++) {
        const dayTasks = tasksByDay[dayIndex]
        
        // Calculate start date for this day (spread across days)
        const startDate = new Date()
        startDate.setDate(startDate.getDate() + dayIndex)
        startDate.setHours(0, 0, 0, 0)
        const startDateTimestamp = startDate.getTime()

        // Process each task in this day
        for (const { task, categoryName } of dayTasks) {
          try {
            // Find or create category
            let category = categories.find(c => c.name.toLowerCase() === categoryName.toLowerCase())
            if (!category && household?.id) {
              try {
                // Create new category
                const categoryColors = ['#6366f1', '#ec4899', '#06b6d4', '#84cc16', '#f59e0b', '#ef4444', '#8b5cf6']
                const randomColor = categoryColors[Math.floor(Math.random() * categoryColors.length)]
                const categoryId = await createCategory({
                  name: categoryName,
                  color: randomColor,
                  householdId: household.id
                })
                category = { id: categoryId, name: categoryName, color: randomColor, householdId: household.id, createdAt: Date.now() }
                // Refresh categories
                if (household.id) {
                  await fetchCategories(household.id)
                }
              } catch (error) {
                console.error(`Error creating category ${categoryName}:`, error)
                // Use default category if creation fails
                category = categories[0] || { id: 'default', name: categoryName, color: '#6366f1', householdId: household.id, createdAt: Date.now() }
              }
            }

            if (category && household?.id && userData?.id) {
              await createRoutine({
                name: task.name,
                categoryId: category.id,
                frequency: task.frequency,
                assignedTo: [userData.id],
                householdId: household.id,
                createdBy: userData.id,
                isActive: true,
                startDate: startDateTimestamp
              } as any)
              created++
            }
          } catch (error) {
            console.error(`Error creating routine ${task.name}:`, error)
          }
        }
      }

      toast.success(t('onboarding.routinesCreated', { count: created }))
      onComplete()
    } catch (error: any) {
      console.error('Error creating routines:', error)
      toast.error(t('routine.failedToCreate'))
    } finally {
      setIsCreating(false)
    }
  }

  const steps = useMemo(() => [
    {
      title: t('onboarding.welcome'),
      subtitle: t('onboarding.welcomeSubtitle'),
      content: (
        <div className="text-center space-y-4">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
            className="mx-auto w-24 h-24 bg-gradient-to-br from-primary-500 to-primary-700 rounded-full flex items-center justify-center mb-6"
          >
            <Sparkles className="w-12 h-12 text-white" />
          </motion.div>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            {t('onboarding.welcomeDesc')}
          </p>
        </div>
      )
    },
    {
      title: t('onboarding.selectAreas'),
      subtitle: t('onboarding.selectAreasSubtitle'),
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {HOUSE_AREAS.map((area) => {
              const isSelected = selectedAreas.includes(area.id)
              return (
                <motion.button
                  key={area.id}
                  onClick={() => handleAreaToggle(area.id)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    isSelected
                      ? `${area.color} border-current shadow-lg`
                      : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-600'
                  }`}
                >
                  <div className="flex flex-col items-center gap-2">
                    <div className={`${isSelected ? 'text-current' : 'text-gray-400 dark:text-gray-500'}`}>
                      {area.icon}
                    </div>
                    <span className={`text-sm font-medium ${isSelected ? 'text-current' : 'text-gray-700 dark:text-gray-300'}`}>
                      {area.name}
                    </span>
                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute top-1 right-1"
                      >
                        <CheckCircle2 className="w-5 h-5 text-current" />
                      </motion.div>
                    )}
                  </div>
                </motion.button>
              )
            })}
          </div>
        </div>
      )
    },
    {
      title: t('onboarding.suggestions'),
      subtitle: t('onboarding.suggestionsSubtitle'),
      content: (
        <div className="space-y-4">
          {isGenerating ? (
            <div className="text-center py-12">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                className="w-16 h-16 border-4 border-primary-200 dark:border-primary-800 border-t-primary-600 rounded-full mx-auto mb-4"
              />
              <p className="text-gray-600 dark:text-gray-400">{t('onboarding.generating')}</p>
            </div>
          ) : suggestedTasks.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              {t('onboarding.noSuggestions')}
            </div>
          ) : (
            <div className="space-y-3">
              {suggestedTasks.map((task, index) => (
                <motion.div
                  key={task.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    task.selected
                      ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-300 dark:border-primary-700'
                      : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                  }`}
                  onClick={() => handleSuggestedTaskToggle(task.name)}
                >
                  <div className="flex items-start gap-3">
                    <div className={`flex-shrink-0 w-6 h-6 rounded border-2 flex items-center justify-center ${
                      task.selected
                        ? 'bg-primary-600 border-primary-600'
                        : 'border-gray-300 dark:border-gray-600'
                    }`}>
                      {task.selected && <CheckCircle2 className="w-4 h-4 text-white" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                          {task.name}
                        </h4>
                        <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-gray-600 dark:text-gray-400">
                          {task.frequency}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{task.reason}</p>
                      <span className="text-xs text-primary-600 dark:text-primary-400 mt-1 inline-block">
                        {task.category}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )
    }
  ], [HOUSE_AREAS, t, selectedAreas, suggestedTasks, isGenerating, handleSuggestedTaskToggle, handleAreaToggle])

  if (!isOpen) return null

  const isFirstStep = currentStep === 0
  const isLastStep = currentStep === steps.length - 1
  const canProceed = currentStep === 0 || (currentStep === 1 && selectedAreas.length > 0) || (currentStep === 2 && suggestedTasks.filter(t => t.selected).length > 0)

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[10006]" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex-shrink-0 bg-gradient-to-r from-primary-600 to-primary-700 text-white px-6 py-4 rounded-t-2xl flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">{steps[currentStep].title}</h2>
            <p className="text-primary-100 text-sm mt-1">{steps[currentStep].subtitle}</p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-primary-100 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`flex-1 h-2 rounded-full transition-all ${
                  index <= currentStep
                    ? 'bg-primary-600'
                    : 'bg-gray-200 dark:bg-gray-700'
                }`}
              />
            ))}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
            Step {currentStep + 1} of {steps.length}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 min-h-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {steps[currentStep].content}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 border-t border-gray-200 dark:border-gray-700 px-4 sm:px-6 py-4 flex items-center justify-between gap-2 overflow-hidden">
          <button
            onClick={() => {
              if (currentStep > 0) {
                setCurrentStep(currentStep - 1)
              } else {
                onClose()
              }
            }}
            className="px-3 sm:px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors flex items-center gap-2 flex-shrink-0"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline">{isFirstStep ? t('common.cancel') : t('common.back')}</span>
          </button>

          <div className="flex gap-2 flex-1 justify-end min-w-0">
            {currentStep === 1 ? (
              // Step 1: Only show Generate button (no Next button)
              <button
                onClick={generateSuggestions}
                disabled={selectedAreas.length === 0 || isGenerating}
                className="px-6 sm:px-8 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-semibold text-base sm:text-lg whitespace-nowrap flex-shrink-0 shadow-lg hover:shadow-xl"
              >
                {isGenerating ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                    />
                    {t('onboarding.generating')}
                  </>
                ) : (
                  <>
                    {t('onboarding.generateAIRoutines')}
                    <Sparkles className="w-5 h-5" />
                  </>
                )}
              </button>
            ) : currentStep === 2 ? (
              // Step 2: Show Regenerate and Create buttons
              <>
                <button
                  onClick={generateSuggestions}
                  disabled={selectedAreas.length === 0 || isGenerating}
                  className="px-3 sm:px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium text-sm whitespace-nowrap flex-shrink-0"
                  title={t('onboarding.regenerate')}
                >
                  {isGenerating ? t('onboarding.generating') : t('onboarding.regenerate')}
                  {!isGenerating && <Sparkles className="w-4 h-4" />}
                </button>
                <button
                  onClick={handleCreateRoutines}
                  disabled={suggestedTasks.filter(t => t.selected).length === 0 || isCreating}
                  className="px-4 sm:px-6 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium whitespace-nowrap flex-shrink-0 text-sm sm:text-base"
                >
                  <span className="hidden sm:inline">
                    {isCreating ? t('onboarding.creating') : t('onboarding.createRoutines', { count: suggestedTasks.filter(t => t.selected).length })}
                  </span>
                  <span className="sm:hidden">
                    {isCreating ? t('onboarding.creating') : t('onboarding.createRoutines', { count: suggestedTasks.filter(t => t.selected).length })}
                  </span>
                  {!isCreating && <ArrowRight className="w-4 h-4" />}
                </button>
              </>
            ) : (
              // Step 0: Show Next button
              <button
                onClick={() => {
                  if (canProceed) {
                    setCurrentStep(currentStep + 1)
                  }
                }}
                disabled={!canProceed}
                className="px-4 sm:px-6 py-2 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-lg hover:from-primary-700 hover:to-primary-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium whitespace-nowrap flex-shrink-0"
              >
                {isLastStep ? t('tutorial.finish') : t('common.next')}
                {!isLastStep && <ChevronRight className="w-4 h-4" />}
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  )
}

