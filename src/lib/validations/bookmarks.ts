import { z } from "zod"

export const bookmarkCategorySchema = z.enum([
  "Dev Tools",
  "Social",
  "Self-hosted Services",
  "Misc",
])

export const createBookmarkSchema = z.object({
  label: z.string().trim().min(1).max(100),
  url: z.string().url().max(2000),
  icon: z.string().trim().max(50).optional().nullable(),
  category: z.string().trim().max(50).default("Misc"),
})

export const updateBookmarkSchema = createBookmarkSchema.partial()

export const bookmarkQuerySchema = z.object({
  category: z.string().trim().max(50).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(100),
  offset: z.coerce.number().int().min(0).default(0),
})

export type CreateBookmarkInput = z.infer<typeof createBookmarkSchema>
export type UpdateBookmarkInput = z.infer<typeof updateBookmarkSchema>
export type BookmarkQueryInput = z.infer<typeof bookmarkQuerySchema>