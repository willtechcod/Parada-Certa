# Parada Certa - Sistema de Estacionamento

Sistema de gerenciamento de estacionamento moderno com Next.js 16, interface redesenhada com Tailwind CSS e componentes shadcn/ui.

## Tecnologias

- **Frontend:** Next.js 16 (App Router), React 19, Tailwind CSS v4, shadcn/ui
- **Componentes:** Recharts (gráficos), lucide-react (ícones)
- **Backend:** Next.js API Routes (Route Handlers)
- **Banco de Dados:** SQLite com Prisma ORM
- **Autenticação:** JWT (jsonwebtoken + bcryptjs)
- **Relatórios:** XLSX (Excel), jsPDF

---

## Estrutura do Banco de Dados

### Schema Prisma

```prisma
// Usuários do sistema
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  password  String
  name      String?
  role      String   @default("USER")  // ADMIN ou USER
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

// Veículos estacionados
model Vehicle {
  id          String    @id @default(uuid())
  plate       String    // Placa do veículo (7 caracteres)
  model       String    // Modelo do veículo
  type        String    // CARRO ou MOTO
  startTime   DateTime  // Hora de entrada
  endTime     DateTime? // Hora de saída (null = ainda estacionado)
  pricePerMin Float?    // Preço por minuto (armazenado como float)
  totalPrice  Float?    // Valor total pago
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

// Preços por tipo de veículo (por hora)
model Price {
  id          String   @id @default(uuid())
  type        String   @unique  // CARRO ou MOTO
  pricePerMin Float    @default(0.0833)  // Preço por minuto (R$ 10/hora = 0.1667, R$ 5/hora = 0.0833)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

// Promoções
model Promotion {
  id          String    @id @default(uuid())
  name        String    // Nome da promoção
  discount    Float     // Desconto em porcentagem (0-100)
  vehicleType String?   // CARRO, MOTO ou null (todos)
  startDate   DateTime // Data de início
  endDate     DateTime // Data de fim
  active      Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

### Preços (Atualizado)
```json
[
  { "type": "CARRO", "pricePerMin": 0.1667 },  // R$ 10,00/hora
  { "type": "MOTO", "pricePerMin": 0.0833 }   // R$ 5,00/hora
]
```

---

## Nova Lógica de Cobrança (Atualizada)

### Regras de Faturamento:
1. **Até 29 min:** Proporcional ao minuto (preço por minuto)
2. **30 minutos:** Metade do valor da hora (R$ 5,00 para carro, R$ 2,50 para moto)
3. **31-60 min:** Valor cheio da hora (R$ 10,00 para carro, R$ 5,00 para moto)
4. **Após 1h:** Valor da hora + minutos excedentes proporcionais

### Exemplos:
```
10 min (carro): 10 × (10/60) = R$ 1,67
29 min (carro): 29 × (10/60) = R$ 4,83
30 min (carro): R$ 10,00 / 2 = R$ 5,00  ✨
45 min (carro): R$ 10,00 (hora cheia)
1h15min (carro): 1h = R$ 10,00 + 15min = R$ 2,50 = R$ 12,50
```

---

## Estrutura de Arquivos Atualizada

```
parada-certa/
├── prisma/
│   ├── schema.prisma      # Schema do banco
│   ├── seed.ts           # Dados iniciais (preços R$ 10/5 por hora)
│   └── dev.db            # Banco SQLite
├── src/
│   ├── app/
│   │   ├── (dashboard)/      # Route Group - Layout compartilhado
│   │   │   ├── layout.tsx    # Sidebar + Header + Main
│   │   │   └── page.tsx     # / - Veículos estacionados
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   │   ├── login/route.ts
│   │   │   │   ├── register/route.ts
│   │   │   │   ├── logout/route.ts (GET + POST)
│   │   │   │   └── me/route.ts
│   │   │   ├── vehicles/       # Rotas de veículos
│   │   │   │   ├── route.ts    # GET (lista) + POST (criar)
│   │   │   │   └── [id]/route.ts  # DELETE (finalizar) + GET (detalhes)
│   │   │   ├── admin/          # Rotas admin
│   │   │   │   ├── metrics/route.ts   # Métricas
│   │   │   │   ├── prices/route.ts   # Preços
│   │   │   │   ├── promotions/route.ts # Promoções
│   │   │   │   └── users/         # Usuários
│   │   │   │       ├── route.ts   # GET (lista) + POST (criar)
│   │   │   │       └── [id]/route.ts # DELETE (excluir)
│   │   │   └── reports/route.ts   # Relatórios
│   │   ├── admin/
│   │   │   ├── layout.tsx     # Layout admin com sidebar
│   │   │   └── page.tsx      # /admin - Dashboard admin
│   │   ├── login/
│   │   │   ├── page.tsx      # /login (apenas login, sem registro)
│   │   │   └── page.module.css
│   │   ├── layout.tsx         # Root layout
│   │   ├── globals.css        # Estilos globais + Tailwind + Gradiente
│   │   └── proxy.ts           # Proxy (substituiu middleware.ts)
│   ├── components/
│   │   ├── ui/                # Componentes base (shadcn/ui)
│   │   │   ├── button.tsx    # Com loading spinner
│   │   │   ├── card.tsx
│   │   │   └── input.tsx
│   │   ├── dashboard/         # Componentes do dashboard
│   │   │   ├── sidebar.tsx    # Navegação lateral (Dashboard + Admin)
│   │   │   ├── header.tsx     # Cabeçalho
│   │   │   └── stats-cards.tsx # Cartões de estatísticas
│   │   ├── Modal.tsx          # Componente modal com BRL formatting
│   │   ├── Button.tsx         # Componente botão legado
│   │   ├── Input.tsx          # Componente input atualizado
│   │   ├── VehicleCard.tsx    # Card de veículo atualizado
│   │   └── index.ts           # Barrel exports
│   ├── lib/
│   │   ├── prisma.ts          # Cliente Prisma
│   │   ├── auth.ts            # Funções auth (getCurrentUser, requireAdmin)
│   │   └── utils.ts           # Utilitários (cn, etc)
├── public/
├── .env
├── tailwind.config.ts
├── postcss.config.mjs
└── package.json
```

---

## Páginas e Rotas

### 1. Login (`/login`) - Apenas Login

**Página:** `src/app/login/page.tsx` (apenas login, **sem opção de registro**)

**Funcionalidade:**
- Formulário de login com email/senha
- Redirecionamento automático após login

**Rotas relacionadas:**

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/api/auth/login` | Autentica usuário |
| GET/POST | `/api/auth/logout` | Faz logout |
| GET | `/api/auth/me` | Retorna usuário atual |

