# Publicar Linux Flow na Cloudflare Pages com D1

Para seguir a configuração em telas curtas, com comandos copiáveis e uma revisão de segurança, abra [o guia HTML local](../guias-cloudflare/index.html). A pasta não entra no build público `dist/`.

O site estático é publicado pela **Pages**. As rotas em `functions/api/` são **Pages Functions** e usam o banco **D1**, que oferece SQL compatível com SQLite. Não se trata de colocar um arquivo `.sqlite` dentro de `dist/`: o banco fica no serviço D1 e a função o acessa por um binding. O plano anterior com Vercel/MySQL está documentado apenas no histórico Git e nas [notas de manutenção](../.github/PROJECT_NOTES.md).

## Antes de publicar

1. A conversa salva indica que a conta Cloudflare, o 2FA e a conexão com GitHub foram configurados. Confirme no painel as permissões e os códigos de recuperação; não coloque credenciais no código nem as compartilhe.
2. Confirme que o repositório `Jonathan-Eleodoro/linux-flow` contém a **versão local mais recente na raiz**. Ela deve incluir `functions/`, `cloudflare/`, `server/`, `sql/d1-schema.sql`, `package.json`, `package-lock.json`, `scripts/`, `index.html`, `css/`, `js/` e `assets/`. Inclua também `.gitignore`. Não envie `node_modules/`, `dist/`, `.env`, chaves de acesso de perfis ou credenciais.
3. Na raiz do clone, execute `npm ci`, `npm test` e `npm run build`. O build só publica os arquivos permitidos em `dist/`; as Functions são descobertas separadamente pela Pages.

## Criar o banco

1. Em **Cloudflare Dashboard → Storage & databases → D1 SQL database**, abra o banco `linux-flow-db` mostrado no binding `DB`. Antes de modificar, siga o [diagnóstico da publicação](../guias-cloudflare/11-validacao-publica.html) para ver o que já existe.
2. Na aba **Console** desse banco, aplique [`sql/d1-schema.sql`](../sql/d1-schema.sql) e as migrações [001](../sql/migrations/001-premium-approval.sql), [002](../sql/migrations/002-educator-access.sql), [003](../sql/migrations/003-financial-retention.sql), [004](../sql/migrations/004-ranking-synced.sql) e [005](../sql/migrations/005-financial-retention-guard.sql), nessa ordem, **somente se faltarem**. A 001 não pode ser repetida. Em banco com dados, faça backup antes; a 004 remove pontuações legadas sem perfil e rodada verificada. A 005 recusa encurtar o prazo financeiro já registrado.

```powershell
npx wrangler d1 execute linux-flow-db --remote --file=sql/d1-schema.sql
npx wrangler d1 execute linux-flow-db --remote --file=sql/migrations/001-premium-approval.sql
npx wrangler d1 execute linux-flow-db --remote --file=sql/migrations/002-educator-access.sql
npx wrangler d1 execute linux-flow-db --remote --file=sql/migrations/003-financial-retention.sql
npx wrangler d1 execute linux-flow-db --remote --file=sql/migrations/004-ranking-synced.sql
npx wrangler d1 execute linux-flow-db --remote --file=sql/migrations/005-financial-retention-guard.sql
```
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

- Rode `npm run smoke:live` na raiz do clone. A checagem usa somente GET, não cria perfis nem imprime apelidos; ela informa o SHA público do deploy e falha enquanto site, commit, saúde da API ou leitura do ranking não passarem. Compare o SHA com `git rev-parse --short HEAD`. O [guia público](../guias-cloudflare/11-validacao-publica.html) detalha o diagnóstico.
- Acesse `/api/health`: `{"status":"ready"}` com HTTP 200 confirma a Function, o binding `DB`, as 20 tabelas, os 14 gatilhos necessários e a ausência de pedidos sem arquivo financeiro. Em 03/10/2026, a URL pública retornou HTTP 503; veja o [passo a passo de diagnóstico](../guias-cloudflare/11-validacao-publica.html). A rota não mostra nomes de tabelas nem dados pessoais; ela não substitui testes funcionais.
- Abra o site no celular e no computador; teste as trilhas, o quiz e o terminal.
- Acesse `/api/ranking?category=all&level=1&total=10`: antes de publicar resultados, a resposta deve ser `{"ranking":[]}`. Se receber erro 503, verifique o binding `DB`, o esquema e os logs das Functions.
- Crie um perfil de teste, ative a sincronização, anote o código de acesso e recarregue. Confira se o progresso reaparece. Faça um quiz com publicação opcional e confira o ranking.
- Em **Comunidade**, crie dois perfis sincronizados fictícios. Com o primeiro, abra um duelo; com o segundo, entre pelo código. Confirme que só o criador inicia e avança, que cada pessoa responde uma vez por questão e que o cronômetro bloqueia respostas tardias. Sem concessão docente, o criador não vê os registros nominativos nem o progresso do segundo perfil no grupo. Depois, no D1 de **Preview**, simule aprovação e revogação conforme o [guia de acesso docente](../guias-cloudflare/10-acesso-docente.html). A partida rápida individual abre o quiz existente.
- Envie uma sugestão de teste e confira uma linha em `feedback_comments` no console D1. Teste a exclusão do perfil na tela de privacidade.
- Se configurar Pix, gere um pedido, confira valor e recebedor no aplicativo bancário e teste a mudança para `claimed`. **Não conceda Premium sem confirmar o crédito no extrato bancário.** Depois de aplicar a migração 001, o Console D1 precisa de **uma única atualização**. Antes, consulte o pedido e confira perfil, valor, `txid` e estado. Use a referência única do extrato bancário, nunca a referência digitada pelo aluno:

