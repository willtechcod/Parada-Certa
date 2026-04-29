import { z } from "zod";

// Schema para login
export const loginSchema = z.object({
  email: z.string().email("Email inválido").min(1, "Email é obrigatório"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
});

// Schema para registro de usuário (admin)
export const registerSchema = z.object({
  email: z.string().email("Email inválido").min(1, "Email é obrigatório"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  name: z.string().optional(),
  role: z.enum(["USER", "ADMIN"]).default("USER"),
});

// Schema para veículo
export const vehicleSchema = z.object({
  plate: z
    .string()
    .min(7, "Placa deve ter 7 caracteres")
    .max(8, "Placa deve ter no máximo 8 caracteres")
    .refine(
      (val) => {
        const cleaned = val.replace(/[^A-Z0-9]/g, '');
        // Old standard: ABC1234
        if (/^[A-Z]{3}\d{4}$/.test(cleaned)) return true;
        // Mercosul: ABC1D23
        if (/^[A-Z]{3}\d{1}[A-Z]{1}\d{2}$/.test(cleaned)) return true;
        return false;
      },
      { message: "Placa deve estar no formato ABC-1234 ou ABC-1D23" }
    ),
  model: z.string().min(1, "Modelo é obrigatório"),
  type: z.enum(["CARRO", "MOTO"], {
    errorMap: () => ({ message: "Tipo deve ser CARRO ou MOTO" }),
  }),
});

// Schema para preço
export const priceSchema = z.object({
  type: z.enum(["CARRO", "MOTO"]),
  pricePerMin: z.number().min(0.01, "Preço deve ser maior que zero"),
});

// Schema para promoção
export const promotionSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  discount: z.number().min(0, "Desconto deve ser positivo").max(100, "Desconto máximo é 100%"),
  vehicleType: z.string().nullable().optional(),
  startDate: z.string().min(1, "Data inicial é obrigatória"),
  endDate: z.string().min(1, "Data final é obrigatória"),
  active: z.boolean().default(true),
});

// Schema para edição de usuário
export const editUserSchema = z.object({
  email: z.string().email("Email inválido").optional(),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres").optional().or(z.literal("")),
  name: z.string().optional(),
  role: z.enum(["USER", "ADMIN"]).optional(),
});

// Types infered from schemas
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type VehicleInput = z.infer<typeof vehicleSchema>;
export type PriceInput = z.infer<typeof priceSchema>;
export type PromotionInput = z.infer<typeof promotionSchema>;
export type EditUserInput = z.infer<typeof editUserSchema>;
