<script lang="ts">
  import { useLocale } from '@/lib/i18n/context.svelte'
  import { navigate } from '@/lib/router'
  import './EditorBackLink.css'

  let { dirty = false }: { dirty?: boolean } = $props()
  const locale = useLocale()
</script>

<a
  class="editor_back_link"
  href="/theater/content"
  onclick={(event) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
    event.preventDefault()
    if (
      dirty &&
      !window.confirm(locale.locale === 'ru' ? 'Отменить несохранённые изменения?' : 'Discard unsaved changes?')
    )
      return
    navigate('/theater/content')
  }}>← {locale.t.nav.content}</a
>
