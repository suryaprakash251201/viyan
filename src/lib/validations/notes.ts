import { z } from "zod"

export const createNoteSchema = z.object({
  title: z.string().trim().min(1).max(200).default("Untitled note"),
  content: z
    .object({
      type: z.literal("doc"),
      content: z.array(z.any()).optional(),
    })
    .passthrough()
    .optional(),
  tags: z.array(z.string().trim().max(50)).max(20).optional(),
  pinned: z.boolean().optional(),
})

export const updateNoteSchema = createNoteSchema.partial()

export const noteQuerySchema = z.object({
  query: z.string().trim().max(500).optional(),
  pinned: z.enum(["true", "false"]).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
})

export type CreateNoteInput = z.infer<typeof createNoteSchema>
export type UpdateNoteInput = z.infer<typeof updateNoteSchema>
export type NoteQueryInput = z.infer<typeof noteQuerySchema>