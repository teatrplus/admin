/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
  const translated = (name, max, help) => ['ru', 'en', 'uz'].map((locale) => ({ type: 'text', name: `${name}_${locale}`, max, help }))
  const dates = [
    { type: 'autodate', name: 'created', onCreate: true },
    { type: 'autodate', name: 'updated', onCreate: true, onUpdate: true },
  ]
  const teachers = new Collection({
    name: 't_course_teacher', type: 'base', listRule: '', viewRule: '',
    createRule: null, updateRule: null, deleteRule: null,
    fields: [
      { type: 'relation', name: 'staff', collectionId: app.findCollectionByNameOrId('t_staff').id, maxSelect: 1, cascadeDelete: false, help: 'Link an existing team member to reuse their name, portrait and public profile. Leave empty for a guest teacher.' },
      ...translated('name', 200, 'Guest teacher name. Linked staff names take precedence.'),
      ...translated('role', 300, 'Teaching role or professional title.'),
      ...translated('bio', 5000, 'Short teaching biography. Plain text, paragraphs separated by a blank line.'),
      { type: 'file', name: 'photo', maxSelect: 1, maxSize: 10485760, mimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/avif'] },
      ...dates,
    ],
    indexes: ["CREATE UNIQUE INDEX idx_course_teacher_staff ON t_course_teacher (staff) WHERE staff != ''"],
  })
  app.save(teachers)
  const courses = new Collection({
    name: 't_course', type: 'base', listRule: 'published = true', viewRule: 'published = true',
    createRule: null, updateRule: null, deleteRule: null,
    fields: [
      { type: 'bool', name: 'published', help: 'Only published courses and their sections are public. Rebuild the website after editing.' },
      { type: 'text', name: 'slug', required: true, max: 200, pattern: '^[a-z0-9]+(-[a-z0-9]+)*$', help: 'Generated once from the title. Preserved by the theater slug hook.' },
      { type: 'number', name: 'sort_order', min: 0, onlyInt: true },
      { type: 'select', name: 'enrollment_status', required: true, maxSelect: 1, values: ['enquire', 'open', 'waitlist', 'closed'], help: 'enquire: ask for dates; open: enrollment confirmed; waitlist: intake closed but enquiries welcome; closed: no enrollment action.' },
      ...translated('title', 250, 'Course title.'),
      ...translated('discipline', 100, 'Short label, e.g. Acting or Animation.'),
      ...translated('summary', 700, 'Short invitation used in the catalogue and search metadata.'),
      ...translated('description', 12000, 'About the course. Plain text; separate paragraphs with a blank line.'),
      ...translated('audience', 500, 'Who the course is for, including age groups where known.'),
      ...translated('duration', 300, 'Total course length. Leave blank when unconfirmed.'),
      ...translated('schedule', 1000, 'Class days, times and frequency. Leave blank when unconfirmed.'),
      ...translated('location', 300, 'Where classes take place.'),
      ...translated('enrollment_note', 1000, 'Current enrollment information. Do not promise unconfirmed dates.'),
      ...translated('price_note', 300, 'Price basis, e.g. for the full course. Empty price is not a free course.'),
      ...translated('cover_alt', 500, 'Describe the cover photo. Leave empty if the adjacent title already describes it.'),
      { type: 'number', name: 'min_age', min: 0, onlyInt: true },
      { type: 'number', name: 'max_age', min: 0, onlyInt: true },
      { type: 'number', name: 'session_count', min: 0, onlyInt: true },
      { type: 'number', name: 'session_minutes', min: 0, onlyInt: true },
      { type: 'number', name: 'price_uzs', min: 0, help: 'Confirmed amount in UZS. Zero/empty means ask for price, never free.' },
      { type: 'text', name: 'contact_phone', max: 30, pattern: '^\\+?[0-9 ()-]*$', help: 'Public enrollment phone number, with country code.' },
      { type: 'url', name: 'enrollment_url', help: 'Optional real booking or contact destination. Otherwise the phone number is used.' },
      { type: 'file', name: 'cover', maxSelect: 1, maxSize: 20971520, mimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/avif'] },
      { type: 'relation', name: 'teachers', collectionId: teachers.id, maxSelect: 20, cascadeDelete: false, help: 'Select teachers in display order. Guest teachers and linked theater staff are both supported.' },
      { type: 'url', name: 'source_url', hidden: true, help: 'Editorial provenance; not a booking destination.' },
      ...dates,
    ],
    indexes: ['CREATE UNIQUE INDEX idx_t_course_slug ON t_course (slug)'],
  })
  app.save(courses)
  const sections = new Collection({
    name: 't_course_section', type: 'base', listRule: 'course.published = true', viewRule: 'course.published = true',
    createRule: null, updateRule: null, deleteRule: null,
    fields: [
      { type: 'relation', name: 'course', collectionId: courses.id, required: true, maxSelect: 1, cascadeDelete: true },
      { type: 'select', name: 'kind', required: true, maxSelect: 1, values: ['about', 'audience', 'outcomes', 'program', 'format', 'faq'], help: 'Program and FAQ render as expandable sections; other kinds remain visible.' },
      { type: 'number', name: 'sort_order', min: 0, onlyInt: true },
      ...translated('title', 300, 'Section heading or FAQ question.'),
      ...translated('body', 12000, 'Plain text paragraphs. Optional when the section contains only a list.'),
      ...translated('items', 8000, 'One list item per line. No HTML or bullet characters needed.'),
      ...dates,
    ],
  })
  app.save(sections)
  const media = app.findCollectionByNameOrId('t_media_library')
  media.fields.add(new RelationField({ name: 'courses', collectionId: courses.id, maxSelect: 100, cascadeDelete: false, help: 'Courses shown in this photo. Upload once, then tag relevant courses and people.' }))
  app.save(media)
}, () => {
  // Preserve course content, teacher records, and gallery tags on rollback.
})
