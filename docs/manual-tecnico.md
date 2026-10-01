# Arquitetura e manutenção

## Mapa do código

| Área | Responsabilidade |
|---|---|
| `index.html`, `css/style.css` | Estrutura, navegação, temas e layout mobile first. |
| `js/config.js`, `js/data.js` | Contato institucional e conteúdo editorial. |
| `js/core.js`, `js/terminal.js` | Sorteio, avaliação e simulação isolada do terminal. |
| `js/storage.js`, `js/sync.js` | Estado local e comunicação com perfis sincronizados. |
| `js/app.js`, `js/community.js`, `js/i18n.js` | Interface principal, comunidade e textos da interface. |
| `functions/api/` | Rotas ativas da Cloudflare Pages. |
| `cloudflare/common.mjs`, `server/*.cjs` | Acesso ao D1, autenticação e validações compartilhadas. |
| `sql/d1-schema.sql` | Esquema inicial do banco D1. |

Os scripts do navegador carregam com `defer` na ordem declarada em `index.html`. Usam namespaces `Flow*` para que o quiz individual também funcione ao abrir o HTML localmente. As Pages Functions usam módulos no servidor e nunca são copiadas para `dist/`.

## Fluxos e invariantes

O frontend navega com fragmentos de URL (`#quiz`, `#comunidade`). Uma rodada guarda perguntas, posição, alternativa e confirmações em memória. Só resultados concluídos são persistidos. O gabarito é público: ranking e relatórios são didáticos, não prova de identidade ou nota oficial.

`js/core.js` embaralha sem modificar `js/data.js`. A avaliação compara o texto selecionado com a resposta canônica, independentemente da letra exibida. O certificado requer quiz geral com ao menos dez perguntas e proporção real de acertos de 80% ou mais.

O terminal interpreta apenas comandos previstos em uma árvore de arquivos em memória. Nunca chama shell, disco ou rede reais. Ao alterar comandos, mantenha essa fronteira e amplie os testes de domínio.

Um perfil sincronizado usa um código aleatório guardado no navegador; o D1 guarda seu hash. Quem obtiver o código pode acessar o perfil. As rotas recebem JSON com tamanho limitado, usam consultas preparadas e verificam o dono antes de expor salas ou grupos. O criador controla a sessão como mestre. Registros nominativos e relatórios individuais exigem concessão docente manual e ativa; a escola verifica a pessoa fora do aplicativo.

Salas são consultadas periodicamente pelo navegador. O servidor valida prazo, questão ativa, participação e resposta única. O relatório individual do grupo é visto pelo criador; cada participante consulta apenas o próprio desempenho. A faixa etária opcional não é retornada em placares ou relatórios.

## Alterar conteúdo

Edite categorias, perguntas e explicações em `js/data.js`. Cada pergunta precisa de ID estável, categoria existente, nível, quatro alternativas distintas, resposta presente nas alternativas e fonte editorial. As perguntas Premium ficam em `server/pro-data.cjs`. Rode `npm test` após editar conteúdo.

Para ampliar o D1 em uma publicação existente, crie uma migração numerada. `sql/d1-schema.sql` é o esquema inicial e não substitui uma migração de dados em produção.

## Executar e publicar

```bash
npm ci
npm test
npm run build
npm start
```

O build copia `index.html`, `css/`, `js/`, `assets/`, `_headers` e `_routes.json` para `dist/`. O servidor de prévia em `npm start` serve apenas os arquivos do frontend e não executa a API. Para publicar Pages Functions e ligar o banco, siga [cloudflare-d1.md](cloudflare-d1.md). Decisões e próximos passos ficam em [PROJECT_NOTES.md](../.github/PROJECT_NOTES.md).
