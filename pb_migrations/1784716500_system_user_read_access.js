/// <reference path="../pb_data/types.d.ts" />

const INTERNAL_COLLECTIONS = new Set([
  '_superusers',
  '_mfas',
  '_otps',
  '_authOrigins',
  '_externalAuths',
])

const withSystemRead = (rule, isSystemUser) => {
  if (rule === '') return ''
  if (!rule) return isSystemUser
  return `(${rule}) || (${isSystemUser})`
}

const withoutSystemRead = (rule, isSystemUser) => {
  if (rule === isSystemUser) return null
  const suffix = ` || (${isSystemUser})`
  if (rule.endsWith(suffix)) return rule.slice(0, -suffix.length)
  return rule
}

migrate(
  (app) => {
    const systemUser = app.findCollectionByNameOrId('_system_user')
    const isSystemUser = `@request.auth.collectionId = '${systemUser.id}'`

    for (const collection of app.findAllCollections()) {
      if (!collection || collection.system) continue
      if (INTERNAL_COLLECTIONS.has(collection.name)) continue

      collection.listRule = withSystemRead(collection.listRule, isSystemUser)
      collection.viewRule = withSystemRead(collection.viewRule, isSystemUser)
      app.save(collection)
    }
  },
  (app) => {
    const systemUser = app.findCollectionByNameOrId('_system_user')
    const isSystemUser = `@request.auth.collectionId = '${systemUser.id}'`

    for (const collection of app.findAllCollections()) {
      if (!collection || collection.system) continue
      if (INTERNAL_COLLECTIONS.has(collection.name)) continue

      collection.listRule = withoutSystemRead(collection.listRule, isSystemUser)
      collection.viewRule = withoutSystemRead(collection.viewRule, isSystemUser)
      app.save(collection)
    }
  },
)
