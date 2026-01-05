import { useState } from 'react'
import { Lightbulb, Loader2, X } from 'lucide-react'
import { getSmartInsights } from '@/services/aiService'
import { Routine, Category, TaskInstance } from '@/types'

interface SmartInsightsProps {
  tasks: TaskInstance[]
  routines: Routine[]
  categories: Category[]
}

export default function SmartInsights({ tasks, routines, categories }: SmartInsightsProps) {
  const [insights, setInsights] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false) // Start collapsed
  const [hasTriedFetch, setHasTriedFetch] = useState(false)

  const fetchInsights = async () => {
    // Prevent multiple simultaneous fetches
    if (loading) return
    
    setLoading(true)
    setHasTriedFetch(true)
    try {
      const result = await getSmartInsights(tasks, routines, categories)
      setInsights(result)
      setIsExpanded(true) // Auto-expand when insights are loaded
    } catch (error: any) {
      console.error('Error fetching insights:', error)
      // Handle rate limit gracefully
      if (error.code === 'functions/resource-exhausted') {
        setInsights([])
        // Show message that rate limit was hit
      } else if (error.code !== 'functions/not-found' && error.code !== 'functions/failed-precondition') {
        setInsights([])
      }
    } finally {
      setLoading(false)
    }
  }

  // Don't auto-fetch - only show button to fetch
  if (!hasTriedFetch && !loading && insights.length === 0) {
    return (
      <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800 p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">Smart Insights</h3>
          </div>
          <button
            onClick={fetchInsights}
            disabled={loading || tasks.length === 0}
            className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed dark:bg-yellow-500 dark:hover:bg-yellow-600"
          >
            {loading ? 'Loading...' : 'Get Insights'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800 p-4 mb-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">Smart Insights</h3>
        </div>
        {isExpanded && (
          <button
            onClick={() => setIsExpanded(false)}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-4 h-4" />
          </button>
        )}
        {!isExpanded && (
          <button
            onClick={() => setIsExpanded(true)}
            className="text-sm text-yellow-600 dark:text-yellow-400 hover:text-yellow-700 dark:hover:text-yellow-300"
          >
            Show
          </button>
        )}
      </div>

      {loading && (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="w-4 h-4 animate-spin text-yellow-600 dark:text-yellow-400" />
          <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">Analyzing...</span>
        </div>
      )}

      {isExpanded && !loading && insights.length > 0 && (
        <div className="space-y-2">
          {insights.map((insight, index) => (
            <div
              key={index}
              className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300"
            >
              <span className="text-yellow-600 dark:text-yellow-400 mt-0.5">💡</span>
              <span>{insight}</span>
            </div>
          ))}
        </div>
      )}

      {hasTriedFetch && !loading && insights.length === 0 && (
        <div className="text-sm text-gray-600 dark:text-gray-400 py-2">
          <p>Rate limit reached. Please try again in a few minutes.</p>
          <button
            onClick={fetchInsights}
            className="mt-2 text-yellow-600 dark:text-yellow-400 hover:text-yellow-700 dark:hover:text-yellow-300 text-sm font-medium"
          >
            Try Again
          </button>
        </div>
      )}
    </div>
  )
}

