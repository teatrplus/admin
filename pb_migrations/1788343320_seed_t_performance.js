/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId('t_performance')
    if (app.countRecords('t_performance') > 0) {
      return
    }

    const paints = 'g4y4xrydwm24afv'
    const toys = 'gohd1i0tdhgoo6b'
    const ticket = 'https://iticket.uz/ru/venues/theatre-form-zarafshan-ch'
    const price = 50000

    const rows = [
      { id: 'pfmkraski093012', play: paints, start_at: '2026-09-30 07:00:00.000Z', ticket: ticket },
      { id: 'pfmkraski100112', play: paints, start_at: '2026-10-01 07:00:00.000Z', ticket: '' },
      { id: 'pfmtoys10081100', play: toys, start_at: '2026-10-08 06:00:00.000Z', ticket: ticket },
      { id: 'pfmtoys10091100', play: toys, start_at: '2026-10-09 06:00:00.000Z', ticket: ticket },
      { id: 'pfmkraski101712', play: paints, start_at: '2026-10-17 07:00:00.000Z', ticket: '' },
      { id: 'pfmkraski101811', play: paints, start_at: '2026-10-18 06:00:00.000Z', ticket: '' },
      { id: 'pfmtoys10311200', play: toys, start_at: '2026-10-31 07:00:00.000Z', ticket: '' },
      { id: 'pfmtoys11011200', play: toys, start_at: '2026-11-01 07:00:00.000Z', ticket: '' },
      { id: 'pfmkraski110712', play: paints, start_at: '2026-11-07 07:00:00.000Z', ticket: ticket },
      { id: 'pfmkraski110812', play: paints, start_at: '2026-11-08 07:00:00.000Z', ticket: '' },
      { id: 'pfmkraski112512', play: paints, start_at: '2026-11-25 07:00:00.000Z', ticket: '' },
      { id: 'pfmtoys11261200', play: toys, start_at: '2026-11-26 07:00:00.000Z', ticket: ticket },
      { id: 'pfmkraski121012', play: paints, start_at: '2026-12-10 07:00:00.000Z', ticket: '' },
      { id: 'pfmkraski121212', play: paints, start_at: '2026-12-12 07:00:00.000Z', ticket: ticket },
    ]

    for (const row of rows) {
      if (app.findRecordsByFilter('t_play', 'id = {:id}', '', 1, 0, { id: row.play }).length === 0) continue
      const record = new Record(collection)
      record.set('id', row.id)
      record.set('play', row.play)
      record.set('start_at', row.start_at)
      record.set('price_uzs', price)
      if (row.ticket) {
        record.set('ticket_purchase_url', row.ticket)
      }
      app.save(record)
    }
  },
  (app) => {
    const ids = [
      'pfmkraski093012',
      'pfmkraski100112',
      'pfmtoys10081100',
      'pfmtoys10091100',
      'pfmkraski101712',
      'pfmkraski101811',
      'pfmtoys10311200',
      'pfmtoys11011200',
      'pfmkraski110712',
      'pfmkraski110812',
      'pfmkraski112512',
      'pfmtoys11261200',
      'pfmkraski121012',
      'pfmkraski121212',
    ]

    for (const id of ids) {
      try {
        app.delete(app.findRecordById('t_performance', id))
      } catch (err) {}
    }
  },
)
