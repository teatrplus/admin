<script lang="ts">
  import PageHeader from '@/components/PageHeader/PageHeader.svelte'
  import NavIcon from '@/components/NavIcon/NavIcon.svelte'
  import ArrowIcon from '~icons/material-symbols/arrow-outward'
  import { useLocale } from '@/lib/i18n/context.svelte'
  import { getCurrentUser } from '@/lib/pocketbase/auth'
  import { navSectionsForUser } from '@/lib/pocketbase/permissions'
  import { navigate } from '@/lib/router'
  import type { NavItem } from '@/lib/nav'
  import './HomePage.css'

  const localeCtx = useLocale()
  const user = $derived(getCurrentUser())
  const displayName = $derived(user?.name?.trim() || user?.email || '—')
  const greeting = $derived(localeCtx.t.home.greeting.replace('{name}', displayName))
  const sections = $derived(navSectionsForUser())
  const description = (item: NavItem) =>
    ({
      homepage: localeCtx.t.workspace.homeDescription,
      masks: localeCtx.t.workspace.masksDescription,
      inquiries: localeCtx.t.workspace.inquiriesDescription,
      landing: localeCtx.t.workspace.landingDescription,
      requests: localeCtx.t.workspace.requestsDescription,
      staff: localeCtx.t.workspace.staffDescription,
      account: localeCtx.t.workspace.accountDescription,
      social: localeCtx.t.workspace.socialDescription,
    })[item.labelKey]
</script>

<section class="home_page">
  <PageHeader eyebrow={localeCtx.t.workspace.overview} title={greeting} description={localeCtx.t.home.body} />
  <div class="home_page-sections">
    {#each sections as section}
      <section class="home_page-section">
        <h2 class="home_page-section_title">{localeCtx.t.nav.sections[section.labelKey]}</h2>
        <div class="home_page-grid">
          {#each section.items as item}
            <a
              class="home_page-card"
              href={item.route}
              onclick={(event) => {
                if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
                event.preventDefault()
                navigate(item.route)
              }}
            >
              <div class="home_page-card_header">
                <span class="home_page-icon"><NavIcon name={item.icon} /></span>
                <span class="home_page-arrow" aria-hidden="true"><ArrowIcon width="18" height="18" /></span>
              </div>
              <h3 class="home_page-card_title">{localeCtx.t.nav[item.labelKey]}</h3>
              <p class="home_page-card_description">{description(item)}</p>
            </a>
          {/each}
        </div>
      </section>
    {/each}
  </div>
</section>
