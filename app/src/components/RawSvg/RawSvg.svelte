<script lang="ts">
  import type { SVGAttributes } from 'svelte/elements'

  type Props = SVGAttributes<SVGSVGElement> & {
    content: string
  }

  let { content, ...attrs }: Props = $props()

  const parsed = $derived.by(() => {
    const sourceSvgMatch = content.match(/<svg\b([^>]*)>([\s\S]*?)<\/svg>\s*$/)
    const sourceAttrsStr = sourceSvgMatch?.[1] ?? ''
    const innerHTML = sourceSvgMatch?.[2] ?? content

    const sourceAttrs: Record<string, string> = {}
    const attrRegex = /(\w[\w-]*)="([^"]*)"/g
    let match: RegExpExecArray | null

    while ((match = attrRegex.exec(sourceAttrsStr)) !== null) {
      if (match[1] !== 'xmlns') {
        sourceAttrs[match[1]] = match[2]
      }
    }

    return {
      merged: { ...sourceAttrs, ...attrs },
      innerHTML,
    }
  })
</script>

<svg {...parsed.merged}>{@html parsed.innerHTML}</svg>
