import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type SortingState,
} from '@tanstack/react-table'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Trash2 } from 'lucide-react'
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

interface ParticipantTableProps {
  data: Participant[]
  onRemove: (id: string) => void
  isLoading?: boolean
}

const columnHelper = createColumnHelper<Participant>()

export function ParticipantTable({
  data,
  onRemove,
  isLoading = false,
}: ParticipantTableProps) {
  const { t } = useTranslation(['organizer', 'common'])
  const [sorting, setSorting] = useState<SortingState>([])

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
      <div className="text-center py-8 text-neutral-500">
        {t('organizer:participants.noParticipants')}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="text-sm text-neutral-600">
        {t('common:plurals.participant', { count: data.length })}
      </div>
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className={(header.column.columnDef.meta as any)?.className}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id} className={(cell.column.columnDef.meta as any)?.className}>
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
