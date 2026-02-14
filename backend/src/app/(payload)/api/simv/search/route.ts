import { NextRequest, NextResponse } from 'next/server'

/**
 * Mock SIMV (veterinary professional registry) search endpoint.
 * Returns matching professionals from a hardcoded dataset.
 * In production, this would query the real SIMV API.
 */

interface SimvEntry {
  id: string
  lastName: string
  firstName: string
  email: string
  city: string
  professionalNumber: string
  beneficiaryType: string
}

const MOCK_REGISTRY: SimvEntry[] = [
  { id: 's1', lastName: 'Martin', firstName: 'Sophie', email: 'sophie.martin@vet.fr', city: 'Lyon', professionalNumber: '69001234', beneficiaryType: 'veterinaire' },
  { id: 's2', lastName: 'Bernard', firstName: 'Pierre', email: 'pierre.bernard@vet.fr', city: 'Paris', professionalNumber: '75005678', beneficiaryType: 'veterinaire' },
  { id: 's3', lastName: 'Dubois', firstName: 'Marie', email: 'marie.dubois@vet.fr', city: 'Bordeaux', professionalNumber: '33009012', beneficiaryType: 'veterinaire' },
  { id: 's4', lastName: 'Moreau', firstName: 'Jean', email: 'jean.moreau@vet.fr', city: 'Toulouse', professionalNumber: '31003456', beneficiaryType: 'veterinaire' },
  { id: 's5', lastName: 'Laurent', firstName: 'Claire', email: 'claire.laurent@vet.fr', city: 'Nantes', professionalNumber: '44007890', beneficiaryType: 'veterinaire' },
  { id: 's6', lastName: 'Simon', firstName: 'Philippe', email: 'philippe.simon@vet.fr', city: 'Strasbourg', professionalNumber: '67001234', beneficiaryType: 'veterinaire' },
  { id: 's7', lastName: 'Michel', firstName: 'Isabelle', email: 'isabelle.michel@vet.fr', city: 'Montpellier', professionalNumber: '34005678', beneficiaryType: 'veterinaire' },
  { id: 's8', lastName: 'Lefevre', firstName: 'Nicolas', email: 'nicolas.lefevre@vet.fr', city: 'Rennes', professionalNumber: '35009012', beneficiaryType: 'veterinaire' },
  { id: 's9', lastName: 'Roux', firstName: 'Catherine', email: 'catherine.roux@vet.fr', city: 'Lille', professionalNumber: '59003456', beneficiaryType: 'veterinaire' },
  { id: 's10', lastName: 'David', firstName: 'Antoine', email: 'antoine.david@vet.fr', city: 'Nice', professionalNumber: '06007890', beneficiaryType: 'veterinaire' },
  { id: 's11', lastName: 'Bertrand', firstName: 'Emilie', email: 'emilie.bertrand@vet.fr', city: 'Libourne', professionalNumber: '33101234', beneficiaryType: 'veterinaire' },
  { id: 's12', lastName: 'Petit', firstName: 'Francois', email: 'francois.petit@vet.fr', city: 'Dijon', professionalNumber: '21005678', beneficiaryType: 'veterinaire' },
  { id: 's13', lastName: 'Robert', firstName: 'Nathalie', email: 'nathalie.robert@vet.fr', city: 'Grenoble', professionalNumber: '38009012', beneficiaryType: 'veterinaire' },
  { id: 's14', lastName: 'Richard', firstName: 'Marc', email: 'marc.richard@vet.fr', city: 'Aix-en-Provence', professionalNumber: '13003456', beneficiaryType: 'veterinaire' },
  { id: 's15', lastName: 'Durand', firstName: 'Sylvie', email: 'sylvie.durand@vet.fr', city: 'Tours', professionalNumber: '37007890', beneficiaryType: 'veterinaire' },
  { id: 's16', lastName: 'Thomas', firstName: 'Christophe', email: 'christophe.thomas@vet.fr', city: 'Clermont-Ferrand', professionalNumber: '63001234', beneficiaryType: 'veterinaire' },
  { id: 's17', lastName: 'Garnier', firstName: 'Sandrine', email: 'sandrine.garnier@vet.fr', city: 'Metz', professionalNumber: '57005678', beneficiaryType: 'veterinaire' },
  { id: 's18', lastName: 'Fournier', firstName: 'Laurent', email: 'laurent.fournier@vet.fr', city: 'Caen', professionalNumber: '14009012', beneficiaryType: 'veterinaire' },
  { id: 's19', lastName: 'Girard', firstName: 'Veronique', email: 'veronique.girard@vet.fr', city: 'Orleans', professionalNumber: '45003456', beneficiaryType: 'veterinaire' },
  { id: 's20', lastName: 'Bonnet', firstName: 'Patrick', email: 'patrick.bonnet@vet.fr', city: 'Angers', professionalNumber: '49007890', beneficiaryType: 'veterinaire' },
  { id: 's21', lastName: 'Dupont', firstName: 'Anne', email: 'anne.dupont@vet.fr', city: 'Limoges', professionalNumber: '87001234', beneficiaryType: 'veterinaire' },
  { id: 's22', lastName: 'Lambert', firstName: 'Thierry', email: 'thierry.lambert@vet.fr', city: 'Besancon', professionalNumber: '25005678', beneficiaryType: 'veterinaire' },
  { id: 's23', lastName: 'Fontaine', firstName: 'Caroline', email: 'caroline.fontaine@vet.fr', city: 'Rouen', professionalNumber: '76009012', beneficiaryType: 'veterinaire' },
  { id: 's24', lastName: 'Chevalier', firstName: 'Alain', email: 'alain.chevalier@pharma.fr', city: 'Poitiers', professionalNumber: '86003456', beneficiaryType: 'pharmacien' },
  { id: 's25', lastName: 'Robin', firstName: 'Helene', email: 'helene.robin@pharma.fr', city: 'Amiens', professionalNumber: '80007890', beneficiaryType: 'pharmacien' },
  { id: 's26', lastName: 'Masson', firstName: 'Jerome', email: 'jerome.masson@pharma.fr', city: 'Perpignan', professionalNumber: '66001234', beneficiaryType: 'pharmacien' },
  { id: 's27', lastName: 'Sanchez', firstName: 'Lucie', email: 'lucie.sanchez@pharma.fr', city: 'Nancy', professionalNumber: '54005678', beneficiaryType: 'pharmacien' },
  { id: 's28', lastName: 'Muller', firstName: 'Eric', email: 'eric.muller@vet.fr', city: 'Colmar', professionalNumber: '68009012', beneficiaryType: 'veterinaire' },
  { id: 's29', lastName: 'Lefebvre', firstName: 'Martine', email: 'martine.lefebvre@vet.fr', city: 'Pau', professionalNumber: '64003456', beneficiaryType: 'veterinaire' },
  { id: 's30', lastName: 'Leroy', firstName: 'Olivier', email: 'olivier.leroy@vet.fr', city: 'La Rochelle', professionalNumber: '17007890', beneficiaryType: 'veterinaire' },
  { id: 's31', lastName: 'Marchand', firstName: 'Stephanie', email: 'stephanie.marchand@vet.fr', city: 'Valence', professionalNumber: '26001234', beneficiaryType: 'veterinaire' },
  { id: 's32', lastName: 'Nguyen', firstName: 'David', email: 'david.nguyen@vet.fr', city: 'Avignon', professionalNumber: '84005678', beneficiaryType: 'veterinaire' },
  { id: 's33', lastName: 'Henry', firstName: 'Corinne', email: 'corinne.henry@vet.fr', city: 'Brest', professionalNumber: '29009012', beneficiaryType: 'veterinaire' },
  { id: 's34', lastName: 'Rousseau', firstName: 'Guillaume', email: 'guillaume.rousseau@vet.fr', city: 'Quimper', professionalNumber: '29103456', beneficiaryType: 'veterinaire' },
  { id: 's35', lastName: 'Vincent', firstName: 'Aurelie', email: 'aurelie.vincent@vet.fr', city: 'Bayonne', professionalNumber: '64107890', beneficiaryType: 'veterinaire' },
  { id: 's36', lastName: 'Perrin', firstName: 'Didier', email: 'didier.perrin@vet.fr', city: 'Chambery', professionalNumber: '73001234', beneficiaryType: 'veterinaire' },
  { id: 's37', lastName: 'Morel', firstName: 'Valerie', email: 'valerie.morel@vet.fr', city: 'Annecy', professionalNumber: '74005678', beneficiaryType: 'veterinaire' },
  { id: 's38', lastName: 'Mercier', firstName: 'Bruno', email: 'bruno.mercier@vet.fr', city: 'Tarbes', professionalNumber: '65009012', beneficiaryType: 'veterinaire' },
  { id: 's39', lastName: 'Blanchard', firstName: 'Cecile', email: 'cecile.blanchard@vet.fr', city: 'Agen', professionalNumber: '47003456', beneficiaryType: 'veterinaire' },
  { id: 's40', lastName: 'Guerin', firstName: 'Romain', email: 'romain.guerin@vet.fr', city: 'Rodez', professionalNumber: '12007890', beneficiaryType: 'veterinaire' },
  { id: 's41', lastName: 'Boyer', firstName: 'Delphine', email: 'delphine.boyer@vet.fr', city: 'Aurillac', professionalNumber: '15001234', beneficiaryType: 'veterinaire' },
  { id: 's42', lastName: 'Gauthier', firstName: 'Yves', email: 'yves.gauthier@vet.fr', city: 'Le Mans', professionalNumber: '72005678', beneficiaryType: 'veterinaire' },
  { id: 's43', lastName: 'Picard', firstName: 'Marion', email: 'marion.picard@vet.fr', city: 'Chartres', professionalNumber: '28009012', beneficiaryType: 'veterinaire' },
  { id: 's44', lastName: 'Andre', firstName: 'Sebastien', email: 'sebastien.andre@vet.fr', city: 'Vannes', professionalNumber: '56003456', beneficiaryType: 'veterinaire' },
  { id: 's45', lastName: 'Lemoine', firstName: 'Christine', email: 'christine.lemoine@vet.fr', city: 'Laval', professionalNumber: '53007890', beneficiaryType: 'veterinaire' },
  { id: 's46', lastName: 'Carpentier', firstName: 'Pascal', email: 'pascal.carpentier@vet.fr', city: 'Beauvais', professionalNumber: '60001234', beneficiaryType: 'veterinaire' },
  { id: 's47', lastName: 'Faure', firstName: 'Dominique', email: 'dominique.faure@vet.fr', city: 'Perigueux', professionalNumber: '24005678', beneficiaryType: 'veterinaire' },
  { id: 's48', lastName: 'Caron', firstName: 'Brigitte', email: 'brigitte.caron@vet.fr', city: 'Cherbourg', professionalNumber: '50009012', beneficiaryType: 'veterinaire' },
  { id: 's49', lastName: 'Da Silva', firstName: 'Hugo', email: 'hugo.dasilva@vet.fr', city: 'Saint-Etienne', professionalNumber: '42003456', beneficiaryType: 'veterinaire' },
  { id: 's50', lastName: 'Renard', firstName: 'Monique', email: 'monique.renard@vet.fr', city: 'Troyes', professionalNumber: '10007890', beneficiaryType: 'veterinaire' },
]

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')

  if (!q || q.length < 2) {
    return NextResponse.json({ results: [] })
  }

  const query = q.toLowerCase()
  const results = MOCK_REGISTRY.filter(
    (entry) =>
      entry.lastName.toLowerCase().includes(query) ||
      entry.firstName.toLowerCase().includes(query) ||
      entry.professionalNumber.includes(query)
  ).slice(0, 20)

  return NextResponse.json({ results })
}
