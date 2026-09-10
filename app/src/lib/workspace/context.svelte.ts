import { getContext, setContext, type Snippet } from 'svelte'

const key = Symbol('admin-workspace')

export function createWorkspace() {
  const state = $state<{ actions?: Snippet; content?: HTMLElement }>({})
  const workspace = {
    state,
    scrollToSection(id: string) {
      const container = state.content
      const section = document.getElementById(id)
      if (!container || !section || !container.contains(section)) return
      const inset = parseFloat(getComputedStyle(container).paddingTop)
      const top =
        container.scrollTop + section.getBoundingClientRect().top - container.getBoundingClientRect().top - inset
      // scrollIntoView and native fragments also scroll ancestors, including the shell.
      container.scrollTo({
        top,
        behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
      })
      section.setAttribute('tabindex', '-1')
      section.focus({ preventScroll: true })
      history.replaceState(history.state, '', `#${id}`)
    },
  }
  setContext(key, workspace)
  return workspace
}

export const useWorkspace = () => getContext<ReturnType<typeof createWorkspace>>(key)
