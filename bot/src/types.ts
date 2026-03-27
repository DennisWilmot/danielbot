import { z } from "zod";

export const ReceiptItemSchema = z.object({
  name: z.string(),
  quantity: z.number().nullable(),
  unitPrice: z.number().nullable(),
  lineTotal: z.number().nullable(),
});

export const ParsedReceiptSchema = z.object({
  merchant: z.string().nullable(),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable(),
  currency: z.string().nullable(),
  total: z.number().nullable(),
  tax: z.number().nullable(),
  paymentMethod: z.string().nullable(),
  items: z.array(ReceiptItemSchema),
  notes: z.string().nullable(),
  confidence: z.number().min(0).max(1),
  category: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  purchase: z.string().nullable().optional(),
});

export const ReceiptSchema = z.object({
  id: z.string(),
  userId: z.number(),
  username: z.string().nullable(),
  displayName: z.string().nullable().optional(),
  createdAt: z.string(),
  source: z.enum(["photo", "pdf", "text"]),
  raw: z.object({
    fileId: z.string().nullable(),
    mimeType: z.string().nullable(),
    text: z.string().nullable(),
  }),
  parsed: ParsedReceiptSchema,
  imagePath: z.string().nullable().optional(),
  status: z.enum(["Pending", "Approved", "Rejected"]).default("Pending"),
});

export type ReceiptItem = z.infer<typeof ReceiptItemSchema>;
export type ParsedReceipt = z.infer<typeof ParsedReceiptSchema>;
export type Receipt = z.infer<typeof ReceiptSchema>;
export type ReceiptSource = "photo" | "pdf" | "text";
