interface EventInfo {
  title: string
  organizerName: string
  location: string
  expenseType: string
}

/**
 * Build HTML email template for event finalization notification
 */
export function buildFinalizeEmailTemplate(event: EventInfo): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    h1 {
      color: #2c5aa0;
      font-size: 24px;
      margin-bottom: 20px;
    }
    .details {
      background-color: #f5f5f5;
      padding: 15px;
      border-radius: 5px;
      margin: 20px 0;
    }
    .details ul {
      list-style: none;
      padding: 0;
      margin: 0;
    }
    .details li {
      padding: 5px 0;
    }
    .details strong {
      color: #2c5aa0;
    }
    .signature {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #ddd;
      color: #666;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <h1>Evenement finalise</h1>

  <p>Bonjour,</p>

  <p>L'evenement <strong>${event.title}</strong> a ete finalise avec succes.</p>

  <div class="details">
    <ul>
      <li><strong>Organisateur:</strong> ${event.organizerName}</li>
      <li><strong>Lieu:</strong> ${event.location}</li>
      <li><strong>Type de depense:</strong> ${event.expenseType}</li>
    </ul>
  </div>

  <p>Vous trouverez en piece jointe la feuille de presence au format Excel avec les signatures des participants.</p>

  <div class="signature">
    <p>Cordialement,<br>
    <strong>c-sign</strong><br>
    Ceva Sante Animale</p>
  </div>
</body>
</html>
  `.trim()
}
