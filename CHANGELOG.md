# Registro de Alterações (Changelog) e Documentação

Todas as mudanças relevantes testadas e validadas neste projeto (Scheasy v2.0) serão documentadas aqui de acordo com os padrões de manutenção de software.

## [Unreleased] - Em Andamento (Sprint 1)

### Melhorias de Arquitetura e Segurança
- **Segurança (Credenciais):** Removido rastreamento do arquivo `.env` do controle de versão (Git). Criação de `.env.example` com placeholders para proteger credenciais de banco de dados (Neon DB), Twilio e Google OAuth.
- **Refatoração Estrutural (Backend):** O arquivo monolítico `api.ts` (que continha todas as rotas do Express) foi desmembrado em rotas modulares dentro de `backend/src/routes/` visando facilitar a manutenção e escalabilidade:
  - `appointment.routes.ts`
  - `auth.routes.ts`
  - `barber.routes.ts`
  - `customer.routes.ts`
  - `rating.routes.ts`
  - `service.routes.ts`
  - `waiting-list.routes.ts`
- **Centralização:** O arquivo `api.ts` agora atua apenas como o hub (indexador) das sub-rotas.
- **Resiliência:** Implementado um `errorHandler` global no Express (`utils/errorHandler.ts`), garantindo que falhas internas não derrubem o servidor e retornem respostas padronizadas.

### Validação e Consistência (Sprint 2)
- **Sanitização de Entradas (Zod):** Implementados schemas rigorosos de validação de dados para Agendamentos e Registro de Clientes, garantindo integridade das informações antes de tocarem no banco de dados.
- **Gestão de Fusos Horários (Timezones):** A rota de cálculo de horários ocupados (`busy-slots`) foi reescrita utilizando `date-fns-tz` para fixar cálculos na timezone local (`America/Sao_Paulo`), prevenindo bugs em servidores rodando em UTC.

### UX Frontend (Sprint 3)
- **Autenticação Descentralizada:** Criado um `AuthContext` no React para gerenciar globalmente as sessões dos usuários (clientes), evitando repasse de propriedades complexas.
- **Máscaras Dinâmicas:** Adicionada formatação visual em tempo real nos inputs de Telefone `(XX) XXXXX-XXXX` para evitar erros de entrada do usuário.
- **Notificações Ricas:** Substituição completa dos clássicos e bloqueantes `alert()` de navegador por um sistema polido de Toasts não-obstrutivos (`react-hot-toast`) garantindo feedback elegante em caso de sucesso ou falha no login, agendamentos, e filas de espera.

### Infraestrutura e Deploy (Sprint 4)
- **Empacotamento (Docker):** Criado o `Dockerfile` para o Node (Backend) e para o Vite/Nginx (Frontend).
- **Orquestração Inteligente:** Desenvolvido um `docker-compose.yml` que sobe o banco PostgreSQL, backend e frontend conectados e prontos para produção.
- **Automação de Banco:** O contêiner backend foi configurado para executar `npx prisma db push` automaticamente antes de iniciar, garantindo que as tabelas sejam sempre criadas na nuvem.
- **Documentação de Nuvem:** Criado o arquivo `DEPLOY.md` com instruções claras para deploy em VPS.

---

## [3.0.0] - 2026-06-20 — Arquitetura SaaS Multi-Tenant

Esta versão representa a maior evolução do projeto: a transição de um sistema para uma única barbearia para uma **plataforma SaaS** capaz de servir dezenas de barbearias simultaneamente com isolamento total de dados.

### Banco de Dados (Prisma Schema)
- **Novo modelo `Barbershop`:** Entidade principal multi-tenant com campos `name`, `slug` (URL único), `logoUrl`, `phone`, `address`.
- **Relacionamentos vinculados:** Os modelos `Barber`, `Service`, `Appointment` e `WaitingList` receberam a coluna `barbershopId` garantindo isolamento total de dados entre empresas.
- **Migração executada:** Schema aplicado ao banco de dados PostgreSQL via `prisma db push`.
- **Seed atualizado:** Barbearia de demonstração criada com slug `demo`, serviços e barbeiros vinculados (acessível em `/demo`).

### Backend (API)
- **`BarbershopController`** expandido com:
  - `GET /api/barbershops/:slug` — público, retorna dados completos (nome, logo, serviços, barbeiros com horários).
  - `GET /api/barbershops/` — admin, lista todas as barbearias.
  - `POST /api/barbershops/` — admin, cria nova barbearia.
  - `PUT /api/barbershops/:id` — admin, atualiza barbearia.
- **`ServiceController`** atualizado: `getServices` agora aceita `?barbershopId=` e `createService` exige `barbershopId`.
- **`BarberController`** atualizado: `getBarbers` agora filtra por `?barbershopId=` e inclui `schedules` na resposta.
- **`AppointmentController`** atualizado: `createAppointment` e `getAppointments` filtrados por `barbershopId`.
- **`appointment.validator.ts`** atualizado: `barbershopId` adicionado como campo obrigatório no schema Zod.
- **`waiting-list.routes.ts`** atualizado: endpoint POST exige `barbershopId`.
- **`index.ts`** limpo: removidas importações duplicadas e de arquivos inexistentes.

### Frontend (React)
- **`App.tsx` — Roteamento Dinâmico:** Implementada a rota `/:slug` que carrega o `BookingFlow` para qualquer barbearia cadastrada. Rotas específicas (`/my-account`, `/login`, `/admin`) declaradas antes para evitar colisões.
- **`BookingFlow.tsx` — Carregamento por Slug:** O componente agora:
  - Lê o `slug` da URL via `useParams`.
  - Busca dados completos da barbearia em `GET /api/barbershops/:slug` (uma única requisição inclui serviços e barbeiros).
  - Exibe nome, logo (avatar com inicial) e endereço da barbearia dinamicamente no header.
  - Inclui `barbershopId` em todos os payloads de agendamento e fila de espera.
  - Exibe tela de loading elegante e tela de erro se a barbearia não for encontrada.

### Script de Inicialização
- **`iniciar_projeto.bat`** atualizado para abrir automaticamente `http://localhost:5173/demo` (barbearia de demonstração).

### Como Adicionar uma Nova Barbearia
```bash
# Via API (POST autenticado como admin)
curl -X POST http://localhost:3001/api/barbershops \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Barbearia do João", "slug": "barbearia-do-joao", "phone": "11988887777"}'

# O cliente acessa via:
http://localhost:5173/barbearia-do-joao
```
