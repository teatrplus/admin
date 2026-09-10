/// <reference path="../pb_data/types.d.ts" />
// Preserve the preview's Tashkent dates/times if the first local import used UTC.
migrate(
  (app) => {
    const seeds = JSON.parse(toString($os.readFile(__hooks + '/../pb_migrations/content-seed.json'))).t_festival
    const correct = (record, field, target) => {
      if (new Date(record.getString(field)).getTime() === new Date(target).getTime() + 5 * 60 * 60 * 1000) {
        record.set(field, target)
        app.save(record)
      }
    }
    for (const seed of seeds) {
      const records = app.findRecordsByFilter('t_festival', 'slug = {:slug} && published = false', '', 1, 0, {
        slug: seed.slug,
      })
      if (!records.length) continue
      const festival = records[0]
      correct(festival, 'starts_at', seed.starts_at)
      correct(festival, 'ends_at', seed.ends_at)
      const ids = festival.getStringSlice('programme')
      if (ids.length !== seed.programme.length) continue
      ids.forEach((id, index) =>
        correct(app.findRecordById('t_festival_session', id), 'starts_at', seed.programme[index].starts_at),
      )
    }
  },
  () => {},
)
