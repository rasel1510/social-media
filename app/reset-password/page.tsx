"use client";

import { useState, useEffect, Suspense } from "react";
import { authClient } from "@/lib/auth-client";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Lock, Eye, EyeOff, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

function ResetPasswordContent() {
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [isSuccess, setIsSuccess] = useState(false);
    const [mounted, setMounted] = useState(false);

    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get("token");

    useEffect(() => {
        setMounted(true);
    }, []);

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!token) {
            setError("Invalid or missing reset token.");
            return;
        }

        if (newPassword !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        if (newPassword.length < 8) {
            setError("Password must be at least 8 characters long.");
            return;
        }

        setIsLoading(true);
        setError("");

        const { data, error: resetError } = await authClient.resetPassword({
            newPassword,
            token,
        });

        if (resetError) {
            setError(resetError.message || "Failed to reset password. The link may have expired.");
            setIsLoading(false);
        } else {
            setIsSuccess(true);
            setIsLoading(false);
            // Auto redirect after 3 seconds
            setTimeout(() => {
                router.push("/login");
            }, 3000);
        }
    };

    if (!mounted) return null;

    if (!token && !isSuccess) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-black px-4 py-12 text-white">
                <div className="w-full max-w-md text-center space-y-6">
                    <AlertCircle className="h-16 w-16 text-red-500 mx-auto" />
                    <h2 className="text-2xl font-bold">Invalid Reset Link</h2>
                    <p className="text-zinc-400">This password reset link is invalid or has expired.</p>
                    <Link href="/forgot-password" title="Go to Forgot Password">
                      <button className="w-full rounded-xl bg-zinc-800 py-3 font-bold hover:bg-zinc-700 transition">
                        Request New Link
                      </button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-black px-4 py-12 text-white">
            <div className="w-full max-w-md space-y-8">
                <div className="text-center">
                    <h2 className="mt-6 text-3xl font-extrabold tracking-tight">Reset Password</h2>
                    <p className="mt-2 text-sm text-zinc-400">
                        Please enter your new password below.
                    </p>
                </div>

                <div className="rounded-3xl border border-zinc-800 bg-zinc-950/50 p-8 shadow-2xl backdrop-blur-xl">
                    {!isSuccess ? (
                        <form className="space-y-5" onSubmit={handleResetPassword}>
                            {error && (
                                <div className="rounded-xl bg-red-500/10 p-3 text-center text-sm font-medium text-red-400 border border-red-500/20">
                                    {error}
                                </div>
                            )}

                            <div className="space-y-4">
                                <div className="relative">
                                    <Lock className="absolute left-3 top-3.5 h-5 w-5 text-zinc-500" />
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        placeholder="New Password"
                                        required
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className="w-full rounded-xl border border-zinc-800 bg-zinc-900/50 py-3 pl-10 pr-12 text-sm outline-none transition focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-3 text-zinc-500 hover:text-white"
                                    >
                                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                    </button>
                                </div>

                                <div className="relative">
                                    <Lock className="absolute left-3 top-3.5 h-5 w-5 text-zinc-500" />
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Confirm New Password"
                                        required
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="w-full rounded-xl border border-zinc-800 bg-zinc-900/50 py-3 pl-10 pr-12 text-sm outline-none transition focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="flex w-full items-center justify-center rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white transition hover:bg-emerald-500 disabled:opacity-50"
                            >
                                {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Reset Password"}
                            </button>
                        </form>
                    ) : (
                        <div className="text-center space-y-4 animate-in fade-in zoom-in duration-300">
                            <div className="flex justify-center">
                                <CheckCircle2 className="h-16 w-16 text-emerald-500" />
                            </div>
                            <h3 className="text-xl font-bold">Password Reset Successful</h3>
                            <p className="text-sm text-zinc-400">
                                Your password has been updated. Redirecting to login...
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={
            <div className="flex min-h-screen items-center justify-center bg-black text-white">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
            </div>
        }>
            <ResetPasswordContent />
        </Suspense>
    );
}