```sql
UPDATE pro_requests
SET status = 'approved',
    confirmed_payment_reference = 'REFERENCIA_UNICA_DO_EXTRATO',
    approved_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
WHERE id = 'ID_DO_PEDIDO' AND status = 'claimed' AND amount_cents = 990;
```

Troque `990` pelo valor exato do pedido em centavos. O gatilho grava o acesso na mesma operação; se faltar referência, o pedido não estiver declarado ou a referência já tiver sido usada, a atualização inteira falha. Depois confira `pro_requests.status = 'approved'` e a linha correspondente em `pro_entitlements`. Não execute o SQL antigo de duas etapas.

Após a migração 003, excluir um perfil remove os dados de estudo e os pedidos ligados a ele, mas mantém um histórico independente em `financial_records` e `financial_events` por **pelo menos um ano após o último evento**. Os registros preservam ID do perfil, valor, identificador Pix, referências, concessão do acesso e decisões; o acesso deve ficar restrito a operadores autorizados. A migração só recupera o estado atual de pedidos anteriores, não transições já perdidas. Extratos bancários e comprovantes externos precisam de guarda própria. O prazo de um ano é um mínimo técnico definido pelo projeto, não uma conclusão sobre obrigações fiscais. Antes da venda, defina com orientação profissional o prazo total, comprovantes, acesso e descarte após o período aplicável.

## Operação e custos

No plano gratuito, a Pages tem até 500 builds por mês. Requisições estáticas não consomem a cota das Functions; as Functions entram na cota gratuita de Workers. O D1 gratuito tem limites próprios de consultas e armazenamento. Confira o uso nos painéis de **Workers & Pages** e **D1**. Quando a cota D1 é excedida, as consultas param até o próximo ciclo; o site estático pode continuar abrindo, mas perfil, ranking, sugestões e Premium deixam de responder.

Exporte o D1 antes de alterações importantes com `npx wrangler d1 export linux-flow-db --remote --output=backup.sql` e mantenha o arquivo fora do repositório, pois contém dados pessoais. O pedido de exclusão de sugestões recebidas por e-mail ainda é manual: pesquise e remova as linhas correspondentes no Console D1 após verificar o solicitante.

Depois que o domínio Pages estiver testado, **Vercel e Aiven não serão necessários** para esta implantação. Como nenhum dado foi cadastrado no Aiven, basta validar os fluxos no D1. A Cloudflare passa a hospedar o frontend, a API e o banco.

## Limites pedagógicos da comunidade

O "mestre" é o criador da sala ou grupo e controla a sessão pelo código do próprio perfil. Criar uma sala ou grupo **não concede** acesso a registros nominativos ou resultados de outros integrantes. Esses dados exigem uma concessão docente manual, vinculada ao perfil e revogável no D1; a escola ainda precisa verificar a pessoa, definir quem autoriza e guardar a decisão fora do GitHub. Os relatórios usam quizzes verificados pela API, cujo gabarito está no código público; não servem como nota escolar oficial. A faixa etária é opcional, guardada como intervalo e não aparece em salas ou relatórios. Antes de usar com menores em uma turma real, defina com a escola regras de autorização, retenção, moderação e gestão de acesso. Não peça data de nascimento, nome completo ou e-mail dos alunos nas salas.

Documentação: [Pages com GitHub](https://developers.cloudflare.com/pages/get-started/git-integration/), [Pages Functions](https://developers.cloudflare.com/pages/functions/get-started/), [binding D1](https://developers.cloudflare.com/pages/functions/bindings/), [D1 pricing](https://developers.cloudflare.com/d1/platform/pricing/), [D1 limits](https://developers.cloudflare.com/d1/platform/limits/) e [Wrangler D1](https://developers.cloudflare.com/d1/wrangler-commands/).
