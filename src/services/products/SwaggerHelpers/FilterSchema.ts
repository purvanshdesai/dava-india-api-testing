import { Type } from "@feathersjs/typebox";

export const FilterSchema = Type.Object(
  {
    categories: Type.Array(
      Type.String({
        description: 'Array of category IDs',
        default: []
      }),
      {
        description: 'Categories to filter by',
        default: []
      }
    ),
    price: Type.Object(
      {
        from: Type.Number({
          description: 'Minimum price filter',
          default: 0
        }),
        to: Type.Number({
          description: 'Maximum price filter',
          default: 500
        })
      },
      {
        description: 'Price range filter'
      }
    ),
    discount: Type.Object(
      {
        from: Type.Number({
          description: 'Minimum discount percentage',
          default: 0
        }),
        to: Type.Number({
          description: 'Maximum discount percentage',
          default: 500
        })
      },
      {
        description: 'Discount range filter'
      }
    ),
    sortBy: Type.String({
      description: 'Sort preference for the filtered results',
      default: 'none'
    })
  },
  {
    description: 'Filter options for product search'
  }
)


export const productSchemaFilter = Type.Object(
  {
    id: Type.Number(),
    category: Type.String({
      description: 'Category of the item',
      example: 'Electronics'
    }),
    sponsored: Type.String({
      description: 'Indicates if the item is sponsored or not',
      example: 'yes'
    }),
    filter: FilterSchema
  },
  { $id: 'ConsumerProducts', additionalProperties: false }
)