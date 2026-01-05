import { useState, useEffect } from 'react'
import { X, Trash2, Edit2 } from 'lucide-react'
import { useRoutineStore } from '@/store/useRoutineStore'
import toast from 'react-hot-toast'
import { doc, deleteDoc } from 'firebase/firestore'
import { db } from '@/firebase/config'

interface ManageCategoriesModalProps {
  isOpen: boolean
  onClose: () => void
  householdId: string
}

const COLORS = [
  '#6366f1', '#ef4444', '#10b981', '#f59e0b', 
  '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'
]

export default function ManageCategoriesModal({ isOpen, onClose, householdId }: ManageCategoriesModalProps) {
  const { categories, fetchCategories, createCategory } = useRoutineStore()
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newCategoryColor, setNewCategoryColor] = useState(COLORS[0])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const [editingColor, setEditingColor] = useState('')

  useEffect(() => {
    if (isOpen && householdId) {
      fetchCategories(householdId)
    }
  }, [isOpen, householdId, fetchCategories])

  const householdCategories = categories.filter(cat => cat.householdId === householdId)

  const handleDelete = async (categoryId: string) => {
    if (!confirm('Are you sure you want to delete this category? Routines using this category will need to be updated.')) {
      return
    }
    
    try {
      if (!db) {
        throw new Error('Firestore not initialized')
      }
      await deleteDoc(doc(db, 'categories', categoryId))
      await fetchCategories(householdId)
      toast.success('Category deleted')
    } catch (error) {
      console.error('Error deleting category:', error)
      toast.error('Failed to delete category')
    }
  }

  const handleCreate = async () => {
    if (!newCategoryName.trim()) {
      toast.error('Please enter a category name')
      return
    }
    
    try {
      await createCategory({
        name: newCategoryName.trim(),
        color: newCategoryColor,
        householdId
      })
      setNewCategoryName('')
      toast.success('Category created')
    } catch (error) {
      console.error('Error creating category:', error)
      toast.error('Failed to create category')
    }
  }

  const handleStartEdit = (category: any) => {
    setEditingId(category.id)
    setEditingName(category.name)
    setEditingColor(category.color)
  }

  const handleSaveEdit = async () => {
    if (!editingId || !editingName.trim()) {
      toast.error('Please enter a category name')
      return
    }
    
    try {
      if (!db) {
        throw new Error('Firestore not initialized')
      }
      const { updateDoc } = await import('firebase/firestore')
      await updateDoc(doc(db, 'categories', editingId), {
        name: editingName.trim(),
        color: editingColor
      })
      await fetchCategories(householdId)
      setEditingId(null)
      setEditingName('')
      setEditingColor('')
      toast.success('Category updated')
    } catch (error) {
      console.error('Error updating category:', error)
      toast.error('Failed to update category')
    }
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditingName('')
    setEditingColor('')
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-800">Manage Categories</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Create New Category */}
          <div className="border-b border-gray-200 pb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Create New Category</h3>
            <div className="space-y-3">
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Category name"
                onKeyPress={(e) => e.key === 'Enter' && handleCreate()}
              />
              <div className="flex gap-2">
                {COLORS.map(color => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setNewCategoryColor(color)}
                    className={`w-10 h-10 rounded-lg border-2 ${
                      newCategoryColor === color ? 'border-gray-800' : 'border-gray-300'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
              <button
                onClick={handleCreate}
                className="w-full bg-primary-600 text-white py-2 rounded-lg font-medium hover:bg-primary-700 transition-colors"
              >
                Create Category
              </button>
            </div>
          </div>

          {/* Existing Categories */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Existing Categories</h3>
            {householdCategories.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No categories yet. Create one above!</p>
            ) : (
              <div className="space-y-2">
                {householdCategories.map(category => (
                  <div
                    key={category.id}
                    className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    {editingId === category.id ? (
                      <>
                        <div
                          className="w-6 h-6 rounded-full flex-shrink-0"
                          style={{ backgroundColor: editingColor }}
                        />
                        <input
                          type="text"
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          className="flex-1 px-3 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-primary-500"
                          autoFocus
                        />
                        <div className="flex gap-1">
                          {COLORS.map(color => (
                            <button
                              key={color}
                              type="button"
                              onClick={() => setEditingColor(color)}
                              className={`w-6 h-6 rounded border ${
                                editingColor === color ? 'border-gray-800' : 'border-gray-300'
                              }`}
                              style={{ backgroundColor: color }}
                            />
                          ))}
                        </div>
                        <button
                          onClick={handleSaveEdit}
                          className="px-3 py-1 bg-primary-600 text-white rounded text-sm hover:bg-primary-700"
                        >
                          Save
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="px-3 py-1 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <div
                          className="w-6 h-6 rounded-full flex-shrink-0"
                          style={{ backgroundColor: category.color }}
                        />
                        <span className="flex-1 font-medium text-gray-800">{category.name}</span>
                        <button
                          onClick={() => handleStartEdit(category)}
                          className="p-2 text-gray-600 hover:text-primary-600 transition-colors"
                          title="Edit category"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(category.id)}
                          className="p-2 text-gray-600 hover:text-red-600 transition-colors"
                          title="Delete category"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end pt-4 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

