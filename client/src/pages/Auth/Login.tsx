import { useState } from "react";
import { z } from "zod";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const result = z
      .object({ email: z.string().email(), password: z.string().min(8) })
      .safeParse({ email, password });
    if (!result.success) {
      setError("Invalid credentials format");
      return;
    }
    alert("Mock login — replace with real auth later");
  };

  return (
    <div className="mx-auto w-full max-w-sm rounded-xl border border-neutral-200 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-neutral-800 dark:bg-neutral-900">
      <h2 className="mb-4 text-2xl font-semibold tracking-tight text-neutral-800 dark:text-neutral-100">
        Login
      </h2>
      <form onSubmit={onSubmit} className="grid gap-4">
        <label className="grid gap-1">
          <span className="text-sm text-neutral-600 dark:text-neutral-300">
            Email
          </span>
          <input
            className="h-10 rounded-md border border-neutral-300 bg-white px-3 text-sm shadow-sm outline-none ring-0 focus:border-blue-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
        </label>
        <label className="grid gap-1">
          <span className="text-sm text-neutral-600 dark:text-neutral-300">
            Password
          </span>
          <input
            className="h-10 rounded-md border border-neutral-300 bg-white px-3 text-sm shadow-sm outline-none ring-0 focus:border-blue-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
        </label>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          className="inline-flex h-10 items-center justify-center rounded-md bg-blue-500 px-4 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-50"
        >
          Login
        </button>
      </form>
    </div>
  );
}

export default Login;
