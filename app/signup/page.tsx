import Link from "next/link";

export default function SignUp() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-[url('/beach.jpg')] bg-cover bg-center">
      <div className="absolute inset-0 bg-black/40"></div>

      <div className="relative z-10 bg-white/20 backdrop-blur-lg rounded-2xl p-8 w-80 text-white">
        <h2 className="text-center text-2xl font-semibold mb-6">Sign Up</h2>

        <form className="flex flex-col gap-4">
          <input
            type="email"
            placeholder="Email"
            className="bg-white/30 rounded-md px-3 py-2 focus:outline-none placeholder-white"
          />
          <input
            type="text"
            placeholder="Full Name"
            className="bg-white/30 rounded-md px-3 py-2 focus:outline-none placeholder-white"
          />
          <input
            type="tel"
            placeholder="Phone Number"
            className="bg-white/30 rounded-md px-3 py-2 focus:outline-none placeholder-white"
          />
          <input
            type="password"
            placeholder="Create Password"
            className="bg-white/30 rounded-md px-3 py-2 focus:outline-none placeholder-white"
          />
          <input
            type="password"
            placeholder="Confirmation Password"
            className="bg-white/30 rounded-md px-3 py-2 focus:outline-none placeholder-white"
          />

          <button
            type="submit"
            className="bg-white text-black rounded-full py-2 mt-2 hover:bg-gray-100 transition"
          >
            Register
          </button>
        </form>

        <p className="text-xs text-center mt-4">
          Already have an account?{" "}
          <Link href="/signin" className="underline hover:text-white">
            Sign in here
          </Link>
        </p>
      </div>
    </main>
  );
}
