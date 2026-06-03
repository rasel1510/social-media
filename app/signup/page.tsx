"use client";

import { useState, useEffect } from "react";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Terminal, Mail, User, Phone, Lock, Eye, EyeOff, Loader2 } from "lucide-react";

export default function SignUpPage() {
    const { data: session } = authClient.useSession();
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [phoneNumber, setPhoneNumber] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isGoogleLoading, setIsGoogleLoading] = useState(false);
    const [error, setError] = useState("");
    const [mounted, setMounted] = useState(false);

    const router = useRouter();

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (session) {
            router.push("/home");
        }
    }, [session, router]);

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        // Simple validation
        if (password.length < 8) {
            setError("Password must be at least 8 characters long.");
            setIsLoading(false);
            return;
        }

        // Inside handleSignUp
        const { data, error: signUpError } = await authClient.signUp.email({
            email,
            password,
            name,
            phoneNumber,
            callbackURL: "/login",
        } as any);

        if (signUpError) {
            setError(signUpError.message || "Failed to sign up. Please check your details.");
            setIsLoading(false);
        } else {
            router.push("/login");
        }
    };

    const handleGoogleLogin = async () => {
        // Disabled as per user request
        alert("Google login is currently disabled.");
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-black px-4 py-12 text-white">
            <div className="w-full max-w-md space-y-8">
                {/* Logo & Header */}
                <div className="text-center">

                    <h2 className="mt-6 text-3xl font-extrabold tracking-tight">Create your account</h2>

                </div>

                {/* Form Card */}
                <div className="rounded-3xl border border-zinc-800 bg-zinc-950/50 p-8 shadow-2xl backdrop-blur-xl">
                    <form className="space-y-5" onSubmit={handleSignUp}>
                        {error && (
                            <div className="rounded-xl bg-red-500/10 p-3 text-center text-sm font-medium text-red-400 border border-red-500/20">
                                {error}
                            </div>
                        )}

                        <div className="space-y-4">
                            {/* Name */}
                            <div className="relative">
                                <User className="absolute left-3 top-3.5 h-5 w-5 text-zinc-500" />
                                <input
                                    type="text"
                                    placeholder="Full Name"
                                    required
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full rounded-xl border border-zinc-800 bg-zinc-900/50 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                                />
                            </div>


                            {/* Email */}
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

                            {/* Phone */}
                            <div className="relative">
                                <Phone className="absolute left-3 top-3.5 h-5 w-5 text-zinc-500" />
                                <input
                                    type="tel"
                                    placeholder="Mobile Number"
                                    required
                                    value={phoneNumber}
                                    onChange={(e) => setPhoneNumber(e.target.value)}
                                    className="w-full rounded-xl border border-zinc-800 bg-zinc-900/50 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                                />
                            </div>

                            {/* Password */}
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

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="flex w-full items-center justify-center rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white transition hover:bg-emerald-500 disabled:opacity-50"
                        >
                            {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Sign up"}
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
                    Already have an account?{" "}
                    <Link href="/login" className="font-bold text-emerald-400 hover:underline">
                        Log in here
                    </Link>
                </p>
            </div>
        </div>
    );
}
