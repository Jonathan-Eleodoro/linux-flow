# Acesso, privacidade e segurança

## Política de acesso

A aplicação é pública. Criar um perfil local não comprova identidade. O botão **Entrar** oferece perfil local, código de acesso, criação e sessão visitante; a sessão visitante não é gravada no armazenamento persistente. Google, GitHub e Apple aparecem como opções indisponíveis até que OAuth seja implementado e configurado no domínio publicado. Ao ativar a sincronização por código, o site gera uma chave aleatória; a API guarda seu hash e exige o código para ler, alterar ou apagar o perfil da nuvem. Quem souber o código tem acesso ao perfil. Não há papéis de professor/administrador. Pessoas que compartilham navegador podem consultar perfis locais.

A atribuição de autoria em uma rodada usa o perfil escolhido no início. Trocar de perfil durante uma rodada é bloqueado na interface. Isso é uma regra de uso, não uma barreira de segurança contra um usuário que altera o código.

## Dados

| Dado | Finalidade | Local |
|---|---|---|
| Apelido e identificador local | Identificar tentativas no dispositivo | Memória; localStorage se autorizado |
| Resultados e data | Ranking e certificados | Memória; localStorage se autorizado |
| Missões concluídas | Acompanhar prática | Memória; localStorage se autorizado |
| Código de acesso do perfil sincronizado | Recuperar progresso em outro aparelho | Navegador; somente hash no D1 |
| Resultados e missões sincronizados | Continuidade entre aparelhos | D1 da Cloudflare, mediante ativação |
| Tema e som | Preferências | Memória; localStorage se autorizado |
| Seleção e respostas da rodada atual | Correção e revisão imediata | Apenas memória |
| Apelido, identificador aleatório do perfil, assunto, nível, total, acertos e data de rodadas publicadas | Ranking compartilhado opcional | D1 da Cloudflare |
| E-mail informado e comentário de sugestão | Analisar sugestões e eventualmente responder | D1 da Cloudflare; não exibidos publicamente |

O quiz não solicita senha, CPF, e-mail ou telefone do participante. O formulário opcional de sugestões solicita e-mail e comentário, com ciência explícita; o endereço é informado pelo remetente e não é verificado. O contato em `config.js` é dado público do autor.

O aplicativo não cria cookies próprios nem integra analytics ou anúncios. O aviso de armazenamento é lembrado apenas na aba atual por `sessionStorage`. A sincronização envia apelido, resultados e missões à Pages Functions. Novas rodadas enviam respostas para recálculo dos acertos; a opção de ranking controla a publicação da pontuação. Compartilhar um resultado abre um serviço externo somente após ação do usuário e transmite apenas o resumo escolhido, sem respostas nem código de acesso. A hospedagem pode manter logs de acesso fora do controle do JavaScript. Consulte suas próprias configurações e políticas antes de uso institucional. Este texto descreve a implementação e não é uma certificação de conformidade jurídica.

## Consentimento funcional

O salvamento local é opt-in no cadastro. Ativar a sincronização salva o código de acesso no navegador. A publicação no ranking compartilhado tem uma opção separada. A tela Sobre permite apagar a cópia local ou apagar o perfil da nuvem. Desligar a publicação impede novos registros no ranking; os antigos são removidos ao apagar o perfil da nuvem.

Limites locais: 30 perfis e 300 resultados recentes. O navegador pode limpar os dados; perfis sincronizados podem ser recuperados com o código de acesso. Não há sincronização em tempo real entre abas. Resultados e missões são unidos por identificador; preferências de tema e som permanecem locais.

## Medidas técnicas

- Conteúdo de usuário nunca é interpretado como HTML.
- O terminal usa somente comandos reconhecidos e dados em memória.
- Não há `eval`, `new Function`, execução de shell ou requisições de rede.
- Validação defensiva dos dados carregados do armazenamento, tipos e limites.
- Política CSP sem scripts inline, recursos externos ou objetos incorporados; conexões limitadas à mesma origem para a API.
- Cabeçalhos de publicação: `nosniff`, `DENY`, política de referência restrita e bloqueio de câmera/microfone/geolocalização.
- `form-action 'none'`; formulários são tratados pelo JavaScript, e as chamadas à API usam `fetch` na mesma origem.
- Build por lista de permissão; documentos e testes não entram no diretório hospedado.
- O binding D1 fica apenas nas Pages Functions. A chave Pix é configurada como secret na Cloudflare.
- A marca institucional e os certificados indicam o caráter acadêmico, sem afirmar chancela oficial.

Os cabeçalhos estáticos da Cloudflare são definidos em `_headers`; as Functions definem seus próprios cabeçalhos. O servidor Python local não replica esses cabeçalhos HTTP; a CSP de meta protege o que pode ser aplicado por HTML. A diretiva `frame-ancestors` depende de cabeçalho HTTP.

## O que a versão estática não pode garantir

O banco de respostas é público. O usuário pode alterar o código e armazenamento local. A API recalcula o resultado das novas rodadas enviadas, mas não comprova que foram feitas por uma pessoa nem impede envios automatizados com conhecimento do gabarito. Resultados locais antigos são importados sem verificação e não entram automaticamente no ranking. Não existe identidade verificada ou certificado verificável remotamente.

Para avaliação oficial, a evolução deve validar respostas no servidor, autenticar usuários, aplicar autorização e limites de requisição, guardar tentativas em banco e manter política de retenção definida com a instituição. O projeto atual não simula que essas garantias já existam.
