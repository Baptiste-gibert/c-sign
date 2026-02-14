export type EventStatus = 'draft' | 'open' | 'finalized' | 'reopened'

export const statusConfig: Record<
  EventStatus,
  { bg: string; text: string; dot: string }
> = {
  draft: {
    bg: '#f3f4f6',
    text: '#6b7280',
    dot: '#9ca3af',
  },
  open: {
    bg: '#dcfce7',
    text: '#16a34a',
    dot: '#22c55e',
  },
  finalized: {
    bg: '#dbeafe',
    text: '#2563eb',
    dot: '#3b82f6',
  },
  reopened: {
    bg: '#fef3c7',
    text: '#d97706',
    dot: '#f59e0b',
  },
}

export interface StatusContext {
  bgClass: string
  borderClass: string
  textClass: string
  buttonClass: string
}

export const statusContext: Record<EventStatus, StatusContext> = {
  draft: {
    bgClass: 'bg-gray-50',
    borderClass: 'border-gray-200',
    textClass: 'text-gray-600',
    buttonClass: 'bg-emerald-600 hover:bg-emerald-700 text-white',
  },
  open: {
    bgClass: 'bg-blue-50',
    borderClass: 'border-blue-200',
    textClass: 'text-blue-800',
    buttonClass: 'bg-amber-500 hover:bg-amber-600 text-white',
  },
  reopened: {
    bgClass: 'bg-amber-50',
    borderClass: 'border-amber-200',
    textClass: 'text-amber-800',
    buttonClass: 'bg-amber-500 hover:bg-amber-600 text-white',
  },
  finalized: {
    bgClass: 'bg-emerald-50',
    borderClass: 'border-emerald-200',
    textClass: 'text-emerald-800',
    buttonClass: 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50',
  },
}
