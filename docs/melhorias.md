# Melhorias sugeridas

As funcionalidades abaixo são propostas de evolução e não são apresentadas como implementadas.

| Prioridade | Evolução | Motivo e dependências |
|---|---|---|
| 1 | Revisão pedagógica pelo professor | Validar recorte já ministrado, fontes e dificuldade de cada questão. |
| 1 | Moderação e proteção do ranking compartilhado | Adicionar limites de envio, remoção de registros e controle de abuso. O ranking didático básico já usa API e MySQL. |
| 1 | Autenticação real | Distinguir participantes em uso institucional; definir recuperação, retenção e autorização. |
| 2 | Mais cenários de terminal | Acrescentar pipes e manipulação de texto com parser próprio seguro e testes sem shell real. |
| 2 | Novos materiais para less, more e wget | Ampliar o banco mantendo rastreabilidade aos conteúdos da turma. |
| 2 | Revisão espaçada | Reapresentar tópicos errados em intervalos, após definir como persistir histórico por questão. |
| 2 | Exportação e importação de progresso | Transportar dados com esquema validado e informação clara de integridade não garantida. |
| 3 | PWA e cache offline | Permitir recarregar a versão hospedada sem rede, com política de atualização e invalidação. |
| 3 | Mascotes autorais | Substituir emojis por recursos licenciados sem depender da aparência de cada sistema. |
| 3 | Auditoria de acessibilidade | Validar leitores de tela, zoom, contraste e navegação com usuários reais. |
| 3 | Certificados verificáveis | Emissão no servidor, assinatura/validação e aprovação institucional; não apenas IDs no navegador. |

Uma evolução para backend deve preservar a separação de regras, conteúdo e interface. Evite inserir uma chave administrativa no JavaScript público. A introdução de rastreamento ou coleta adicional exigirá revisar a política de dados e a interface correspondente.
