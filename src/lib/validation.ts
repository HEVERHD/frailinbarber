import { z } from "zod"

/** Acepta dígitos, espacios, +, guiones y paréntesis. Suficiente para validar formato sin ser
 *  demasiado estricto con prefijos internacionales. */
export const phoneSchema = z
  .string()
  .trim()
  .min(7, "Teléfono inválido")
  .max(20, "Teléfono inválido")
  .regex(/^[0-9+\s()-]+$/, "Teléfono inválido")

/** "2026-02-15T18:00" o "2026-02-15T18:00:00" — el formato que espera parseColombia() */
export const dateTimeStringSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/, "Fecha/hora inválida")
  .refine((value) => !Number.isNaN(new Date(`${value}-05:00`).getTime()), "Fecha/hora inválida")

/** "2026-02-15" */
export const dateOnlySchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida")
  .refine((value) => !Number.isNaN(new Date(`${value}T00:00:00`).getTime()), "Fecha inválida")

export const appointmentStatusSchema = z.enum([
  "PENDING",
  "CONFIRMED",
  "COMPLETED",
  "CANCELLED",
  "NO_SHOW",
])

export const waitlistStatusSchema = z.enum(["WAITING", "NOTIFIED", "BOOKED", "EXPIRED"])

export const createAppointmentSchema = z.object({
  barberId: z.string().min(1, "barberId es requerido"),
  serviceId: z.string().min(1, "serviceId es requerido"),
  date: dateTimeStringSchema,
  phone: phoneSchema,
  email: z.string().trim().email("Email inválido").optional().or(z.literal("")),
  clientName: z.string().trim().min(1, "El nombre es requerido").max(100),
  notes: z.string().trim().max(500).optional(),
  bookedBy: z.enum(["CLIENT", "BARBER"]).optional(),
})

export const rescheduleAppointmentSchema = z.object({
  action: z.literal("reschedule"),
  id: z.string().min(1),
  newDate: dateTimeStringSchema,
})

export const updateAppointmentStatusSchema = z.object({
  id: z.string().min(1),
  status: appointmentStatusSchema,
})

export const createWaitlistSchema = z.object({
  date: dateOnlySchema,
  name: z.string().trim().min(1, "El nombre es requerido").max(100),
  phone: phoneSchema,
  serviceId: z.string().min(1, "serviceId es requerido"),
})

export const updateWaitlistStatusSchema = z.object({
  id: z.string().min(1),
  status: waitlistStatusSchema,
})

export const cancelAppointmentSchema = z.object({
  token: z.string().trim().min(1).max(100),
})

/** Primer mensaje de error de un ZodError, listo para devolver al cliente */
export function zodErrorMessage(error: z.ZodError): string {
  return error.issues[0]?.message || "Datos inválidos"
}
