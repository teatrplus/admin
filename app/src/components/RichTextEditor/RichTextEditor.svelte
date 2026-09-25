<script lang="ts">
  import { onMount } from 'svelte'
  import { Editor, type JSONContent } from '@tiptap/core'
  import StarterKit from '@tiptap/starter-kit'
  import UndoIcon from '~icons/material-symbols/undo-rounded'
  import RedoIcon from '~icons/material-symbols/redo-rounded'
  import { useLocale } from '@/lib/i18n/context.svelte'
  import './RichTextEditor.css'

  let {
    name,
    label,
    value = $bindable(),
    required = false,
    disabled = false,
  }: {
    name: string
    label: string
    value: JSONContent | null
    required?: boolean
    disabled?: boolean
  } = $props()
  const locale = useLocale()
  const tr = (en: string, ru: string) => (locale.locale === 'ru' ? ru : en)
  let element: HTMLDivElement
  let editor = $state.raw<Editor | null>(null)
  let revision = $state(0)
  let lastValue = ''
  let linkOpen = $state(false)
  let linkUrl = $state('')
  let linkError = $state('')
  let contentError = $state('')
  const validHref = (href: string) =>
    !/[\s\u0000-\u001f\u007f\\]/.test(href) &&
    /^(https?:\/\/[^/]+|mailto:[^@]+@[^@]+|tel:[+\d][\d().-]*|\/(?!\/)|#\S)/i.test(href)

  const actions = $derived.by(() => {
    void revision
    const e = editor
    return [
      {
        text: '¶',
        label: tr('Paragraph', 'Абзац'),
        active: e?.isActive('paragraph'),
        run: () => e?.chain().focus().setParagraph().run(),
      },
      {
        text: 'H2',
        label: tr('Heading', 'Заголовок'),
        active: e?.isActive('heading', { level: 2 }),
        run: () => e?.chain().focus().toggleHeading({ level: 2 }).run(),
      },
      {
        text: 'H3',
        label: tr('Subheading', 'Подзаголовок'),
        active: e?.isActive('heading', { level: 3 }),
        run: () => e?.chain().focus().toggleHeading({ level: 3 }).run(),
      },
      {
        text: 'B',
        label: tr('Bold', 'Полужирный'),
        active: e?.isActive('bold'),
        run: () => e?.chain().focus().toggleBold().run(),
      },
      {
        text: 'I',
        label: tr('Italic', 'Курсив'),
        active: e?.isActive('italic'),
        run: () => e?.chain().focus().toggleItalic().run(),
      },
      {
        text: 'U',
        label: tr('Underline', 'Подчёркивание'),
        active: e?.isActive('underline'),
        run: () => e?.chain().focus().toggleUnderline().run(),
      },
      {
        text: 'S',
        label: tr('Strikethrough', 'Зачёркивание'),
        active: e?.isActive('strike'),
        run: () => e?.chain().focus().toggleStrike().run(),
      },
      {
        text: '•',
        label: tr('Bullet list', 'Маркированный список'),
        active: e?.isActive('bulletList'),
        run: () => e?.chain().focus().toggleBulletList().run(),
      },
      {
        text: '1.',
        label: tr('Numbered list', 'Нумерованный список'),
        active: e?.isActive('orderedList'),
        run: () => e?.chain().focus().toggleOrderedList().run(),
      },
      {
        text: '❝',
        label: tr('Quote', 'Цитата'),
        active: e?.isActive('blockquote'),
        run: () => e?.chain().focus().toggleBlockquote().run(),
      },
      {
        text: tr('Link', 'Ссылка'),
        label: tr('Edit link', 'Изменить ссылку'),
        active: e?.isActive('link'),
        run: () => {
          linkUrl = e?.getAttributes('link').href || ''
          linkError = ''
          linkOpen = true
        },
      },
      {
        text: '—',
        label: tr('Horizontal separator', 'Горизонтальный разделитель'),
        run: () => e?.chain().focus().setHorizontalRule().run(),
      },
      {
        icon: UndoIcon,
        label: tr('Undo', 'Отменить'),
        unavailable: !e?.can().undo(),
        run: () => e?.chain().focus().undo().run(),
      },
      {
        icon: RedoIcon,
        label: tr('Redo', 'Повторить'),
        unavailable: !e?.can().redo(),
        run: () => e?.chain().focus().redo().run(),
      },
    ]
  })

  onMount(() => {
    lastValue = JSON.stringify(value)
    editor = new Editor({
      element,
      editable: !disabled,
      enableContentCheck: true,
      extensions: [
        StarterKit.configure({
          code: false,
          codeBlock: false,
          dropcursor: false,
          heading: { levels: [2, 3], HTMLAttributes: { class: 'rich_text_editor-heading' } },
          paragraph: { HTMLAttributes: { class: 'rich_text_editor-paragraph' } },
          bulletList: { HTMLAttributes: { class: 'rich_text_editor-list', 'data-kind': 'bullet' } },
          orderedList: { HTMLAttributes: { class: 'rich_text_editor-list', 'data-kind': 'ordered' } },
          listItem: { HTMLAttributes: { class: 'rich_text_editor-list_item' } },
          blockquote: { HTMLAttributes: { class: 'rich_text_editor-quote' } },
          horizontalRule: { HTMLAttributes: { class: 'rich_text_editor-separator' } },
          link: {
            openOnClick: false,
            isAllowedUri: validHref,
            HTMLAttributes: { target: null, rel: null, class: null },
          },
        }),
      ],
      content: value ?? { type: 'doc', content: [{ type: 'paragraph' }] },
      editorProps: {
        attributes: {
          id: name,
          class: 'rich_text_editor-document',
          role: 'textbox',
          'aria-multiline': 'true',
          'aria-labelledby': `${name}-label`,
          'aria-describedby': `${name}-hint`,
          'aria-required': String(required),
        },
      },
      onContentError: () => {
        contentError = tr(
          'This document could not be opened. Reload before editing.',
          'Не удалось открыть документ. Перезагрузите страницу перед редактированием.',
        )
      },
      onTransaction: () => {
        revision++
      },
      onUpdate: ({ editor: current }) => {
        if (contentError) return
        const document = current.getJSON()
        lastValue = JSON.stringify(document)
        value = document
      },
    })
    return () => editor?.destroy()
  })

  $effect(() => {
    editor?.setEditable(!disabled && !contentError, false)
  })
  $effect(() => {
    const serialized = JSON.stringify(value)
    if (editor && serialized !== lastValue) {
      lastValue = serialized
      editor.commands.setContent(value ?? { type: 'doc', content: [{ type: 'paragraph' }] }, { emitUpdate: false })
    }
  })

  function applyLink() {
    const href = linkUrl.trim()
    if (!validHref(href)) {
      linkError = tr(
        'Use a web, email, phone, or relative link.',
        'Укажите веб-ссылку, email, телефон или относительный адрес.',
      )
      return
    }
    editor?.chain().focus().extendMarkRange('link').setLink({ href }).run()
    linkOpen = false
  }
</script>

<div class="rich_text_editor" data-disabled={disabled ? 'true' : undefined}>
  <span class="rich_text_editor-label" id={`${name}-label`}>{label}{required ? ' *' : ''}</span>
  <div class="rich_text_editor-frame">
    <div class="rich_text_editor-toolbar" role="group" aria-label={tr('Text formatting', 'Форматирование текста')}>
      {#each actions as action}
        <button
          class="rich_text_editor-tool"
          type="button"
          title={action.label}
          aria-label={action.label}
          aria-pressed={action.active}
          disabled={disabled || !editor || Boolean(contentError) || action.unavailable}
          onmousedown={(event) => event.preventDefault()}
          onclick={action.run}
        >
          {#if action.icon}
            <action.icon class="rich_text_editor-tool_icon" aria-hidden="true" />
          {:else}
            {action.text}
          {/if}
        </button>
      {/each}
    </div>
    {#if linkOpen}
      <div class="rich_text_editor-link_controls">
        <label class="rich_text_editor-label" for={`${name}-url`}>{tr('Link address', 'Адрес ссылки')}</label>
        <input
          class="rich_text_editor-link_input"
          id={`${name}-url`}
          type="text"
          bind:value={linkUrl}
          placeholder="https://…"
          {disabled}
          aria-invalid={linkError ? 'true' : undefined}
          aria-describedby={linkError ? `${name}-link-error` : undefined}
          onkeydown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault()
              applyLink()
            }
          }}
        />
        <div class="rich_text_editor-link_actions">
          <button class="rich_text_editor-tool" type="button" {disabled} onclick={applyLink}
            >{tr('Apply', 'Применить')}</button
          >
          <button
            class="rich_text_editor-tool"
            type="button"
            {disabled}
            onclick={() => {
              editor?.chain().focus().extendMarkRange('link').unsetLink().run()
              linkOpen = false
            }}>{tr('Remove link', 'Убрать ссылку')}</button
          >
          <button
            class="rich_text_editor-tool"
            type="button"
            onclick={() => {
              linkOpen = false
              editor?.commands.focus()
            }}>{tr('Cancel', 'Отмена')}</button
          >
        </div>
        {#if linkError}<p class="rich_text_editor-error" id={`${name}-link-error`} role="alert">{linkError}</p>{/if}
      </div>
    {/if}
    <div class="rich_text_editor-mount" bind:this={element}></div>
  </div>
  <p class="rich_text_editor-hint" id={`${name}-hint`}>
    {tr(
      'Select text to format it. Use the separator button to insert a horizontal rule.',
      'Выделите текст для форматирования. Кнопка разделителя вставляет горизонтальную линию.',
    )}
  </p>
  {#if contentError}<p class="rich_text_editor-error" role="alert">{contentError}</p>{/if}
</div>
