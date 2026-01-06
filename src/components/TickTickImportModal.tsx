import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, Upload, FileText, CheckCircle2, AlertCircle, ExternalLink } from 'lucide-react'
import { Frequency } from '@/types'
import { useRoutineStore } from '@/store/useRoutineStore'
import { useAuthStore } from '@/store/useAuthStore'
import toast from 'react-hot-toast'
import { useTranslation } from '@/hooks/useTranslation'

interface TickTickImportModalProps {
  isOpen: boolean
  onClose: () => void
  householdId: string
}

interface ParsedTask {
  title: string
  recurrence?: string
  list?: string
  notes?: string
  priority?: string
  status?: string
  [key: string]: any // For other CSV columns
}

interface ImportPreview {
  name: string
  frequency: Frequency
  category: string
  notes?: string
  isValid: boolean
  error?: string
}

const COLORS = [
  '#6366f1', '#ef4444', '#10b981', '#f59e0b', 
  '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'
]

/**
 * Map TickTick recurrence patterns to our frequency types
 * TickTick uses iCal recurrence format (RFC 5545): FREQ=DAILY;INTERVAL=1
 */
function mapRecurrenceToFrequency(recurrence: string | undefined): Frequency {
  if (!recurrence) return 'weekly' // Default
  
  const lower = recurrence.toLowerCase()
  
  // Parse iCal format: FREQ=DAILY;INTERVAL=1
  const freqMatch = lower.match(/freq=([^;]+)/i)
  if (freqMatch) {
    const freq = freqMatch[1].trim()
    const intervalMatch = lower.match(/interval=(\d+)/i)
    const interval = intervalMatch ? parseInt(intervalMatch[1], 10) : 1
    
    switch (freq) {
      case 'daily':
        return 'daily'
      case 'weekly':
        return interval === 2 ? 'biweekly' : 'weekly'
      case 'monthly':
        return interval === 3 ? 'quarterly' : 'monthly'
      case 'yearly':
      case 'annually':
        return 'annually'
      default:
        break
    }
  }
  
  // Fallback to text-based matching for other formats
  // Daily patterns
  if (lower.includes('daily') || lower.includes('every day')) {
    return 'daily'
  }
  
  // Weekly patterns
  if (lower.includes('weekly') || lower.includes('every week')) {
    if (lower.includes('bi') || lower.includes('2')) {
      return 'biweekly'
    }
    return 'weekly'
  }
  
  // Bi-weekly patterns
  if (lower.includes('bi-weekly') || lower.includes('biweekly') || lower.includes('every 2 weeks') || lower.includes('every other week')) {
    return 'biweekly'
  }
  
  // Monthly patterns
  if (lower.includes('monthly') || lower.includes('every month')) {
    if (lower.includes('quarter') || lower.includes('3')) {
      return 'quarterly'
    }
    return 'monthly'
  }
  
  // Quarterly patterns
  if (lower.includes('quarterly') || lower.includes('every 3 months') || lower.includes('every quarter')) {
    return 'quarterly'
  }
  
  // Annual patterns
  if (lower.includes('annually') || lower.includes('yearly') || lower.includes('every year')) {
    return 'annually'
  }
  
  // Default to weekly if pattern not recognized
  return 'weekly'
}

/**
 * Parse CSV line properly handling quoted fields
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    const nextChar = line[i + 1]
    
    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        current += '"'
        i++ // Skip next quote
      } else {
        // Toggle quote state
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      // End of field
      result.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }
  
  // Add last field
  result.push(current.trim())
  
  return result
}

/**
 * Parse CSV content into rows
 */
