"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/Modal";
import { AlertModal } from "@/components/AlertModal";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  BarChart3,
  DollarSign,
  Users,
  Tag,
  Pencil,
  Trash2,
  UserPlus,
  Download,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

// Helper to format number as BRL currency
const formatBRL = (value: number): string => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
};

// Helper to parse BRL currency string to number
const parseBRL = (value: string): number => {
  const cleaned = value.replace(/[^\d,]/g, "").replace(",", ".");
  return parseFloat(cleaned) || 0;
};

interface MetricData {
  totalVehicles: number;
  totalCars: number;
  totalMotos: number;
  totalRevenue: number;
  monthlyData: {
    month: string;
    cars: number;
    motorcycles: number;
    revenue: number;
  }[];
}

interface Price {
  id: string;
  type: string;
  pricePerMin: number;
}

interface Promotion {
  id: string;
  name: string;
  discount: number;
  vehicleType: string | null;
  startDate: string;
  endDate: string;
  active: boolean;
}

interface User {
  id: string;
  email: string;
  name: string | null;
  role: string;
  createdAt: string;
}

const COLORS = ["#FEE81F", "#4CF412", "#66FF31", "#3C5934"];

export default function AdminPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [metrics, setMetrics] = useState<MetricData | null>(null);
  const [prices, setPrices] = useState<Price[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [period, setPeriod] = useState("6months");
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "metrics");
  const [priceModal, setPriceModal] = useState(false);
  const [promoModal, setPromoModal] = useState(false);
  const [userModal, setUserModal] = useState(false);
  const [editingPrice, setEditingPrice] = useState<Price | null>(null);
  const [priceInputValue, setPriceInputValue] = useState("");
  const [promoForm, setPromoForm] = useState({
    name: "",
    discount: 0,
    vehicleType: "TODOS",
    startDate: "",
    endDate: "",
  });
  const [userForm, setUserForm] = useState({
    email: "",
    password: "",
    name: "",
    role: "USER",
  });
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editUserModal, setEditUserModal] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Get current user ID
  useEffect(() => {
    const getCurrentUser = async () => {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          setCurrentUserId(data.user?.id || null);
        }
      } catch (error) {
        console.error("Error fetching current user:", error);
      }
    };
    getCurrentUser();
  }, []);

  // Alert modal states
  const [alertModal, setAlertModal] = useState(false);
  const [alertType, setAlertType] = useState<"success" | "error" | "confirm" | "warning">("success");
  const [alertTitle, setAlertTitle] = useState("");
  const [alertMessage, setAlertMessage] = useState("");
  const [alertCallback, setAlertCallback] = useState<(() => void) | null>(null);
  const [alertLoading, setAlertLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, [period]);

  const fetchData = async () => {
    try {
      const [metricsRes, pricesRes, promosRes, usersRes] = await Promise.all([
        fetch(`/api/admin/metrics?period=${period}`),
        fetch("/api/admin/prices"),
        fetch("/api/admin/promotions"),
        fetch("/api/admin/users"),
      ]);

      const metricsData = await metricsRes.json();
      const pricesData = await pricesRes.json();
      const promosData = await promosRes.json();
      const usersData = await usersRes.json();

      setMetrics(metricsData);
      setPrices(pricesData);
      setPromotions(promosData);
      setUsers(usersData);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to show alert modals
  const showAlert = (
    type: "success" | "error" | "confirm" | "warning",
    title: string,
    message: string,
    onConfirm?: () => void
  ) => {
    setAlertType(type);
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertCallback(() => onConfirm || null);
    setAlertModal(true);
  };

  const handleSavePrice = async (type: string, pricePerMin: number) => {
    try {
      const res = await fetch("/api/admin/prices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, pricePerMin }),
      });

      if (res.ok) {
        fetchData();
        setPriceModal(false);
        setEditingPrice(null);
        setPriceInputValue("");
        showAlert("success", "Sucesso!", "Preço atualizado com sucesso.");
      } else {
        const error = await res.json();
        showAlert("error", "Erro!", error.error || "Erro ao atualizar preço.");
      }
    } catch {
      showAlert("error", "Erro!", "Erro ao conectar com o servidor.");
    }
  };

  const handleSavePromotion = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/admin/promotions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...promoForm,
          discount: Number(promoForm.discount),
        }),
      });

      if (res.ok) {
        fetchData();
        setPromoModal(false);
        setPromoForm({
          name: "",
          discount: 0,
          vehicleType: "TODOS",
          startDate: "",
          endDate: "",
        });
        showAlert("success", "Sucesso!", "Promoção criada com sucesso.");
      } else {
        const error = await res.json();
        showAlert("error", "Erro!", error.error || "Erro ao criar promoção.");
      }
    } catch {
      showAlert("error", "Erro!", "Erro ao conectar com o servidor.");
    }
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userForm),
      });

      if (res.ok) {
        fetchData();
        setUserModal(false);
        setUserForm({ email: "", password: "", name: "", role: "USER" });
        showAlert("success", "Sucesso!", "Usuário criado com sucesso.");
      } else {
        const error = await res.json();
        showAlert("error", "Erro!", error.error || "Erro ao criar usuário.");
      }
    } catch {
      showAlert("error", "Erro!", "Erro ao conectar com o servidor.");
    }
  };

  const handleDeleteUser = async (id: string) => {
    showAlert(
      "confirm",
      "Confirmar Exclusão",
      "Tem certeza que deseja excluir este usuário? Esta ação não pode ser desfeita.",
      async () => {
        try {
          const res = await fetch(`/api/admin/users/${id}`, {
            method: "DELETE",
          });

          if (res.ok) {
            fetchData();
            showAlert("success", "Sucesso!", "Usuário excluído com sucesso.");
          } else {
            const error = await res.json();
            showAlert("error", "Erro!", error.error || "Erro ao excluir usuário.");
          }
        } catch {
          showAlert("error", "Erro!", "Erro ao conectar com o servidor.");
        }
      }
    );
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    // Prevent self-editing
    if (editingUser.id === currentUserId) {
      showAlert("error", "Erro!", "Você não pode editar seu próprio usuário.");
      return;
    }

    try {
      const res = await fetch(`/api/admin/users/${editingUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userForm),
      });

      if (res.ok) {
        fetchData();
        setEditUserModal(false);
        setEditingUser(null);
        setUserForm({ email: "", password: "", name: "", role: "USER" });
        showAlert("success", "Sucesso!", "Usuário atualizado com sucesso.");
      } else {
        const error = await res.json();
        showAlert("error", "Erro!", error.error || "Erro ao atualizar usuário.");
      }
    } catch {
      showAlert("error", "Erro!", "Erro ao conectar com o servidor.");
    }
  };

  const handleTogglePromotion = async (id: string, active: boolean) => {
    try {
      const res = await fetch("/api/admin/promotions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, active }),
      });

      if (res.ok) {
        fetchData();
        showAlert(
          "success",
          "Sucesso!",
          `Promoção ${active ? "ativada" : "desativada"} com sucesso.`
        );
      } else {
        const error = await res.json();
        showAlert("error", "Erro!", error.error || "Erro ao alterar promoção.");
      }
    } catch {
      showAlert("error", "Erro!", "Erro ao conectar com o servidor.");
    }
  };

  const downloadReport = async (format: string) => {
    window.open(`/api/reports?period=${period}&format=${format}`, "_blank");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <StatsCards
        totalVehicles={metrics?.totalVehicles || 0}
        totalCars={metrics?.totalCars || 0}
        totalMotos={metrics?.totalMotos || 0}
        revenue={metrics?.totalRevenue || 0}
      />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-white">
            {activeTab === "metrics" && "Métricas"}
            {activeTab === "prices" && "Preços"}
            {activeTab === "promotions" && "Promoções"}
            {activeTab === "users" && "Usuários"}
          </h2>
          <p className="text-gray-400 mt-1 text-sm md:text-base">
            {activeTab === "metrics" && "Visão geral do estacionamento"}
            {activeTab === "prices" && "Gerenciar preços por tipo de veículo"}
            {activeTab === "promotions" && "Gerenciar promoções ativas"}
            {activeTab === "users" && "Gerenciar usuários do sistema"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {activeTab === "metrics" && (
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="px-3 py-2 bg-background-light border border-border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary text-sm"
            >
              <option value="month">Este mês</option>
              <option value="6months">Últimos 6 meses</option>
              <option value="year">Este ano</option>
            </select>
          )}
          {activeTab === "promotions" && (
            <Button onClick={() => setPromoModal(true)} className="w-full sm:w-auto">
              + Nova Promoção
            </Button>
          )}
          {activeTab === "users" && (
            <Button onClick={() => setUserModal(true)} className="w-full sm:w-auto">
              + Novo Usuário
            </Button>
          )}
        </div>
      </div>

      {/* Tab Navigation - Scrollable on mobile */}
      <div className="flex gap-2 border-b border-border overflow-x-auto pb-0 scrollbar-hide">
        <button
          onClick={() => setActiveTab("metrics")}
          className={`px-3 py-2 transition-colors whitespace-nowrap ${
            activeTab === "metrics"
              ? "border-b-2 border-primary text-primary"
              : "text-gray-400 hover:text-white"
          }`}
        >
          Métricas
        </button>
        <button
          onClick={() => setActiveTab("prices")}
          className={`px-3 py-2 transition-colors whitespace-nowrap ${
            activeTab === "prices"
              ? "border-b-2 border-primary text-primary"
              : "text-gray-400 hover:text-white"
          }`}
        >
          Preços
        </button>
        <button
          onClick={() => setActiveTab("promotions")}
          className={`px-3 py-2 transition-colors whitespace-nowrap ${
            activeTab === "promotions"
              ? "border-b-2 border-primary text-primary"
              : "text-gray-400 hover:text-white"
          }`}
        >
          Promoções
        </button>
        <button
          onClick={() => setActiveTab("users")}
          className={`px-3 py-2 transition-colors whitespace-nowrap ${
            activeTab === "users"
              ? "border-b-2 border-primary text-primary"
              : "text-gray-400 hover:text-white"
          }`}
        >
          Usuários
        </button>
      </div>

      {/* Metrics Tab */}
      {activeTab === "metrics" && metrics && (
        <>
          <div className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-2">
            <Card className="bg-background-light border-border">
              <CardHeader>
                <CardTitle className="text-white text-lg md:text-xl">
                  Veículos por Mês
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={metrics.monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#3C5934" />
                    <XAxis dataKey="month" stroke="#CCCCCC" />
                    <YAxis stroke="#CCCCCC" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1B2818",
                        border: "1px solid #4CF412",
                      }}
                    />
                    <Legend />
                    <Bar
                      dataKey="cars"
                      fill="#FEE81F"
                      name="Carros"
                    />
                    <Bar
                      dataKey="motorcycles"
                      fill="#4CF412"
                      name="Motos"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="bg-background-light border-border">
              <CardHeader>
                <CardTitle className="text-white text-lg md:text-xl">
                  Distribuição de Veículos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={[
                        {
                          name: "Carros",
                          value: metrics.totalCars,
                        },
                        {
                          name: "Motos",
                          value: metrics.totalMotos,
                        },
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => `${entry.name}: ${entry.value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {COLORS.map((color, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={color}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1B2818",
                        border: "1px solid #4CF412",
                      }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-background-light border-border">
            <CardHeader>
              <CardTitle className="text-white text-lg md:text-xl">
                Faturamento Mensal
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={metrics.monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#3C5934" />
                  <XAxis dataKey="month" stroke="#CCCCCC" />
                  <YAxis stroke="#CCCCCC" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1B2818",
                      border: "1px solid #4CF412",
                    }}
                    formatter={(value: number) =>
                      `R$ ${value.toFixed(2)}`
                    }
                  />
                  <Legend />
                  <Bar
                    dataKey="revenue"
                    fill="#66FF31"
                    name="Faturamento"
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="bg-background-light border-border">
            <CardHeader>
              <CardTitle className="text-white">
                Faturamento Mensal
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={metrics.monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#3C5934" />
                  <XAxis dataKey="month" stroke="#CCCCCC" />
                  <YAxis stroke="#CCCCCC" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1B2818",
                      border: "1px solid #4CF412",
                    }}
                    formatter={(value: number) =>
                      `R$ ${value.toFixed(2)}`
                    }
                  />
                  <Bar
                    dataKey="revenue"
                    fill="#66FF31"
                    name="Faturamento"
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="bg-background-light border-border">
            <CardHeader>
              <CardTitle className="text-white text-lg md:text-xl">
                Dados Mensais
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto -mx-4 px-4">
                <table className="w-full min-w-[500px] text-left">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="p-2 md:p-3 text-gray-300 text-sm md:text-base">Mês</th>
                      <th className="p-2 md:p-3 text-gray-300 text-sm md:text-base">Carros</th>
                      <th className="p-2 md:p-3 text-gray-300 text-sm md:text-base">Motos</th>
                      <th className="p-2 md:p-3 text-gray-300 text-sm md:text-base">Faturamento</th>
                    </tr>
                  </thead>
                  <tbody>
                    {metrics.monthlyData.map((item, i) => (
                      <tr
                        key={i}
                        className="border-b border-border/50 hover:bg-background/50"
                      >
                        <td className="p-3 text-white">
                          {item.month}
                        </td>
                        <td className="p-3 text-gray-300">
                          {item.cars}
                        </td>
                        <td className="p-3 text-gray-300">
                          {item.motorcycles}
                        </td>
                        <td className="p-3 text-primary">
                          R$ {item.revenue.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Prices Tab */}
      {activeTab === "prices" && (
        <Card className="bg-background-light border-border">
          <CardHeader>
            <CardTitle className="text-white">
              Preços por Minuto
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 md:space-y-4">
              {prices.map((price) => (
                <div
                  key={price.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-3 md:p-4 bg-background rounded-lg gap-3 sm:gap-0"
                >
                  <div>
                    <p className="text-white font-semibold text-sm md:text-base">
                      {price.type === "CARRO" ? "Carro" : "Moto"}
                    </p>
                    <p className="text-xs md:text-sm text-gray-400">
                      R$ {(price.pricePerMin * 60).toFixed(2)} por hora
                    </p>
                  </div>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setEditingPrice(price);
                      setPriceInputValue(formatBRL(price.pricePerMin * 60));
                      setPriceModal(true);
                    }}
                    className="w-full sm:w-auto"
                  >
                    Editar
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Promotions Tab */}
      {activeTab === "promotions" && (
        <Card className="bg-background-light border-border">
          <CardHeader>
            <CardTitle className="text-white">
              Promoções Ativas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 md:space-y-4">
              {promotions.length === 0 ? (
                <p className="text-gray-400 text-center py-8">
                  Nenhuma promoção cadastrada
                </p>
              ) : (
                promotions.map((promo) => (
                  <div
                    key={promo.id}
                    className={`flex flex-col sm:flex-row sm:items-center justify-between p-3 md:p-4 bg-background rounded-lg gap-3 sm:gap-0 ${
                      promo.active ? "" : "opacity-50"
                    }`}
                  >
                    <div>
                      <p className="text-white font-semibold text-sm md:text-base">
                        {promo.name}
                      </p>
                      <p className="text-xs md:text-sm text-gray-400">
                        {promo.discount}% desconto
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(promo.startDate).toLocaleDateString("pt-BR")} -{" "}
                        {new Date(promo.endDate).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={promo.active}
                        onChange={(e) =>
                          handleTogglePromotion(promo.id, e.target.checked)
                        }
                        className="w-4 h-4 md:w-5 md:h-5"
                      />
                      <span className="text-gray-300 text-sm md:text-base">
                        {promo.active ? "Ativa" : "Inativa"}
                      </span>
                    </label>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Users Tab - Only for ADMIN */}
      {activeTab === "users" && (
        <Card className="bg-background-light border-border">
          <CardHeader>
            <CardTitle className="text-white text-lg md:text-xl">
              Usuários do Sistema
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 md:space-y-4">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-3 md:p-4 bg-background rounded-lg gap-3 sm:gap-0"
                >
                  <div>
                    <p className="text-white font-semibold text-sm md:text-base">
                      {user.name || user.email}
                    </p>
                    <p className="text-xs md:text-sm text-gray-400">
                      {user.email}
                    </p>
                    <span
                      className={`inline-block text-xs px-2 py-1 rounded mt-1 ${
                        user.role === "ADMIN"
                          ? "bg-primary/20 text-primary"
                          : "bg-gray-500/20 text-gray-300"
                      }`}
                    >
                      {user.role}
                    </span>
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto">
                    {currentUserId !== user.id ? (
                      <>
                        <Button
                          variant="secondary"
                          onClick={() => {
                            setEditingUser(user);
                            setUserForm({
                              email: user.email,
                              password: "",
                              name: user.name || "",
                              role: user.role,
                            });
                            setEditUserModal(true);
                          }}
                          className="flex-1 sm:flex-none"
                        >
                          Editar
                        </Button>
                        <Button
                          variant="danger"
                          onClick={() => handleDeleteUser(user.id)}
                          className="flex-1 sm:flex-none"
                        >
                          Excluir
                        </Button>
                      </>
                    ) : (
                      <span className="text-gray-500 text-sm italic py-2">
                        Você não pode editar seu próprio usuário
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Reports Section */}
      <div className="flex gap-4">
        <Button onClick={() => downloadReport("xlsx")}>
          <Download size={20} className="mr-2" />
          Exportar XLSX
        </Button>
        <Button onClick={() => downloadReport("json")} variant="secondary">
          <Download size={20} className="mr-2" />
          Exportar JSON
        </Button>
      </div>

      {/* Price Modal */}
      <Modal
        isOpen={priceModal}
        onClose={() => {
          setPriceModal(false);
          setEditingPrice(null);
          setPriceInputValue("");
        }}
        title="Editar Preço"
      >
        {editingPrice && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const pricePerHour = parseBRL(priceInputValue);
              const pricePerMin = pricePerHour / 60;
              handleSavePrice(editingPrice.type, pricePerMin);
            }}
            className="space-y-4"
          >
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Tipo de veículo
              </label>
              <div className="px-4 py-2 bg-background border border-border rounded-lg text-white">
                {editingPrice.type === "CARRO" ? "🚗 Carro" : "🏍️ Moto"}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Preço por hora (R$)
              </label>
              <input
                type="text"
                inputMode="decimal"
                value={priceInputValue}
                onChange={(e) => {
                  const raw = e.target.value.replace(/[^\d]/g, "");
                  if (raw === "") {
                    setPriceInputValue("");
                    return;
                  }
                  const number = Number(raw) / 100;
                  setPriceInputValue(formatBRL(number));
                }}
                onKeyDown={(e) => {
                  if (e.key === " " || e.key === "Enter") {
                    e.preventDefault();
                  }
                }}
                placeholder="R$ 0,00"
                required
                className="w-full px-4 py-2 bg-background border border-border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <p className="text-xs text-gray-500 mt-1">
                Digite apenas números. Ex: 1000 = R$ 10,00
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setPriceModal(false);
                  setEditingPrice(null);
                  setPriceInputValue("");
                }}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button type="submit" className="flex-1">
                Salvar
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Promotion Modal */}
      <Modal
        isOpen={promoModal}
        onClose={() => setPromoModal(false)}
        title="Nova Promoção"
      >
        <form onSubmit={handleSavePromotion} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Nome da promoção
            </label>
            <input
              type="text"
              value={promoForm.name}
              onChange={(e) => setPromoForm({ ...promoForm, name: e.target.value })}
              placeholder="Ex: Promoção Feriadão"
              required
              className="w-full px-4 py-2 bg-background border border-border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Desconto (%)
            </label>
            <input
              type="number"
              value={promoForm.discount}
              onChange={(e) =>
                setPromoForm({ ...promoForm, discount: Number(e.target.value) })
              }
              min="0"
              max="100"
              required
              className="w-full px-4 py-2 bg-background border border-border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Tipo de veículo
            </label>
            <select
              value={promoForm.vehicleType}
              onChange={(e) =>
                setPromoForm({ ...promoForm, vehicleType: e.target.value })
              }
              className="w-full px-4 py-2 bg-background border border-border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="TODOS">Todos</option>
              <option value="CARRO">Carro</option>
              <option value="MOTO">Moto</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Data início
            </label>
            <input
              type="date"
              value={promoForm.startDate}
              onChange={(e) =>
                setPromoForm({ ...promoForm, startDate: e.target.value })
              }
              required
              className="w-full px-4 py-2 bg-background border border-border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Data fim
            </label>
            <input
              type="date"
              value={promoForm.endDate}
              onChange={(e) =>
                setPromoForm({ ...promoForm, endDate: e.target.value })
              }
              required
              className="w-full px-4 py-2 bg-background border border-border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="flex gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setPromoModal(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button type="submit" className="flex-1">
              Salvar
            </Button>
          </div>
        </form>
      </Modal>

      {/* User Modal */}
      <Modal
        isOpen={userModal}
        onClose={() => {
          setUserModal(false);
          setUserForm({ email: "", password: "", name: "", role: "USER" });
        }}
        title="Novo Usuário"
      >
        <form onSubmit={handleSaveUser} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Email
            </label>
            <input
              type="email"
              value={userForm.email}
              onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
              placeholder="usuario@exemplo.com"
              required
              className="w-full px-4 py-2 bg-background border border-border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Senha
            </label>
            <input
              type="password"
              value={userForm.password}
              onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
              placeholder="••••••••"
              minLength={6}
              required
              className="w-full px-4 py-2 bg-background border border-border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Nome
            </label>
            <input
              type="text"
              value={userForm.name}
              onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
              placeholder="Nome do usuário"
              className="w-full px-4 py-2 bg-background border border-border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Função
            </label>
            <select
              value={userForm.role}
              onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
              className="w-full px-4 py-2 bg-background border border-border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="USER">Usuário (USER)</option>
              <option value="ADMIN">Administrador (ADMIN)</option>
            </select>
          </div>

          <div className="flex gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setUserModal(false);
                setUserForm({ email: "", password: "", name: "", role: "USER" });
              }}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button type="submit" className="flex-1">
              Criar
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit User Modal */}
      <Modal
        isOpen={editUserModal}
        onClose={() => {
          setEditUserModal(false);
          setEditingUser(null);
          setUserForm({ email: "", password: "", name: "", role: "USER" });
        }}
        title="Editar Usuário"
      >
        {editingUser && (
          <form onSubmit={handleEditUser} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Email
              </label>
              <input
                type="email"
                value={userForm.email}
                onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                placeholder="usuario@exemplo.com"
                required
                className="w-full px-4 py-2 bg-background border border-border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Nova Senha (deixe em branco para manter)
              </label>
              <input
                type="password"
                value={userForm.password}
                onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                placeholder="••••••••"
                minLength={6}
                className="w-full px-4 py-2 bg-background border border-border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Nome
              </label>
              <input
                type="text"
                value={userForm.name}
                onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                placeholder="Nome do usuário"
                className="w-full px-4 py-2 bg-background border border-border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Função
              </label>
              <select
                value={userForm.role}
                onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                className="w-full px-4 py-2 bg-background border border-border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="USER">Usuário (USER)</option>
                <option value="ADMIN">Administrador (ADMIN)</option>
              </select>
            </div>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setEditUserModal(false);
                  setEditingUser(null);
                  setUserForm({ email: "", password: "", name: "", role: "USER" });
                }}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button type="submit" className="flex-1">
                Salvar
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Alert Modal */}
      <AlertModal
        isOpen={alertModal}
        onClose={() => {
          setAlertModal(false);
          setAlertLoading(false);
        }}
        onConfirm={async () => {
          if (alertCallback) {
            setAlertLoading(true);
            await alertCallback();
            setAlertLoading(false);
          }
          setAlertModal(false);
        }}
        type={alertType}
        title={alertTitle}
        message={alertMessage}
        isLoading={alertLoading}
      />
    </div>
  );
}
