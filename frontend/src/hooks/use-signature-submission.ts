import { useMutation } from '@tanstack/react-query'
import { createParticipant, uploadSignatureImage, createSignature } from '@/lib/api'
import type { ParticipantFormData } from '@/lib/schemas'

interface SubmissionData {
  formData: ParticipantFormData
  signatureBlob: Blob
  sessionId: string
}

export function useSignatureSubmission() {
  return useMutation({
    mutationFn: async ({ formData, signatureBlob, sessionId }: SubmissionData) => {
      // Step 1: Create participant
      const participant = await createParticipant({
        lastName: formData.lastName,
        firstName: formData.firstName,
        email: formData.email,
        city: formData.city,
        professionalNumber: formData.professionalNumber || undefined,
        beneficiaryType: formData.beneficiaryType,
        beneficiaryTypeOther: formData.beneficiaryTypeOther || undefined,
      })

      // Step 2: Upload signature image to Media collection
      const media = await uploadSignatureImage(signatureBlob)

      // Step 3: Create signature record linking participant + session + media
      const signature = await createSignature({
        participant: participant.doc.id,
        session: sessionId,
        image: media.doc.id,
        rightToImage: formData.consentRightToImage,
      })

      return { participant: participant.doc, media: media.doc, signature: signature.doc }
    },
  })
}
