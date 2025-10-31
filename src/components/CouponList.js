"use client";

import { useState, useEffect } from "react";

export default function CouponList({ refreshTrigger }) {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedCoupons, setExpandedCoupons] = useState(new Set());
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedIndividualCoupon, setSelectedIndividualCoupon] =
    useState(null);

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

  const toggleCouponExpansion = (couponId) => {
    setExpandedCoupons((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(couponId)) {
        newSet.delete(couponId);
      } else {
        newSet.add(couponId);
      }
      return newSet;
    });
  };

  const handleAssignCoupon = (individualCoupon) => {
    setSelectedIndividualCoupon(individualCoupon);
    setShowAssignModal(true);
  };

  const handleAssignSubmit = async (formData) => {
    try {
      const response = await fetch("/api/cupons-individuais", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: selectedIndividualCoupon.id,
          ...formData,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Refresh the coupons list
        await fetchCoupons();
        setShowAssignModal(false);
        setSelectedIndividualCoupon(null);
        alert("Cupom atribuído com sucesso!");
      } else {
        alert(data.error || "Erro ao atribuir cupom");
      }
    } catch (error) {
      console.error("Error assigning coupon:", error);
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
                onClick={() => toggleCouponExpansion(coupon.id)}
                className="btn-expand"
                title={expandedCoupons.has(coupon.id) ? "Recolher" : "Expandir"}
              >
                {expandedCoupons.has(coupon.id) ? "🔽 Recolher" : "🔼 Expandir"}
              </button>
              <button
                onClick={() => handleDeleteCoupon(coupon.id)}
                className="btn-delete"
                title="Excluir cupom"
              >
                🗑️ Excluir
              </button>
            </div>

            {expandedCoupons.has(coupon.id) && (
              <div className="individual-coupons-section">
                <h4>
                  Cupons Individuais ({coupon.cuponsIndividuais?.length || 0})
                </h4>
                <div className="individual-coupons-grid">
                  {coupon.cuponsIndividuais?.map((individual) => (
                    <div key={individual.id} className="individual-coupon-item">
                      <div className="individual-coupon-code">
                        {individual.codigo}
                      </div>
                      <div className="individual-coupon-status">
                        {individual.status === "disponivel" && "✅ Disponível"}
                        {individual.status === "atribuido" && "🎯 Atribuído"}
                        {individual.status === "usado" && "✅ Usado"}
                        {individual.status === "expirado" && "⏰ Expirado"}
                      </div>
                      {individual.dataAtribuicao && (
                        <div className="individual-coupon-assigned">
                          <small>
                            Atribuído em:{" "}
                            {new Date(
                              individual.dataAtribuicao
                            ).toLocaleDateString("pt-BR")}
                          </small>
                          {individual.telefone && (
                            <div>📞 {individual.telefone}</div>
                          )}
                          {individual.cpf && <div>🆔 {individual.cpf}</div>}
                          {individual.email && <div>📧 {individual.email}</div>}
                        </div>
                      )}
                      {individual.status === "disponivel" && (
                        <button
                          onClick={() => handleAssignCoupon(individual)}
                          className="btn-assign"
                        >
                          Atribuir
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Assignment Modal */}
      {showAssignModal && selectedIndividualCoupon && (
        <AssignCouponModal
          coupon={selectedIndividualCoupon}
          onClose={() => {
            setShowAssignModal(false);
            setSelectedIndividualCoupon(null);
          }}
          onAssign={handleAssignSubmit}
        />
      )}
    </div>
  );
}

// Componente Modal para Atribuir Cupom
function AssignCouponModal({ coupon, onClose, onAssign }) {
  const [formData, setFormData] = useState({
    telefone: "",
    cpf: "",
    email: "",
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const formatCPF = (value) => {
    const cleaned = value.replace(/\D/g, "");
    const match = cleaned.match(/^(\d{3})(\d{3})(\d{3})(\d{2})$/);
    if (match) {
      return `${match[1]}.${match[2]}.${match[3]}-${match[4]}`;
    }
    return cleaned;
  };

  const formatPhone = (value) => {
    const cleaned = value.replace(/\D/g, "");
    if (cleaned.length <= 11) {
      if (cleaned.length <= 2) return cleaned;
      if (cleaned.length <= 6)
        return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2)}`;
      if (cleaned.length <= 10)
        return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(
          6
        )}`;
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(
        7
      )}`;
    }
    return value;
  };

  const handleCPFChange = (e) => {
    const formatted = formatCPF(e.target.value);
    setFormData((prev) => ({ ...prev, cpf: formatted }));
    if (errors.cpf) {
      setErrors((prev) => ({ ...prev, cpf: "" }));
    }
  };

  const handlePhoneChange = (e) => {
    const formatted = formatPhone(e.target.value);
    setFormData((prev) => ({ ...prev, telefone: formatted }));
    if (errors.telefone) {
      setErrors((prev) => ({ ...prev, telefone: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.telefone && !formData.cpf && !formData.email) {
      newErrors.general = "Pelo menos um campo deve ser preenchido";
    }

    if (formData.cpf && formData.cpf.replace(/\D/g, "").length !== 11) {
      newErrors.cpf = "CPF deve ter 11 dígitos";
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "E-mail inválido";
    }

    if (formData.telefone && formData.telefone.replace(/\D/g, "").length < 10) {
      newErrors.telefone = "Telefone deve ter pelo menos 10 dígitos";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      await onAssign(formData);
    } catch (error) {
      console.error("Error in modal submit:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content assign-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2>🎯 Atribuir Cupom</h2>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="coupon-info">
          <p>
            <strong>Código:</strong> {coupon.codigo}
          </p>
          <p>
            <strong>Status:</strong> Disponível
          </p>
        </div>

        <form onSubmit={handleSubmit} className="assign-form">
          <div className="form-instructions">
            <p>
              Preencha pelo menos um dos campos abaixo para atribuir o cupom ao
              cliente. Esta ação é <strong>irreversível</strong>.
            </p>
          </div>

          <div className="form-group">
            <label htmlFor="telefone">Telefone</label>
            <input
              type="text"
              id="telefone"
              name="telefone"
              value={formData.telefone}
              onChange={handlePhoneChange}
              className={`form-input ${errors.telefone ? "error" : ""}`}
              placeholder="(11) 99999-9999"
              maxLength="15"
            />
            {errors.telefone && (
              <span className="error-message">{errors.telefone}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="cpf">CPF</label>
            <input
              type="text"
              id="cpf"
              name="cpf"
              value={formData.cpf}
              onChange={handleCPFChange}
              className={`form-input ${errors.cpf ? "error" : ""}`}
              placeholder="000.000.000-00"
              maxLength="14"
            />
            {errors.cpf && <span className="error-message">{errors.cpf}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="email">E-mail</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className={`form-input ${errors.email ? "error" : ""}`}
              placeholder="cliente@email.com"
            />
            {errors.email && (
              <span className="error-message">{errors.email}</span>
            )}
          </div>

          {errors.general && (
            <div className="error-message general-error">{errors.general}</div>
          )}

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancelar
            </button>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? "Atribuindo..." : "Atribuir Cupom"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
