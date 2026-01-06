/**
 * Schemas de validação com Zod para endpoints críticos
 */

import { z } from 'zod'

// Validações básicas reutilizáveis
export const emailSchema = z
  .string()
  .email('Email inválido')
  .max(320, 'Email muito longo')
  .toLowerCase()

export const passwordSchema = z
  .string()
  .min(8, 'Senha deve ter pelo menos 8 caracteres')
  .max(128, 'Senha muito longa')

export const nameSchema = z
  .string()
  .min(2, 'Nome deve ter pelo menos 2 caracteres')
  .max(100, 'Nome muito longo')
  .regex(/^[a-zA-ZÀ-ÿ\s]+$/, 'Nome deve conter apenas letras e espaços')

export const amountSchema = z
  .number()
  .min(0.01, 'Valor deve ser maior que zero')
  .max(999999.99, 'Valor muito alto')

export const descriptionSchema = z
  .string()
  .min(1, 'Descrição é obrigatória')
  .max(200, 'Descrição muito longa')
  .trim()

export const categoryIdSchema = z
  .string()
  .min(1, 'ID de categoria inválido')

export const userIdSchema = z
  .string()
  .min(1, 'ID de usuário inválido')

// Schemas para autenticação
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Senha é obrigatória')
})

export const signupSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema
})

// Schemas para transações
export const createTransactionSchema = z.object({
  amount: amountSchema,
  description: descriptionSchema,
  type: z.enum(['INCOME', 'EXPENSE'], {
    errorMap: () => ({ message: 'Tipo deve ser INCOME ou EXPENSE' })
  }),
  categoryId: categoryIdSchema,
  date: z.string().datetime('Data inválida').optional(),
  method: z.enum(['CASH', 'CREDIT_CARD', 'DEBIT_CARD', 'PIX', 'TRANSFER', 'OTHER']).default('OTHER')
})

export const transactionFiltersSchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data de início inválida').optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data de fim inválida').optional(),
  categoryId: categoryIdSchema.optional(),
  type: z.enum(['INCOME', 'EXPENSE']).optional(),
  minAmount: z.coerce.number().min(0).optional(),
  maxAmount: z.coerce.number().min(0).optional(),
  limit: z.coerce.number().int().min(1).max(1000).default(100)
})

// Schema para Telegram webhook
export const telegramWebhookSchema = z.object({
  update_id: z.number(),
  message: z.object({
    message_id: z.number(),
    from: z.object({
      id: z.number(),
      first_name: z.string(),
      username: z.string().optional()
    }),
    chat: z.object({
      id: z.number(),
      type: z.string()
    }),
    text: z.string(),
    date: z.number()
  }).optional()
})

// Helper para validação de request
export function validateRequest<T>(schema: z.ZodSchema<T>, data: unknown): {
  success: boolean;
  data?: T;
  errors?: string[];
} {
  try {
    const result = schema.parse(data)
    return { success: true, data: result }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map(err => {
        const path = err.path.length > 0 ? `${err.path.join('.')}: ` : ''
        return `${path}${err.message}`
      })
      return { success: false, errors }
    }
    return { success: false, errors: ['Erro de validação desconhecido'] }
  }
}

// Helper para validação de query parameters
export function validateQuery<T>(schema: z.ZodSchema<T>, searchParams: URLSearchParams): {
  success: boolean;
  data?: T;
  errors?: string[];
} {
  const data: Record<string, any> = {}

  for (const [key, value] of searchParams.entries()) {
    data[key] = value
  }

  return validateRequest(schema, data)
}