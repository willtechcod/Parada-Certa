// Simplified admin page for mobile - only essential info + generate report
"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/Modal";
import { AlertModal } from "@/components/AlertModal";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { z } from "zod";
import { promotionSchema, editUserSchema } from "@/lib/validations";
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
  
  // Get active tab directly from URL - reacts to changes
  const activeTab = searchParams.get("tab") || "metrics";
  
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
  
  // Alert modal states
  const [alertModal, setAlertModal] = useState(false);
  const [alertType, setAlertType] = useState<"success" | "error" | "confirm" | "warning">("success");
  const [alertTitle, setAlertTitle] = useState("");
  const [alertMessage, setAlertMessage] = useState("");
  const [alertCallback, setAlertCallback] = useState<(() => void) | null>(null);
  const [alertLoading, setAlertLoading] = useState(false);

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

  // Fetch data when tab or period changes
  useEffect(() => {
    fetchData();
  }, [period, activeTab]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch based on active tab
      if (activeTab === "metrics") {
        const res = await fetch(`/api/admin/metrics?period=${period}`);
        const data = await res.json();
        setMetrics(data);
      }
      
      if (activeTab === "prices" || !activeTab) {
        const res = await fetch("/api/admin/prices");
        const data = await res.json();
        setPrices(data);
      }
      
      if (activeTab === "promotions") {
        const res = await fetch("/api/admin/promotions");
        const data = await res.json();
        setPromotions(data);
      }
      
      if (activeTab === "users") {
        const res = await fetch("/api/admin/users");
        const data = await res.json();
        setUsers(data);
      }
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
        showAlert("success", "Sucesso", "Preço atualizado com sucesso!");
      }
    } catch (error) {
      showAlert("error", "Erro", "Falha ao salvar preço");
    }
  };

  const handleDeletePromotion = async (id: string) => {
    showAlert(
      "confirm",
      "Confirmar exclusão",
      "Tem certeza que deseja excluir esta promoção?",
      async () => {
        setAlertLoading(true);
        try {
          const res = await fetch(`/api/admin/promotions/${id}`, {
            method: "DELETE",
          });

          if (res.ok) {
            fetchData();
            showAlert("success", "Sucesso", "Promoção excluída com sucesso!");
          }
        } catch (error) {
          showAlert("error", "Erro", "Falha ao excluir promoção");
        } finally {
          setAlertLoading(false);
        }
      }
    );
  };

  const handleSaveUser = async () => {
    try {
      const validatedData = editUserSchema.parse(userForm);
      
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validatedData),
      });

      if (res.ok) {
        fetchData();
        setUserModal(false);
        setUserForm({ email: "", password: "", name: "", role: "USER" });
        showAlert("success", "Sucesso", "Usuário criado com sucesso!");
      } else {
        const data = await res.json();
        showAlert("error", "Erro", data.error || "Falha ao criar usuário");
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const firstError = error.issues?.[0];
        showAlert("error", "Erro", firstError?.message || "Dados inválidos");
      }
    }
  };

  const handleEditUser = async () => {
    if (!editingUser) return;

    try {
      const validatedData = editUserSchema.parse(userForm);
      
      const res = await fetch(`/api/admin/users/${editingUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validatedData),
      });

      if (res.ok) {
        fetchData();
        setEditUserModal(false);
        setEditingUser(null);
        setUserForm({ email: "", password: "", name: "", role: "USER" });
        showAlert("success", "Sucesso", "Usuário atualizado com sucesso!");
      } else {
        const data = await res.json();
        showAlert("error", "Erro", data.error || "Falha ao atualizar usuário");
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const firstError = error.issues?.[0];
        showAlert("error", "Erro", firstError?.message || "Dados inválidos");
      }
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (id === currentUserId) {
      showAlert("error", "Erro", "Você não pode excluir sua própria conta");
      return;
    }

    showAlert(
      "confirm",
      "Confirmar exclusão",
      "Tem certeza que deseja excluir este usuário?",
      async () => {
        setAlertLoading(true);
        try {
          const res = await fetch(`/api/admin/users/${id}`, {
            method: "DELETE",
          });

          if (res.ok) {
            fetchData();
            showAlert("success", "Sucesso", "Usuário excluído com sucesso!");
          }
        } catch (error) {
          showAlert("error", "Erro", "Falha ao excluir usuário");
        } finally {
          setAlertLoading(false);
        }
      }
    );
  };

  const handleGenerateReport = async () => {
    try {
      showAlert("success", "Relatório", "Gerando relatório...");
      const res = await fetch(`/api/reports?period=${period}&format=xlsx`);
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `relatorio-${period}.xlsx`;
        a.click();
        showAlert("success", "Sucesso", "Relatório baixado com sucesso!");
      }
    } catch (error) {
      showAlert("error", "Erro", "Falha ao gerar relatório");
    }
  };

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Stats Cards - Always visible */}
      <StatsCards
        totalVehicles={metrics?.totalVehicles || 0}
        totalCars={metrics?.totalCars || 0}
        totalMotos={metrics?.totalMotos || 0}
        revenue={metrics?.totalRevenue || 0}
      />

      {/* Tab Navigation - Scrollable on mobile */}
      <div className="flex gap-2 border-b border-border overflow-x-auto pb-0 scrollbar-hide">
        <button
          onClick={() => {
            router.push("/admin?tab=metrics");
          }}
          className={`px-3 py-2 transition-colors whitespace-nowrap ${
            activeTab === "metrics"
              ? "border-b-2 border-primary text-primary"
              : "text-gray-400 hover:text-white"
          }`}
        >
          Métricas
        </button>
        <button
          onClick={() => {
            router.push("/admin?tab=prices");
          }}
          className={`px-3 py-2 transition-colors whitespace-nowrap ${
            activeTab === "prices"
              ? "border-b-2 border-primary text-primary"
              : "text-gray-400 hover:text-white"
          }`}
        >
          Preços
        </button>
        <button
          onClick={() => {
            router.push("/admin?tab=promotions");
          }}
          className={`px-3 py-2 transition-colors whitespace-nowrap ${
            activeTab === "promotions"
              ? "border-b-2 border-primary text-primary"
              : "text-gray-400 hover:text-white"
          }`}
        >
          Promoções
        </button>
        <button
          onClick={() => {
            router.push("/admin?tab=users");
          }}
          className={`px-3 py-2 transition-colors whitespace-nowrap ${
            activeTab === "users"
              ? "border-b-2 border-primary text-primary"
              : "text-gray-400 hover:text-white"
          }`}
        >
          Usuários
        </button>
      </div>

      {/* Metrics Tab - Simplified for mobile */}
      {activeTab === "metrics" && metrics && (
        <div className="space-y-4">
          {/* Period Selector */}
          <div className="flex items-center gap-2">
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="bg-background-light border border-border text-white rounded-lg px-3 py-2 text-sm"
            >
              <option value="1month">1 mês</option>
              <option value="3months">3 meses</option>
              <option value="6months">6 meses</option>
              <option value="1year">1 ano</option>
            </select>
            
            <Button onClick={handleGenerateReport} size="sm" className="ml-auto">
              <Download size={16} className="mr-2" />
              <span className="hidden sm:inline">Gerar Relatório</span>
            </Button>
          </div>

          {/* Charts - Hidden on mobile, visible on desktop */}
          <div className="hidden md:grid gap-4 md:grid-cols-2">
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
                        { name: "Carros", value: metrics.totalCars },
                        { name: "Motos", value: metrics.totalMotos },
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {[
                        { name: "Carros", value: metrics.totalCars },
                        { name: "Motos", value: metrics.totalMotos },
                      ].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => `R$ ${value.toFixed(2)}`}
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

          {/* Mobile: Simple summary instead of charts */}
          <div className="md:hidden space-y-4">
            <Card className="bg-background-light border-border">
              <CardHeader>
                <CardTitle className="text-white text-lg">
                  Resumo
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-400">Total de Veículos:</span>
                  <span className="text-white font-bold">{metrics.totalVehicles}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Carros:</span>
                  <span className="text-white font-bold">{metrics.totalCars}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Motos:</span>
                  <span className="text-white font-bold">{metrics.totalMotos}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Receita Total:</span>
                  <span className="text-primary font-bold">{formatBRL(metrics.totalRevenue)}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Prices Tab */}
      {activeTab === "prices" && (
        <div className="space-y-4">
          <div className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-2">
            {prices.map((price) => (
              <Card key={price.id} className="bg-background-light border-border">
                <CardHeader>
                  <CardTitle className="text-white text-lg">
                    {price.type === "CARRO" ? "Carro" : "Moto"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Preço por minuto:</span>
                      <span className="text-white">{formatBRL(price.pricePerMin)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Preço por hora:</span>
                      <span className="text-primary font-bold">
                        {formatBRL(price.pricePerMin * 60)}
                      </span>
                    </div>
                    <Button
                      onClick={() => {
                        setEditingPrice(price);
                        setPriceInputValue((price.pricePerMin * 60).toFixed(2));
                        setPriceModal(true);
                      }}
                      variant="secondary"
                      className="w-full mt-2"
                    >
                      <Pencil size={16} className="mr-2" />
                      Editar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Promotions Tab */}
      {activeTab === "promotions" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-white">Promoções Ativas</h3>
            <Button onClick={() => setPromoModal(true)}>
              + Nova Promoção
            </Button>
          </div>

          {promotions.length === 0 ? (
            <p className="text-gray-400 text-center py-8">Nenhuma promoção cadastrada</p>
          ) : (
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {promotions.map((promo) => (
                <Card key={promo.id} className="bg-background-light border-border">
                  <CardHeader>
                    <CardTitle className="text-white text-lg">{promo.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Desconto:</span>
                        <span className="text-primary font-bold">{promo.discount}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Tipo:</span>
                        <span className="text-white">
                          {promo.vehicleType || "Todos"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Status:</span>
                        <span className={promo.active ? "text-green-400" : "text-red-400"}>
                          {promo.active ? "Ativa" : "Inativa"}
                        </span>
                      </div>
                      <div className="flex gap-2 mt-2">
                        <Button
                          onClick={() => handleDeletePromotion(promo.id)}
                          variant="danger"
                          size="sm"
                          className="flex-1"
                        >
                          <Trash2 size={16} className="mr-1" />
                          Excluir
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Users Tab */}
      {activeTab === "users" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-white">Usuários do Sistema</h3>
            <Button onClick={() => setUserModal(true)}>
              <UserPlus size={16} className="mr-2" />
              Novo Usuário
            </Button>
          </div>

          {users.length === 0 ? (
            <p className="text-gray-400 text-center py-8">Nenhum usuário cadastrado</p>
          ) : (
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {users.map((user) => (
                <Card key={user.id} className="bg-background-light border-border">
                  <CardHeader>
                    <CardTitle className="text-white text-lg">
                      {user.name || user.email}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Email:</span>
                        <span className="text-white">{user.email}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Role:</span>
                        <span className="text-primary font-bold">{user.role}</span>
                      </div>
                      {user.id !== currentUserId && (
                        <div className="flex gap-2 mt-2">
                          <Button
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
                            variant="secondary"
                            size="sm"
                            className="flex-1"
                          >
                            <Pencil size={16} className="mr-1" />
                            Editar
                          </Button>
                          <Button
                            onClick={() => handleDeleteUser(user.id)}
                            variant="danger"
                            size="sm"
                            className="flex-1"
                          >
                            <Trash2 size={16} className="mr-1" />
                            Excluir
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Price Modal */}
      <Modal
        isOpen={priceModal}
        onClose={() => {
          setPriceModal(false);
          setEditingPrice(null);
          setPriceInputValue("");
        }}
        title={editingPrice ? "Editar Preço" : "Novo Preço"}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Tipo de Veículo
            </label>
            <select
              value={editingPrice?.type || "CARRO"}
              onChange={(e) =>
                setEditingPrice(
                  editingPrice
                    ? { ...editingPrice, type: e.target.value }
                    : null
                )
              }
              className="w-full px-4 py-2 bg-background border border-border rounded-lg text-white"
              disabled={!editingPrice}
            >
              <option value="CARRO">Carro</option>
              <option value="MOTO">Moto</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Preço por Hora (R$)
            </label>
            <input
              type="text"
              value={priceInputValue}
              onChange={(e) => setPriceInputValue(e.target.value)}
              placeholder="10.00"
              className="w-full px-4 py-2 bg-background border border-border rounded-lg text-white"
            />
          </div>

          <Button
            onClick={() => {
              const pricePerHour = parseBRL(priceInputValue);
              handleSavePrice(
                editingPrice?.type || "CARRO",
                pricePerHour / 60
              );
            }}
            className="w-full"
          >
            Salvar
          </Button>
        </div>
      </Modal>

      {/* Promotion Modal */}
      <Modal
        isOpen={promoModal}
        onClose={() => {
          setPromoModal(false);
          setPromoForm({
            name: "",
            discount: 0,
            vehicleType: "TODOS",
            startDate: "",
            endDate: "",
          });
        }}
        title="Nova Promoção"
      >
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            try {
              const validatedData = promotionSchema.parse(promoForm);
              const res = await fetch("/api/admin/promotions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(validatedData),
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
                showAlert("success", "Sucesso", "Promoção criada com sucesso!");
              } else {
                const data = await res.json();
                showAlert("error", "Erro", data.error || "Falha ao criar promoção");
              }
            } catch (error) {
              if (error instanceof z.ZodError) {
                const firstError = error.issues?.[0];
                showAlert("error", "Erro", firstError?.message || "Dados inválidos");
              }
            }
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Nome
            </label>
            <input
              type="text"
              value={promoForm.name}
              onChange={(e) =>
                setPromoForm({ ...promoForm, name: e.target.value })
              }
              placeholder="Promoção de Fim de Ano"
              required
              className="w-full px-4 py-2 bg-background border border-border rounded-lg text-white placeholder-gray-500"
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
                setPromoForm({
                  ...promoForm,
                  discount: parseFloat(e.target.value) || 0,
                })
              }
              placeholder="10"
              min="0"
              max="100"
              required
              className="w-full px-4 py-2 bg-background border border-border rounded-lg text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Tipo de Veículo
            </label>
            <select
              value={promoForm.vehicleType}
              onChange={(e) =>
                setPromoForm({ ...promoForm, vehicleType: e.target.value })
              }
              className="w-full px-4 py-2 bg-background border border-border rounded-lg text-white"
            >
              <option value="">Todos</option>
              <option value="CARRO">Carro</option>
              <option value="MOTO">Moto</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Data Inicial
            </label>
            <input
              type="date"
              value={promoForm.startDate}
              onChange={(e) =>
                setPromoForm({ ...promoForm, startDate: e.target.value })
              }
              required
              className="w-full px-4 py-2 bg-background border border-border rounded-lg text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Data Final
            </label>
            <input
              type="date"
              value={promoForm.endDate}
              onChange={(e) =>
                setPromoForm({ ...promoForm, endDate: e.target.value })
              }
              required
              className="w-full px-4 py-2 bg-background border border-border rounded-lg text-white"
            />
          </div>

          <Button type="submit" className="w-full">
            Criar Promoção
          </Button>
        </form>
      </Modal>

      {/* User Modal (Create) */}
      <Modal
        isOpen={userModal}
        onClose={() => {
          setUserModal(false);
          setUserForm({ email: "", password: "", name: "", role: "USER" });
        }}
        title="Novo Usuário"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Email
            </label>
            <input
              type="email"
              value={userForm.email}
              onChange={(e) =>
                setUserForm({ ...userForm, email: e.target.value })
              }
              placeholder="usuario@exemplo.com"
              required
              className="w-full px-4 py-2 bg-background border border-border rounded-lg text-white placeholder-gray-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Senha
            </label>
            <input
              type="password"
              value={userForm.password}
              onChange={(e) =>
                setUserForm({ ...userForm, password: e.target.value })
              }
              placeholder="••••••••"
              required
              className="w-full px-4 py-2 bg-background border border-border rounded-lg text-white placeholder-gray-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Nome
            </label>
            <input
              type="text"
              value={userForm.name}
              onChange={(e) =>
                setUserForm({ ...userForm, name: e.target.value })
              }
              placeholder="João Silva"
              className="w-full px-4 py-2 bg-background border border-border rounded-lg text-white placeholder-gray-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Função
            </label>
            <select
              value={userForm.role}
              onChange={(e) =>
                setUserForm({ ...userForm, role: e.target.value })
              }
              className="w-full px-4 py-2 bg-background border border-border rounded-lg text-white"
            >
              <option value="USER">Usuário</option>
              <option value="ADMIN">Administrador</option>
            </select>
          </div>

          <Button onClick={handleSaveUser} className="w-full">
            Criar Usuário
          </Button>
        </div>
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
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Email
            </label>
            <input
              type="email"
              value={userForm.email}
              onChange={(e) =>
                setUserForm({ ...userForm, email: e.target.value })
              }
              placeholder="usuario@exemplo.com"
              className="w-full px-4 py-2 bg-background border border-border rounded-lg text-white placeholder-gray-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Senha (deixe em branco para manter)
            </label>
            <input
              type="password"
              value={userForm.password}
              onChange={(e) =>
                setUserForm({ ...userForm, password: e.target.value })
              }
              placeholder="••••••••"
              className="w-full px-4 py-2 bg-background border border-border rounded-lg text-white placeholder-gray-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Nome
            </label>
            <input
              type="text"
              value={userForm.name}
              onChange={(e) =>
                setUserForm({ ...userForm, name: e.target.value })
              }
              placeholder="João Silva"
              className="w-full px-4 py-2 bg-background border border-border rounded-lg text-white placeholder-gray-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Função
            </label>
            <select
              value={userForm.role}
              onChange={(e) =>
                setUserForm({ ...userForm, role: e.target.value })
              }
              className="w-full px-4 py-2 bg-background border border-border rounded-lg text-white"
            >
              <option value="USER">Usuário</option>
              <option value="ADMIN">Administrador</option>
            </select>
          </div>

          <Button onClick={handleEditUser} className="w-full">
            Salvar Alterações
          </Button>
        </div>
      </Modal>

      {/* Alert Modal */}
      <AlertModal
        isOpen={alertModal}
        onClose={() => setAlertModal(false)}
        type={alertType}
        title={alertTitle}
        message={alertMessage}
        onConfirm={() => {
          if (alertCallback) alertCallback();
          setAlertModal(false);
        }}
        loading={alertLoading}
      />
    </div>
  );
}
