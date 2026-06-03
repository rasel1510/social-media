import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import prisma from "./db";
import { sendPasswordResetEmail } from "./mail";

export const auth = betterAuth({
    database: prismaAdapter(prisma, {
        provider: "postgresql",
    }),
    emailAndPassword: {
        enabled: true,
        async sendResetPassword({ user, url }) {
            console.log(`Password reset requested for ${user.email}`);
            await sendPasswordResetEmail({
                to: user.email,
                resetUrl: url,
            });
            console.log(`Password reset email sent to ${user.email}`);
        },
    },
    user: {
        additionalFields: {
            username: {
                type: "string",

                required: false,
            },
            phoneNumber: {
                type: "string",
                required: false,
            },
            coverImage: {
                type: "string",
                required: false,
            },
        },
    },
});