---

### 2. Dashboard Principal (`/`)

**Página:** `src/app/(dashboard)/page.tsx`

**Layout:** Sidebar lateral + Header + Conteúdo principal

**Funcionalidade:**
- **Stats Cards:** Veículos ativos, carros, motos, faturamento estimado
- **Grid de Veículos:** Cards responsivos com informações dos veículos estacionados
- **Tempo em tempo real:** Atualização dinâmica do tempo estacionado
- **Nova Lógica de Preço:**
  - Até 29 min: Proporcional ao minuto
  - 30 min: Metade do valor da hora
  - 31-60 min: Hora cheia
  - Após 1h: Hora + minutos proporcionais
- **Modal de adição:** Formulário para novo veículo (Carro/Moto)
- **Modal de finalização:** Confirmação com tempo e valor a pagar

**Rotas relacionadas:**

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/vehicles` | Lista todos os veículos |
| POST | `/api/vehicles` | Adiciona novo veículo |
| GET | `/api/vehicles/[id]` | Detalhes de um veículo |
| DELETE | `/api/vehicles/[id]` | Finaliza veículo (nova lógica) |

---

### 3. Painel Admin (`/admin`) - Apenas ADMIN

**Página:** `src/app/admin/page.tsx`

**Layout:** Sidebar dedicada + Header + Conteúdo

**Funcionalidades:**

#### 3.1 Dashboard de Métricas
- **Stats Cards:** Total veículos, carros, motos, faturamento
- **Gráfico de Barras:** Veículos por mês (Carros vs Motos)
- **Gráfico de Pizza:** Distribuição de veículos
- **Gráfico de Barras:** Faturamento mensal
- **Tabela:** Dados mensais detalhados
- **Seletor de período:** Mês, 6 meses, ano

#### 3.2 Gestão de Preços
- Lista de preços por tipo de veículo
- Edição de preço com formatação automática BRL
- **Auto-formatação:** Digite apenas números, converte para R$ automaticamente
- **Impede letras/espaços:** Apenas números aceitos no input
- Modal de edição com conversão automática (horário → por minuto)

#### 3.3 Promoções
- Lista de promoções ativas/inativas
- Criação de nova promoção
- Toggle ativar/desativar
- Filtro por tipo de veículo

#### 3.4 Usuários (NOVO - Apenas ADMIN)
- **Listar usuários:** Todos os usuários do sistema
- **Criar usuário:** Novo usuário via painel admin
- **Excluir usuário:** Remover usuário (não pode excluir a si mesmo)
- **Restrição:** Usuário padrão (USER) **não pode** acessar essa função

#### 3.5 Relatórios
- Exportação para XLSX (Excel)
- Exportação para JSON
- Seleção de período

**Rotas relacionadas:**

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/admin/metrics` | Retorna métricas |
| GET | `/api/admin/prices` | Lista preços |
| POST | `/api/admin/prices` | Cria/atualiza preço |
| GET | `/api/admin/promotions` | Lista promoções |
| POST | `/api/admin/promotions` | Cria promoção |
| PATCH | `/api/admin/promotions` | Ativa/desativa |
| GET | `/api/admin/users` | Lista usuários (admin) |
| POST | `/api/admin/users` | Cria usuário (admin) |
| DELETE | `/api/admin/users/[id]` | Exclui usuário (admin) |
| GET | `/api/reports` | Exporta relatório |

