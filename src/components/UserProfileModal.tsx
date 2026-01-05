import { useState, useRef, useEffect } from 'react'
import { X, Upload, User as UserIcon, Mail } from 'lucide-react'
import { useAuthStore } from '@/store/useAuthStore'
import { storage } from '@/firebase/config'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import toast from 'react-hot-toast'

interface UserProfileModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function UserProfileModal({ isOpen, onClose }: UserProfileModalProps) {
  const { user, userData, updateUserData, loadUserData } = useAuthStore()
  const [displayName, setDisplayName] = useState(userData?.displayName || '')
  const [isUploading, setIsUploading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(userData?.photoURL || null)

  // Sync previewUrl with userData when it changes
  useEffect(() => {
    if (userData?.photoURL) {
      setPreviewUrl(userData.photoURL)
    } else {
      setPreviewUrl(null)
    }
  }, [userData?.photoURL])

  // Sync displayName with userData when it changes
  useEffect(() => {
    if (userData?.displayName) {
      setDisplayName(userData.displayName)
    }
  }, [userData?.displayName])

  // Check if user signed up with email (not Google)
  const isEmailUser = user?.providerData?.[0]?.providerId === 'password'

  if (!isOpen) return null

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB')
      return
    }

    setIsUploading(true)

    try {
      if (!storage || !user) {
        throw new Error('Storage not initialized or user not authenticated')
      }

      // Create a preview URL
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string)
      }
      reader.readAsDataURL(file)

      // Upload to Firebase Storage
      const storageRef = ref(storage, `profile-pictures/${user.uid}/${Date.now()}_${file.name}`)
      console.log('Uploading to:', storageRef.fullPath)
      
      await uploadBytes(storageRef, file)
      console.log('Upload complete, getting download URL...')
      
      const downloadURL = await getDownloadURL(storageRef)
      console.log('Download URL:', downloadURL)

      // Update user profile with new photo URL
      console.log('Updating user data with photoURL...')
      await updateUserData({ photoURL: downloadURL })
      console.log('User data updated')
      
      // Update preview immediately with the new URL
      setPreviewUrl(downloadURL)
      
      // Reload to get updated data (this will also sync the previewUrl via useEffect)
      await loadUserData()
      console.log('User data reloaded')

      toast.success('Profile picture updated!')
    } catch (error: any) {
      console.error('Error uploading profile picture:', error)
      console.error('Error details:', {
        code: error?.code,
        message: error?.message,
        stack: error?.stack
      })
      
      // More specific error messages
      let errorMessage = 'Failed to upload profile picture'
      if (error?.code === 'storage/unauthorized') {
        errorMessage = 'Permission denied. Please check Firebase Storage rules. Run: firebase deploy --only storage'
      } else if (error?.code === 'storage/canceled') {
        errorMessage = 'Upload was canceled'
      } else if (error?.code === 'storage/unknown') {
        errorMessage = 'Unknown error occurred. Please check Firebase Storage configuration.'
      } else if (error?.message) {
        errorMessage = error.message
      }
      
      toast.error(errorMessage)
      setPreviewUrl(userData?.photoURL || null) // Reset preview on error
    } finally {
      setIsUploading(false)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleSave = async () => {
    if (!displayName.trim()) {
      toast.error('Display name cannot be empty')
      return
    }

    setIsSaving(true)

    try {
      await updateUserData({ displayName: displayName.trim() })
      await loadUserData() // Reload to get updated data
      toast.success('Profile updated!')
      onClose()
    } catch (error: any) {
      console.error('Error updating profile:', error)
      toast.error(`Failed to update: ${error.message || 'Unknown error'}`)
    } finally {
      setIsSaving(false)
    }
  }

  const handleRemovePhoto = async () => {
    try {
      await updateUserData({ photoURL: '' })
      await loadUserData()
      setPreviewUrl(null)
      toast.success('Profile picture removed')
    } catch (error: any) {
      console.error('Error removing profile picture:', error)
      toast.error(`Failed to remove: ${error.message || 'Unknown error'}`)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full">
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Profile Settings</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Profile Picture Section */}
          <div className="flex flex-col items-center">
            <div className="relative">
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Profile"
                  className="w-24 h-24 rounded-full object-cover border-4 border-gray-200 dark:border-gray-700"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center border-4 border-gray-200 dark:border-gray-700">
                  <UserIcon className="w-12 h-12 text-gray-400 dark:text-gray-500" />
                </div>
              )}
              {isEmailUser && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="absolute bottom-0 right-0 bg-primary-600 hover:bg-primary-700 text-white rounded-full p-2 shadow-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Upload profile picture"
                >
                  <Upload className="w-4 h-4" />
                </button>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            {isEmailUser && (
              <div className="mt-2 flex gap-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 disabled:opacity-50"
                >
                  {isUploading ? 'Uploading...' : 'Change Photo'}
                </button>
                {previewUrl && (
                  <>
                    <span className="text-gray-400">•</span>
                    <button
                      onClick={handleRemovePhoto}
                      className="text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                    >
                      Remove
                    </button>
                  </>
                )}
              </div>
            )}
            {!isEmailUser && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                Profile picture managed by Google
              </p>
            )}
          </div>

          {/* Email (Read-only) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email
            </label>
            <div className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
              <Mail className="w-4 h-4" />
              <span>{userData?.email || user?.email || 'N/A'}</span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Email cannot be changed
            </p>
          </div>

          {/* Display Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Display Name *
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Enter your display name"
              required
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving || !displayName.trim() || displayName === userData?.displayName}
              className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