function parseCSV(content: string): ParsedTask[] {
  const lines = content.split('\n').map(line => line.trim()).filter(line => line.length > 0)
  if (lines.length === 0) return []
  
  // Find the header row - skip metadata lines (lines that start with "Date:", "Version:", "Status:", or are empty)
  let headerIndex = 0
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].toLowerCase()
    // Skip metadata lines
    if (line.startsWith('"date:') || line.startsWith('date:') ||
        line.startsWith('"version:') || line.startsWith('version:') ||
        line.startsWith('"status:') || line.startsWith('status:') ||
        line.match(/^\s*[0-9]+\s+(normal|completed|archived)/i)) {
      continue
    }
    // Check if this looks like a header row (contains common CSV headers)
    if (line.includes('title') || line.includes('task') || line.includes('list name') || line.includes('folder name')) {
      headerIndex = i
      break
    }
  }
  
  if (headerIndex >= lines.length) {
    throw new Error('Could not find header row in CSV file')
  }
  
  // Parse header row
  const headers = parseCSVLine(lines[headerIndex]).map(h => h.replace(/^"|"$/g, '').trim())
  
  // Find column indices (case-insensitive)
  const getColumnIndex = (possibleNames: string[]): number => {
    for (const name of possibleNames) {
      const index = headers.findIndex(h => h.toLowerCase() === name.toLowerCase())
      if (index !== -1) return index
    }
    return -1
  }
  
  const titleIndex = getColumnIndex(['title', 'task', 'name', 'task name', 'task title'])
  const recurrenceIndex = getColumnIndex(['repeat', 'recurrence', 'recurring', 'frequency', 'repeats'])
  const listIndex = getColumnIndex(['list name', 'list', 'folder name', 'folder', 'category', 'project'])
  const notesIndex = getColumnIndex(['content', 'notes', 'description', 'note'])
  const statusIndex = getColumnIndex(['status', 'completed', 'done', 'state'])
  
  if (titleIndex === -1) {
    throw new Error(`Could not find task title column in CSV. Found columns: ${headers.join(', ')}`)
  }
  
  // Parse data rows
  const tasks: ParsedTask[] = []
  for (let i = headerIndex + 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]).map(v => v.replace(/^"|"$/g, '').trim())
    
    // Skip empty rows
    if (values.length === 0 || values.every(v => !v)) continue
    
    const task: ParsedTask = {
      title: values[titleIndex] || '',
      recurrence: recurrenceIndex !== -1 ? values[recurrenceIndex] : undefined,
      list: listIndex !== -1 ? values[listIndex] : undefined,
      notes: notesIndex !== -1 ? values[notesIndex] : undefined,
      status: statusIndex !== -1 ? values[statusIndex] : undefined,
    }
    
    // Only include tasks with titles and that are recurring (have a Repeat field)
    if (task.title && task.recurrence) {
      tasks.push(task)
    }
  }
  
  return tasks
}

