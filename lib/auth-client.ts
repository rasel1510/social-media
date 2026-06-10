import { createAuthClient } from "better-auth/react";
import { emailOTPClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
    baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    plugins: [
        emailOTPClient()
    ],
    user: {
        additionalFields: {
            username: {
                type: "string",
            },
            phoneNumber: {
                type: "string",
            },
            coverImage: {
                type: "string",
            },
            demeritPoints: {
                type: "number",
            },
        },
    },
});

