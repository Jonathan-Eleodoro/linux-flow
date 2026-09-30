# Implantação anterior: perfis, progresso e ranking com Aiven MySQL

Nenhum dado real foi cadastrado no Aiven. A publicação atual usa Cloudflare Pages e D1; siga [cloudflare-d1.md](cloudflare-d1.md).

Na versão hospedada, cada perfil pode ativar a sincronização na tela **Sobre**. O site gera um código aleatório de 64 caracteres. A API guarda somente o hash desse código; quem tiver o código pode abrir o perfil em outro navegador. Guarde-o fora do computador compartilhado. Não há recuperação por e-mail ou senha.

Ao ativar, o histórico local de resultados e missões é enviado ao banco. Esses resultados antigos preservam o progresso, mas não entram automaticamente no ranking compartilhado: o servidor não recebeu as respostas originais para conferir a pontuação. Nas novas rodadas, a API confere as alternativas com o gabarito, salva o resultado no perfil e os totais de tentativas e acertos por questão. Publica no ranking apenas se a opção de compartilhamento estiver ligada. O ranking segue didático porque o gabarito é público.

## Configurar

1. No [console da Aiven](https://console.aiven.io/), crie um serviço **MySQL Free** ou use o que já tiver. Na página do serviço, anote host, porta, usuário, senha e banco; baixe o certificado CA do projeto.
2. Conecte pelo cliente MySQL ou MySQL Workbench com TLS. Execute [ranking.sql](../sql/ranking.sql), [profiles.sql](../sql/profiles.sql) e [feedback.sql](../sql/feedback.sql) no mesmo banco. Eles podem ser reexecutados. Se você já criou as tabelas anteriores, execute `feedback.sql` para habilitar o formulário de sugestões.
3. Na Vercel, em **Project → Settings → Environment Variables**, configure `AIVEN_MYSQL_HOST`, `AIVEN_MYSQL_PORT`, `AIVEN_MYSQL_USER`, `AIVEN_MYSQL_PASSWORD`, `AIVEN_MYSQL_DATABASE` e `AIVEN_MYSQL_CA`. No último campo, cole o certificado PEM completo, preservando quebras de linha ou usando `\n`. Configure os ambientes usados pelo projeto e faça um novo deploy.
4. No site publicado, abra um perfil local e, na tela **Sobre**, clique em **Ativar sincronização deste perfil**. Guarde o código exibido. Conclua uma missão e um quiz. Em outro navegador, clique em **Criar perfil → Abrir perfil da nuvem** e cole o código. Confira o progresso recuperado. A aba **Compartilhado** do ranking só mostra rodadas publicadas voluntariamente.

O arquivo [.env.example](../.env.example) lista os nomes das variáveis, sem valores. Inclua o `.gitignore` no GitHub: ele impede o envio acidental de `.env`, `node_modules` e `dist`. Nunca publique a senha do MySQL nem o código de acesso de um aluno. O certificado CA sozinho não é uma senha, mas pertence à configuração do servidor.

## Dados e limites

- O site aberto como arquivo local ou servido com `npm start` não executa a API. O quiz continua utilizável; perfis sincronizados e ranking compartilhado exigem a versão hospedada com o banco configurado.
- O código de acesso é uma credencial: quem o possuir pode ver, modificar e apagar o perfil da nuvem. A API guarda seu hash, mas o navegador precisa manter o código para sincronizar automaticamente.
- A sincronização une resultados e missões por identificador. Duas abas ou aparelhos podem atualizar o mesmo perfil; apelido e opção de ranking usam a última alteração recebida. Preferências de tema e som permanecem locais.
- Resultados feitos sem conexão ficam locais. Quando a conexão volta, podem ser enviados como histórico sem verificação das respostas e não são publicados automaticamente no ranking.
- As estatísticas por questão começam nas novas rodadas verificadas após a criação de `profile_question_stats`. Resultados importados anteriormente não têm respostas detalhadas para reconstruir essas estatísticas. O mapa de objetivos mostra trilhas relacionadas, não cobertura integral de cada objetivo.
- **Apagar dados locais** remove a cópia e o código deste navegador, mas não apaga o banco. **Apagar perfil da nuvem** remove perfil, progresso e pontuações publicadas daquele perfil do banco; a cópia local permanece.
- A API valida estrutura e recalcula acertos das novas rodadas, mas o gabarito público permite automação. Não use o ranking como nota oficial. O plano gratuito da Aiven pode ser desligado após inatividade; nesse caso, o estudo local continua.
- Sugestões ficam em `feedback_comments`, com e-mail informado pelo remetente e comentário privado. O e-mail não é verificado. Para revisar: `SELECT email, comment, created_at FROM feedback_comments ORDER BY created_at DESC LIMIT 100;`. Para atender a um pedido de exclusão, confirme o endereço por canal apropriado antes de executar `DELETE FROM feedback_comments WHERE email = ?` com o e-mail correspondente. A API limita a três envios por endereço a cada 24 horas.

Referências: [Aiven MySQL Free](https://aiven.io/docs/products/mysql/concepts/mysql-free-tier), [conexão TLS](https://aiven.io/docs/products/mysql/howto/connect-from-mysql-workbench), [Vercel Functions](https://vercel.com/docs/functions/runtimes/node-js).

Para habilitar contribuições Pix e a liberação manual das etapas PRO, siga [pro-pix.md](pro-pix.md). A chave Pix, o nome do recebedor e a cidade são configurados separadamente das credenciais MySQL.
