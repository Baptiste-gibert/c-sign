import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Search } from 'lucide-react'
import { useSimvSearch, type SimvParticipant } from '@/hooks/use-participants'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

interface ParticipantSearchProps {
  onSelect: (participant: SimvParticipant) => void
  disabled?: boolean
}

export function ParticipantSearch({
  onSelect,
  disabled = false,
}: ParticipantSearchProps) {
  const { t } = useTranslation('organizer')
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')

  const { data: results = [], isLoading } = useSimvSearch(search)

  const handleSelect = (participant: SimvParticipant) => {
    onSelect(participant)
    setOpen(false)
    setSearch('')
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" disabled={disabled} className="w-full justify-start">
          <Search className="mr-2 h-4 w-4" />
          {t('participants.searchSimvPlaceholder')}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={t('participants.searchPlaceholder')}
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty>
              {isLoading ? t('common:searching') : t('participants.noResults')}
            </CommandEmpty>
            {results.length > 0 && (
              <CommandGroup>
                {results.map((participant) => (
                  <CommandItem
                    key={participant.id}
                    value={participant.id}
                    onSelect={() => handleSelect(participant)}
                    className="flex flex-col items-start gap-1 py-3"
                  >
                    <div className="font-medium">
                      {participant.lastName} {participant.firstName}
                    </div>
                    <div className="text-sm text-neutral-500">
                      {participant.professionalNumber || t('participants.noNumber')} • {participant.city}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
