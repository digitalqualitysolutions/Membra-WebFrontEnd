import type { z } from "zod";

import type {
  createLoginSchema,
  createSignupSchema,
} from "@/features/auth/schemas";

export type LoginFormValues = z.input<ReturnType<typeof createLoginSchema>>;
export type SignupFormValues = z.input<ReturnType<typeof createSignupSchema>>;
