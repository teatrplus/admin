# Admin design conventions

The workspace uses a navy navigation rail, neutral content surfaces, and cobalt for primary actions and selection. Geologica provides one typeface for both Russian and English; Fontsource loads it in `main.ts`.

`theme.css` owns the BEAM token contract: foundations, light/dark theme values, then public semantic tokens. Component styles consume the semantic layer. Add theme values there instead of introducing a page-specific palette.

- Start authenticated pages with `PageHeader`. Put page actions in `PageActions`; it registers a snippet in the shell above the scrolling content. Submit buttons need an explicit `form` ID because they render outside the editor form.
- Use `Button`, `FormField`, `Select`, `ContentLocaleTabs`, `StatusBanner`, and `MediaDropzone` for shared controls. Improvements to those components should reach every page.
- Keep one block and its flat element selectors in each co-located stylesheet. Compose separate components with `l_*` wrappers; never attach a layout class and a block class to the same element.
- Use numeric spacing tokens for padding, margins, and gaps. Controls and other fixed shapes use rem sizes. Use `fluid()` for interpolated type; PostCSS compiles it during the build.
- Style accessible state directly with ARIA attributes. Independent `data-*` flags are `true` or omitted. Inline styles are limited to component `--c-*` properties.
- Start with the mobile layout and add `min-width` queries. Wide tables and boards scroll inside their own containers. Editor panels become sticky when their columns sit beside each other.
- Use `EditorNavigation` for section links. It scrolls only the shell content pane, with smooth motion unless reduced motion is requested. Native fragment scrolling and `scrollIntoView` can also move overflow ancestors.
- Pair `SortableList` with `layout="gallery"` and `GalleryImage` for galleries. This keeps drag previews at their original size and shares image framing and edit/delete controls; optional fields can follow the image in the item snippet.
- Use `SortableList` for content ordering. It wraps `svelte-dnd-action` with drag handles, keyboard reordering, and reduced-motion support; the editor owns the draft and save operation.

For visual changes, run `pnpm check` and `pnpm build`, then inspect the affected routes at desktop and mobile sizes in both themes. Check DOM state and geometry first, and use screenshots to assess the visual layout. Exercise draft interactions without publishing content just to test styling.
