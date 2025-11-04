"use client";
import { useAuth } from "./auth/auth-context";

export default function Navbar() {
  const { user, signout } = useAuth();

  return (
    <nav className="...">
      <div>JaTour</div>
      <div>
        {user ? (
          <>
            <span className="mr-4">{user.fullName || user.email}</span>
            <button onClick={() => signout()} className="bg-red-500 text-white px-3 py-1 rounded">Logout</button>
          </>
        ) : (
          <a href="/signin">Sign in</a>
        )}
      </div>
    </nav>
  );
}
