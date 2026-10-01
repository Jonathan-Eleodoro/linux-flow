# Publicar Linux Flow na Cloudflare Pages com D1

Para seguir a configuração em telas curtas, com comandos copiáveis e uma revisão de segurança, abra [o guia HTML local](../guias-cloudflare/index.html). A pasta não entra no build público `dist/`.

O site estático é publicado pela **Pages**. As rotas em `functions/api/` são **Pages Functions** e usam o banco **D1**, que oferece SQL compatível com SQLite. Não se trata de colocar um arquivo `.sqlite` dentro de `dist/`: o banco fica no serviço D1 e a função o acessa por um binding. O plano anterior com Vercel/MySQL está documentado apenas no histórico Git e nas [notas de manutenção](../.github/PROJECT_NOTES.md).

## Antes de publicar

1. A conversa salva indica que a conta Cloudflare, o 2FA e a conexão com GitHub foram configurados. Confirme no painel as permissões e os códigos de recuperação; não coloque credenciais no código nem as compartilhe.
2. Confirme que o repositório `Jonathan-Eleodoro/linux-flow` contém a **versão local mais recente na raiz**. Ela deve incluir `functions/`, `cloudflare/`, `server/`, `sql/d1-schema.sql`, `package.json`, `package-lock.json`, `scripts/`, `index.html`, `css/`, `js/` e `assets/`. Inclua também `.gitignore`. Não envie `node_modules/`, `dist/`, `.env`, chaves de acesso de perfis ou credenciais.
3. Na raiz do clone, execute `npm ci`, `npm test` e `npm run build`. O build só publica os arquivos permitidos em `dist/`; as Functions são descobertas separadamente pela Pages.

## Criar o banco

1. Em **Cloudflare Dashboard → Storage & databases → D1 SQL database**, crie um banco, por exemplo `linux-flow`.
2. Na aba **Console** desse banco, execute o conteúdo de [`sql/d1-schema.sql`](../sql/d1-schema.sql). O script usa `CREATE TABLE IF NOT EXISTS`, então pode ser repetido. Alternativamente, no terminal autenticado pelo Wrangler, na raiz do clone, rode `npx wrangler d1 execute linux-flow --remote --file=sql/d1-schema.sql`.
3. Confira que as tabelas de perfil, ranking, sugestões e Premium aparecem, além de `game_rooms`, `game_members`, `game_answers`, `game_events`, `study_groups`, `study_members`, `study_suggestions` e `community_profiles`. Como nenhum dado foi colocado no Aiven, não há importação de dados.

## Conectar GitHub e publicar

1. Em **Workers & Pages → Create application → Pages → Connect to Git**, selecione `Jonathan-Eleodoro/linux-flow` e a branch que receberá as atualizações. Confirme que o tipo criado é **Pages**, não **Worker**.
2. Deixe **Root directory** na raiz do repositório (campo vazio ou `/`), configure **Build command** como `npm run build` e **Build output directory** como `dist`. Deixe o framework como **None**. A Pages instala as dependências do `package-lock.json` e publica a cada push na branch de produção. **Não use `npx wrangler deploy` no campo Deploy command**: esse comando é de Worker e pode tentar enviar a raiz inteira, inclusive `node_modules/`.
3. Em **Settings → Functions**, defina uma data de compatibilidade recente, ao menos `2026-08-04`, em **Production** e **Preview**. O fluxo atual usa Web Crypto e QR em SVG, sem `require("node:crypto")` no Pix. O build copia `_routes.json` para `dist/`, limitando as invocações das Functions a `/api/*`.
4. Em **Settings → Bindings → Add → D1 database**, vincule o banco criado à variável **`DB`**. Faça isso no ambiente **Production**; se testar previews, use um banco D1 separado e outro binding `DB` em **Preview**. Salve e faça **Redeploy** após adicionar o binding.
5. Em **Settings → Variables and Secrets**, configure `PIX_KEY`, `PIX_RECEIVER_NAME` e `PIX_RECEIVER_CITY` apenas quando for oferecer o Pix. Guarde a chave como secret e faça redeploy. Sem as três variáveis, a solicitação Premium permanece indisponível. Nunca coloque esses valores no GitHub.

### Se o primeiro deploy falhou

O HTML salvo da conversa de 01/10/2026 mostra três falhas distintas: `npx wrangler deploy` tentou publicar a raiz do repositório como Worker e encontrou `node_modules/workerd` maior que 25 MiB; o empacotamento das Pages Functions encontrou `require("node:crypto")` no Pix; e mudar o **Root directory** para `dist` causou `Cannot find cwd`, porque `dist` só surge depois do build. O código do Pix e do hash foi adaptado para Web Crypto e o QR usa SVG.

No painel, devolva **Root directory** para a raiz/vazio, mantenha **Build output directory** em `dist` e **Build command** em `npm run build`. Confirme que a aplicação é Pages e que nenhum comando de Worker (`npx wrangler deploy`) será executado. Não renomeie nem exclua `functions/`: isso desativa perfil, ranking, grupos e Premium. `Build watch paths` controla quando um build dispara; não corrige a pasta de assets. Não crie `.pagesignore` para esconder as Functions.

