export interface ExportData {
  event: {
    title: string
    location: string
    organizerName: string
    expenseType: string
  }
  attendanceDays: Array<{
    date: string
    sessions: Array<{
      name: string
      signatures: Array<{
        participant: {
          lastName: string
          firstName: string
          email: string
          city: string
          professionalNumber: string | null
          beneficiaryType: string
        }
        image: {
          url: string
          filename: string
        }
        rightToImage: boolean
      }>
    }>
  }>
}
