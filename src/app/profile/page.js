"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import InputMask from "react-input-mask";

export default function Profile() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [formData, setFormData] = useState({
    fullName: "",
    birthDate: "",
    cpf: "",
    whatsapp: "",
    whatsappCountryCode: "55", // Padrão Brasil
    whatsappConsent: false,
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState([]);
  const [countries, setCountries] = useState([]);

  // Buscar lista de países
  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const res = await fetch("/api/countries");
        if (res.ok) {
          const data = await res.json();
          setCountries(data.countries);
        }
      } catch (error) {
        console.error("Erro ao buscar países:", error);
      }
    };
    fetchCountries();
  }, []);

  useEffect(() => {
    if (status === "loading") return;
    if (!session) router.push("/");

    // Buscar dados do perfil via API
    const fetchProfile = async () => {
      try {
        const res = await fetch("/api/profile");
        if (res.ok) {
          const data = await res.json();
          setFormData({
            fullName: data.user.fullName || "",
            birthDate: data.user.birthDate || "",
            cpf: data.user.cpf || "",
            whatsapp: data.user.whatsapp || "",
            whatsappCountryCode: data.user.whatsappCountryCode || "55",
            whatsappConsent: data.user.whatsappConsent || false,
          });
        } else {
          // Se não conseguir buscar, usar dados da sessão como fallback
          setFormData({
            fullName: "",
            birthDate: "",
            cpf: "",
            whatsapp: "",
            whatsappCountryCode: "55",
            whatsappConsent: false,
          });
        }
      } catch (error) {
        console.error("Erro ao buscar perfil:", error);
        // Fallback para dados da sessão
        setFormData({
          fullName: "",
          birthDate: "",
          cpf: "",
          whatsapp: "",
          whatsappConsent: false,
        });
      }
    };

    fetchProfile();
  }, [session, status, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors([]); // Limpar erros anteriores

    const res = await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });

    if (res.ok) {
      const data = await res.json();
      // Dados salvos com sucesso - redirecionar para página inicial
      router.push("/");
    } else {
      try {
        const errorData = await res.json();
        if (errorData.errors && Array.isArray(errorData.errors)) {
          setErrors(errorData.errors);
        } else {
          setErrors(["Erro ao salvar perfil. Tente novamente."]);
        }
      } catch {
        setErrors(["Erro ao salvar perfil. Tente novamente."]);
      }
    }
    setLoading(false);
  };

  const handleRemoveProfile = async () => {
    if (
      !confirm(
        "Tem certeza que deseja remover seu perfil? Esta ação não pode ser desfeita."
      )
    ) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/profile", {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        alert("Perfil removido com sucesso!");
        router.push("/");
      } else {
        alert(data.error || "Erro ao remover perfil");
      }
    } catch (error) {
      console.error("Erro ao remover perfil:", error);
      alert("Erro ao remover perfil");
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading") return <p>Carregando...</p>;

  return (
    <div
      style={{
        maxWidth: 1200,
        margin: "0 auto",
        padding: "24px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <h1>Complete seu Perfil</h1>

      <div
        style={{
          marginBottom: 20,
          padding: 12,
          backgroundColor: "#f8f9fa",
          borderRadius: 4,
        }}
      >
        <label
          style={{ display: "block", marginBottom: 8, fontWeight: "bold" }}
        >
          E-mail:
        </label>
        <input
          type="email"
          value={session?.user?.email || ""}
          readOnly
          style={{
            padding: 8,
            width: "100%",
            backgroundColor: "#e9ecef",
            border: "1px solid #ced4da",
            borderRadius: 4,
            color: "#6c757d",
          }}
        />
        <small style={{ color: "#6c757d", marginTop: 4, display: "block" }}>
          Este e-mail foi validado durante o login e não pode ser alterado.
        </small>
      </div>

      {errors.length > 0 && (
        <div
          style={{
            backgroundColor: "#f8d7da",
            color: "#721c24",
            padding: 12,
            borderRadius: 4,
            border: "1px solid #f5c6cb",
            marginBottom: 20,
          }}
        >
          <strong>Por favor, corrija os seguintes erros:</strong>
          <ul style={{ margin: "8px 0 0 20px", padding: 0 }}>
            {errors.map((error, index) => (
              <li key={`${error}-${index}`} style={{ marginBottom: 4 }}>
                {error}
              </li>
            ))}
          </ul>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        style={{ display: "flex", flexDirection: "column", gap: 15 }}
      >
        <label>
          Nome Completo:
          <input
            type="text"
            value={formData.fullName}
            onChange={(e) =>
              setFormData({ ...formData, fullName: e.target.value })
            }
            required
            style={{ padding: 8, width: "100%" }}
          />
        </label>
        <label>
          Data de Nascimento:
          <input
            type="date"
            value={formData.birthDate}
            onChange={(e) =>
              setFormData({ ...formData, birthDate: e.target.value })
            }
            required
            style={{ padding: 8, width: "100%" }}
          />
        </label>
        <label>
          CPF:
          <InputMask
            mask="999.999.999-99"
            value={formData.cpf}
            onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
            required
          >
            {(inputProps) => (
              <input
                {...inputProps}
                type="text"
                placeholder="000.000.000-00"
                style={{ padding: 8, width: "100%" }}
              />
            )}
          </InputMask>
        </label>
        <label>
          WhatsApp (opcional):
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <select
              value={formData.whatsappCountryCode}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  whatsappCountryCode: e.target.value,
                })
              }
              style={{ padding: 8, minWidth: 120 }}
            >
              {countries.map((country, index) => (
                <option key={`${country.ddi}-${index}`} value={country.ddi}>
                  +{country.ddi} {country.pais}
                </option>
              ))}
            </select>
            <InputMask
              mask={
                formData.whatsappCountryCode === "55"
                  ? "(99) 99999-9999"
                  : "999999999999999"
              }
              value={formData.whatsapp}
              onChange={(e) =>
                setFormData({ ...formData, whatsapp: e.target.value })
              }
            >
              {(inputProps) => (
                <input
                  {...inputProps}
                  type="tel"
                  placeholder={
                    formData.whatsappCountryCode === "55"
                      ? "(11) 99999-9999"
                      : "Número do telefone"
                  }
                  style={{ padding: 8, flex: 1 }}
                />
              )}
            </InputMask>
          </div>
        </label>
        <label style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <input
            type="checkbox"
            checked={formData.whatsappConsent}
            onChange={(e) =>
              setFormData({ ...formData, whatsappConsent: e.target.checked })
            }
          />
          Concordo em receber comunicações via WhatsApp
        </label>
        <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: 12,
              backgroundColor: loading ? "#ccc" : "#007bff",
              color: "white",
              border: "none",
              borderRadius: 4,
              cursor: loading ? "not-allowed" : "pointer",
              flex: 1,
            }}
          >
            {loading ? "Salvando..." : "Salvar Perfil"}
          </button>
          <button
            type="button"
            onClick={handleRemoveProfile}
            disabled={loading}
            style={{
              padding: 12,
              backgroundColor: loading ? "#ccc" : "#dc3545",
              color: "white",
              border: "none",
              borderRadius: 4,
              cursor: loading ? "not-allowed" : "pointer",
              flex: 1,
            }}
          >
            {loading ? "Processando..." : "Remover cadastro"}
          </button>
        </div>
      </form>
    </div>
  );
}
