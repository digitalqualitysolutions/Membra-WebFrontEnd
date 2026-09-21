import type { z } from "zod";

import type { createProfileSchema } from "@/features/onboarding/schemas";

export type ProfileFormValues = z.input<ReturnType<typeof createProfileSchema>>;
