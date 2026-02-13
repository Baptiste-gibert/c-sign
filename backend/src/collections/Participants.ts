import type { CollectionConfig } from 'payload'

export const Participants: CollectionConfig = {
  slug: 'participants',
  admin: {
    useAsTitle: 'lastName',
    defaultColumns: ['lastName', 'firstName', 'email', 'beneficiaryType'],
  },
  access: {
    create: () => true, // Public form creates participants
    read: () => true, // Public: needed for duplicate checking
    update: ({ req: { user } }) => !!user, // Only authenticated users
    delete: ({ req: { user } }) => !!user, // Only authenticated users
  },
  fields: [
    {
      name: 'lastName',
      type: 'text',
      required: true,
      label: 'Nom',
    },
    {
      name: 'firstName',
      type: 'text',
      required: true,
      label: 'Prenom',
    },
    {
      name: 'email',
      type: 'email',
      required: true,
      // NOT unique - same person can attend multiple events
    },
    {
      name: 'city',
      type: 'text',
      required: true,
      label: 'Ville',
    },
    {
      name: 'professionalNumber',
      type: 'text',
      label: "Numero d'inscription professionnelle",
      admin: {
        description: 'Si applicable (veterinaires, pharmaciens)',
      },
    },
    {
      name: 'beneficiaryType',
      type: 'select',
      required: true,
      label: 'Type de beneficiaire',
      options: [
        { label: 'ASV', value: 'asv' },
        { label: 'Autre', value: 'autre' },
        { label: 'Eleveur', value: 'eleveur' },
        { label: 'Etudiant', value: 'etudiant' },
        { label: 'Pharmacien', value: 'pharmacien' },
        { label: 'Technicien', value: 'technicien' },
        { label: 'Veterinaire', value: 'veterinaire' },
      ],
    },
    {
      name: 'beneficiaryTypeOther',
      type: 'text',
      label: 'Preciser le type',
      admin: {
        condition: (data) => data?.beneficiaryType === 'autre',
        description: 'Requis lorsque "Autre" est selectionne',
      },
    },
  ],
}
