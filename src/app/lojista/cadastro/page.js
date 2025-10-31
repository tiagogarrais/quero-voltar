"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import estadosCidades from "../../../../estados-cidades2.json";

export default function CadastroLoja() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lojaData, setLojaData] = useState(null);
  const [formData, setFormData] = useState({
    cnpj: "",
    cidade: "",
    estado: "",
    nomeResponsavel: "",
    telefoneResponsavel: "",
  });
  const [errors, setErrors] = useState({});

  // Estados para controle dos dropdowns de estado e cidade
  const [selectedEstado, setSelectedEstado] = useState("");
  const [filteredCidades, setFilteredCidades] = useState([]);

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/");
      return;
    }

    // Carregar dados existentes da loja
    loadLojaData();
  }, [session, status, router]);

  // Filtrar cidades quando o estado selecionado muda
  useEffect(() => {
    if (selectedEstado) {
      // Filtrar cidades pelo state_id e ordenar alfabeticamente
      const cidadesDoEstado = estadosCidades.cities
        .filter((cidade) => cidade.state_id === parseInt(selectedEstado))
        .map((cidade) => cidade.name)
        .sort((a, b) => a.localeCompare(b));

      setFilteredCidades(cidadesDoEstado);
    } else {
      setFilteredCidades([]);
    }
  }, [selectedEstado]);

  const loadLojaData = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/loja");
      const data = await response.json();

      if (data.success && data.loja) {
        setLojaData(data.loja);
        setFormData({
          cnpj: data.loja.cnpj || "",
          cidade: data.loja.cidade || "",
          estado: data.loja.estado || "",
          nomeResponsavel: data.loja.nomeResponsavel || "",
          telefoneResponsavel: data.loja.telefoneResponsavel || "",
        });
        // Inicializar estado selecionado para carregar cidades
        setSelectedEstado(data.loja.estado || "");
      }
    } catch (error) {
      console.error("Erro ao carregar dados da loja:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCNPJ = (value) => {
    // Remove tudo que não é dígito
    const digits = value.replace(/\D/g, "");

    // Aplica a máscara
    if (digits.length <= 2) return digits;
    if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
    if (digits.length <= 8)
      return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
    if (digits.length <= 12)
      return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(
        5,
        8
      )}/${digits.slice(8)}`;
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(
      5,
      8
    )}/${digits.slice(8, 12)}-${digits.slice(12, 14)}`;
  };

  const validateCNPJ = (cnpj) => {
    // Remove caracteres não numéricos
    const digits = cnpj.replace(/\D/g, "");

    // Verifica se tem 14 dígitos
    if (digits.length !== 14) {
      return false;
    }

    // Verifica se todos os dígitos são iguais (CNPJ inválido)
    if (/^(\d)\1+$/.test(digits)) {
      return false;
    }

    // Calcula primeiro dígito verificador
    let sum = 0;
    let weight = 5;
    for (let i = 0; i < 12; i++) {
      sum += parseInt(digits[i]) * weight;
      weight = weight === 2 ? 9 : weight - 1;
    }
    let remainder = sum % 11;
    let firstVerifier = remainder < 2 ? 0 : 11 - remainder;

    // Calcula segundo dígito verificador
    sum = 0;
    weight = 6;
    for (let i = 0; i < 13; i++) {
      sum += parseInt(digits[i]) * weight;
      weight = weight === 2 ? 9 : weight - 1;
    }
    remainder = sum % 11;
    let secondVerifier = remainder < 2 ? 0 : 11 - remainder;

    // Verifica se os dígitos calculados batem com os informados
    return (
      parseInt(digits[12]) === firstVerifier &&
      parseInt(digits[13]) === secondVerifier
    );
  };

  const formatPhone = (value) => {
    // Remove tudo que não é dígito
    const digits = value.replace(/\D/g, "");

    // Aplica a máscara para telefone brasileiro
    if (digits.length <= 2) return `(${digits}`;
    if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    if (digits.length <= 10)
      return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(
      7,
      11
    )}`;
  };

  const handleInputChange = (field, value) => {
    let formattedValue = value;

    if (field === "cnpj") {
      formattedValue = formatCNPJ(value);
    } else if (field === "telefoneResponsavel") {
      formattedValue = formatPhone(value);
    }

    setFormData((prev) => ({
      ...prev,
      [field]: formattedValue,
    }));

    // Atualizar estado selecionado quando o campo estado muda
    if (field === "estado") {
      setSelectedEstado(value);
    }

    // Limpar erro do campo
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: null,
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.cnpj) {
      newErrors.cnpj = "CNPJ é obrigatório";
    } else if (!/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/.test(formData.cnpj)) {
      newErrors.cnpj = "CNPJ deve estar no formato XX.XXX.XXX/XXXX-XX";
    } else if (!validateCNPJ(formData.cnpj)) {
      newErrors.cnpj = "CNPJ inválido";
    }

    if (!formData.cidade.trim()) {
      newErrors.cidade = "Cidade é obrigatória";
    }

    if (!formData.estado) {
      newErrors.estado = "Estado é obrigatório";
    }

    if (!formData.nomeResponsavel.trim()) {
      newErrors.nomeResponsavel = "Nome completo do responsável é obrigatório";
    } else if (formData.nomeResponsavel.trim().length < 3) {
      newErrors.nomeResponsavel = "Nome deve ter pelo menos 3 caracteres";
    }

    if (!formData.telefoneResponsavel) {
      newErrors.telefoneResponsavel = "Telefone do responsável é obrigatório";
    } else if (
      !/^\(\d{2}\) \d{4,5}-\d{4}$/.test(formData.telefoneResponsavel)
    ) {
      newErrors.telefoneResponsavel =
        "Telefone deve estar no formato (XX) XXXXX-XXXX";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSaving(true);
    try {
      const response = await fetch("/api/loja", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        alert("Informações da loja salvas com sucesso!");
        router.push("/lojista");
      } else {
        alert(data.error || "Erro ao salvar informações");
      }
    } catch (error) {
      console.error("Erro ao salvar:", error);
      alert("Erro ao salvar informações da loja");
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveCadastro = async () => {
    if (
      !confirm(
        "Tem certeza que deseja remover o cadastro da loja? Esta ação não pode ser desfeita."
      )
    ) {
      return;
    }

    setSaving(true);
    try {
      const response = await fetch("/api/loja", {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        alert("Cadastro da loja removido com sucesso!");
        router.push("/lojista");
      } else {
        alert(data.error || "Erro ao remover cadastro");
      }
    } catch (error) {
      console.error("Erro ao remover cadastro:", error);
      alert("Erro ao remover cadastro da loja");
    } finally {
      setSaving(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Carregando...</p>
      </div>
    );
  }

  const estados = Object.keys(estadosCidades.states).sort();

  return (
    <div className="cadastro-loja">
      <div className="cadastro-container">
        <div className="cadastro-header">
          <h1>🏪 Cadastro da Loja</h1>
          <p>
            Complete as informações da sua loja para começar a usar a plataforma
          </p>
        </div>

        <form onSubmit={handleSubmit} className="cadastro-form">
          <div className="form-group">
            <label htmlFor="cnpj">CNPJ *</label>
            <input
              type="text"
              id="cnpj"
              value={formData.cnpj}
              onChange={(e) => handleInputChange("cnpj", e.target.value)}
              placeholder="XX.XXX.XXX/XXXX-XX"
              maxLength="18"
              className={errors.cnpj ? "error" : ""}
            />
            {errors.cnpj && (
              <span className="error-message">{errors.cnpj}</span>
            )}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="estado">Estado *</label>
              <select
                id="estado"
                value={formData.estado}
                onChange={(e) => handleInputChange("estado", e.target.value)}
                className={errors.estado ? "error" : ""}
              >
                <option value="">Selecione o estado</option>
                {estados.map((estado) => (
                  <option key={estado} value={estado}>
                    {estadosCidades.states[estado]}
                  </option>
                ))}
              </select>
              {errors.estado && (
                <span className="error-message">{errors.estado}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="cidade">Cidade *</label>
              <select
                id="cidade"
                value={formData.cidade}
                onChange={(e) => handleInputChange("cidade", e.target.value)}
                className={errors.cidade ? "error" : ""}
                disabled={!selectedEstado}
              >
                <option value="">
                  {selectedEstado
                    ? "Selecione a cidade"
                    : "Selecione o estado primeiro"}
                </option>
                {filteredCidades.map((cidade) => (
                  <option key={cidade} value={cidade}>
                    {cidade}
                  </option>
                ))}
              </select>
              {errors.cidade && (
                <span className="error-message">{errors.cidade}</span>
              )}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="nomeResponsavel">
              Nome Completo do Responsável *
            </label>
            <input
              type="text"
              id="nomeResponsavel"
              value={formData.nomeResponsavel}
              onChange={(e) =>
                handleInputChange("nomeResponsavel", e.target.value)
              }
              placeholder="Digite o nome completo do responsável"
              className={errors.nomeResponsavel ? "error" : ""}
            />
            {errors.nomeResponsavel && (
              <span className="error-message">{errors.nomeResponsavel}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="telefoneResponsavel">
              Telefone do Responsável *
            </label>
            <input
              type="text"
              id="telefoneResponsavel"
              value={formData.telefoneResponsavel}
              onChange={(e) =>
                handleInputChange("telefoneResponsavel", e.target.value)
              }
              placeholder="(XX) XXXXX-XXXX"
              maxLength="15"
              className={errors.telefoneResponsavel ? "error" : ""}
            />
            {errors.telefoneResponsavel && (
              <span className="error-message">
                {errors.telefoneResponsavel}
              </span>
            )}
          </div>

          <div className="form-actions">
            <button
              type="button"
              onClick={handleRemoveCadastro}
              className="btn-secondary"
              disabled={saving}
            >
              Remover cadastro
            </button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? "Salvando..." : lojaData ? "Atualizar" : "Salvar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
