import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { auth } from "@/lib/auth";

const DEMO_EMAIL = "demo@socialmedia.com";
const DEMO_PASSWORD = "Demo@12345";
const DEMO_NAME = "Demo User";
const DEMO_USERNAME = "demo_user";

export async function POST() {
    try {
        // Check if demo user already exists
        const existingUser = await (prisma as any).user.findUnique({
            where: { email: DEMO_EMAIL },
        });

        if (!existingUser) {
            // Create demo user via better-auth's signUp API
            const ctx = await auth.api.signUpEmail({
                body: {
                    email: DEMO_EMAIL,
                    password: DEMO_PASSWORD,
                    name: DEMO_NAME,
                },
            });

            // Update additional fields
            if (ctx?.user?.id) {
                await (prisma as any).user.update({
                    where: { id: ctx.user.id },
                    data: {
                        username: DEMO_USERNAME,
                        bio: "👋 This is a demo account for showcasing the app. Feel free to explore!",
                        emailVerified: true,
                    },
                });
            }
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Demo seed error:", error);
        // If user already exists, that's fine
        return NextResponse.json({ success: true });
    }
}
