module.exports = {
  // Dependencies live in app/, but this config also covers PocketBase and docs.
  plugins: [require.resolve('prettier-plugin-svelte', { paths: [`${__dirname}/app`] })],
  semi: false,
  singleQuote: true,
  printWidth: 120,
  tabWidth: 2,
  trailingComma: 'all',
  arrowParens: 'always',
  endOfLine: 'lf',
  htmlWhitespaceSensitivity: 'css',
  overrides: [{ files: '*.svelte', options: { parser: 'svelte' } }],
}
