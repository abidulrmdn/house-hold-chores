import { useState, useEffect } from 'react'
import { Search, Filter, ArrowUpDown, Sparkles, X, ChevronUp } from 'lucide-react'
import { useTranslation } from '@/hooks/useTranslation'

interface MobileToolbarProps {
  searchQuery: string
  setSearchQuery: (query: string) => void
  sortBy: 'dueDate' | 'assignee'
  setSortBy: (sort: 'dueDate' | 'assignee') => void
  quickFilter: 'overdue' | 'today' | 'upcoming' | 'avoiding' | 'quick' | null
  setQuickFilter: (filter: 'overdue' | 'today' | 'upcoming' | 'avoiding' | 'quick' | null) => void
  onAIClick: () => void
  isAIVisible: boolean
}

export default function MobileToolbar({
  searchQuery,
  setSearchQuery,
  sortBy,
  setSortBy,
  quickFilter,
  setQuickFilter,
  onAIClick,
  isAIVisible
}: MobileToolbarProps) {
  const [expandedSection, setExpandedSection] = useState<'search' | 'filters' | 'sort' | 'ai' | null>(null)
  const { t } = useTranslation()

  const quickFilters = [
    { id: 'overdue' as const, label: t('dashboard.overdue'), color: 'red' },
    { id: 'today' as const, label: t('dashboard.today'), color: 'blue' },
    { id: 'upcoming' as const, label: t('dashboard.upcoming'), color: 'green' },
    { id: 'avoiding' as const, label: t('dashboard.avoiding'), color: 'orange' },
    { id: 'quick' as const, label: t('dashboard.quickTasks'), color: 'purple' }
  ]

  const sortOptions = [
    { id: 'dueDate' as const, label: t('dashboard.sortByDueDate') },
    { id: 'assignee' as const, label: t('dashboard.sortByAssignee') }
  ]

  const toggleSection = (section: 'search' | 'filters' | 'sort' | 'ai') => {
    setExpandedSection(expandedSection === section ? null : section)
  }

  // Close expanded section when clicking outside
  useEffect(() => {
    if (!expandedSection) return
    
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest('.mobile-toolbar')) {
        setExpandedSection(null)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [expandedSection])

  return (
    <div className="sm:hidden mobile-toolbar mobile-toolbar-bottom fixed bottom-0 left-0 right-0 z-40 safe-area-bottom">
      {/* Expanded Sections - Render above toolbar */}
      {expandedSection && (
        <div className="absolute bottom-full left-0 right-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-lg max-h-[60vh] overflow-y-auto">
          {expandedSection === 'search' && (
            <div className="px-4 py-3 bg-gray-50 dark:bg-gray-900">
              <div className="flex items-center gap-2">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder={t('common.search') + '...'}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    autoFocus
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <button
                  onClick={() => setExpandedSection(null)}
                  className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                >
                  <ChevronUp className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {expandedSection === 'filters' && (
            <div className="px-4 py-3 bg-gray-50 dark:bg-gray-900">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">{t('dashboard.filters')}</h3>
                <button
                  onClick={() => setExpandedSection(null)}
                  className="p-1 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                >
                  <ChevronUp className="w-5 h-5" />
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {quickFilters.map(filter => {
                  const isActive = quickFilter === filter.id
                  return (
                    <button
                      key={filter.id}
                      onClick={() => setQuickFilter(isActive ? null : filter.id)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                        isActive
                          ? filter.id === 'overdue'
                            ? 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300'
                            : filter.id === 'today'
                            ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                            : filter.id === 'upcoming'
                            ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
                            : filter.id === 'avoiding'
                            ? 'bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300'
                            : 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      {filter.label}
                    </button>
                  )
                })}
                {quickFilter && (
                  <button
                    onClick={() => setQuickFilter(null)}
                    className="px-3 py-1.5 text-xs font-medium rounded-lg bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-500 flex items-center gap-1"
                  >
                    <X className="w-3 h-3" />
                    {t('common.clear')}
                  </button>
                )}
              </div>
            </div>
          )}

          {expandedSection === 'sort' && (
            <div className="px-4 py-3 bg-gray-50 dark:bg-gray-900">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">{t('dashboard.sortBy')}</h3>
                <button
                  onClick={() => setExpandedSection(null)}
                  className="p-1 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                >
                  <ChevronUp className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-2">
                {sortOptions.map(option => (
                  <button
                    key={option.id}
                    onClick={() => {
                      setSortBy(option.id)
                      setExpandedSection(null)
                    }}
                    className={`w-full px-4 py-2 text-left rounded-lg transition-colors ${
                      sortBy === option.id
                        ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300'
                        : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Main Toolbar Row */}
      <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-lg">
        <div className="flex items-center justify-around px-1 py-2">
          {/* Search Button */}
          <button
            onClick={() => toggleSection('search')}
            className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg transition-colors relative ${
              expandedSection === 'search' || searchQuery
                ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <Search className="w-5 h-5" />
            <span className="text-[10px] font-medium">{t('common.search')}</span>
            {searchQuery && (
              <span className="absolute top-0 right-0 w-2 h-2 bg-primary-500 rounded-full border border-white dark:border-gray-800"></span>
            )}
          </button>

          {/* Filters Button */}
          <button
            onClick={() => toggleSection('filters')}
            className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg transition-colors relative ${
              expandedSection === 'filters' || quickFilter
                ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <Filter className="w-5 h-5" />
            <span className="text-[10px] font-medium">{t('dashboard.filters')}</span>
            {quickFilter && (
              <span className="absolute top-0 right-0 w-2 h-2 bg-primary-500 rounded-full border border-white dark:border-gray-800"></span>
            )}
          </button>

          {/* Sort Button */}
          <button
            onClick={() => toggleSection('sort')}
            className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg transition-colors ${
              expandedSection === 'sort'
                ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <ArrowUpDown className="w-5 h-5" />
            <span className="text-[10px] font-medium">{t('dashboard.sort')}</span>
          </button>

          {/* AI Button */}
          <button
            onClick={() => {
              toggleSection('ai')
              onAIClick()
            }}
            className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg transition-colors relative ${
              isAIVisible
                ? 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300'
                : 'text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20'
            }`}
          >
            <Sparkles className="w-5 h-5" />
            <span className="text-[10px] font-medium">AI</span>
            {isAIVisible && (
              <span className="absolute top-0 right-0 w-2 h-2 bg-purple-500 rounded-full border border-white dark:border-gray-800"></span>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
