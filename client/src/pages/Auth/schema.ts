import { z } from "zod";

export const registerSchema = z.object({
  username: z.string().min(3, "Username too short"),
  email: z.string().email("Invalid email format"),
  password: z
    .string()
    .min(8, "Password must be 8 chars")
    .regex(/[A-Z]/, "Needs uppercase")
    .regex(/[0-9]/, "Needs number"),
  firstName: z.string().nonempty(),
  lastName: z.string().nonempty(),
});
