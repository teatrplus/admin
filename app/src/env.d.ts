/// <reference types="svelte" />
/// <reference types="vite/client" />

declare module '~icons/*' {
  import type { Component } from 'svelte'
  const component: Component<Record<string, string>>
  export default component
}

declare module '*?raw' {
  const content: string
  export default content
}

declare module '@fontsource/*'
declare module '@fontsource-variable/*'
