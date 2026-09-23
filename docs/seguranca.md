# Acesso, privacidade e segurança

## Política de acesso

A aplicação é pública. Criar um perfil local não comprova identidade e não estabelece sessão autenticada. Não há papéis de professor/administrador nem área privada. Pessoas que compartilham navegador podem consultar resultados e selecionar outros perfis. Use somente apelidos adequados para esse contexto.

A atribuição de autoria em uma rodada usa o perfil escolhido no início. Trocar de perfil durante uma rodada é bloqueado na interface. Isso é uma regra de uso, não uma barreira de segurança contra um usuário que altera o código.

## Dados

| Dado | Finalidade | Local |
|---|---|---|
| Apelido e identificador local | Identificar tentativas no dispositivo | Memória; localStorage se autorizado |
| Resultados e data | Ranking e certificados | Memória; localStorage se autorizado |
| Missões concluídas | Acompanhar prática | Memória; localStorage se autorizado |
| Tema e som | Preferências | Memória; localStorage se autorizado |
| Seleção e respostas da rodada atual | Correção e revisão imediata | Apenas memória |

Não se solicita senha, CPF, e-mail ou telefone do participante. Os campos de contato em `config.js` são dados públicos do autor, não um formulário de coleta. O mantenedor deve escolher o que deseja publicar.

O aplicativo não cria cookies nem integra analytics, anúncios, fontes externas ou APIs. A hospedagem pode manter logs de acesso fora do controle do JavaScript. Consulte suas próprias configurações e políticas antes de uso institucional. Este texto descreve a implementação e não é uma certificação de conformidade jurídica.

## Consentimento funcional

O salvamento local é opt-in no cadastro. Sem a seleção, o perfil é temporário. A tela Sobre permite ativar, revogar ou apagar os dados. Revogar o salvamento apaga a cópia persistente e mantém a sessão atual em memória; apagar tudo também limpa a sessão.

Limites: 30 perfis, 300 resultados recentes, sem sincronização e sem backup. O navegador pode limpar os dados; certificados antigos dependem de resultados retidos. Sessões em aba privada têm regras próprias de retenção. Não há sincronização em tempo real entre abas; evite usar várias abas para gravar resultados simultaneamente, pois a última gravação pode substituir alterações de outra aba.

## Medidas técnicas

- Conteúdo de usuário nunca é interpretado como HTML.
- O terminal usa somente comandos reconhecidos e dados em memória.
- Não há `eval`, `new Function`, execução de shell ou requisições de rede.
- Validação defensiva dos dados carregados do armazenamento, tipos e limites.
- Política CSP sem scripts inline, recursos externos, conexões de aplicação ou objetos incorporados.
- Cabeçalhos de publicação: `nosniff`, `DENY`, política de referência restrita e bloqueio de câmera/microfone/geolocalização.
- `form-action 'none'`; formulários são tratados localmente, sem envio HTTP.
- Build por lista de permissão; documentos e testes não entram no diretório hospedado.
- Sem dependências de execução de terceiros, tokens ou segredos.
- A marca institucional e os certificados indicam o caráter acadêmico, sem afirmar chancela oficial.

Os cabeçalhos definidos em `vercel.json` precisam ser aplicados pelo provedor. O servidor Python local não replica esses cabeçalhos HTTP; a CSP de meta protege o que pode ser aplicado por HTML. A diretiva `frame-ancestors` depende de cabeçalho HTTP.

## O que a versão estática não pode garantir

O banco de respostas é público. O usuário pode alterar o código, armazenamento e notas. Não existe anti-cheat, identidade verificada, ranking global ou certificado verificável remotamente. Ocultar o gabarito no JavaScript não resolveria isso.

Para avaliação oficial, a evolução deve validar respostas no servidor, autenticar usuários, aplicar autorização e limites de requisição, guardar tentativas em banco e manter política de retenção definida com a instituição. O projeto atual não simula que essas garantias já existam.
