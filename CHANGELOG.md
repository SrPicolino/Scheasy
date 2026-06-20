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
