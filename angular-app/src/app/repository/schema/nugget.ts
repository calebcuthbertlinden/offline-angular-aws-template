export const nuggetSchema = {
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
      id: {
          type: 'string',
          maxLength: 100
      },
      name: {
          type: 'string'
      },
      updatedAt: {
          type: 'number'
      },
      _deleted: {
          type: 'boolean'
      }
  },
  required: ['id', 'name', 'done', 'timestamp']
}