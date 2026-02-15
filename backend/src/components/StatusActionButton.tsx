import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { type EventStatus, statusContext } from '@/config/status'

interface StatusActionButtonProps {
  status: EventStatus
  onAction: (nextStatus: EventStatus) => void
  isPending: boolean
}

function getNextStatus(status: EventStatus): EventStatus {
  switch (status) {
    case 'draft':
      return 'open'
    case 'open':
      return 'finalized'
    case 'reopened':
      return 'finalized'
    case 'finalized':
      return 'reopened'
  }
}

function getActionKey(status: EventStatus): string {
  switch (status) {
    case 'draft':
      return 'eventDetail.actionOpen'
    case 'open':
      return 'eventDetail.actionFinalize'
    case 'reopened':
      return 'eventDetail.actionFinalize'
    case 'finalized':
      return 'eventDetail.actionReopen'
  }
}

export function StatusActionButton({ status, onAction, isPending }: StatusActionButtonProps) {
  const { t } = useTranslation('organizer')
  const [confirming, setConfirming] = useState(false)

  const ctx = statusContext[status]
  const nextStatus = getNextStatus(status)
  const actionLabel = t(getActionKey(status))

  if (!confirming) {
    return (
      <Button
        size="sm"
        className={`h-7 px-3 text-[11px] font-semibold ${ctx.buttonClass}`}
        onClick={() => setConfirming(true)}
        disabled={isPending}
      >
        {actionLabel}
      </Button>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] font-medium text-amber-700">
        {t('eventDetail.confirmAction')}
      </span>
      <Button
        size="sm"
        className="h-7 bg-red-600 px-3 text-[11px] font-semibold text-white hover:bg-red-700"
        disabled={isPending}
        onClick={() => {
          onAction(nextStatus)
          setConfirming(false)
        }}
      >
        {t('eventDetail.confirmYes')} {actionLabel.toLowerCase()}
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="h-7 px-2 text-[11px] text-gray-500"
        onClick={() => setConfirming(false)}
      >
        {t('common:actions.cancel')}
      </Button>
    </div>
  )
}
