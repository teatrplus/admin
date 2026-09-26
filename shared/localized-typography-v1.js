// Versioned because the data migration must keep the same behavior on future installs.
const word = /[A-Za-z0-9_\u00c0-\u02ff\u0300-\u036f\u0400-\u052f]/
const quotes = { '"': '"', "'": "'", '«': '»', '„': '“', '“': '”', '‘': '’', '‚': '‘', '‹': '›' }
const singleQuotes = "'‘’‚"

function textEdits(text, locale) {
  const edits = []
  const protectedRanges = []
  // A URL in prose is still an address, including its query string and fragment.
  const addresses = /(?:https?:\/\/|www\.|mailto:)[^\s<>]+/gi
  let match
  while ((match = addresses.exec(text))) {
    // Closing prose punctuation is not part of the address.
    const address = match[0].replace(/[»”’.,!?;:)]+$/, '')
    protectedRanges.push([match.index, match.index + address.length])
  }
  const protectedAt = (index) => protectedRanges.some(([start, end]) => index >= start && index < end)
  const names =
    /(^|[^A-Za-z0-9_\u00c0-\u02ff\u0300-\u036f\u0400-\u052f])([dD][oO][lL][oOóÓ]\u0301?[kK][oO]|[дД][оО][лЛ][оОóÓ]\u0301?[кК][оО])(?=$|[^A-Za-z0-9_\u00c0-\u02ff\u0300-\u036f\u0400-\u052f])/g
  while ((match = names.exec(text))) {
    const index = match.index + match[1].length + 3
    if (protectedAt(index)) continue
    const letter = text[index]
    const replacement = /^[дД]/.test(match[2])
      ? (letter === 'О' || letter === 'Ó' ? 'О' : 'о') + '\u0301'
      : letter === 'O' || letter === 'Ó'
        ? 'Ó'
        : 'ó'
    edits.push({ start: index, end: index + 1 + (text[index + 1] === '\u0301' ? 1 : 0), value: replacement })
  }

  const stack = []
  const pairs =
    locale === 'ru'
      ? [
          ['«', '»'],
          ['„', '“'],
        ]
      : [
          ['“', '”'],
          ['‘', '’'],
        ]
  for (let index = 0; index < text.length; index++) {
    const character = text[index]
    if (protectedAt(index) || !'"\'«»„“”‘’‚‹›'.includes(character)) continue
    const previous = text[index - 1] || ''
    const next = text[index + 1] || ''
    const top = stack[stack.length - 1]
    const single = singleQuotes.includes(character)
    // Contractions and Uzbek o‘/g‘/tutuq marks are letters, not quotation delimiters.
    if (single && word.test(previous) && word.test(next)) continue
    const canClose = top && top.close === character
    const openingContext =
      (!previous || /[\s([{—–:]/.test(previous) || Object.hasOwnProperty.call(quotes, previous)) &&
      next &&
      !/[\s.,!?;:)\]}]/.test(next)
    if (canClose && ((character !== '"' && character !== "'") || !openingContext)) {
      stack.pop()
      const pair = pairs[top.depth % 2]
      edits.push({ start: top.index, end: top.index + 1, value: pair[0] })
      edits.push({ start: index, end: index + 1, value: pair[1] })
    } else if (quotes[character] && (openingContext || (!single && !word.test(previous)))) {
      stack.push({ index, close: quotes[character], depth: stack.length })
    }
  }
  return edits.sort((a, b) => a.start - b.start)
}

function formatText(text, locale) {
  const edits = textEdits(text, locale)
  for (let index = edits.length - 1; index >= 0; index--) {
    const edit = edits[index]
    text = text.slice(0, edit.start) + edit.value + text.slice(edit.end)
  }
  return text
}

function formatDocument(document, locale) {
  if (!document || document.type !== 'doc' || !Array.isArray(document.content)) return document
  const result = JSON.parse(JSON.stringify(document))
  const visit = (node) => {
    if (node.type === 'codeBlock') return
    if (node.type === 'paragraph' || node.type === 'heading') {
      // Format a complete text block so pairs and surnames can cross bold/link marks.
      const runs = []
      let text = ''
      for (const child of node.content || []) {
        if (
          child.type === 'text' &&
          typeof child.text === 'string' &&
          !child.marks?.some((mark) => mark.type === 'code')
        ) {
          runs.push({ node: child, start: text.length, end: text.length + child.text.length })
          text += child.text
        } else text += '\n'
      }
      const edits = textEdits(text, locale)
      for (const run of runs) {
        for (let index = edits.length - 1; index >= 0; index--) {
          const edit = edits[index]
          if (edit.start >= run.end || edit.end <= run.start) continue
          const start = Math.max(edit.start, run.start) - run.start
          const end = Math.min(edit.end, run.end) - run.start
          run.node.text =
            run.node.text.slice(0, start) + (edit.start >= run.start ? edit.value : '') + run.node.text.slice(end)
        }
      }
    } else for (const child of node.content || []) visit(child)
  }
  visit(result)
  return result
}

function localizedFields(collection) {
  if (!collection.isBase()) return []
  // Field suffixes are the CMS's language contract. Never rewrite IDs, files or URLs.
  return Array.from(collection.fields, (field) => ({ name: field.name, type: field.type() })).filter(
    (field) => /_(en|ru|uz)$/.test(field.name) && ['text', 'json'].includes(field.type),
  )
}

function normalizeRecord(record) {
  let changed = false
  for (const field of localizedFields(record.collection())) {
    const locale = field.name.slice(-2)
    const original = record.getString(field.name)
    // get() returns Go-backed bytes for JSON fields; getString() decodes those bytes.
    const value = field.type === 'json' ? JSON.parse(original || 'null') : original
    const formatted = field.type === 'text' ? formatText(value, locale) : formatDocument(value, locale)
    if (JSON.stringify(value) === JSON.stringify(formatted)) continue
    record.set(field.name, formatted)
    changed = true
  }
  return changed
}

module.exports = { formatText, formatDocument, localizedFields, normalizeRecord }
