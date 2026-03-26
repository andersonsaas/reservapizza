# Migração para Sistema Multi-Tenant

## Visão Geral
O sistema foi transformado de uma plataforma single-tenant para multi-tenant, permitindo que múltiplos restaurantes usem a mesma instância da aplicação.

## Mudanças Principais

### 1. Novos Tipos de Usuário
- **Super Admin**: Acesso total ao sistema, pode gerenciar todos os restaurantes
- **Admin Restaurante**: Gerencia apenas seu restaurante atribuído
- **Operador**: Usuário básico com acesso limitado ao restaurante atribuído

### 2. Isolamento de Dados
- Cada restaurante tem seus próprios dados (mesas, reservas, configurações)
- Políticas RLS (Row Level Security) garantem que usuários só acessem dados do seu restaurante

### 3. Nova Estrutura do Banco
- Tabela `restaurantes`: Armazena informações dos restaurantes
- Campo `restaurante_id` adicionado em todas as tabelas relevantes
- Tabela `configuracoes_restaurante`: Configurações específicas por restaurante

## Passos para Migração

### 1. Executar Script SQL
1. Abra o SQL Editor no seu projeto Supabase
2. Execute o conteúdo completo do arquivo `schema.sql`
3. Aguarde a conclusão de todas as operações

### 2. Migrar Dados Existentes (se houver)
Se você já tem dados no sistema, será necessário migrá-los para o novo formato:

```sql
-- Exemplo: Migrar mesas existentes para o restaurante padrão
UPDATE mesas SET restaurante_id = 'ID_DO_RESTAURANTE_PADRAO' WHERE restaurante_id IS NULL;

-- Exemplo: Migrar reservas existentes
UPDATE reservas SET restaurante_id = 'ID_DO_RESTAURANTE_PADRAO' WHERE restaurante_id IS NULL;

-- Exemplo: Migrar perfis de usuário
UPDATE profiles SET restaurante_id = 'ID_DO_RESTAURANTE_PADRAO' WHERE role != 'super_admin';
```

### 3. Configurar Super Admin
Certifique-se de que os emails dos super admins estão na lista do trigger:
- natashjaabreu@hotmail.com
- andersonacionalsat@gmail.com

### 4. Criar Restaurante Inicial
Um restaurante de exemplo "Rainha das Pizzas" é criado automaticamente pelo script.

## Como Usar

### Para Super Admin
1. Login com conta de super admin
2. Selecione ou crie restaurantes na aba "Restaurantes"
3. Atribua usuários aos restaurantes na aba "Usuários"
4. Alterne entre restaurantes usando o botão "Trocar Restaurante"

### Para Admin Restaurante
1. Login normal
2. Sistema automaticamente seleciona o restaurante atribuído
3. Gerencie mesas, reservas e configurações do restaurante

### Para Operador
1. Login normal
2. Acesso limitado às operações básicas do restaurante atribuído

## Funcionalidades Adicionadas

- **Gerenciamento de Restaurantes**: CRUD completo para restaurantes
- **Atribuição de Usuários**: Vincular usuários a restaurantes específicos
- **Seletor de Restaurante**: Interface para alternar entre restaurantes (super admin)
- **Isolamento de Dados**: Cada restaurante vê apenas seus próprios dados
- **Configurações por Restaurante**: Sistema ativo/desativo por restaurante

## Testando a Migração

1. Execute o aplicativo
2. Login com super admin
3. Crie um novo restaurante
4. Atribua um usuário ao restaurante
5. Login com o usuário atribuído
6. Verifique se os dados são isolados corretamente

## Suporte
Em caso de problemas durante a migração, verifique:
1. Se o script SQL foi executado completamente
2. Se as políticas RLS estão ativas
3. Se os usuários têm os restaurante_id corretos
4. Logs do console do navegador para erros