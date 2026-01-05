import { useState } from 'react'
import { X, Copy, Check, Mail, Share2 } from 'lucide-react'
import { useHouseholdStore } from '@/store/useHouseholdStore'
import { useAuthStore } from '@/store/useAuthStore'
import toast from 'react-hot-toast'

interface InviteModalProps {
  isOpen: boolean
  onClose: () => void
  householdId: string
  householdName: string
}

export default function InviteModal({ isOpen, onClose, householdId, householdName }: InviteModalProps) {
  const [copied, setCopied] = useState(false)
  const { user } = useAuthStore()

  if (!isOpen) return null

  const inviteLink = `${window.location.origin}/join/${householdId}`
  const inviteCode = householdId

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      toast.success(`${label} copied to clipboard!`)
      setTimeout(() => setCopied(false), 2000)
    }).catch(() => {
      toast.error('Failed to copy')
    })
  }

  const shareLink = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Join ${householdName} on Household Routine Manager`,
          text: `Join my household "${householdName}" to manage chores together!`,
          url: inviteLink
        })
        toast.success('Shared!')
      } catch (error: any) {
        if (error.name !== 'AbortError') {
          copyToClipboard(inviteLink, 'Invite link')
        }
      }
    } else {
      copyToClipboard(inviteLink, 'Invite link')
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-800">Invite to Household</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <p className="text-sm text-gray-600 mb-4">
              Share this with family members to invite them to <strong>{householdName}</strong>
            </p>
          </div>

          {/* Invite Link */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Invite Link
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={inviteLink}
                readOnly
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm"
              />
              <button
                onClick={() => copyToClipboard(inviteLink, 'Invite link')}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <button
              onClick={shareLink}
              className="mt-2 w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 text-sm"
            >
              <Share2 className="w-4 h-4" />
              Share via...
            </button>
          </div>

          {/* Household ID */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Household ID (Alternative)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={inviteCode}
                readOnly
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm font-mono"
              />
              <button
                onClick={() => copyToClipboard(inviteCode, 'Household ID')}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors flex items-center gap-2"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              They can use this ID to join manually
            </p>
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-medium text-blue-900 mb-2">How to join:</h3>
            <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
              <li>Share the invite link or Household ID</li>
              <li>They sign up or sign in</li>
              <li>They use the "Join Household" option</li>
              <li>Enter the Household ID</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  )
}