export default function TickTickImportModal({ isOpen, onClose, householdId }: TickTickImportModalProps) {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<ImportPreview[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [importedCount, setImportedCount] = useState(0)
  const { createRoutine, createCategory, categories, fetchCategories } = useRoutineStore()
  const { userData } = useAuthStore()
  const { t } = useTranslation()

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      fetchCategories(householdId)
    } else {
      document.body.style.overflow = ''
      setFile(null)
      setPreview([])
      setImportedCount(0)
    }
    
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen, householdId, fetchCategories])

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    if (!selectedFile.name.endsWith('.csv')) {
      toast.error('Please select a CSV file')
      return
    }

    setFile(selectedFile)
    setIsProcessing(true)

    try {
      const content = await selectedFile.text()
      const parsedTasks = parseCSV(content)
      
      if (parsedTasks.length === 0) {
        toast.error('No recurring tasks found in CSV file. Make sure your CSV contains tasks with recurrence patterns.')
        setIsProcessing(false)
        return
      }

      // Create preview
      const previewItems: ImportPreview[] = parsedTasks.map(task => {
        const frequency = mapRecurrenceToFrequency(task.recurrence)
        const categoryName = task.list || 'Imported'
        
        return {
          name: task.title,
          frequency,
          category: categoryName,
          notes: task.notes,
          isValid: true
        }
      })

      setPreview(previewItems)
      toast.success(`Found ${previewItems.length} recurring tasks to import`)
    } catch (error: any) {
      console.error('Error parsing CSV:', error)
      toast.error(`Error parsing CSV: ${error.message || 'Unknown error'}`)
      setPreview([])
    } finally {
      setIsProcessing(false)
    }
  }

  const getOrCreateCategory = async (categoryName: string): Promise<string> => {
    // Check if category exists
    const existing = categories.find(c => c.name.toLowerCase() === categoryName.toLowerCase())
    if (existing) return existing.id

    // Create new category
    const color = COLORS[categories.length % COLORS.length]
    const categoryId = await createCategory({
      name: categoryName,
      color,
      householdId
    })
    
    return categoryId
  }

  const handleImport = async () => {
    if (preview.length === 0) {
      toast.error('No tasks to import')
      return
    }

    if (!userData?.id) {
      toast.error('User not authenticated')
      return
    }

    setIsImporting(true)
    let successCount = 0
    let errorCount = 0

    try {
      for (const item of preview) {
        if (!item.isValid) {
          errorCount++
          continue
        }

        try {
          // Get or create category
          const categoryId = await getOrCreateCategory(item.category)

          // Create routine
          await createRoutine({
            name: item.name,
            categoryId,
            frequency: item.frequency,
            assignedTo: [userData.id],
            householdId,
            createdBy: userData.id,
            isActive: true,
            notes: item.notes
          })

          successCount++
        } catch (error: any) {
          console.error(`Error importing task "${item.name}":`, error)
          errorCount++
        }
      }

      setImportedCount(successCount)
      
      if (successCount > 0) {
        toast.success(`Successfully imported ${successCount} routine${successCount !== 1 ? 's' : ''}`)
      }
      
      if (errorCount > 0) {
        toast.error(`Failed to import ${errorCount} routine${errorCount !== 1 ? 's' : ''}`)
      }

      // Refresh categories and close modal after a short delay
      await fetchCategories(householdId)
      
      setTimeout(() => {
        onClose()
      }, 1500)
    } catch (error: any) {
      console.error('Error during import:', error)
      toast.error(`Import failed: ${error.message || 'Unknown error'}`)
    } finally {
      setIsImporting(false)
    }
  }

  if (!isOpen) return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <FileText className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {t('import.importFromTickTick')}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            disabled={isImporting}
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {importedCount > 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <CheckCircle2 className="w-16 h-16 text-green-500 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                {t('import.importComplete')}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {t('import.successfullyImported')} {importedCount} {importedCount !== 1 ? t('import.routinesPlural') : t('import.routine')}
              </p>
            </div>
          ) : (
            <>
              {/* File Upload */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('import.selectCSVFile')}
                </label>
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-indigo-500 dark:hover:border-indigo-400 transition-colors">
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="csv-upload"
                    disabled={isProcessing || isImporting}
                  />
                  <label
                    htmlFor="csv-upload"
                    className="cursor-pointer flex flex-col items-center gap-2"
                  >
                    <Upload className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {file ? file.name : t('import.clickToSelect')}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-500">
                      {t('import.onlyRecurringTasks')}
                    </span>
                  </label>
                </div>
              </div>

              {/* Processing Indicator */}
              {isProcessing && (
                <div className="mb-4 text-center text-gray-600 dark:text-gray-400">
                  {t('import.processing')}
                </div>
              )}

              {/* Preview */}
              {preview.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    {t('import.preview')} ({preview.length} {t('import.routines')})
                  </h3>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {preview.map((item, index) => (
                      <div
                        key={index}
                        className={`p-3 rounded-lg border ${
                          item.isValid
                            ? 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50'
                            : 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="font-medium text-gray-900 dark:text-white">
                              {item.name}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              <span className="capitalize">{item.frequency}</span>
                              {' • '}
                              <span>{item.category}</span>
                              {item.notes && (
                                <>
                                  {' • '}
                                  <span className="text-xs">{item.notes.substring(0, 50)}</span>
                                </>
                              )}
                            </div>
                          </div>
                          {item.isValid ? (
                            <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 ml-2" />
                          ) : (
                            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 ml-2" />
                          )}
                        </div>
                        {item.error && (
                          <div className="text-xs text-red-600 dark:text-red-400 mt-2">
                            {item.error}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Instructions */}
              {preview.length === 0 && !isProcessing && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold text-blue-900 dark:text-blue-200">
                      {t('import.howToExport')}
                    </h4>
                    <a
                      href="https://help.ticktick.com/articles/7055781405648748544"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
                    >
                      <span>{t('import.learnMore')}</span>
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                  <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800 dark:text-blue-300">
                    <li>{t('import.exportStep1')}</li>
                    <li>{t('import.exportStep2')}</li>
                    <li>{t('import.exportStep3')}</li>
                    <li>{t('import.exportStep4')}</li>
                  </ol>
                  <p className="text-xs text-blue-700 dark:text-blue-400 mt-3">
                    {t('import.note')}
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            disabled={isImporting}
          >
            {importedCount > 0 ? t('import.close') : t('import.cancel')}
          </button>
          {preview.length > 0 && importedCount === 0 && (
            <button
              onClick={handleImport}
              disabled={isImporting || preview.length === 0}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {isImporting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {t('import.importing')}
                </>
              ) : (
                `${t('import.importButton')} ${preview.length} ${preview.length !== 1 ? t('import.routinesPlural') : t('import.routine')}`
              )}
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}

