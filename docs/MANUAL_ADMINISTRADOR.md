# Manual do Administrador e Operador
## Sistema de Gestão de Igreja - MVP v1.0

---

## Índice

1. [Gestão de Voluntários e Segurança (RLS)](#1-gestão-de-voluntários-e-segurança-rls)
2. [Uso do Sistema de Escalas](#2-uso-do-sistema-de-escalas)
3. [Automação e Auditoria (CRON)](#3-automação-e-auditoria-cron)
4. [Instruções de Go-Live Futuro (WhatsApp)](#4-instruções-de-go-live-futuro-whatsapp)

---

## 1. Gestão de Voluntários e Segurança (RLS)

### 1.1 Funções (Roles) do Sistema

O sistema possui **6 funções principais** definidas no enum `app_role`:

| Role | Descrição | Permissões Principais |
|------|-----------|----------------------|
| **admin** | Administrador Geral | Acesso total a todas as telas, dados e configurações. Pode gerenciar usuários, escalas, ministérios, finanças e configurações da instituição. |
| **lider** | Líder de Ministério | Acesso às escalas e voluntários do seu ministério. Pode criar/editar escalas, gerenciar funções e voluntários do ministério que lidera. |
| **voluntario** | Voluntário Ativo | Visualiza suas próprias escalas, pode confirmar/recusar participação, acessa notificações pessoais. |
| **membro** | Membro da Igreja | Acesso básico: visualiza avisos públicos, eventos, bases públicas, pode fazer pedidos de oração. |
| **visitante** | Visitante | Acesso mínimo: pode se registrar como visitante através do formulário "Sou Novo". |
| **financeiro** | Gestor Financeiro | Acesso às telas de finanças: transações, contas, categorias e relatórios financeiros. |

### 1.2 Matriz de Permissões por Tela

| Tela/Funcionalidade | admin | lider | financeiro | voluntario | membro |
|---------------------|-------|-------|------------|------------|--------|
| Dashboard Admin | ✅ | ❌ | ❌ | ❌ | ❌ |
| Gestão de Usuários | ✅ | ❌ | ❌ | ❌ | ❌ |
| Configurações da Igreja | ✅ | ❌ | ❌ | ❌ | ❌ |
| Ministérios (gerenciar) | ✅ | ✅* | ❌ | ❌ | ❌ |
| Escalas (criar/editar) | ✅ | ✅* | ❌ | ❌ | ❌ |
| Escalas (confirmar/recusar) | ✅ | ✅ | ❌ | ✅** | ❌ |
| Finanças | ✅ | ❌ | ✅ | ❌ | ❌ |
| Membros (cadastro) | ✅ | ❌ | ❌ | ❌ | ❌ |
| Visitantes | ✅ | ❌ | ❌ | ❌ | ❌ |
| Bases (gerenciar) | ✅ | ✅* | ❌ | ❌ | ❌ |
| Avisos | ✅ | ❌ | ❌ | ❌ | ❌ |
| Auditoria | ✅ | ❌ | ❌ | ❌ | ❌ |
| Kids (check-in) | ✅ | ❌ | ❌ | ❌ | ❌ |

**Legenda:**
- ✅* = Apenas para o ministério/base que lidera
- ✅** = Apenas para suas próprias escalas

### 1.3 Dados Sensíveis Protegidos por RLS

As seguintes tabelas possuem **Row-Level Security (RLS)** ativa para proteger dados sensíveis:

| Tabela | Dados Sensíveis | Quem Pode Acessar |
|--------|-----------------|-------------------|
| `profiles` | Email, telefone, endereço, data nascimento, observações privadas | Próprio usuário + Admin |
| `membros` | Dados pessoais completos | Somente Admin |
| `configuracoes_instituicao` | Chave WhatsApp, informações PIX, configurações | Somente Admin |
| `transacoes_financeiras` | Valores, doadores, referências | Admin + Financeiro |
| `audit_logs` | Histórico de ações do sistema | Somente Admin |
| `visitantes` | Dados de contato de visitantes | Somente Admin |

### 1.4 Como Alterar a Role de um Usuário

**Passo a passo para o Administrador:**

1. Acesse o sistema como **admin**
2. Navegue até **Admin → Usuários**
3. Localize o usuário na lista
4. Clique no botão **"Editar"** ao lado do usuário
5. No modal de edição, selecione a(s) nova(s) role(s) no campo **"Funções"**
6. Clique em **"Salvar"**

**Estrutura técnica (para referência):**

A tabela `user_roles` armazena as permissões:

```sql
-- Estrutura da tabela user_roles
id: uuid (primary key)
user_id: uuid (referência ao auth.users)
role: app_role (enum: admin, lider, voluntario, membro, visitante, financeiro)
created_at: timestamp
```

**Importante:** Um usuário pode ter **múltiplas roles** simultaneamente (ex: um líder que também é financeiro).

---

## 2. Uso do Sistema de Escalas

### 2.1 Como Criar uma Nova Escala

1. Acesse **Admin → Escalas**
2. Clique no botão **"Nova Escala"**
3. Preencha os campos obrigatórios:
   - **Data**: Data do evento/culto
   - **Ministério**: Selecione o ministério responsável
   - **Função**: Cargo/função na escala (ex: "Recepção", "Louvor", "Mídia")
   - **Voluntário**: Selecione o voluntário a ser escalado
   - **Horário** (opcional): Horário específico
   - **Turno** (opcional): Manhã, Tarde ou Noite
4. Clique em **"Criar Escala"**

### 2.2 Ações Disponíveis na Tela de Escalas

| Ação | Descrição | Quem Pode Executar |
|------|-----------|-------------------|
| **Adicionar Voluntário** | Escalar um novo voluntário para uma data | Admin, Líder |
| **Remover da Escala** | Remover um voluntário escalado | Admin, Líder |
| **Editar Escala** | Alterar função, horário ou turno | Admin, Líder |
| **Alterar Status** | Confirmar, marcar ausente ou pendente | Admin, Líder |
| **Visualizar Detalhes** | Ver informações completas da escala | Admin, Líder, Voluntário (própria) |
| **Filtrar por Data** | Selecionar intervalo de datas | Todos com acesso |
| **Filtrar por Ministério** | Ver escalas de um ministério específico | Todos com acesso |
| **Exportar** | Gerar PDF/Excel das escalas | Admin, Líder |

### 2.3 Status do Voluntário na Escala

O sistema utiliza **3 status principais** definidos no enum `scale_status`:

| Status | Código | Descrição | Ação do Administrador |
|--------|--------|-----------|----------------------|
| 🟡 **Pendente** | `pendente` | Voluntário foi escalado mas ainda não confirmou presença | Aguardar confirmação ou enviar lembrete manual |
| 🟢 **Confirmado** | `confirmado` | Voluntário confirmou que estará presente | Nenhuma ação necessária |
| 🔴 **Ausente** | `ausente` | Voluntário informou que não poderá comparecer | Buscar substituto ou redistribuir função |

### 2.4 Status Geral da Escala

Além do status individual, cada escala tem um **status geral** (`escala_status_geral`):

| Status | Descrição |
|--------|-----------|
| **Planejada** | Escala criada, aguardando execução |
| **Ativa** | Escala em andamento (dia do evento) |
| **Concluída** | Escala finalizada |

### 2.5 Fluxo de Confirmação pelo Voluntário

1. Voluntário recebe **notificação push** de nova escala
2. Acessa **Minhas Escalas** no app
3. Visualiza detalhes da escala
4. Clica em **"Confirmar"** ou **"Não Posso"**
5. Se recusar, pode informar **justificativa**
6. Admin/Líder recebe notificação da resposta

---

## 3. Automação e Auditoria (CRON)

### 3.1 Edge Function de Lembretes Automáticos

**Nome da função:** `daily-reminders`

**Horário de execução:** Diariamente às **08:00 AM** (horário do servidor)

**Status atual:** ⚠️ Configuração de CRON pendente (ver seção 3.4)

### 3.2 Lógica de Seleção de Voluntários

A função `daily-reminders` seleciona voluntários com base nos seguintes critérios:

```
1. Status da escala: pendente
2. Data da escala: próximos 7 dias
3. Voluntário possui token de push notification registrado
```

**Query executada:**
```sql
SELECT escalas.*, profiles.nome, push_subscriptions.endpoint
FROM escalas
JOIN profiles ON escalas.voluntario_id = profiles.id
JOIN push_subscriptions ON profiles.user_id = push_subscriptions.user_id
WHERE escalas.status = 'pendente'
  AND escalas.data BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'
```

### 3.3 Canais de Comunicação Atuais

| Canal | Status | Observação |
|-------|--------|------------|
| **Push Notification** | ✅ Ativo | Funcional para usuários com PWA instalado |
| **WhatsApp** | ⚠️ Simulação | Retorna `simulacao_desativada` no histórico |
| **Email** | ❌ Não implementado | Planejado para versão futura |

### 3.4 Como Configurar o CRON Job

Para ativar a execução automática diária, execute o seguinte SQL no banco de dados:

```sql
-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Agendar execução diária às 08:00
SELECT cron.schedule(
  'daily-reminders-job',
  '0 8 * * *',
  $$
  SELECT net.http_post(
    url := 'https://vktfcgtnpbnacjnepfhf.supabase.co/functions/v1/daily-reminders',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZrdGZjZ3RucGJuYWNqbmVwZmhmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUwMzQ1ODAsImV4cCI6MjA4MDYxMDU4MH0.1KLNcBSdwIOGtBE5E6zsFqGCZ1yHYXWwQU2mlWO2PpE"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);
```

### 3.5 Auditoria de Comunicações

**Tabela:** `historico_comunicacoes`

**Campos principais:**

| Campo | Descrição |
|-------|-----------|
| `id` | Identificador único |
| `tipo` | Tipo de comunicação: `push`, `whatsapp`, `email` |
| `status` | Status do envio: `enviado`, `falha`, `simulacao_desativada` |
| `voluntario_id` | ID do voluntário destinatário |
| `escala_id` | ID da escala relacionada |
| `mensagem_preview` | Prévia da mensagem enviada |
| `detalhes_erro` | Detalhes em caso de falha |
| `created_at` | Data/hora do registro |

**Como verificar os lembretes automáticos:**

1. Acesse **Admin → Auditoria** ou consulte diretamente a tabela
2. Filtre por `tipo = 'push'` para ver notificações push
3. Verifique a coluna `status`:
   - `enviado` = Sucesso
   - `falha` = Erro (ver `detalhes_erro`)
   - `simulacao_desativada` = WhatsApp em modo simulação

**Exemplo de consulta SQL:**
```sql
SELECT 
  created_at,
  tipo,
  status,
  mensagem_preview,
  detalhes_erro
FROM historico_comunicacoes
WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
ORDER BY created_at DESC;
```

---

## 4. Instruções de Go-Live Futuro (WhatsApp)

### 4.1 Pré-requisitos

Para ativar o envio real de mensagens via WhatsApp, você precisará:

1. **Conta no provedor de WhatsApp API** (ex: Twilio, MessageBird, Z-API)
2. **Chave de API** do provedor escolhido
3. **Número de telefone** verificado e aprovado para envio

### 4.2 Como Ativar o WhatsApp (Sem Alterar Código)

**Passo 1:** Acesse o painel de administração do Lovable Cloud

**Passo 2:** Navegue até **Configurações → Secrets**

**Passo 3:** Adicione a seguinte variável de ambiente:

| Nome da Variável | Valor |
|------------------|-------|
| `WHATSAPP_API_KEY` | Sua chave de API do provedor |

**Passo 4:** Salve as alterações

**Passo 5:** A Edge Function `send-whatsapp-message` detectará automaticamente a chave e começará a enviar mensagens reais

### 4.3 Verificação Pós-Ativação

Após adicionar a chave:

1. Crie uma escala de teste com seu próprio número
2. Aguarde o CRON executar ou dispare manualmente
3. Verifique a tabela `historico_comunicacoes`:
   - Status deve ser `enviado` (não mais `simulacao_desativada`)
4. Confirme o recebimento da mensagem no WhatsApp

### 4.4 Configuração do Provedor (Exemplo Z-API)

Se estiver usando Z-API, a Edge Function espera os seguintes campos:

```javascript
// Variáveis de ambiente necessárias
WHATSAPP_API_KEY     // Token de autenticação
WHATSAPP_INSTANCE_ID // ID da instância (opcional, configurável no código)
```

### 4.5 Formato da Mensagem Enviada

A mensagem padrão de lembrete segue o template:

```
🔔 Lembrete de Escala

Olá, {nome_voluntario}!

Você está escalado(a) para:
📅 Data: {data_escala}
⏰ Horário: {horario}
🎯 Função: {funcao}
⛪ Ministério: {nome_ministerio}

Por favor, confirme sua presença no aplicativo.
```

---

## Anexo: Contatos e Suporte

| Recurso | Informação |
|---------|------------|
| **Documentação Técnica** | `/docs/` no repositório |
| **Logs de Erro** | Lovable Cloud → Edge Functions → Logs |
| **Banco de Dados** | Lovable Cloud → Database |

---

*Manual gerado em: Dezembro 2024*
*Versão do Sistema: MVP 1.0*
