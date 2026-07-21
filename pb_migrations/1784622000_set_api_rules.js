/// <reference path="../pb_data/types.d.ts" />

migrate(
  (app) => {
    const auth = "@request.auth.id != ''"
    const isAdmin = `${auth} && @request.auth.role = 'admin'`
    const isModerator = `${auth} && @request.auth.role = 'moderator'`
    const canEditLanding = `${auth} && (${isAdmin} || ${isModerator})`
    const staffList = `${auth} && (${isAdmin} || id = @request.auth.id || (${isModerator} && role = 'manager'))`
    const staffView = staffList
    const staffUpdate = `${auth} && (${isAdmin} || id = @request.auth.id)`

    const fixSelectValues = (collection, fieldName, values) => {
      const field = collection.fields.getByName(fieldName)
      if (!field) return
      field.values = values
    }

    const staff = app.findCollectionByNameOrId('staff')
    fixSelectValues(staff, 'role', ['admin', 'moderator', 'manager'])
    staff.listRule = staffList
    staff.viewRule = staffView
    staff.createRule = isAdmin
    staff.updateRule = staffUpdate
    staff.deleteRule = isAdmin
    staff.manageRule = isAdmin
    app.save(staff)

    const staffRecords = app.findRecordsByFilter('staff', "role = 'admin '")
    for (const record of staffRecords) {
      record.set('role', 'admin')
      app.save(record)
    }

    const landingCollections = [
      'space_landing',
      'space_venue_item',
      'space_advantage_item',
      'space_gallery_item',
      'space_process_item',
    ]

    for (const name of landingCollections) {
      const collection = app.findCollectionByNameOrId(name)
      collection.listRule = canEditLanding
      collection.viewRule = canEditLanding
      collection.createRule = canEditLanding
      collection.updateRule = canEditLanding
      collection.deleteRule = canEditLanding
      app.save(collection)
    }

    const requests = app.findCollectionByNameOrId('space_request')
    fixSelectValues(requests, 'stage', [
      'inquiry',
      'confirmed',
      'rejected',
      'preparation',
      'completed',
      'cancelled',
    ])
    requests.listRule = auth
    requests.viewRule = auth
    requests.createRule = ''
    requests.updateRule = auth
    requests.deleteRule = isAdmin
    app.save(requests)

    const requestRecords = app.findRecordsByFilter('space_request', "stage = 'confirmed '")
    for (const record of requestRecords) {
      record.set('stage', 'confirmed')
      app.save(record)
    }
  },
  (app) => {
    const names = [
      'staff',
      'space_landing',
      'space_venue_item',
      'space_advantage_item',
      'space_gallery_item',
      'space_process_item',
      'space_request',
    ]

    for (const name of names) {
      const collection = app.findCollectionByNameOrId(name)
      collection.listRule = null
      collection.viewRule = null
      collection.createRule = null
      collection.updateRule = null
      collection.deleteRule = null
      if (name === 'staff') {
        collection.manageRule = null
      }
      app.save(collection)
    }
  },
)
