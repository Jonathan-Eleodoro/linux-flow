# Linux_Flow

Quiz e laboratório de aprendizagem de Linux, criado para a disciplina Sistemas operacionais Linux do curso Técnico em Informática do **Colégio Sinodal Progresso**.

**Aluno:** Jonathan Eleodoro · **Professor:** Cristiano Forte · **Ano:** 2026.

O objetivo é transformar os conteúdos das aulas em prática interativa: responder, compreender o erro, consultar o material e experimentar novamente.

## Experimente em dois passos

1. Extraia o ZIP inteiro, preservando as pastas.
2. Abra `index.html` no navegador. Não abra o HTML de dentro do ZIP.

O quiz e o terminal continuam funcionando sem conexão após extrair os arquivos. Na versão hospedada, perfis e progresso podem ser sincronizados por um código de acesso; o ranking compartilhado é opcional. A publicação atual usa Cloudflare Pages Functions e D1. Veja [publicação na Cloudflare](docs/cloudflare-d1.md). Não é um PWA: uma versão hospedada não garante recarregamento offline.

Para desenvolvimento com uma origem HTTP estável, execute na pasta do projeto:

```bash
npm start
```

Acesse `http://127.0.0.1:4173`. O servidor de prévia usa Node.js e não executa as Pages Functions. O salvamento via `file://` depende das regras de cada navegador; HTTP é preferível para verificar persistência.

## O que está implementado

- Landing page de apresentação com acesso direto às trilhas, quiz, terminal e explicação dos modos temporário, salvo e PRO.
- 135 questões, 14 assuntos e 3 níveis FREE; até 100 perguntas por rodada conforme disponibilidade.
- Duas jornadas guiadas: linha do tempo da história do Linux e simulação de planejamento da instalação, ambas com decisões, feedback e quiz próprio. A simulação não modifica discos.
- Perguntas e alternativas embaralhadas sem repetição na rodada; ao iniciar outra rodada com a mesma configuração, a ordem e as posições corretas diferem da anterior sempre que há mais de uma pergunta disponível.
- Confirmação de resposta, correção imediata e explicação.
- Resultado com perguntas, acertos, erros e aproveitamento; revisão e recomendações por erros.
- Cadastro simples de apelido, troca de perfis e persistência local opcional.
- Entrada com quatro caminhos: perfil existente deste dispositivo ou código da nuvem, criação de perfil, sessão livre e painel de provedores externos. Google, GitHub e Apple dependem de credenciais OAuth e ainda não estão ativos; seus botões indicam isso explicitamente.
- Sincronização opcional de perfis, resultados e missões por código de acesso na versão hospedada.
- Ranking imediato por assunto, dificuldade e quantidade, com melhor tentativa por perfil.
- Comunidade com partida rápida individual, salas de duelo ou competição coletiva com até 40 participantes, cronômetro opcional, placar, controle do mestre e registro dos eventos no D1.
- Grupos de estudo com relatório de quizzes verificados e sugestões de novos conteúdos. O participante vê seus próprios indicadores; o criador do grupo vê os indicadores do grupo.
- Personagem personalizável por mascote e cor, com faixa etária opcional e privada. Os espaços coletivos exigem perfil sincronizado; o papel de mestre ainda não comprova vínculo docente.
- Doze missões com terminal simulado, pistas graduais, sugestões de comandos e histórico por setas.
- 101 entradas no manual pesquisável; mapa de arquitetura e comparação DEB/RPM.
- Busca global por conteúdos do manual, trilhas, missões e objetivos LPI.
- Formulário privado de sugestões com e-mail informado pelo remetente e comentário armazenados no D1; requer `sql/d1-schema.sql` na Cloudflare.
- Cinco mascotes vetoriais originais: três etapas FREE e duas etapas PRO com conteúdo entregue pela API após liberação no D1.
- Mapa editorial dos 19 objetivos Linux Essentials 010-160 (versão 1.6), com trilhas relacionadas e lacunas explícitas.
- Estatísticas de tentativas e acertos por questão no D1 para novas rodadas verificadas de perfis sincronizados.
- Temas claro e escuro e som opcional em Configurações; layout mobile first, controles semânticos e foco visível.
- Menu principal compacto com Quiz e Terminal em Trilhas, Conquistas e Mascotes em Ranking, e Manual em Objetivos.
- Menu de ícones fixo: rótulos aparecem ao passar o mouse ou focar no desktop; no celular, os ícones ficam na barra inferior.
- Ajuda inicial sob demanda, sempre visível ou dispensada. O passeio guiado destaca áreas da tela com balões explicativos; a preferência pode ser alterada em Configurações.
- Configurações reúne Ajuda e seleção persistente entre português do Brasil e espanhol. Aulas, perguntas, explicações técnicas e parte das telas secundárias ainda usam o texto original em pt-BR; a seleção não altera o idioma do conteúdo didático.
- A interface chama as modalidades de Free e Premium; as rotas e campos internos `pro` permanecem para preservar compatibilidade com a API e o banco.
- Rodapé compacto com o endereço da unidade Montenegro do colégio e o e-mail de contato do projeto, sem repetir autoria ou apresentação institucional.
- Políticas de acesso, privacidade e armazenamento na tela Sobre.
- Aviso de armazenamento e página de privacidade/LGPD; o aplicativo não instala cookies próprios de publicidade ou análise.
- Compartilhamento voluntário do resumo do resultado por recurso nativo do aparelho, cópia de texto, WhatsApp ou Bluesky. O link compartilhado abre o projeto e não valida a pontuação.
- Identidade institucional, autoria, ano, motivo e campos para telefone/e-mail.

