"use client";

import { useState, useEffect, Suspense } from "react";
import { authClient } from "@/lib/auth-client";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Mail, Lock, Eye, EyeOff, Loader2, UserCheck } from "lucide-react";
import { checkUserExists } from "@/app/actions";

const DEMO_EMAIL = "demo@socialmedia.com";
const DEMO_PASSWORD = "Demo@12345";

function LoginContent() {
    const { data: session } = authClient.useSession();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isDemoLoading, setIsDemoLoading] = useState(false);
    const [isGoogleLoading, setIsGoogleLoading] = useState(false);
    const [error, setError] = useState("");
    const [mounted, setMounted] = useState(false);

    const router = useRouter();
    const searchParams = useSearchParams();
    const callbackURL = searchParams.get("callbackURL") || "/"; // Get the return path

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (session) {
            router.push("/home");
        }
    }, [session, router]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");
        try {
            const { data, error: loginError } = await authClient.signIn.email({
                email,
                password,
                callbackURL: callbackURL,
            });
            if (loginError) {
                // If login fails, check if the email exists to provide a specific error message
                const userExists = await checkUserExists(email);
                if (!userExists) {
                    setError("Please Create Your account first.");
                } else {
                    setError("Invalid Password.");
                }
            } else {
                // Successful login, navigate to callback URL
                router.push(callbackURL);
            }
        } catch (err) {
            setError("An unexpected error occurred.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDemoLogin = async () => {
        setIsDemoLoading(true);
        setError("");
        try {
            // Seed demo account if it doesn't exist
            await fetch("/api/seed-demo", { method: "POST" });

            // Auto-fill the form
            setEmail(DEMO_EMAIL);
            setPassword(DEMO_PASSWORD);

            // Sign in with demo credentials
            const { data, error: loginError } = await authClient.signIn.email({
                email: DEMO_EMAIL,
                password: DEMO_PASSWORD,
                callbackURL: callbackURL,
            });
            if (loginError) {
                setError("Demo login failed. Please try again.");
            } else {
                router.push(callbackURL);
            }
        } catch (err) {
            setError("Demo login failed. Please try again.");
        } finally {
            setIsDemoLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        // Disabled as per user request
        alert("Google login is currently disabled.");
    };

    return (
        <>
            {/* Dark blurred backdrop */}
            <div
                style={{
                    position: "fixed",
                    inset: 0,
                    zIndex: 40,
                    background: "rgba(0,0,0,0.75)",
                    backdropFilter: "blur(8px)",
                    WebkitBackdropFilter: "blur(8px)",
                }}
            />

            {/* Modal */}
            <div
                style={{
                    position: "fixed",
                    inset: 0,
                    zIndex: 50,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "24px 16px",
                }}
            >
                <div
                    style={{
                        width: "100%",
                        maxWidth: 420,
                        animation: "loginSlideUp 0.3s cubic-bezier(0.34,1.2,0.64,1)",
                    }}
                >
                    <style>{`
                        @keyframes loginSlideUp {
                            from { opacity: 0; transform: translateY(28px) scale(0.97); }
                            to   { opacity: 1; transform: translateY(0)     scale(1);   }
                        }
                    `}</style>

            {/* original inner content reused below */}
            <div className="w-full space-y-8 text-white">
                {/* Logo & Header */}
                <div className="text-center">

                    <p className="mt-2 text-sm text-zinc-400">
                        Log in to your account to continue
                    </p>
                </div>

                {/* Form Card */}
                <div className="rounded-3xl border border-zinc-800 bg-zinc-950/50 p-8 shadow-2xl backdrop-blur-xl">
                    <form className="space-y-5" onSubmit={handleLogin}>
                        {error && (
                            <div className="rounded-xl bg-red-500/10 p-3 text-center text-sm font-medium text-red-400 border border-red-500/20">
                                {error}
                            </div>
                        )}

                        <div className="space-y-4">
                            {/* Email Input */}
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

                            {/* Password Input */}
                            <div className="relative">
                                <Lock className="absolute left-3 top-3.5 h-5 w-5 text-zinc-500" />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
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
                        </div>

                        <div className="flex items-center justify-between">
                            <button
                                type="button"
                                onClick={() => {
                                    setEmail(DEMO_EMAIL);
                                    setPassword(DEMO_PASSWORD);
                                }}
                                className="text-sm font-medium text-amber-400 hover:text-amber-300 hover:underline transition"
                            >
                                Use Demo Account
                            </button>
                            <Link href="/forgot-password" className="text-sm font-medium text-emerald-400 hover:underline">
                                Forgot password?
                            </Link>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading || isDemoLoading}
                            className="flex w-full items-center justify-center rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white transition hover:bg-emerald-500 disabled:opacity-50"
                        >
                            {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Login"}
                        </button>
                    </form>

                    <div className="mt-6">
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-zinc-800"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="bg-zinc-950 px-2 text-zinc-500">Or continue with</span>
                            </div>
                        </div>

                        {mounted && (
                            <button
                                type="button"
                                onClick={handleGoogleLogin}
                                disabled={isGoogleLoading || isLoading}
                                className="group mt-4 flex w-full items-center justify-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900/50 py-3 text-sm font-medium transition-all duration-300 hover:bg-zinc-800 hover:border-zinc-700 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isGoogleLoading ? (
                                    <Loader2 className="h-5 w-5 animate-spin text-zinc-400" />
                                ) : (
                                    <>
                                        <svg className="h-5 w-5 transition-transform group-hover:scale-110" viewBox="0 0 24 24">
                                            <path
                                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                                fill="#4285F4"
                                            />
                                            <path
                                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                                fill="#34A853"
                                            />
                                            <path
                                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                                                fill="#FBBC05"
                                            />
                                            <path
                                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                                fill="#EA4335"
                                            />
                                        </svg>
                                        <span>Continue with Google</span>
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </div>

                <p className="text-center text-sm text-zinc-500">
                    Don't have an account?{" "}
                    <Link href="/signup" className="font-bold text-emerald-400 hover:underline">
                        Sign up here
                    </Link>
                </p>
            </div>
        {/* close animation wrapper */}
                </div>
            {/* close modal flex container */}
            </div>
        </>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={
            <div className="flex min-h-screen items-center justify-center bg-black text-white">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
            </div>
        }>
            <LoginContent />
        </Suspense>
    );
}