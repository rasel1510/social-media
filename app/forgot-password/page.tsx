"use client";

import { useState, useEffect } from "react";
import { authClient } from "@/lib/auth-client";
import Link from "next/link";
import { Mail, ArrowLeft, Loader2, CheckCircle2 } from "lucide-react";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [isSent, setIsSent] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const handleForgotPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        const { data, error: resetError } = await authClient.requestPasswordReset({
            email,
            redirectTo: "/reset-password",
        });

        if (resetError) {
            setError(resetError.message || "Something went wrong. Please try again.");
            setIsLoading(false);
        } else {
            setIsSent(true);
            setIsLoading(false);
        }
    };

    if (!mounted) return null;

    return (
        <div className="flex min-h-screen items-center justify-center bg-black px-4 py-12 text-white">
            <div className="w-full max-w-md space-y-8">
                {/* Header */}
                <div className="text-center">
                    <h2 className="mt-6 text-3xl font-extrabold tracking-tight">Forgot Password?</h2>
                    <p className="mt-2 text-sm text-zinc-400">
                        Enter your email and we'll send you a link to reset your password.
                    </p>
                </div>

                {/* Form Card */}
                <div className="rounded-3xl border border-zinc-800 bg-zinc-950/50 p-8 shadow-2xl backdrop-blur-xl">
                    {!isSent ? (
                        <form className="space-y-6" onSubmit={handleForgotPassword}>
                            {error && (
                                <div className="rounded-xl bg-red-500/10 p-3 text-center text-sm font-medium text-red-400 border border-red-500/20">
                                    {error}
                                </div>
                            )}

                            <div className="relative">
                                <Mail className="absolute left-3 top-3.5 h-5 w-5 text-zinc-500" />
                                <input
                                    type="email"
                                    placeholder="Email Address"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full rounded-xl border border-zinc-800 bg-zinc-900/50 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="flex w-full items-center justify-center rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white transition hover:bg-emerald-500 disabled:opacity-50 active:scale-[0.98]"
                            >
                                {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Send Reset Link"}
                            </button>
                        </form>
                    ) : (
                        <div className="text-center space-y-4 animate-in fade-in zoom-in duration-300">
                            <div className="flex justify-center">
                                <CheckCircle2 className="h-16 w-16 text-emerald-500" />
                            </div>
                            <h3 className="text-xl font-bold">Check your email</h3>
                            <p className="text-sm text-zinc-400">
                                If an account exists for {email}, you will receive a password reset link shortly.
                            </p>
                            <Link
                                href="/login"
                                className="inline-flex items-center justify-center gap-2 text-sm font-medium text-emerald-400 hover:underline mt-4"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                Back to Login
                            </Link>
                        </div>
                    )}
                </div>

                {!isSent && (
                    <p className="text-center text-sm text-zinc-500">
                        Remembered your password?{" "}
                        <Link href="/login" className="font-bold text-emerald-400 hover:underline">
                            Log in here
                        </Link>
                    </p>
                )}
            </div>
        </div>
    );
}
