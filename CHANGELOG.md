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
