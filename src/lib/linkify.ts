// Преобразует URL (http/https) в кликабельные ссылки.
// Текст экранируется, поэтому вставка HTML безопасна (защита от XSS).

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

const URL_RE = /(https?:\/\/[^\s<>"']+)/g

export function linkify(text: string): string {
  if (!text) return ''

  let result = ''
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = URL_RE.exec(text)) !== null) {
    const before = text.slice(lastIndex, match.index)
    result += escapeHtml(before)

    const url = match[0]
    result += `<a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(url)}</a>`

    lastIndex = match.index + url.length
  }

  result += escapeHtml(text.slice(lastIndex))
  return result
}
