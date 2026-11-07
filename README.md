# NEXORA Chat

Aplicativo de mensagens em tempo real com **React + TypeScript + Vite + Supabase + TanStack Query**. Identidade escura com azul e roxo, alternância de tema e experiência mobile.

## Estado do projeto

**Etapa 1 (primeiro MVP):** cadastro, login, recuperação de senha por e-mail, Google OAuth (após configuração), perfil criado automaticamente, busca por nome/@identificador, conversas privadas e mensagens persistentes em tempo real com paginação e políticas RLS.

**Ainda não implementado:** grupos, anexos, edição/exclusão, confirmação de leitura, indicadores de digitação, notificações push, status e chamadas WebRTC. Não há criptografia de ponta a ponta implementada. Não é um produto pronto para produção.

## Configuração

1. Crie um projeto em https://supabase.com/dashboard.
2. No **SQL Editor**, execute `supabase/migrations/001_initial.sql` uma vez. Isso cria tabelas, índices, gatilhos, funções e RLS, e habilita Realtime para as tabelas necessárias.
3. Em **Authentication > Providers**, configure Email; recomenda-se habilitar **Confirm email**. Para login Google, habilite o provedor e configure o cliente OAuth no Google Cloud (URL de callback exibida pelo Supabase). Em **Authentication > URL Configuration**, cadastre a URL local `http://localhost:5173` e a URL final do seu site em Redirect URLs.
4. Em **Project Settings > API** (ou área de chaves da interface atual), copie a URL do projeto e a chave **publishable** ou **anon**. **Nunca** coloque a chave `service_role` no frontend.
5. Execute:

```bash
npm install
cp .env.example .env
# edite .env com os valores reais
npm run dev
```

No Windows sem `cp`, use `copy .env.example .env` no CMD ou `Copy-Item .env.example .env` no PowerShell.

## Teste entre dois usuários

Abra duas sessões independentes (por exemplo, uma janela comum e uma anônima), crie duas contas com e-mails distintos, confirme os e-mails quando exigido e faça login. Em uma das sessões, clique em **Nova conversa**, pesquise pelo nome ou @identificador da outra pessoa e envie uma mensagem. A segunda pessoa verá a conversa ao receber o evento de associação (pode recarregar a página em caso de atraso de assinatura) e as mensagens deverão atualizar automaticamente.

## Segurança e limitações

- As conversas e mensagens são restritas por RLS aos participantes.
- A criação de conversa acontece por RPC do banco com verificação de usuário.
- Não há secrets no repositório. O arquivo `.env` fica fora do Git via `.gitignore`.
- A autenticação usa persistência de sessão administrada pelo cliente Supabase.
- Esta etapa ainda precisa de testes de integração, limites anti-spam no backend, revisão de privacidade da busca e auditoria de segurança antes de qualquer lançamento público.

## Estrutura

```text
src/
  components/     # telas de autenticação e mensagens
  lib/            # cliente Supabase e serviços
  App.tsx         # sessão e rotas autenticadas
  styles.css      # identidade visual responsiva
supabase/
  migrations/     # schema com Row Level Security
```
