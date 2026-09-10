<script lang="ts" generics="T extends string | object">
  import type { Snippet } from 'svelte'
  import { flip } from 'svelte/animate'
  import { MediaQuery } from 'svelte/reactivity'
  import { dragHandleZone, dragHandle, type DndEvent } from 'svelte-dnd-action'
  import DragIcon from '~icons/material-symbols/drag-indicator'
  import { useLocale } from '@/lib/i18n/context.svelte'
  import './SortableList.css'

  let {
    items,
    label,
    itemLabel,
    onReorder,
    children,
    disabled = false,
    layout = 'list',
    density = 'comfortable',
  }: {
    items: T[]
    label: string
    itemLabel: (item: T, index: number) => string
    onReorder: (items: T[]) => void
    children: Snippet<[T, number]>
    disabled?: boolean
    layout?: 'list' | 'grid' | 'gallery'
    density?: 'compact' | 'comfortable'
  } = $props()

  const localeCtx = useLocale()
  const zoneId = $props.id()
  const objectIds = new WeakMap<object, string>()
  let nextId = 0
  const reducedMotion = new MediaQuery('(prefers-reduced-motion: reduce)')
  const flipDurationMs = $derived(reducedMotion.current ? 0 : 150)

  // Local keys also cover unsaved records and files, without changing the saved data.
  function itemId(item: T) {
    if (typeof item === 'string') return `value-${item}`
    let id = objectIds.get(item)
    if (!id) {
      id = `item-${nextId++}`
      objectIds.set(item, id)
    }
    return id
  }

  let sortableItems = $derived(items.map((value) => ({ id: itemId(value), value })))

  function consider(event: CustomEvent<DndEvent<{ id: string; value: T }>>) {
    sortableItems = event.detail.items
  }

  function finalize(event: CustomEvent<DndEvent<{ id: string; value: T }>>) {
    sortableItems = event.detail.items
    if (!disabled) onReorder(sortableItems.map((item) => item.value))
  }
</script>

<div
  class="sortable_list"
  data-layout={layout}
  data-density={density}
  aria-label={label}
  use:dragHandleZone={{
    items: sortableItems,
    type: zoneId,
    flipDurationMs,
    dragDisabled: disabled,
    morphDisabled: layout === 'gallery',
    dropFromOthersDisabled: true,
    dropTargetStyle: { outline: '2px dashed var(--border-focus)', outlineOffset: '2px' },
  }}
  onconsider={consider}
  onfinalize={finalize}
>
  {#each sortableItems as item, index (item.id)}
    <div
      class="sortable_list-item"
      data-layout={layout}
      data-density={density}
      aria-label={itemLabel(item.value, index)}
      animate:flip={{ duration: flipDurationMs }}
    >
      <div
        class="sortable_list-handle u_reset_button"
        role="button"
        tabindex={disabled ? -1 : 0}
        use:dragHandle
        aria-disabled={disabled}
        aria-label={`${localeCtx.locale === 'ru' ? 'Перетащить' : 'Drag to reorder'}: ${itemLabel(item.value, index)}`}
        title={localeCtx.locale === 'ru'
          ? 'Перетащите или нажмите пробел и используйте клавиши со стрелками'
          : 'Drag, or press Space and use the arrow keys'}
      >
        <DragIcon />
      </div>
      <div class="sortable_list-content">
        {@render children(item.value, index)}
      </div>
    </div>
  {/each}
</div>
