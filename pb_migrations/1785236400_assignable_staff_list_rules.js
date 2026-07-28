/// <reference path="../pb_data/types.d.ts" />

migrate(
  (app) => {
    const auth = "@request.auth.id != ''"
    const isAdmin = `${auth} && @request.auth.role = 'admin'`
    const isStaff = `${auth} && @request.auth.role != ''`
    const isAssignableRole =
      "role = 'admin' || role = 'moderator' || role = 'manager'"
    // Any authenticated staff can list assignable contacts (admin/moderator/manager).
    // Admins can still list everyone (including viewers); others can always see themselves.
    const staffList = `${auth} && (${isAdmin} || id = @request.auth.id || (${isStaff} && (${isAssignableRole})))`

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
  },
  (app) => {
    const auth = "@request.auth.id != ''"
    const isAdmin = `${auth} && @request.auth.role = 'admin'`
    const isModerator = `${auth} && @request.auth.role = 'moderator'`
    const isViewer = `${auth} && @request.auth.role = 'viewer'`
    const canListManagers = `(${isModerator} || ${isViewer}) && role = 'manager'`
    const staffList = `${auth} && (${isAdmin} || id = @request.auth.id || (${canListManagers}))`

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
  },
)
