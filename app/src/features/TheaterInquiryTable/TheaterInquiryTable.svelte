<script lang="ts">
  import { createQuery, createMutation, useQueryClient } from '@tanstack/svelte-query'
  import type { RecordModel } from 'pocketbase'
  import { pb } from '@/lib/pocketbase/client'
  import { canEditRequests } from '@/lib/pocketbase/permissions'
  import { useLocale } from '@/lib/i18n/context.svelte'
  import Button from '@/components/Button/Button.svelte'
  import './TheaterInquiryTable.css'

  interface Inquiry extends RecordModel {
    name: string
    email: string
    phone: string
    message: string
    status: 'to-do' | 'done'
    created: string
  }
  const locale = useLocale()
  const t = $derived(locale.t.inquiries)
  const client = useQueryClient()
  let status = $state('to-do')
  let page = $state(1)
  const inquiries = createQuery(() => ({
    queryKey: ['theater-inquiries', pb.authStore.record?.id, status, page],
    queryFn: () =>
      pb.collection('t_inquiry').getList<Inquiry>(page, 25, {
        sort: '-created,-id',
        filter: status === 'all' ? '' : pb.filter('status = {:status}', { status }),
      }),
  }))
  const update = createMutation(() => ({
    mutationFn: ({ id, status }: { id: string; status: Inquiry['status'] }) =>
      pb.collection('t_inquiry').update(id, { status }),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ['theater-inquiries'] })
    },
  }))
  $effect(() => {
    if (inquiries.data && page > Math.max(1, inquiries.data.totalPages)) page = Math.max(1, inquiries.data.totalPages)
  })
</script>

<section class="theater_inquiry_table">
  <h1 class="theater_inquiry_table-title">{t.title}</h1>
  <div class="theater_inquiry_table-toolbar">
    <label class="theater_inquiry_table-filter"
      >{t.status}
      <select
        class="theater_inquiry_table-select"
        bind:value={status}
        onchange={() => {
          page = 1
        }}
      >
        <option value="to-do">{t.todo}</option><option value="done">{t.done}</option><option value="all">{t.all}</option
        >
      </select>
    </label>
    <Button variant="outline" onclick={() => inquiries.refetch()} disabled={inquiries.isFetching}>{t.refresh}</Button>
  </div>
  {#if update.isError}<p role="alert">{t.saveError}</p>{/if}
  {#if inquiries.isPending}<p role="status">{t.loading}</p>
  {:else if inquiries.isError}<p role="alert">{t.error}</p>
  {:else if !inquiries.data?.items.length}<p>{t.empty}</p>
  {:else}
    <!-- svelte-ignore a11y_no_noninteractive_tabindex (Keyboard users must be able to scroll the table.) -->
    <div class="theater_inquiry_table-scroll" role="region" aria-label={t.title} tabindex="0">
      <table class="theater_inquiry_table-table">
        <caption class="u_sr_only">{t.title}</caption>
        <thead
          ><tr
            >{#each [t.created, t.name, t.email, t.phone, t.message, t.status] as heading}<th
                class="theater_inquiry_table-heading"
                scope="col">{heading}</th
              >{/each}</tr
          ></thead
        >
        <tbody
          >{#each inquiries.data.items as inquiry (inquiry.id)}
            <tr>
              <td class="theater_inquiry_table-cell">{new Date(inquiry.created).toLocaleString(locale.locale)}</td>
              <td class="theater_inquiry_table-cell">{inquiry.name}</td>
              <td class="theater_inquiry_table-cell"
                >{#if inquiry.email}<a href={`mailto:${inquiry.email}`}>{inquiry.email}</a>{:else}—{/if}</td
              >
              <td class="theater_inquiry_table-cell"
                >{#if inquiry.phone}<a href={`tel:${inquiry.phone.replace(/[^+0-9]/g, '')}`}>{inquiry.phone}</a
                  >{:else}—{/if}</td
              >
              <td class="theater_inquiry_table-cell" data-content="message">{inquiry.message || '—'}</td>
              <td class="theater_inquiry_table-cell">
                <span class="theater_inquiry_table-status" data-state={inquiry.status}
                  >{inquiry.status === 'done' ? t.done : t.todo}</span
                >
                {#if canEditRequests()}<Button
                    size="sm"
                    variant="outline"
                    disabled={update.isPending}
                    onclick={() =>
                      update.mutate({ id: inquiry.id, status: inquiry.status === 'done' ? 'to-do' : 'done' })}
                    >{inquiry.status === 'done' ? t.reopen : t.complete}</Button
                  >{/if}
              </td>
            </tr>
          {/each}</tbody
        >
      </table>
    </div>
    <div class="theater_inquiry_table-pagination">
      <Button variant="outline" disabled={page <= 1 || inquiries.isFetching} onclick={() => page--}>{t.previous}</Button
      >
      <span>{page} / {Math.max(1, inquiries.data.totalPages)}</span>
      <Button
        variant="outline"
        disabled={page >= inquiries.data.totalPages || inquiries.isFetching}
        onclick={() => page++}>{t.next}</Button
      >
    </div>
  {/if}
</section>
