import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import prisma from "./db";
import { sendPasswordResetEmail, sendPasswordResetOTP } from "./mail";
import { emailOTP } from "better-auth/plugins";

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
    plugins: [
        emailOTP({
            async sendVerificationOTP({ email, otp, type }) {
                if (type === "forget-password") {
                    console.log(`Forgot password OTP requested for ${email}`);
                    await sendPasswordResetOTP({
                        to: email,
                        otp,
                    });
                    console.log(`Forgot password OTP sent to ${email}`);
                }
            },
        }),
    ],
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
            demeritPoints: {
                type: "number",
                required: false,
                defaultValue: 0,
            },
        },
    },
});

