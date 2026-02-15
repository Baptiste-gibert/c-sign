import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
} from '@tanstack/react-table'
import { Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { Participant } from '@/hooks/use-participants'

interface SessionWithSignatures {
  id: string
  name: string
  signatures: Array<{ id: string; participant: { id: string }; createdAt: string }>
  signedCount: number
  totalExpected: number
}

interface AttendanceDayData {
  id: string
  date: string
  sessions: SessionWithSignatures[]
}

interface AttendanceData {
  attendanceDays: AttendanceDayData[]
}

interface ParticipantTableProps {
  data: Participant[]
  onRemove: (id: string) => void
  isLoading?: boolean
  attendanceData?: AttendanceData
}

const columnHelper = createColumnHelper<Participant>()

export function ParticipantTable({
  data,
  onRemove,
  isLoading = false,
  attendanceData,
}: ParticipantTableProps) {
  const { t } = useTranslation(['organizer', 'common'])
  const [sorting, setSorting] = useState<SortingState>([])

  // Compute total sessions and per-participant session counts
  const totalSessions = attendanceData
    ? attendanceData.attendanceDays.reduce((a, d) => a + d.sessions.length, 0)
    : 0

  const participantSessionCounts = new Map<string, number>()
  if (attendanceData) {
    for (const day of attendanceData.attendanceDays) {
      for (const session of day.sessions) {
        for (const sig of session.signatures) {
          const pid = sig.participant.id
          participantSessionCounts.set(pid, (participantSessionCounts.get(pid) || 0) + 1)
        }
      }
    }
  }

  const columns = [
    columnHelper.accessor('lastName', {
      header: t('common:form.labels.lastName'),
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor('firstName', {
      header: t('common:form.labels.firstName'),
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor('email', {
      header: t('common:form.labels.email'),
      cell: (info) => info.getValue(),
      meta: { className: 'hidden md:table-cell' },
    }),
    columnHelper.accessor('city', {
      header: t('common:form.labels.city'),
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor('beneficiaryType', {
      header: t('organizer:walkIn.beneficiaryType'),
      cell: (info) => t(`common:beneficiaryTypes.${info.getValue()}`, info.getValue()),
    }),
    columnHelper.accessor('professionalNumber', {
      header: t('organizer:participants.professionalNumberShort'),
      cell: (info) => info.getValue() || '-',
      meta: { className: 'hidden md:table-cell' },
    }),
    ...(attendanceData && totalSessions > 0
      ? [
          columnHelper.display({
            id: 'presence',
            header: t('organizer:eventDetail.presence'),
            cell: (info) => {
              const sessionsSigned = participantSessionCounts.get(info.row.original.id) || 0
              const pPct =
                totalSessions > 0 ? Math.round((sessionsSigned / totalSessions) * 100) : 0
              const allDone = sessionsSigned === totalSessions && totalSessions > 0

              return (
                <div className="flex items-center gap-1.5">
                  <div className="h-1.5 w-10 overflow-hidden rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${pPct}%`,
                        background: allDone
                          ? '#22c55e'
                          : sessionsSigned > 0
                            ? '#3b82f6'
                            : 'transparent',
                      }}
                    />
                  </div>
                  <Badge
                    variant="secondary"
                    className={`px-1 text-[8px] font-semibold ${
                      allDone
                        ? 'bg-emerald-100 text-emerald-700'
                        : sessionsSigned > 0
                          ? 'bg-blue-50 text-blue-600'
                          : 'bg-gray-100 text-gray-400'
                    }`}
                  >
                    {sessionsSigned}/{totalSessions}
                  </Badge>
                </div>
              )
            },
          }),
        ]
      : []),
    columnHelper.display({
      id: 'actions',
      header: t('organizer:table.headers.actions'),
      cell: (info) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onRemove(info.row.original.id)}
          disabled={isLoading}
        >
          <Trash2 className="h-4 w-4 text-red-500" />
        </Button>
      ),
    }),
  ]

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  if (data.length === 0) {
    return (
      <div className="py-8 text-center text-neutral-500">
        {t('organizer:participants.noParticipants')}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="text-sm text-neutral-600">
        {t('common:plurals.participant', { count: data.length })}
      </div>
      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className={
                      (header.column.columnDef.meta as { className?: string } | undefined)
                        ?.className
                    }
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell
                    key={cell.id}
                    className={
                      (cell.column.columnDef.meta as { className?: string } | undefined)?.className
                    }
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
