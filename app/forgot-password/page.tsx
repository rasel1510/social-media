"use client";

import { useState, useEffect } from "react";
import { authClient } from "@/lib/auth-client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, ArrowLeft, Loader2, CheckCircle2, Lock, Eye, EyeOff, KeyRound } from "lucide-react";

export default function ForgotPasswordPage() {
    const [step, setStep] = useState<"email" | "reset">("email");
    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const [resendTimer, setResendTimer] = useState(0);
    const [mounted, setMounted] = useState(false);

    const router = useRouter();

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (resendTimer > 0) {
            interval = setInterval(() => {
                setResendTimer((prev) => prev - 1);
            }, 1000);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [resendTimer]);

    const handleSendOTP = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");
        setSuccessMessage("");

        const { data, error: sendError } = await authClient.emailOtp.sendVerificationOtp({
            email,
            type: "forget-password",
        });

        if (sendError) {
            setError(sendError.message || "Failed to send verification code. Please check your email and try again.");
            setIsLoading(false);
        } else {
            setSuccessMessage("Verification code sent successfully.");
            setStep("reset");
            setResendTimer(60);
            setIsLoading(false);
        }
    };

    const handleResendOTP = async () => {
        if (resendTimer > 0) return;
        setIsLoading(true);
        setError("");
        setSuccessMessage("");

        const { data, error: sendError } = await authClient.emailOtp.sendVerificationOtp({
            email,
            type: "forget-password",
        });

        if (sendError) {
            setError(sendError.message || "Failed to resend code.");
            setIsLoading(false);
        } else {
            setSuccessMessage("A new verification code has been sent.");
            setResendTimer(60);
            setIsLoading(false);
        }
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setSuccessMessage("");

        if (!otp || otp.length !== 6) {
            setError("Please enter a valid 6-digit verification code.");
            return;
        }

        if (newPassword.length < 8) {
            setError("Password must be at least 8 characters long.");
            return;
        }

        if (newPassword !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        setIsLoading(true);

        const { data, error: resetError } = await authClient.emailOtp.resetPassword({
            email,
            otp,
            password: newPassword,
        });

        if (resetError) {
            setError(resetError.message || "Failed to reset password. The code may be invalid or expired.");
            setIsLoading(false);
        } else {
            setSuccessMessage("Password reset successful! Redirecting to login...");
            setIsLoading(false);
            
            // Auto redirect after 3 seconds
            setTimeout(() => {
                router.push("/login");
            }, 3000);
        }
    };

    if (!mounted) return null;

    return (
        <div className="flex min-h-screen items-center justify-center bg-black px-4 py-12 text-white">
            <div className="w-full max-w-md space-y-8">
                {/* Header */}
                <div className="text-center">
                    <h2 className="mt-6 text-3xl font-extrabold tracking-tight">
                        {step === "email" ? "Forgot Password?" : "Reset Password"}
                    </h2>
                    <p className="mt-2 text-sm text-zinc-400">
                        {step === "email"
                            ? "Enter your email and we'll send you a 6-digit code to reset your password."
                            : `Enter the code sent to ${email} and choose a new password.`}
                    </p>
                </div>

                {/* Form Card */}
                <div className="rounded-3xl border border-zinc-800 bg-zinc-950/50 p-8 shadow-2xl backdrop-blur-xl">
                    {/* Error and Success Alerts */}
                    {error && (
                        <div className="mb-5 rounded-xl bg-red-500/10 p-3 text-center text-sm font-medium text-red-400 border border-red-500/20">
                            {error}
                        </div>
                    )}
                    {successMessage && (
                        <div className="mb-5 rounded-xl bg-emerald-500/10 p-3 text-center text-sm font-medium text-emerald-400 border border-emerald-500/20">
                            {successMessage}
                        </div>
                    )}

                    {step === "email" ? (
                        <form className="space-y-6" onSubmit={handleSendOTP}>
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
                                {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Send Verification Code"}
                            </button>
                        </form>
                    ) : (
                        <form className="space-y-5" onSubmit={handleResetPassword}>
                            {/* OTP Code Input */}
                            <div className="relative">
                                <KeyRound className="absolute left-3 top-3.5 h-5 w-5 text-zinc-500" />
                                <input
                                    type="text"
                                    placeholder="6-Digit Verification Code"
                                    required
                                    maxLength={6}
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                                    className="w-full rounded-xl border border-zinc-800 bg-zinc-900/50 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 tracking-wider"
                                />
                            </div>

                            {/* New Password Input */}
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

                            {/* Confirm Password Input */}
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

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="flex w-full items-center justify-center rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white transition hover:bg-emerald-500 disabled:opacity-50 active:scale-[0.98]"
                            >
                                {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Reset Password"}
                            </button>

                            {/* Resend & Edit Email controls */}
                            <div className="flex flex-col items-center justify-center gap-2 pt-2 text-xs text-zinc-400">
                                <div>
                                    {resendTimer > 0 ? (
                                        <span>Resend code in {resendTimer}s</span>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={handleResendOTP}
                                            disabled={isLoading}
                                            className="text-emerald-400 font-semibold hover:underline"
                                        >
                                            Resend Code
                                        </button>
                                    )}
                                </div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setStep("email");
                                        setError("");
                                        setSuccessMessage("");
                                    }}
                                    className="text-zinc-500 hover:text-zinc-300 transition underline mt-1"
                                >
                                    Change email address
                                </button>
                            </div>
                        </form>
                    )}
                </div>

                <p className="text-center text-sm text-zinc-500">
                    <Link href="/login" className="inline-flex items-center gap-2 font-bold text-emerald-400 hover:underline">
                        <ArrowLeft className="h-4 w-4" />
                        Back to Login
                    </Link>
                </p>
            </div>
        </div>
    );
}
