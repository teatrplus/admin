<script lang="ts">
  import PageHeader from '@/components/PageHeader/PageHeader.svelte'
  import FormField from '@/components/FormField/FormField.svelte'
  import RawSvg from '@/components/RawSvg/RawSvg.svelte'
  import { pageIcons } from './icons'
  import { contentLabel } from '@/lib/pocketbase/content'
  import { theaterPanels } from '@/lib/theater-panels'
  import { useLocale } from '@/lib/i18n/context.svelte'
  import './TheaterContentLibrary.css'
  const locale = useLocale()
  const tr = (en: string, ru: string) => (locale.locale === 'ru' ? ru : en)
  let search = $state('')
  const groups = $derived([
    {
      label: tr('Public pages', 'Страницы сайта'),
      items: [
        {
          key: 'home',
          label: 'Homepage / Главная',
          description: 'Opening story, productions, courses and museum. / Вступление, спектакли, курсы и музей.',
          href: '/theater/home',
        },
        {
          key: 'masks',
          label: 'Masks & Museum / Маски и музей',
          description: 'Museum page, collection and individual masks. / Страница музея, коллекция и отдельные маски.',
          href: '/theater/masks',
        },
        ...theaterPanels
          .filter((panel) => !panel.shared)
          .map((panel) => ({ ...panel, href: `/theater/content/${panel.key}` })),
      ],
    },
  ])
</script>

<section class="theater_content_library">
  <PageHeader
    title={tr('Website pages', 'Страницы сайта')}
    eyebrow={locale.t.nav.sections.theater}
    description={tr(
      'Choose a page. Everything displayed there is edited together.',
      'Выберите страницу. Всё её содержание редактируется в одном месте.',
    )}
  />
  <FormField label={tr('Find a page', 'Найти страницу')} name="content-library-search" bind:value={search} />
  {#each groups as group}<section class="theater_content_library-group">
      <h2 class="theater_content_library-heading">{group.label}</h2>
      <div class="theater_content_library-grid">
        {#each group.items.filter((item) => contentLabel(item.label, locale.locale)
            .toLocaleLowerCase()
            .includes(search.toLocaleLowerCase())) as item}<a class="theater_content_library-card" href={item.href}
            ><div class="theater_content_library-copy">
              <span class="theater_content_library-name">{contentLabel(item.label, locale.locale)}</span>
              <p class="theater_content_library-description">{contentLabel(item.description, locale.locale)}</p>
            </div>
            <RawSvg class="theater_content_library-icon" content={pageIcons[item.key]!} aria-hidden="true" /></a
          >{/each}
      </div>
    </section>{/each}
</section>
