"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { signIn } from "next-auth/react";

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;
    // Usuários logados permanecem na página inicial
    // O redirecionamento será feito apenas na seleção cliente/loja
  }, [session, status, router]);

  const handleClientClick = async () => {
    if (!session) {
      signIn("google");
      return;
    }

    // Verificar se o usuário tem dados completos no perfil
    try {
      const response = await fetch("/api/profile");
      if (response.ok) {
        const data = await response.json();
        const userData = data.user;

        // Verificar se todos os campos obrigatórios estão preenchidos
        const hasCompleteProfile =
          userData.fullName &&
          userData.birthDate &&
          userData.cpf &&
          userData.whatsapp;

        if (!hasCompleteProfile) {
          // Redirecionar para completar o cadastro
          router.push("/profile");
          return;
        }
      }
    } catch (error) {
      console.error("Erro ao verificar perfil:", error);
      // Em caso de erro, redirecionar para o perfil para completar
      router.push("/profile");
      return;
    }

    // Se chegou aqui, o perfil está completo, continuar para a página do cliente
    router.push("/");
  };

  const handleStoreClick = () => {
    if (session) {
      router.push("/lojista");
    } else {
      signIn("google");
    }
  };

  if (status === "loading") {
    return (
      <div className="welcome-loading">
        <div className="loading-spinner"></div>
        <p>Carregando...</p>
      </div>
    );
  }

  return (
    <div className="welcome-container">
      <div className="welcome-content">
        <div className="welcome-header">
          <h1>
            🎉 {session ? "Bem-vindo de volta" : "Bem-vindo"} ao Quero Voltar!
          </h1>
          <p>
            {session
              ? "Como você gostaria de usar nossa plataforma hoje?"
              : "Como você gostaria de usar nossa plataforma?"}
          </p>
        </div>

        <div className="options-grid">
          <div className="option-card client-card" onClick={handleClientClick}>
            <div className="card-icon">👤</div>
            <div className="card-content">
              <h3>Sou Cliente</h3>
              <p>
                Acesse seus cupons de desconto, histórico de compras e gerencie
                seu perfil
              </p>
            </div>
            <button className="btn-primary">
              {session ? "Continuar como Cliente" : "Entrar como Cliente"}
            </button>
          </div>

          <div className="option-card store-card" onClick={handleStoreClick}>
            <div className="card-icon">🏪</div>
            <div className="card-content">
              <h3>Sou Loja</h3>
              <p>
                Gerencie compras, valide cupons, crie promoções e administre sua
                loja
              </p>
            </div>
            <button className="btn-secondary">
              {session ? "Acessar Painel da Loja" : "Entrar como Loja"}
            </button>
          </div>
        </div>

        <div className="welcome-footer">
          <p>
            {session
              ? "Não sabe qual escolher? Você pode alternar entre os modos a qualquer momento."
              : "Faça login para começar a usar nossa plataforma de cupons de desconto!"}
          </p>
        </div>
      </div>
    </div>
  );
}
