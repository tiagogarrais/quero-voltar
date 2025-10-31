"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function LojistaDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState({
    totalCompras: 0,
    cuponsAtivos: 0,
    cuponsUsados: 0,
    receitaTotal: 0,
  });
  const [lojaData, setLojaData] = useState(null);
  const [checkingLoja, setCheckingLoja] = useState(true);

  const checkLojaData = async () => {
    try {
      const response = await fetch("/api/loja");
      const data = await response.json();

      if (data.success && data.loja) {
        setLojaData(data.loja);
        // Aqui você pode carregar estatísticas da loja
        // Por enquanto, dados mockados
        setStats({
          totalCompras: 45,
          cuponsAtivos: 23,
          cuponsUsados: 12,
          receitaTotal: 2850.5,
        });
      } else {
        // Se não há dados da loja, redirecionar para cadastro
        router.push("/lojista/cadastro");
        return;
      }
    } catch (error) {
      console.error("Erro ao verificar dados da loja:", error);
      // Em caso de erro, redirecionar para cadastro
      router.push("/lojista/cadastro");
      return;
    } finally {
      setCheckingLoja(false);
    }
  };

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/");
      return;
    }

    checkLojaData();
  }, [session, status, router]);

  const handleLogout = () => {
    signOut({ callbackUrl: "/" });
  };

  if (status === "loading" || checkingLoja) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>
          {status === "loading"
            ? "Carregando..."
            : "Verificando dados da loja..."}
        </p>
      </div>
    );
  }

  return (
    <div className="lojista-dashboard">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-content">
          <h1>🏪 Painel da Loja</h1>
          <div className="header-actions">
            <button
              onClick={() => router.push("/lojista/cadastro")}
              className="btn-config"
            >
              ⚙️ Configurações da Loja
            </button>
            <div className="user-info">
              <span>Olá, {session?.user?.name || "Lojista"}</span>
              <button onClick={handleLogout} className="btn-logout">
                Sair
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">🛒</div>
          <div className="stat-info">
            <h3>{stats.totalCompras}</h3>
            <p>Total de Compras</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🎫</div>
          <div className="stat-info">
            <h3>{stats.cuponsAtivos}</h3>
            <p>Cupons Ativos</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-info">
            <h3>{stats.cuponsUsados}</h3>
            <p>Cupons Utilizados</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">💰</div>
          <div className="stat-info">
            <h3>R$ {stats.receitaTotal.toFixed(2)}</h3>
            <p>Receita Total</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <h2>Ações Rápidas</h2>
        <div className="actions-grid">
          <button className="action-btn primary">
            <span className="action-icon">➕</span>
            <span>Nova Compra</span>
          </button>

          <button className="action-btn secondary">
            <span className="action-icon">🎫</span>
            <span>Gerar Cupom</span>
          </button>

          <button className="action-btn tertiary">
            <span className="action-icon">📊</span>
            <span>Relatórios</span>
          </button>

          <button className="action-btn quaternary">
            <span className="action-icon">⚙️</span>
            <span>Configurações</span>
          </button>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="recent-activity">
        <h2>Atividades Recentes</h2>
        <div className="activity-list">
          <div className="activity-item">
            <div className="activity-icon">🛒</div>
            <div className="activity-content">
              <p>
                <strong>João Silva</strong> fez uma compra de R$ 150,00
              </p>
              <span className="activity-time">Há 2 horas</span>
            </div>
          </div>

          <div className="activity-item">
            <div className="activity-icon">🎫</div>
            <div className="activity-content">
              <p>
                Cupom <strong>CUPOM10</strong> foi utilizado por Maria Santos
              </p>
              <span className="activity-time">Há 4 horas</span>
            </div>
          </div>

          <div className="activity-item">
            <div className="activity-icon">➕</div>
            <div className="activity-content">
              <p>
                Novo cupom <strong>DESCONTO20</strong> criado
              </p>
              <span className="activity-time">Há 1 dia</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
