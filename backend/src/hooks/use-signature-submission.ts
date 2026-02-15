import { useMutation } from '@tanstack/react-query'

import { createParticipant, createSignature, uploadSignatureImage } from '@/lib/api'
import type { ParticipantFormData } from '@/lib/schemas'

interface SubmissionData {
  formData: ParticipantFormData
  signatureBlob: Blob
  sessionId: string
  deviceFingerprint?: string
  captchaToken?: string
}

export function useSignatureSubmission() {
  return useMutation({
    mutationFn: async ({
      formData,
      signatureBlob,
      sessionId,
      deviceFingerprint,
      captchaToken,
    }: SubmissionData) => {
      // Prepare security headers
      const securityHeaders = {
        fingerprint: deviceFingerprint,
        captchaToken: captchaToken,
      }

      // Step 1: Create participant
      const participant = await createParticipant(
        {
          lastName: formData.lastName,
          firstName: formData.firstName,
          email: formData.email,
          city: formData.city,
          professionalNumber: formData.professionalNumber || undefined,
          beneficiaryType: formData.beneficiaryType,
          beneficiaryTypeOther: formData.beneficiaryTypeOther || undefined,
        },
        securityHeaders,
      )

      // Step 2: Upload signature image to Media collection
      const media = await uploadSignatureImage(signatureBlob, securityHeaders)

      // Step 3: Create signature record linking participant + session + media
      const signature = await createSignature(
        {
          participant: participant.doc.id,
          session: Number(sessionId),
          image: media.doc.id,
          rightToImage: formData.consentRightToImage,
        },
        securityHeaders,
      )

      return { participant: participant.doc, media: media.doc, signature: signature.doc }
    },
  })
}
