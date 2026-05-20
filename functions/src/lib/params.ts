import { defineSecret } from "firebase-functions/params";

export const turnstileSecretKey = defineSecret("TURNSTILE_SECRET_KEY");
