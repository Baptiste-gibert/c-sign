import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type SortingState,
} from '@tanstack/react-table'
import { useState } from 'react'
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

const beneficiaryTypeLabels: Record<string, string> = {
  asv: 'ASV',
  autre: 'Autre',
  eleveur: 'Éleveur',
  etudiant: 'Étudiant',
  pharmacien: 'Pharmacien',
  technicien: 'Technicien',
  veterinaire: 'Vétérinaire',
}

export function ParticipantTable({
  data,
  onRemove,
  isLoading = false,
}: ParticipantTableProps) {
  const [sorting, setSorting] = useState<SortingState>([])

  const columns = [
    columnHelper.accessor('lastName', {
      header: 'Nom',
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor('firstName', {
      header: 'Prénom',
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor('email', {
      header: 'Email',
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor('city', {
      header: 'Ville',
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor('beneficiaryType', {
      header: 'Type',
      cell: (info) => beneficiaryTypeLabels[info.getValue()] || info.getValue(),
    }),
    columnHelper.accessor('professionalNumber', {
      header: "N° d'inscription",
      cell: (info) => info.getValue() || '-',
    }),
    columnHelper.display({
      id: 'actions',
      header: 'Actions',
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
        Aucun participant pré-inscrit
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="text-sm text-neutral-600">
        {data.length} participant{data.length > 1 ? 's' : ''}
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
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
                  <TableCell key={cell.id}>
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
