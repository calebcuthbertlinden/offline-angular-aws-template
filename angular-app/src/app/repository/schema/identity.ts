export const learnerSchema = {
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
      surname: {
          type: 'string'
      },
      dob: {
          type: 'string'
      },
      gender: {
          type: 'string'
      },
      race: {
          type: 'string'
      },
      cellphone: {
          type: 'string'
      },
      status: {
          type: 'string'
      },
      updatedAt: {
          type: 'number'
      },
      _deleted: {
          type: 'boolean'
      }
  },
  required: ['id', 'name', 'done', 'updatedAt'],
  encrypted: ['name', 'surname', 'dob', 'gender', 'race', 'cellphone'],
}