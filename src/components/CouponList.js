"use client";

import { useState, useEffect } from "react";

export default function CouponList({ refreshTrigger }) {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/cupons");
      const data = await response.json();

      if (response.ok) {
        setCoupons(data);
        setError(null);
      } else {
        setError(data.error || "Erro ao carregar cupons");
      }
    } catch (err) {
      console.error("Error fetching coupons:", err);
      setError("Erro interno do servidor");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, [refreshTrigger]);

  const handleDeleteCoupon = async (couponId) => {
    if (!confirm("Tem certeza que deseja excluir este cupom?")) {
      return;
    }

    try {
      const response = await fetch(`/api/cupons?id=${couponId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setCoupons((prev) => prev.filter((coupon) => coupon.id !== couponId));
      } else {
        const data = await response.json();
        alert(data.error || "Erro ao excluir cupom");
      }
    } catch (error) {
      console.error("Error deleting coupon:", error);
      alert("Erro interno do servidor");
    }
  };

  const formatDiscountValue = (coupon) => {
    switch (coupon.tipo) {
      case "VALUE":
        return `R$ ${parseFloat(coupon.valor).toFixed(2)}`;
      case "PERCENTAGE":
        return `${coupon.valor}%`;
      case "BRINDE":
        return coupon.descricao;
      default:
        return coupon.valor || coupon.descricao;
    }
  };

  const getDiscountTypeLabel = (type) => {
    switch (type) {
      case "VALUE":
        return "Valor Fixo";
      case "PERCENTAGE":
        return "Percentual";
      case "BRINDE":
        return "Brinde";
      default:
        return type;
    }
  };

  if (loading) {
    return (
      <div className="coupon-list-loading">
        <div className="loading-spinner"></div>
        <p>Carregando cupons...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="coupon-list-error">
        <p>❌ {error}</p>
        <button onClick={fetchCoupons} className="btn-secondary">
          Tentar Novamente
        </button>
      </div>
    );
  }

  if (coupons.length === 0) {
    return (
      <div className="coupon-list-empty">
        <div className="empty-icon">🎫</div>
        <h3>Nenhum cupom criado ainda</h3>
        <p>
          Crie seu primeiro cupom para começar a oferecer descontos aos seus
          clientes!
        </p>
      </div>
    );
  }

  return (
    <div className="coupon-list">
      <div className="coupon-list-header">
        <h3>Seus Cupons ({coupons.length})</h3>
      </div>

      <div className="coupon-grid">
        {coupons.map((coupon) => (
          <div key={coupon.id} className="coupon-card">
            <div className="coupon-header">
              <div className="coupon-type">
                {getDiscountTypeLabel(coupon.tipo)}
              </div>
              <div
                className={`coupon-status ${
                  coupon.visivel ? "visible" : "hidden"
                }`}
              >
                {coupon.visivel ? "👁️ Visível" : "🙈 Oculto"}
              </div>
            </div>

            <div className="coupon-value">{formatDiscountValue(coupon)}</div>

            <div className="coupon-details">
              <div className="detail-item">
                <span className="detail-label">Quantidade:</span>
                <span className="detail-value">{coupon.quantidade}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Validade:</span>
                <span className="detail-value">{coupon.validadeDias} dias</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Criado em:</span>
                <span className="detail-value">
                  {new Date(coupon.createdAt).toLocaleDateString("pt-BR")}
                </span>
              </div>
            </div>

            <div className="coupon-actions">
              <button
                onClick={() => handleDeleteCoupon(coupon.id)}
                className="btn-delete"
                title="Excluir cupom"
              >
                🗑️ Excluir
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
