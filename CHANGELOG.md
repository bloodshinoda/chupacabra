# Changelog

Todas as mudanças relevantes do Chupacabra System são registradas aqui.

## [1.1.0] - 2026-10-09

### Adicionado
- Configuração individual e persistente dos perfis Rápido, Balanceado e Chupacabra.
- Validação dos limites técnicos, recuperação controlada de campos inválidos e opção de restaurar padrões.
- Registro dos parâmetros efetivamente utilizados em cada execução.
- Execução de jobs com concorrência limitada conforme o perfil configurado.

### Melhorado
- Integração das configurações de coleta e enriquecimento entre a interface, a ponte Tauri/Rust e o motor Python.
- Controles de pausa, retomada, cancelamento e acompanhamento do ciclo de vida das execuções.
- Documentação dos limites por job, concorrência, timeout, lotes e intervalos de requisição.

### Corrigido
- Tratamento e propagação do timeout no enriquecimento de sites e nas consultas de CNPJ.
- Cobertura de testes para configurações de perfil, persistência, validação, isolamento entre execuções e concorrência.

### Observações
- O limite de resultados é um teto por job (combinação cidade × nicho), aplicado antes da deduplicação; não representa uma garantia de leads finais.
- A versão 1.1.0 não inclui autenticação, licenciamento ou cobrança por assinatura.
