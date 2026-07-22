/// <reference path="../pb_data/types.d.ts" />

/**
 * Public landing form → space_request create.
 * Runs after the record is saved so a notification failure never blocks the visitor.
 */
onRecordAfterCreateSuccess((event) => {
  const notify = require(`${__hooks}/lib/space_request_notify.js`)
  const record = event.record
  if (!record) return

  const errors = notify.notifySpaceRequest(record)

  if (errors.length === 0) {
    $app.logger().info('space_request notifications sent', 'requestId', record.id)
    return
  }

  for (const message of errors) {
    $app.logger().error('space_request notification failed', 'requestId', record.id, 'detail', message)
  }
}, 'space_request')
