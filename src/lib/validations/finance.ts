import { z } from "zod"

export const transactionTypeSchema = z.enum(["INCOME", "EXPENSE"])
export const transactionCategorySchema = z.enum([
  "FOOD",
  "RENT",
  "TRANSPORT",
  "SAAS_SUBSCRIPTIONS",
  "SALARY",
  "FREELANCE",
  "MISC",
])

export const createTransactionSchema = z.object({
  amount: z.number().positive().finite(),
  type: transactionTypeSchema,
  category: transactionCategorySchema,
  date: z.string().datetime().or(z.date()),
  note: z.string().trim().max(500).optional().nullable(),
})

export const updateTransactionSchema = createTransactionSchema.partial()

export const transactionQuerySchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(100),
  offset: z.coerce.number().int().min(0).default(0),
})

export const budgetLimitSchema = z.object({
  category: transactionCategorySchema,
  limit: z.number().positive().finite(),
  month: z.string().regex(/^\d{4}-\d{2}$/),
})

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>
export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>
export type TransactionQueryInput = z.infer<typeof transactionQuerySchema>
export type BudgetLimitInput = z.infer<typeof budgetLimitSchema>