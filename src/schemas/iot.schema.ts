import { z } from 'zod'

export const iotParamsSchema = z.object({
  id: z.string().uuid('Invalid UUID'),
})

export const updateDesiredSchema = z.object({
  samplingIntervalSec: z.number().int().min(1).max(3600).optional(),
  co2AlertThreshold: z.number().int().min(100).max(5000).optional(),
})

export const updateOfficeHoursSchema = z.object({
  apertura: z
    .string()
    .regex(/^\d{2}:\d{2}$/, 'apertura must be in HH:mm format')
    .optional(),
  cierre: z
    .string()
    .regex(/^\d{2}:\d{2}$/, 'cierre must be in HH:mm format')
    .optional(),
  timezone: z.string().min(1).optional(),
  diasLaborales: z
    .array(z.number().int().min(1).max(7))
    .min(1)
    .optional(),
})

export const getTelemetryQuerySchema = z.object({
  minutes: z.coerce.number().int().min(1).max(1440).default(60),
})

export const getAlertsQuerySchema = z.object({
  active: z
    .string()
    .optional()
    .transform((v) => v === 'true' ? true : v === 'false' ? false : undefined),
  kind: z.enum(['CO2', 'OCCUPANCY_MAX', 'OCCUPANCY_UNEXPECTED']).optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
})

export type IotParams = z.infer<typeof iotParamsSchema>
export type UpdateDesiredBody = z.infer<typeof updateDesiredSchema>
export type UpdateOfficeHoursBody = z.infer<typeof updateOfficeHoursSchema>
export type GetTelemetryQuery = z.infer<typeof getTelemetryQuerySchema>
export type GetAlertsQuery = z.infer<typeof getAlertsQuerySchema>
