import { useState } from 'react'
import { createPortal } from 'react-dom'
import { X, FileText, Download } from 'lucide-react'
import TickTickImportModal from './TickTickImportModal'
import { useTranslation } from '@/hooks/useTranslation'

interface ImportModalProps {
  isOpen: boolean
  onClose: () => void
  householdId: string
}

interface ImportService {
  id: string
  name: string
  description: string
  icon: React.ReactNode
  color: string
}

const importServices: ImportService[] = [
  {
    id: 'ticktick',
    name: 'TickTick',
    description: 'Import recurring tasks from TickTick CSV backup',
    icon: <FileText className="w-6 h-6" />,
    color: 'bg-blue-500 hover:bg-blue-600'
  }
  // Future services can be added here:
  // {
  //   id: 'todoist',
  //   name: 'Todoist',
  //   description: 'Import tasks from Todoist',
  //   icon: <FileText className="w-6 h-6" />,
  //   color: 'bg-red-500 hover:bg-red-600'
  // }
]

export default function ImportModal({ isOpen, onClose, householdId }: ImportModalProps) {
  const [selectedService, setSelectedService] = useState<string | null>(null)
  const { t } = useTranslation()

  const handleServiceSelect = (serviceId: string) => {
    setSelectedService(serviceId)
  }

  const handleBack = () => {
    setSelectedService(null)
  }

  const handleClose = () => {
    setSelectedService(null)
    onClose()
  }

  if (!isOpen) return null

  // If a service is selected, show the specific import modal
  if (selectedService === 'ticktick') {
    return (
      <TickTickImportModal
        isOpen={true}
        onClose={handleClose}
        householdId={householdId}
      />
    )
  }

  // Show service selection menu
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <Download className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {t('import.importFrom')}
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {t('import.selectService')}
          </p>

          <div className="grid gap-4">
            {importServices.map((service) => (
              <button
                key={service.id}
                onClick={() => handleServiceSelect(service.id)}
                className={`${service.color} text-white rounded-lg p-4 text-left transition-all hover:shadow-lg flex items-start gap-4`}
              >
                <div className="flex-shrink-0 mt-1">
                  {service.icon}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-1">
                    {service.name}
                  </h3>
                  <p className="text-sm opacity-90">
                    {service.description}
                  </p>
                </div>
                <div className="flex-shrink-0 mt-1">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </button>
            ))}
          </div>

          {/* Info Box */}
          <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 dark:text-blue-200 mb-2">
              {t('import.infoTitle')}
            </h4>
            <p className="text-sm text-blue-800 dark:text-blue-300">
              {t('import.infoDescription')}
            </p>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}

