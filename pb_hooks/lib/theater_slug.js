const letters = {
  а: 'a',
  б: 'b',
  в: 'v',
  г: 'g',
  д: 'd',
  е: 'e',
  ё: 'e',
  ж: 'zh',
  з: 'z',
  и: 'i',
  й: 'y',
  к: 'k',
  л: 'l',
  м: 'm',
  н: 'n',
  о: 'o',
  п: 'p',
  р: 'r',
  с: 's',
  т: 't',
  у: 'u',
  ф: 'f',
  х: 'kh',
  ц: 'ts',
  ч: 'ch',
  ш: 'sh',
  щ: 'shch',
  ъ: '',
  ы: 'y',
  ь: '',
  э: 'e',
  ю: 'yu',
  я: 'ya',
  ў: 'o',
  қ: 'q',
  ғ: 'g',
  ҳ: 'h',
}

function slugify(value) {
  return Array.from(value.toLowerCase())
    .map((letter) => letters[letter] ?? letter)
    .join('')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/['‘’ʻʼ`]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function assign(app, record) {
  const collection = record.collection().name
  // Reload persisted state: a Record reused after app.save() can retain an empty original().
  const original = record.isNew() ? '' : app.findRecordById(record.collection().name, record.id).getString('slug')
  if (original && (collection !== 't_mask' || record.getString('slug') === original)) {
    record.set('slug', original)
    return
  }

  if (original && !slugify(record.getString('slug')))
    throw new BadRequestError('A mask address cannot be empty.', {
      slug: { code: 'validation_required', message: 'Enter a page address.' },
    })
  const field = collection === 't_staff' || collection === 't_mask' ? 'name' : 'title'
  const fallback =
    collection === 't_staff'
      ? 'person'
      : collection === 't_course'
        ? 'course'
        : collection === 't_mask'
          ? 'mask'
          : 'play'
  if (!record.id) record.set('id', $security.randomStringWithAlphabet(15, 'abcdefghijklmnopqrstuvwxyz0123456789'))
  const base =
    [record.getString('slug'), ...['en', 'ru', 'uz'].map((locale) => record.getString(`${field}_${locale}`))]
      .map(slugify)
      .find(Boolean) || `${fallback}-${record.id}`
  let slug = base.slice(0, 150).replace(/-$/, '')
  // Keep ID-shaped paths free for automatic legacy redirects.
  if (slug === 'index' || /^[a-z0-9]{15}$/.test(slug)) slug = `${fallback}-${slug}`
  const available = (candidate) =>
    app.findRecordsByFilter(collection, 'slug = {:slug} && id != {:id}', '', 1, 0, { slug: candidate, id: record.id })
      .length === 0
  if (!available(slug)) {
    if (original && collection === 't_mask')
      throw new BadRequestError('This mask address is already in use.', {
        slug: { code: 'validation_not_unique', message: 'Choose a unique page address.' },
      })
    const suffixed = `${slug}-${record.id}`
    slug = suffixed
    for (let suffix = 2; !available(slug); suffix++) slug = `${suffixed}-${suffix}`
  }
  record.set('slug', slug)
}

module.exports = { assign, slugify }
