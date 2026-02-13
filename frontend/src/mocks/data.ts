import { fakerFR as faker } from '@faker-js/faker'

export interface MockParticipant {
  id: string
  lastName: string
  firstName: string
  email: string
  city: string
  professionalNumber?: string
  beneficiaryType: string
}

const beneficiaryTypes = [
  'asv',
  'autre',
  'eleveur',
  'etudiant',
  'pharmacien',
  'technicien',
  'veterinaire',
] as const

// Generate 100 mock participants
export const mockParticipants: MockParticipant[] = Array.from({ length: 100 }, () => {
  const hasProfessionalNumber = Math.random() < 0.7 // 70% probability

  return {
    id: faker.string.uuid(),
    lastName: faker.person.lastName().toUpperCase(),
    firstName: faker.person.firstName(),
    email: faker.internet.email().toLowerCase(),
    city: faker.location.city(),
    professionalNumber: hasProfessionalNumber
      ? faker.string.numeric(8)
      : undefined,
    beneficiaryType:
      beneficiaryTypes[Math.floor(Math.random() * beneficiaryTypes.length)],
  }
})
