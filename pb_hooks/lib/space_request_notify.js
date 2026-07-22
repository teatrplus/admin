/**
 * Notification helpers for public space_request submissions.
 * Loaded from pb_hooks — keep side-effect free; callers own logging.
 */

const BRAND = {
  name: 'Teatr Plus',
  accent: '#0441dc',
  ink: '#1c1917',
  inkMuted: '#78716c',
  surface: '#fafaf9',
  border: '#e7e5e4',
}

const STAGE_LABELS = {
  inquiry: 'Новая заявка',
  confirmed: 'Подтверждена',
  rejected: 'Отклонена',
  preparation: 'Подготовка',
  completed: 'Завершена',
  cancelled: 'Отменена',
}

const escapeHtml = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

const escapeTelegramHtml = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

const readEnv = (key, fallback) => {
  const value = $os.getenv(key)
  return value && value.trim() !== '' ? value.trim() : fallback
}

const MONTHS_RU = [
  'января',
  'февраля',
  'марта',
  'апреля',
  'мая',
  'июня',
  'июля',
  'августа',
  'сентября',
  'октября',
  'ноября',
  'декабря',
]

const pad2 = (value) => String(value).padStart(2, '0')

const parseDate = (value) => {
  if (!value) return null

  const normalized = String(value).includes('T') ? String(value) : String(value).replace(' ', 'T')
  const date = new Date(normalized)

  if (Number.isNaN(date.getTime())) {
    const ymd = String(value).slice(0, 10)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return null
    const [year, month, day] = ymd.split('-').map(Number)
    return new Date(year, month - 1, day)
  }

  return date
}

const formatDateRu = (value) => {
  const date = parseDate(value)
  if (!date) return '—'

  return `${date.getDate()} ${MONTHS_RU[date.getMonth()]} ${date.getFullYear()}`
}

const formatTimestampRu = (value) => {
  const date = parseDate(value)
  if (!date) return '—'

  return `${date.getDate()} ${MONTHS_RU[date.getMonth()]} ${date.getFullYear()}, ${pad2(date.getHours())}:${pad2(date.getMinutes())}`
}

const requestSnapshot = (record) => {
  const clientName = record.get('clientName')
  const clientPhoneNumber = record.get('clientPhoneNumber')
  const dateRequested = record.get('dateRequested')
  const stage = record.get('stage') || 'inquiry'

  return {
    id: record.id,
    clientName,
    clientPhoneNumber,
    dateRequested,
    stage,
    stageLabel: STAGE_LABELS[stage] || stage,
    created: record.get('created'),
    formattedDate: formatDateRu(dateRequested),
    formattedCreated: formatTimestampRu(record.get('created')),
  }
}

const buildEmailHtml = (snapshot, adminUrl) => {
  const adminLink = adminUrl
    ? `<p style="margin:24px 0 0;">
        <a href="${escapeHtml(adminUrl)}" style="display:inline-block;padding:12px 20px;border-radius:999px;background:${BRAND.accent};color:#ffffff;font-weight:600;text-decoration:none;">
          Открыть в админке
        </a>
      </p>`
    : ''

  return `<!DOCTYPE html>
<html lang="ru">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Новая заявка — ${escapeHtml(BRAND.name)}</title>
  </head>
  <body style="margin:0;padding:0;background:${BRAND.surface};color:${BRAND.ink};font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:${BRAND.surface};padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border:1px solid ${BRAND.border};border-radius:20px;overflow:hidden;">
            <tr>
              <td style="padding:28px 28px 20px;border-bottom:1px solid ${BRAND.border};">
                <p style="margin:0 0 8px;font-size:12px;letter-spacing:0.12em;text-transform:uppercase;color:${BRAND.inkMuted};">
                  ${escapeHtml(BRAND.name)} · Space
                </p>
                <h1 style="margin:0;font-size:28px;line-height:1.2;font-weight:700;">
                  Новая заявка на аренду
                </h1>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 28px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
                  <tr>
                    <td style="padding:12px 0;border-bottom:1px solid ${BRAND.border};color:${BRAND.inkMuted};font-size:14px;width:38%;">Имя</td>
                    <td style="padding:12px 0;border-bottom:1px solid ${BRAND.border};font-size:16px;font-weight:600;">${escapeHtml(snapshot.clientName)}</td>
                  </tr>
                  <tr>
                    <td style="padding:12px 0;border-bottom:1px solid ${BRAND.border};color:${BRAND.inkMuted};font-size:14px;">Телефон</td>
                    <td style="padding:12px 0;border-bottom:1px solid ${BRAND.border};font-size:16px;font-weight:600;">
                      <a href="tel:${escapeHtml(snapshot.clientPhoneNumber)}" style="color:${BRAND.accent};text-decoration:none;">
                        ${escapeHtml(snapshot.clientPhoneNumber)}
                      </a>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:12px 0;border-bottom:1px solid ${BRAND.border};color:${BRAND.inkMuted};font-size:14px;">Дата мероприятия</td>
                    <td style="padding:12px 0;border-bottom:1px solid ${BRAND.border};font-size:16px;font-weight:600;">${escapeHtml(snapshot.formattedDate)}</td>
                  </tr>
                  <tr>
                    <td style="padding:12px 0;border-bottom:1px solid ${BRAND.border};color:${BRAND.inkMuted};font-size:14px;">Статус</td>
                    <td style="padding:12px 0;border-bottom:1px solid ${BRAND.border};font-size:16px;font-weight:600;">${escapeHtml(snapshot.stageLabel)}</td>
                  </tr>
                  <tr>
                    <td style="padding:12px 0;color:${BRAND.inkMuted};font-size:14px;">Получено</td>
                    <td style="padding:12px 0;font-size:16px;">${escapeHtml(snapshot.formattedCreated)}</td>
                  </tr>
                </table>
                ${adminLink}
              </td>
            </tr>
            <tr>
              <td style="padding:18px 28px;background:${BRAND.surface};color:${BRAND.inkMuted};font-size:12px;line-height:1.5;">
                ID заявки: <span style="font-family:Consolas,Monaco,monospace;">${escapeHtml(snapshot.id)}</span>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`
}

