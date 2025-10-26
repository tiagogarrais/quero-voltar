import { signIn, signOut, useSession } from "next-auth/react";
import { useState } from "react";

export default function Home() {
  const { data: session } = useSession();
  const [email, setEmail] = useState("");

  return (
    <main style={{ padding: 24, fontFamily: "Arial, sans-serif" }}>
      <h1>Quero Voltar - Demo</h1>

      {!session && (
        <section>
          <button onClick={() => signIn("google")}>Entrar com Google</button>

          <hr />

          <form
            onSubmit={(e) => {
              e.preventDefault();
              signIn("email", { email });
            }}
          >
            <label>
              Entrar por email (magic link):
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
              />
            </label>
            <button type="submit">Enviar link</button>
          </form>
        </section>
      )}

      {session && (
        <section>
          <p>Conectado como {session.user?.email}</p>
          <button onClick={() => signOut()}>Sair</button>
        </section>
      )}
    </main>
  );
}
