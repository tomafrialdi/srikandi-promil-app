export type Format = 'h2' | 'bold' | 'italic' | 'ul' | 'ol' | 'quote' | 'link' | 'cta'

export interface Edit {
  value: string
  selectionStart: number
  selectionEnd: number
}

/** Applies a markdown format to the selected text (or inserts a placeholder). Pure: returns the new value + selection. */
export function applyFormat(value: string, start: number, end: number, format: Format): Edit {
  const selected = value.slice(start, end)
  const before = value.slice(0, start)
  const after = value.slice(end)
  const lineStart = before.lastIndexOf('\n') + 1

  const wrap = (mark: string, placeholder: string): Edit => {
    const text = selected || placeholder
    return { value: `${before}${mark}${text}${mark}${after}`, selectionStart: start + mark.length, selectionEnd: start + mark.length + text.length }
  }
  const prefixLine = (prefix: string): Edit => ({
    value: `${value.slice(0, lineStart)}${prefix}${value.slice(lineStart)}`,
    selectionStart: start + prefix.length,
    selectionEnd: end + prefix.length,
  })

  switch (format) {
    case 'h2': return prefixLine('## ')
    case 'ul': return prefixLine('- ')
    case 'ol': return prefixLine('1. ')
    case 'quote': return prefixLine('> ')
    case 'bold': return wrap('**', 'bold text')
    case 'italic': return wrap('_', 'italic text')
    case 'link': {
      const text = selected || 'link text'
      const insert = `[${text}](https://)`
      return { value: `${before}${insert}${after}`, selectionStart: start + text.length + 3, selectionEnd: start + insert.length - 1 }
    }
    case 'cta': {
      const insert = `\n:::cta Open “Log LH test” | srikandi://log/lh\n`
      return { value: `${before}${insert}${after}`, selectionStart: start + insert.length, selectionEnd: start + insert.length }
    }
  }
}

export function insertAt(value: string, position: number, text: string): Edit {
  return { value: `${value.slice(0, position)}${text}${value.slice(position)}`, selectionStart: position + text.length, selectionEnd: position + text.length }
}
