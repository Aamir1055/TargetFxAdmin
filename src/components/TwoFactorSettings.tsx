import React, { useState } from 'react'
import { useMutation, useQueryClient } from 'react-query'
import { QRCodeSVG } from 'qrcode.react'
import { 
  ShieldCheckIcon,
  QrCodeIcon,
  KeyIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  DocumentDuplicateIcon
} from '@heroicons/react/24/outline'
import { twoFactorService, TwoFASetupResponse } from '../services/twoFactorService'
import toast from 'react-hot-toast'

interface TwoFactorSettingsProps {
  isEnabled: boolean
  onStatusChange: (enabled: boolean) => void
}

const TwoFactorSettings: React.FC<TwoFactorSettingsProps> = ({ isEnabled, onStatusChange }) => {
  const [showSetup, setShowSetup] = useState(false)
  const [setupData, setSetupData] = useState<TwoFASetupResponse | null>(null)
  const [verificationCode, setVerificationCode] = useState('')
  const [disablePassword, setDisablePassword] = useState('')
  const [showDisableForm, setShowDisableForm] = useState(false)
  const [copiedCodes, setCopiedCodes] = useState(false)
  
  const queryClient = useQueryClient()

  // Setup 2FA mutation
  const setup2FAMutation = useMutation(
    () => twoFactorService.setup2FA(),
    {
      onSuccess: (data) => {
        setSetupData(data)
        setShowSetup(true)
        toast.success('2FA setup ready! Scan the QR code with your authenticator app.')
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Failed to setup 2FA')
      }
    }
  )

  // Enable 2FA mutation
  const enable2FAMutation = useMutation(
    (code: string) => twoFactorService.enable2FA({
      code,
      backup_codes: setupData?.backup_codes || []
    }),
    {
      onSuccess: () => {
        setShowSetup(false)
        setSetupData(null)
        setVerificationCode('')
        onStatusChange(true)
        queryClient.invalidateQueries(['profile'])
        toast.success('Two-factor authentication enabled successfully!')
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Invalid verification code')
      }
    }
  )

  // Disable 2FA mutation
  const disable2FAMutation = useMutation(
    (password: string) => twoFactorService.disable2FA({ password }),
    {
      onSuccess: () => {
        setShowDisableForm(false)
        setDisablePassword('')
        onStatusChange(false)
        queryClient.invalidateQueries(['profile'])
        toast.success('Two-factor authentication disabled successfully!')
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Failed to disable 2FA')
      }
    }
  )

  // Regenerate backup codes mutation
  const regenerateCodesMutation = useMutation(
    () => twoFactorService.regenerateBackupCodes(),
    {
      onSuccess: () => {
        toast.success('Backup codes regenerated successfully!')
        // You might want to show the new codes in a modal
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Failed to regenerate backup codes')
      }
    }
  )

  const handleSetup2FA = () => {
    setup2FAMutation.mutate()
  }

  const handleEnable2FA = () => {
    if (verificationCode.length === 6) {
      enable2FAMutation.mutate(verificationCode)
    }
  }

  const handleDisable2FA = () => {
    if (disablePassword) {
      disable2FAMutation.mutate(disablePassword)
    }
  }

  const copyBackupCodes = () => {
    if (setupData?.backup_codes) {
      const codesText = setupData.backup_codes.join('\n')
      navigator.clipboard.writeText(codesText)
      setCopiedCodes(true)
      toast.success('Backup codes copied to clipboard!')
      setTimeout(() => setCopiedCodes(false), 3000)
    }
  }

  return (
    <div className="space-y-6">
      {/* 2FA Status */}
      <div className="bg-white rounded-lg border border-slate-300 shadow-sm p-6">
        <div className="flex items-center space-x-3 mb-4">
          <ShieldCheckIcon className="w-6 h-6 text-slate-500" />
          <h3 className="text-lg font-semibold text-slate-900">Two-Factor Authentication</h3>
        </div>
        
        {isEnabled ? (
          <div className="space-y-4">
            <div className="flex items-start space-x-3 p-4 bg-white rounded-lg border border-slate-300">
              <CheckCircleIcon className="w-5 h-5 text-slate-500 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-slate-800">Two-Factor Authentication Enabled</h4>
                <p className="text-sm text-slate-600 mt-1">
                  Your account is protected with two-factor authentication.
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowDisableForm(true)}
                disabled={disable2FAMutation.isLoading}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 text-sm font-medium"
              >
                {disable2FAMutation.isLoading ? 'Disabling...' : 'Disable 2FA'}
              </button>
              
              <button
                onClick={() => regenerateCodesMutation.mutate()}
                disabled={regenerateCodesMutation.isLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 text-sm font-medium"
              >
                {regenerateCodesMutation.isLoading ? 'Regenerating...' : 'Regenerate Backup Codes'}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-start space-x-3 p-4 bg-white rounded-lg border border-slate-300">
              <ExclamationTriangleIcon className="w-5 h-5 text-slate-500 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-slate-800">Two-Factor Authentication Disabled</h4>
                <p className="text-sm text-slate-600 mt-1">
                  Enable 2FA to add an extra layer of security to your account.
                </p>
              </div>
            </div>
            
            <button
              onClick={handleSetup2FA}
              disabled={setup2FAMutation.isLoading}
              className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-white transition-colors disabled:opacity-50 text-sm font-medium"
            >
              {setup2FAMutation.isLoading ? 'Setting up...' : 'Enable 2FA'}
            </button>
          </div>
        )}
      </div>

      {/* Disable 2FA Form */}
      {showDisableForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Disable Two-Factor Authentication</h3>
            <p className="text-sm text-slate-600 mb-4">
              Enter your password to disable two-factor authentication.
            </p>
            
            <div className="space-y-4">
              <input
                type="password"
                placeholder="Enter your password"
                value={disablePassword}
                onChange={(e) => setDisablePassword(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
              />
              
              <div className="flex items-center space-x-3">
                <button
                  onClick={handleDisable2FA}
                  disabled={!disablePassword || disable2FAMutation.isLoading}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 text-sm font-medium"
                >
                  {disable2FAMutation.isLoading ? 'Disabling...' : 'Disable 2FA'}
                </button>
                <button
                  onClick={() => {
                    setShowDisableForm(false)
                    setDisablePassword('')
                  }}
                  className="px-4 py-2 text-slate-600 hover:text-slate-800 transition-colors text-sm font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2FA Setup Modal */}
      {showSetup && setupData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3">
          <div className="bg-white rounded-lg p-4 max-w-4xl w-full max-h-[95vh] overflow-hidden flex flex-col">
            <h3 className="text-base font-semibold text-slate-900 mb-3">Set up Two-Factor Authentication</h3>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 min-h-0 overflow-auto">
              {/* Left column: Step 1 - QR Code */}
              <div>
                <h4 className="text-sm font-medium text-slate-900 mb-2 flex items-center">
                  <QrCodeIcon className="w-4 h-4 mr-2" />
                  Step 1: Scan QR Code
                </h4>
                <p className="text-xs text-slate-600 mb-2">
                  Scan with your authenticator app (Google Authenticator, Authy, etc.):
                </p>
                <div className="flex justify-center p-2 bg-white rounded-lg border-2 border-slate-300">
                  {setupData.qr_code_uri ? (
                    <QRCodeSVG
                      value={setupData.qr_code_uri}
                      size={150}
                      level="H"
                      includeMargin={true}
                    />
                  ) : setupData.secret ? (
                    <QRCodeSVG
                      value={`otpauth://totp/BrokerEye:${setupData.secret}?secret=${setupData.secret}&issuer=BrokerEye`}
                      size={150}
                      level="H"
                      includeMargin={true}
                    />
                  ) : (
                    <div className="w-36 h-36 flex items-center justify-center bg-blue-100 rounded">
                      <p className="text-xs text-slate-500">QR Code not available</p>
                    </div>
                  )}
                </div>
                <div className="mt-2 p-2 bg-white rounded-lg">
                  <p className="text-[11px] text-slate-500 mb-1">Can't scan? Manual entry key:</p>
                  <div className="flex items-center justify-between gap-2">
                    <code className="bg-white px-2 py-1.5 rounded font-mono text-xs border border-slate-300 flex-1 break-all">{setupData.secret}</code>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        try {
                          const textArea = document.createElement('textarea')
                          textArea.value = setupData.secret
                          textArea.style.position = 'fixed'
                          textArea.style.left = '-999999px'
                          document.body.appendChild(textArea)
                          textArea.select()
                          document.execCommand('copy')
                          document.body.removeChild(textArea)
                          toast.success('Manual entry key copied to clipboard!')
                        } catch (err) {
                          console.error('Failed to copy:', err)
                          toast.error('Failed to copy to clipboard')
                        }
                      }}
                      className="flex items-center gap-1 px-2 py-1.5 text-xs text-slate-700 hover:bg-white rounded transition-colors whitespace-nowrap border border-slate-300"
                      title="Copy manual entry key"
                    >
                      <DocumentDuplicateIcon className="w-3.5 h-3.5" />
                      Copy
                    </button>
                  </div>
                </div>
              </div>

              {/* Right column: Step 2 + Step 3 */}
              <div className="flex flex-col gap-3">
                <div>
                  <h4 className="text-sm font-medium text-slate-900 mb-2 flex items-center">
                    <KeyIcon className="w-4 h-4 mr-2" />
                    Step 2: Save Backup Codes
                  </h4>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2 mb-2">
                    <p className="text-xs text-yellow-800 font-medium">
                      ⚠️ Save these backup codes in a safe place!
                    </p>
                    <p className="text-[11px] text-yellow-700">
                      Use them to access your account if you lose your phone.
                    </p>
                  </div>
                  <div className="bg-white rounded-lg p-2 relative border border-slate-200">
                    <div className="grid grid-cols-2 gap-1.5 text-xs font-mono">
                      {setupData.backup_codes.map((code, index) => (
                        <div key={index} className="bg-white p-1.5 rounded text-center border">
                          {code}
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={copyBackupCodes}
                      className="absolute top-1 right-1 p-1.5 text-slate-500 hover:text-slate-700 transition-colors"
                      title="Copy backup codes"
                    >
                      <DocumentDuplicateIcon className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  {copiedCodes && (
                    <p className="text-[11px] text-yellow-600 mt-1">✓ Backup codes copied to clipboard!</p>
                  )}
                </div>

                <div>
                  <h4 className="text-sm font-medium text-slate-900 mb-1.5">
                    Step 3: Enter Verification Code
                  </h4>
                  <p className="text-xs text-slate-600 mb-2">
                    Enter the 6-digit code from your authenticator app:
                  </p>
                  <input
                    type="text"
                    placeholder="000000"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-slate-300 text-center text-base tracking-widest font-mono"
                    maxLength={6}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3 pt-3 mt-2 border-t border-slate-200">
              <button
                onClick={handleEnable2FA}
                disabled={verificationCode.length !== 6 || enable2FAMutation.isLoading}
                className="flex-1 px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-white transition-colors disabled:opacity-50 text-sm font-medium"
              >
                {enable2FAMutation.isLoading ? 'Enabling...' : 'Enable 2FA'}
              </button>
              <button
                onClick={() => {
                  setShowSetup(false)
                  setSetupData(null)
                  setVerificationCode('')
                }}
                className="px-4 py-2 text-slate-600 hover:text-slate-800 transition-colors text-sm font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default TwoFactorSettings