const buildEmailText = (snapshot, adminUrl) => {
  const lines = [
    `${BRAND.name} — новая заявка на аренду`,
    '',
    `Имя: ${snapshot.clientName}`,
    `Телефон: ${snapshot.clientPhoneNumber}`,
    `Дата мероприятия: ${snapshot.formattedDate}`,
    `Статус: ${snapshot.stageLabel}`,
    `Получено: ${snapshot.formattedCreated}`,
    `ID: ${snapshot.id}`,
  ]

  if (adminUrl) {
    lines.push('', `Админка: ${adminUrl}`)
  }

  return lines.join('\n')
}

const buildTelegramHtml = (snapshot, adminUrl) => {
  const lines = [
    `<b>${escapeTelegramHtml(BRAND.name)} · Space</b>`,
    `<b>Новая заявка на аренду</b>`,
    '',
    `<b>Имя:</b> ${escapeTelegramHtml(snapshot.clientName)}`,
    `<b>Телефон:</b> <code>${escapeTelegramHtml(snapshot.clientPhoneNumber)}</code>`,
    `<b>Дата:</b> ${escapeTelegramHtml(snapshot.formattedDate)}`,
    `<b>Статус:</b> ${escapeTelegramHtml(snapshot.stageLabel)}`,
    `<b>Получено:</b> ${escapeTelegramHtml(snapshot.formattedCreated)}`,
    `<b>ID:</b> <code>${escapeTelegramHtml(snapshot.id)}</code>`,
  ]

  if (adminUrl) {
    lines.push('', `<a href="${escapeTelegramHtml(adminUrl)}">Открыть в админке</a>`)
  }

  return lines.join('\n')
}

const sendEmail = (snapshot) => {
  const settings = $app.settings()
  const senderAddress = settings.meta.senderAddress
  const senderName = settings.meta.senderName

  if (!senderAddress) {
    throw new Error('PocketBase sender address is not configured (Settings → Mail settings).')
  }

  const recipient = readEnv('SPACE_REQUEST_NOTIFY_EMAIL', 'info@teatrplus.uz')
  const adminBase = readEnv('ADMIN_APP_URL', '')
  const adminUrl = adminBase ? `${adminBase.replace(/\/$/, '')}/space/requests` : ''

  const message = new MailerMessage({
    from: {
      address: senderAddress,
      name: senderName || BRAND.name,
    },
    to: [{ address: recipient }],
    subject: `${BRAND.name}: новая заявка — ${snapshot.clientName}`,
    html: buildEmailHtml(snapshot, adminUrl),
    text: buildEmailText(snapshot, adminUrl),
  })

  $app.newMailClient().send(message)
}

const sendTelegram = (snapshot) => {
  const token = readEnv('TELEGRAM_BOT_TOKEN', '')
  const chatId = readEnv('TELEGRAM_CHANNEL_ID', '')

  if (!token || !chatId) {
    throw new Error('TELEGRAM_BOT_TOKEN and TELEGRAM_CHANNEL_ID must be set.')
  }

  const adminBase = readEnv('ADMIN_APP_URL', '')
  const adminUrl = adminBase ? `${adminBase.replace(/\/$/, '')}/space/requests` : ''
  const text = buildTelegramHtml(snapshot, adminUrl)

  const response = $http.send({
    method: 'POST',
    url: `https://api.telegram.org/bot${token}/sendMessage`,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
      disable_web_page_preview: true,
    }),
    timeout: 15,
  })

  if (response.statusCode < 200 || response.statusCode >= 300) {
    const detail =
      typeof response.json === 'object' && response.json
        ? JSON.stringify(response.json)
        : String(response.raw || '')
    throw new Error(`Telegram API responded with ${response.statusCode}: ${detail}`)
  }

  if (response.json && response.json.ok === false) {
    throw new Error(`Telegram API error: ${JSON.stringify(response.json)}`)
  }
}

const notifySpaceRequest = (record) => {
  try {
    const snapshot = requestSnapshot(record)
    const errors = []

    try {
      sendEmail(snapshot)
    } catch (error) {
      errors.push(`email: ${error}`)
    }

    try {
      sendTelegram(snapshot)
    } catch (error) {
      errors.push(`telegram: ${error}`)
    }

    return errors
  } catch (error) {
    return [`notify: ${error}`]
  }
}

module.exports = {
  notifySpaceRequest,
  requestSnapshot,
}
