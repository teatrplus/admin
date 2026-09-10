const revision = (masks) =>
  masks
    .map((mask) => `${mask.id}:${mask.sort_order ?? 0}`)
    .sort()
    .join('|')

const saveMaskOrder = (app, input) => {
  if (
    !input ||
    !Array.isArray(input.ids) ||
    input.ids.some((id) => typeof id !== 'string') ||
    new Set(input.ids).size !== input.ids.length
  )
    throw new BadRequestError('Provide each mask ID exactly once.')
  let result
  app.runInTransaction((tx) => {
    const records = tx.findAllRecords('t_mask')
    const byId = new Map(records.map((record) => [record.id, record]))
    if (input.ids.length !== records.length || input.ids.some((id) => !byId.has(id)))
      throw new ApiError(409, 'The mask collection changed. Reload before saving its order.')
    if (input.revision !== revision(records.map((record) => record.publicExport())))
      throw new ApiError(409, 'The mask order changed. Reload before saving.')
    // Save the complete order atomically; failures must never leave half a reorder.
    result = input.ids.map((id, index) => {
      const record = byId.get(id)
      if (record.get('sort_order') !== index) {
        record.set('sort_order', index)
        tx.save(record)
      }
      return record.publicExport()
    })
  })
  return result
}
module.exports = { revision, saveMaskOrder }