## Limites importantes

**Apelido não comprova identidade.** Sem sincronização, perfis e progresso pertencem ao navegador. Ao ativar a nuvem, um código aleatório permite abrir o perfil e o progresso em outro aparelho. Quem tiver o código poderá acessar e alterar esse perfil. O ranking é didático; o gabarito é público.

**Certificados são didáticos.** Não são certificados oficiais do colégio, LPI, Linux Foundation ou de outra entidade. A identidade do aluno e a integridade da nota não são verificadas no servidor.

**Terminal é uma simulação limitada.** Nada é executado no computador. Digite `help` para ver os comandos e limitações. Saídas de rede são fictícias.

**Recorte das fontes:** as fontes das questões permanecem registradas nos dados para manutenção editorial, sem aparecer durante as atividades. As 18 novas perguntas de licenças, compactação e scripts usam o [material oficial do LPI](https://learning.lpi.org/pdfstore/LPI-Learning-Material-010-160-pt.pdf) como referência. O mapa de objetivos não afirma cobertura integral. Não se afirma que todo o plano anual já tenha sido ministrado. Veja [fontes e decisões](docs/fontes.md).

**PRO por Pix manual:** Automação e Arquitetura têm 10 questões exclusivas cada. Um perfil sincronizado pode gerar um QR Code Pix a partir de R$ 9,90 quando a chave do recebedor estiver configurada na Cloudflare. Marcar o pedido como pago não libera acesso; o responsável confere o crédito no banco e ativa o perfil manualmente no D1. Veja [publicação e ativação Premium](docs/cloudflare-d1.md). Sem chave Pix configurada, a tela informa que o pedido está indisponível.

## Onde configurar seus dados

Edite `js/config.js`. O e-mail de contato informado pelo autor está publicado para solicitações sobre dados; o telefone permanece vazio. Confira ambos antes de publicar.

## Organização

```text
Linux_Flow/
  index.html          Estrutura principal e modal de perfil
  css/style.css       Tokens visuais, temas, layout e impressão
  js/config.js        Dados do projeto e contatos
  js/data.js          Questões, manuais, categorias e fontes
  js/core.js          Regras de sorteio, resultado e certificação
  js/storage.js       Persistência opcional e validação de dados locais
  js/terminal.js      Simulador determinístico isolado
  js/app.js           Navegação e controladores de interface
  assets/colegio.png  Logo institucional enviado
  functions/api/      API de perfis, progresso, ranking e Premium na Cloudflare
  cloudflare/         Acesso ao D1 e respostas HTTP das Pages Functions
  api/                API anterior da Vercel, mantida para referência
  server/             Validação compartilhada e adaptador MySQL anterior
  sql/                Esquema D1 e esquemas MySQL anteriores
  scripts/build.cjs   Publicação somente dos arquivos estáticos necessários
  tests/              Verificações das regras principais
  docs/               Guias de uso, código, segurança e publicação
  vercel.json         Build e cabeçalhos de segurança
```

## Verificações e build

Com Node.js 20 ou superior:

```bash
npm test
npm run build
```

Use `npm ci` para instalar as dependências. Os testes e o build estático não precisam de um banco remoto. O build gera `dist/` a partir de uma lista de arquivos autorizados. Não edite `dist/` diretamente.

## Manuais

- [Uso da aplicação](docs/manual-do-aluno.md)
- [Arquitetura e manutenção](docs/manual-tecnico.md)
- [Publicar no GitHub e na Cloudflare Pages com D1](docs/cloudflare-d1.md)
- [Implantação anterior: Vercel e Aiven](docs/publicacao.md)
- [Configurar Pix e ativar PRO manualmente](docs/pro-pix.md)
- [Fontes, recorte e decisões editoriais](docs/fontes.md)
- [Políticas de acesso e segurança](docs/seguranca.md)
- [Melhorias sugeridas](docs/melhorias.md)
- [Relatório de verificação](docs/validacao.md)

Os PDFs originais não foram incorporados ao repositório público. A marca do colégio mantém seus direitos próprios e identifica o contexto acadêmico. Não foi presumida uma licença aberta para materiais de terceiros. Antes de atribuir uma licença de redistribuição ao repositório, separe o código autoral dos recursos institucionais.