Em 01/10/2026, um `wrangler.jsonc` parcial foi reintroduzido no GitHub. Ele contém nome, data e compatibilidade, mas **não** define `pages_build_output_dir` nem binding D1; foi convertido de UTF-16 para UTF-8. Use o painel para Pages e D1 até decidir migrar toda a configuração. Se adicionar `pages_build_output_dir`, o arquivo passa a ser fonte de verdade também para bindings: inclua os IDs reais dos bancos de Production e Preview e revise variáveis/segredos antes do deploy. Leia o [diagnóstico passo a passo](../guias-cloudflare/06-diagnostico.html).

O pequeno `functions/package.json` contém apenas `{"type":"module"}` para delimitar o formato dos arquivos `.js` das Functions. Não instala dependências nem cria um segundo build; deixe-o enquanto as Functions usam `import`/`export`.

## Verificar no endereço `*.pages.dev`

- Abra o site no celular e no computador; teste as trilhas, o quiz e o terminal.
- Acesse `/api/ranking?category=all&level=1&total=10`: antes de publicar resultados, a resposta deve ser `{"ranking":[]}`. Se receber erro 503, verifique o binding `DB`, o esquema e os logs das Functions.
- Crie um perfil de teste, ative a sincronização, anote o código de acesso e recarregue. Confira se o progresso reaparece. Faça um quiz com publicação opcional e confira o ranking.
- Em **Comunidade**, crie dois perfis sincronizados de teste. Com o primeiro, abra um duelo; com o segundo, entre pelo código. Confirme que só o mestre inicia e avança, que cada pessoa responde uma vez por questão, que o cronômetro bloqueia respostas tardias e que o registro do mestre mostra os eventos. Depois crie um grupo, entre com o segundo perfil, envie uma sugestão e confira o relatório. A partida rápida individual abre o quiz existente.
- Envie uma sugestão de teste e confira uma linha em `feedback_comments` no console D1. Teste a exclusão do perfil na tela de privacidade.
- Se configurar Pix, gere um pedido, confira valor e recebedor no aplicativo bancário e teste a mudança para `claimed`. **Não conceda Premium sem confirmar o crédito no extrato bancário.** Para ativar manualmente, execute as duas instruções no Console D1, com o ID real do pedido e a referência real do pagamento:

```sql
UPDATE pro_requests
SET status = 'approved', approved_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
WHERE id = 'ID_DO_PEDIDO' AND status = 'claimed';

INSERT INTO pro_entitlements (profile_id, request_id, payment_reference)
SELECT profile_id, id, 'REFERENCIA_UNICA_DO_EXTRATO'
FROM pro_requests WHERE id = 'ID_DO_PEDIDO' AND status = 'approved';
```

Antes de executar, confirme que o pedido pertence ao perfil esperado, que a quantia foi creditada e que a referência ainda não foi usada. Execute uma instrução de cada vez; se a primeira atualização não atingir exatamente uma linha, não insira o entitlement. Se a segunda falhar, o pedido ficará aprovado sem acesso; corrija a referência e repita apenas a segunda instrução.

## Operação e custos

No plano gratuito, a Pages tem até 500 builds por mês. Requisições estáticas não consomem a cota das Functions; as Functions entram na cota gratuita de Workers. O D1 gratuito tem limites próprios de consultas e armazenamento. Confira o uso nos painéis de **Workers & Pages** e **D1**. Quando a cota D1 é excedida, as consultas param até o próximo ciclo; o site estático pode continuar abrindo, mas perfil, ranking, sugestões e Premium deixam de responder.

Exporte o D1 antes de alterações importantes com `npx wrangler d1 export linux-flow --remote --output=backup.sql` e mantenha o arquivo fora do repositório, pois contém dados pessoais. O pedido de exclusão de sugestões recebidas por e-mail ainda é manual: pesquise e remova as linhas correspondentes no Console D1 após verificar o solicitante.

Depois que o domínio Pages estiver testado, **Vercel e Aiven não serão necessários** para esta implantação. Como nenhum dado foi cadastrado no Aiven, basta validar os fluxos no D1. A Cloudflare passa a hospedar o frontend, a API e o banco.

## Limites pedagógicos da comunidade

O "mestre" é o criador da sala ou grupo e controla a sessão pelo código do próprio perfil. **Ainda não há validação institucional de quem é professor.** Os relatórios do grupo usam apenas quizzes verificados pela API, cujo gabarito está no código público; não servem como nota escolar oficial. A faixa etária é opcional, guardada como intervalo e não aparece em salas ou relatórios. Antes de usar com menores em uma turma real, defina com a escola regras de autorização, retenção, moderação e gestão de acesso. Não peça data de nascimento, nome completo ou e-mail dos alunos nas salas.

Documentação: [Pages com GitHub](https://developers.cloudflare.com/pages/get-started/git-integration/), [Pages Functions](https://developers.cloudflare.com/pages/functions/get-started/), [binding D1](https://developers.cloudflare.com/pages/functions/bindings/), [D1 pricing](https://developers.cloudflare.com/d1/platform/pricing/), [D1 limits](https://developers.cloudflare.com/d1/platform/limits/) e [Wrangler D1](https://developers.cloudflare.com/d1/wrangler-commands/).
