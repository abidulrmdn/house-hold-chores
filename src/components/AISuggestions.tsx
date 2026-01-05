import { useState } from 'react'
import { Sparkles, Loader2, Plus, X } from 'lucide-react'
import { getTaskSuggestions, TaskSuggestion } from '@/services/aiService'
import { Routine, Category, TaskInstance } from '@/types'
import { useTranslation } from '@/hooks/useTranslation'
import toast from 'react-hot-toast'

interface AISuggestionsProps {
  routines: Routine[]
  categories: Category[]
  tasks: TaskInstance[]
  householdId: string
  onSuggestionSelect: (suggestion: TaskSuggestion) => void
}

export default function AISuggestions({
  routines,
  categories,
  tasks,
  householdId,
  onSuggestionSelect
}: AISuggestionsProps) {
  const [suggestions, setSuggestions] = useState<TaskSuggestion[]>([])
  const [loading, setLoading] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const { t } = useTranslation()

  const fetchSuggestions = async () => {
    setLoading(true)
    try {
      const result = await getTaskSuggestions(routines, categories, tasks, householdId)
      setSuggestions(result)
      setIsExpanded(true)
    } catch (error: any) {
      console.error('Error fetching suggestions:', error)
      if (error.code === 'functions/not-found') {
        toast.error('AI features not deployed. Please deploy Firebase Functions first.')
      } else if (error.code === 'functions/failed-precondition') {
        toast.error('Gemini API not configured. Please set up your API key.')
      } else {
        toast.error('Failed to load suggestions. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg border border-purple-200 dark:border-purple-800 p-4 mb-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">{t('ai.taskSuggestions')}</h3>
        </div>
        {!isExpanded && (
          <button
            onClick={fetchSuggestions}
            disabled={loading}
            className="text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium disabled:opacity-50"
          >
            {loading ? t('ai.loading') : t('ai.getSuggestions')}
          </button>
        )}
        {isExpanded && (
          <button
            onClick={() => setIsExpanded(false)}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {loading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-purple-600 dark:text-purple-400" />
          <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">{t('ai.generating')}</span>
        </div>
      )}

      {isExpanded && !loading && suggestions.length > 0 && (
        <div className="space-y-3">
          {suggestions.map((suggestion, index) => (
            <div
              key={index}
              className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-700 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-gray-900 dark:text-gray-100">{suggestion.name}</h4>
                    <span className="text-xs px-2 py-0.5 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded-full">
                      {suggestion.frequency}
                    </span>
                    {suggestion.category && (
                      <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full">
                        {suggestion.category}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{suggestion.reason}</p>
                </div>
                <button
                  onClick={() => onSuggestionSelect(suggestion)}
                  className="ml-4 p-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors dark:bg-purple-500 dark:hover:bg-purple-600"
                  title={t('ai.addTask')}
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
          <button
            onClick={fetchSuggestions}
            className="w-full text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium py-2"
          >
            {t('ai.getMore')}
          </button>
        </div>
      )}

      {isExpanded && !loading && suggestions.length === 0 && (
        <div className="text-center py-4 text-gray-500 dark:text-gray-400">
          <p>{t('ai.noSuggestions')}</p>
        </div>
      )}
    </div>
  )
}

