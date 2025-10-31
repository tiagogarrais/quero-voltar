"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function PublicCouponsPage() {
  const params = useParams();
  const router = useRouter();
  const [lojaData, setLojaData] = useState(null);
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCoupons = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/loja/${params.id}/cupons`);
        const data = await response.json();

        if (response.ok) {
          setLojaData(data.loja);
          setCoupons(data.cupons);
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

    if (params.id) {
      fetchCoupons();
    }
  }, [params.id]);

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
      <div className="public-coupons-loading">
        <div className="loading-spinner"></div>
        <p>Carregando cupons...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="public-coupons-error">
        <h1>❌ Ops!</h1>
        <p>{error}</p>
        <button onClick={() => router.push("/")} className="btn-primary">
          Voltar ao Início
        </button>
      </div>
    );
  }

  return (
    <div className="public-coupons-page">
      {/* Header */}
      <header className="public-header">
        <div className="header-content">
          <button onClick={() => router.push("/")} className="btn-back">
            ← Voltar
          </button>
          <h1>{lojaData?.nome || "Cupons Disponíveis"}</h1>
        </div>
      </header>

      {/* Coupons Section */}
      <div className="coupons-section">
        {coupons.length === 0 ? (
          <div className="no-coupons">
            <div className="empty-icon">🎫</div>
            <h2>Nenhum cupom disponível no momento</h2>
            <p>Esta loja ainda não possui cupons ativos. Volte mais tarde!</p>
          </div>
        ) : (
          <>
            <div className="section-header">
              <h2>Cupons Disponíveis ({coupons.length})</h2>
              <p>Confira as ofertas especiais desta loja!</p>
            </div>

            <div className="public-coupon-grid">
              {coupons.map((coupon) => (
                <div key={coupon.id} className="public-coupon-card">
                  <div className="coupon-badge">
                    {getDiscountTypeLabel(coupon.tipo)}
                  </div>

                  <div className="coupon-main-value">
                    {formatDiscountValue(coupon)}
                  </div>

                  <div className="coupon-details">
                    <div className="detail-row">
                      <span>Quantidade disponível:</span>
                      <strong>{coupon.quantidade}</strong>
                    </div>
                    <div className="detail-row">
                      <span>Validade:</span>
                      <strong>{coupon.validadeDias} dias</strong>
                    </div>
                    <div className="detail-row">
                      <span>Publicado em:</span>
                      <strong>
                        {new Date(coupon.createdAt).toLocaleDateString("pt-BR")}
                      </strong>
                    </div>
                  </div>

                  <div className="coupon-cta">
                    <button className="btn-claim">🛒 Solicitar Cupom</button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
