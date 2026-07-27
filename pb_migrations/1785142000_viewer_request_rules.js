/// <reference path="../pb_data/types.d.ts" />

migrate(
  (app) => {
    const auth = "@request.auth.id != ''"
    const isAdmin = `${auth} && @request.auth.role = 'admin'`
    const isModerator = `${auth} && @request.auth.role = 'moderator'`
    const isViewer = `${auth} && @request.auth.role = 'viewer'`
    const canListManagers = `(${isModerator} || ${isViewer}) && role = 'manager'`
    const staffList = `${auth} && (${isAdmin} || id = @request.auth.id || (${canListManagers}))`
    const canEditRequests = `${auth} && @request.auth.role != 'viewer'`

    const systemUser = app.findCollectionByNameOrId('_system_user')
    const isSystemUser = `@request.auth.collectionId = '${systemUser.id}'`
    const withSystemRead = (rule) => {
      if (rule === '') return ''
      if (!rule) return isSystemUser
      return `(${rule}) || (${isSystemUser})`
    }

    const staff = app.findCollectionByNameOrId('staff')
    staff.listRule = withSystemRead(staffList)
    staff.viewRule = withSystemRead(staffList)
    app.save(staff)

    const requests = app.findCollectionByNameOrId('space_request')
    requests.updateRule = canEditRequests
    app.save(requests)
  },
  (app) => {
    const auth = "@request.auth.id != ''"
    const isAdmin = `${auth} && @request.auth.role = 'admin'`
    const isModerator = `${auth} && @request.auth.role = 'moderator'`
    const staffList = `${auth} && (${isAdmin} || id = @request.auth.id || (${isModerator} && role = 'manager'))`

    const systemUser = app.findCollectionByNameOrId('_system_user')
    const isSystemUser = `@request.auth.collectionId = '${systemUser.id}'`
    const withSystemRead = (rule) => {
      if (rule === '') return ''
      if (!rule) return isSystemUser
      return `(${rule}) || (${isSystemUser})`
    }

    const staff = app.findCollectionByNameOrId('staff')
    staff.listRule = withSystemRead(staffList)
    staff.viewRule = withSystemRead(staffList)
    app.save(staff)

    const requests = app.findCollectionByNameOrId('space_request')
    requests.updateRule = auth
    app.save(requests)
  },
)
