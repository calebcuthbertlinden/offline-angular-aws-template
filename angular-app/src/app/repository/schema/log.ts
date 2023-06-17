export const logSchema = {
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
      id: {
          type: 'string',
          maxLength: 100
      },
      event: {
          type: 'string'
      },
      metadata: {
          type: 'string'
      },
      data: {
          type: 'string'
      },
      updatedAt: {
          type: 'number'
      },
      _deleted: {
          type: 'boolean'
      }
  },
  required: ['id', 'name', 'done', 'timestamp'],
  encrypted: ['data']
}