---

## Interface e Design

### Layout Moderno (2026)
- **Sidebar Colapsável:** Navegação lateral com ícones (lucide-react)
- **Header Dinâmico:** Título da página + ações contextuais
- **Responsivo:** Adapta-se de mobile (drawer) a desktop (sidebar fixa)
- **Tema Escuro:** Cores da marca (verde + amarelo)
- **Cards Visuais:** Stats cards com ícones e cores contrastantes
- **Gráficos Interativos:** Recharts com tooltip customizado
- **Formatação BRL:** Inputs de preço auto-formatam para moeda brasileira
- **Validação de Input:** Impede letras e espaços em campos numéricos

### Cores do Tema
```css
--color-primary: #fee81f (Amarelo)
--color-secondary: #171817 (Preto)
--color-background: #1b2818 (Verde escuro)
--color-background-light: #3c5934 (Verde médio)
--color-border: #4cf412 (Verde neon)
```

### Gradiente de Background (NOVO)
```css
background: linear-gradient(
  180deg,
  rgba(0, 0, 0, 0.9) 0%,      /* Preto 90% opacidade */
  rgba(27, 40, 24, 0.65) 50%,  /* Verde escuro 65% */
  rgba(60, 89, 52, 0.37) 100%  /* Verde médio 37% */
);
```

---

## Autenticação e Autorização

### JWT
- Token armazenado em cookie HTTPOnly
- Expira em 7 dias
- Validação em todas as rotas via proxy.ts

### Roles e Permissões (Atualizado)
| Role | Permissões |
|------|-------------|
| **ADMIN** | Acesso completo ao painel admin + dashboard + criar/excluir usuários |
| **USER** | Acesso apenas ao dashboard de veículos + cadastrar/finalizar veículos |

### Proxy (substituiu middleware.ts)
- Protege rotas `/admin` e `/api/admin`
- Redireciona para `/login` se não autenticado
- Suporta GET e POST em `/api/auth/logout`

---

## Instalação e Execução

```bash
# Instalar dependências
npm install

# Gerar cliente Prisma
npx prisma generate

# Criar banco e executar seed (preços R$ 10/5 por hora)
npx prisma db push
npx tsx prisma/seed.ts

# Iniciar servidor de desenvolvimento
npm run dev
```

### Credenciais de Acesso
- **Admin:** admin@willtechcode.com.br / admin123
  - Pode criar/excluir usuários
- **Operador (USER):** operador@willtechcode.com.br / operador123
  - Apenas cadastra e finaliza veículos

---

## Variáveis de Ambiente

```env
DATABASE_URL=file:./dev.db
JWT_SECRET=parada-certa-secret-key-2024
```

---

## Scripts Disponíveis

```bash
npm run dev      # Servidor de desenvolvimento
npm run build    # Build de produção
npm run start    # Servidor de produção
npm run lint     # Linter
```

---

## Melhorias Implementadas (v2.0)

✅ **Nova Lógica de Cobrança:**
  - Até 29 min: proporcional
  - 30 min: metade da hora
  - 31-60 min: hora cheia
  - Após 1h: hora + minuto proporcional

✅ **Layout Moderno:** Sidebar navegacional substituindo botões soltos

✅ **Stats Cards:** Visualização rápida de métricas na página principal

✅ **Gráficos:** Recharts para visualização de dados no admin (barras, pizza, faturamento)

✅ **Tailwind CSS v4:** Tema customizado com `@theme`

✅ **Componentes Atualizados:** Button (com loading), Modal, Input, VehicleCard

✅ **Proxy.ts:** Substituiu middleware.ts (Next.js 16)

✅ **Gradiente de Background:** 0% #000000 90% → 50% #1B2818 65% → 100% #3C5934 37%

✅ **Login Simplificado:** Removida opção de registro (apenas login)

✅ **Gestão de Usuários:** ADMIN pode criar/excluir usuários

✅ **Restrição de Permissões:** USER só pode cadastrar/finalizar veículos

✅ **Formatação BRL:** Auto-formatação de preços para moeda brasileira (R$ 10,00)
  - Impede letras e espaços em campos numéricos
  - Conversão automática (horário → por minuto) ao salvar

✅ **README.md:** Documentação completa da nova estrutura e lógica
