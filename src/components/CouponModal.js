"use client";

import { useState } from "react";

export default function CouponModal({ isOpen, onClose, onCouponCreated }) {
  const [formData, setFormData] = useState({
    discountType: "VALUE",
    discountValue: "",
    quantity: "",
    validityDays: "",
    isVisible: true,
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.discountValue.trim()) {
      newErrors.discountValue = "Valor do desconto é obrigatório";
    }

    if (!formData.quantity.trim()) {
      newErrors.quantity = "Quantidade é obrigatória";
    } else if (parseInt(formData.quantity) <= 0) {
      newErrors.quantity = "Quantidade deve ser maior que 0";
    }

    if (!formData.validityDays.trim()) {
      newErrors.validityDays = "Dias de validade é obrigatório";
    } else if (parseInt(formData.validityDays) <= 0) {
      newErrors.validityDays = "Dias de validade deve ser maior que 0";
    }

    // Validate discount value based on type
    if (formData.discountType === "PERCENTAGE") {
      const value = parseFloat(formData.discountValue);
      if (isNaN(value) || value < 0 || value > 100) {
        newErrors.discountValue = "Percentual deve ser entre 0 e 100";
      }
    } else if (formData.discountType === "VALUE") {
      const value = parseFloat(formData.discountValue);
      if (isNaN(value) || value <= 0) {
        newErrors.discountValue = "Valor deve ser maior que 0";
      }
    } else if (formData.discountType === "BRINDE") {
      if (!formData.discountValue.trim()) {
        newErrors.discountValue = "Descrição do brinde é obrigatória";
      }
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
      const response = await fetch("/api/cupons", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        onCouponCreated(data);
        onClose();
        setFormData({
          discountType: "VALUE",
          discountValue: "",
          quantity: "",
          validityDays: "",
          isVisible: true,
        });
      } else {
        setErrors({ submit: data.error || "Erro ao criar campanha" });
      }
    } catch (error) {
      console.error("Error creating coupon:", error);
      setErrors({ submit: "Erro interno do servidor" });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content coupon-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2>🎫 Criar Nova Campanha</h2>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="coupon-form">
          <div className="form-group">
            <label htmlFor="discountType">Tipo de Desconto</label>
            <select
              id="discountType"
              name="discountType"
              value={formData.discountType}
              onChange={handleInputChange}
              className="form-input"
            >
              <option value="VALUE">Valor Fixo (R$)</option>
              <option value="PERCENTAGE">Percentual (%)</option>
              <option value="BRINDE">Brinde</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="discountValue">
              {formData.discountType === "VALUE" && "Valor do Desconto (R$)"}
              {formData.discountType === "PERCENTAGE" &&
                "Percentual do Desconto (%)"}
              {formData.discountType === "BRINDE" && "Descrição do Brinde"}
            </label>
            <input
              type={formData.discountType === "BRINDE" ? "text" : "number"}
              id="discountValue"
              name="discountValue"
              value={formData.discountValue}
              onChange={handleInputChange}
              className={`form-input ${errors.discountValue ? "error" : ""}`}
              placeholder={
                formData.discountType === "VALUE"
                  ? "Ex: 10.00"
                  : formData.discountType === "PERCENTAGE"
                  ? "Ex: 15"
                  : "Ex: 1 produto grátis"
              }
              step={formData.discountType === "VALUE" ? "0.01" : "1"}
              min={formData.discountType === "PERCENTAGE" ? "0" : "0.01"}
              max={formData.discountType === "PERCENTAGE" ? "100" : undefined}
            />
            {errors.discountValue && (
              <span className="error-message">{errors.discountValue}</span>
            )}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="quantity">Quantidade Disponível</label>
              <input
                type="number"
                id="quantity"
                name="quantity"
                value={formData.quantity}
                onChange={handleInputChange}
                className={`form-input ${errors.quantity ? "error" : ""}`}
                placeholder="Ex: 100"
                min="1"
              />
              {errors.quantity && (
                <span className="error-message">{errors.quantity}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="validityDays">Validade (dias)</label>
              <input
                type="number"
                id="validityDays"
                name="validityDays"
                value={formData.validityDays}
                onChange={handleInputChange}
                className={`form-input ${errors.validityDays ? "error" : ""}`}
                placeholder="Ex: 30"
                min="1"
              />
              {errors.validityDays && (
                <span className="error-message">{errors.validityDays}</span>
              )}
            </div>
          </div>

          <div className="form-group checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="isVisible"
                checked={formData.isVisible}
                onChange={handleInputChange}
              />
              <span className="checkmark"></span>
              Cupom visível para clientes
            </label>
          </div>

          {errors.submit && (
            <div className="error-message submit-error">{errors.submit}</div>
          )}

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancelar
            </button>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? "Criando..." : "Gerar Cupom"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
