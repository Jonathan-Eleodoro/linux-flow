# Manual técnico e escolhas de implementação

## Por que HTML, CSS e JavaScript nativos

A entrega acadêmica deve ser fácil de abrir, ler, modificar e hospedar. O aplicativo não precisa de biblioteca visual, framework, banco externo ou chave de API para cumprir seu fluxo local. O JavaScript é dividido por responsabilidade, em vez de ficar inteiro em um HTML monolítico.

Os scripts usam `defer` e carregam em ordem explícita: configuração, conteúdo, regras, armazenamento, terminal e interface. Pequenos namespaces globais (`FlowData`, `FlowCore`, `FlowStore`, `FlowTerminal`) conectam os módulos. Essa escolha permite abrir por `file://`, sem as restrições de módulos ES nesse protocolo. Em uma evolução com bundler, a migração para `import/export` é recomendada.

## Fluxo da aplicação

A navegação usa fragmentos de URL (`#trilhas`, `#quiz`, etc.). Isso dispensa regras de reescrita no servidor e mantém links internos reproduzíveis.

Uma rodada registra configurações, questões sorteadas, índice atual, alternativa selecionada, confirmação e respostas. Uma resposta só entra na contagem depois da confirmação. Botões são desabilitados para evitar nova resposta à mesma pergunta. O resultado só é persistido no fim da rodada.

A fonte de verdade da nota é a comparação entre `selected` e `question.answer`. Não há dependência do índice da alternativa, porque as alternativas são embaralhadas. Ao voltar do manual, a interface reconstitui a seleção ou correção sem somar pontos novamente.

## Algoritmos e regras

**Fisher–Yates:** percorre o vetor de trás para frente e troca cada posição por um índice sorteado no trecho ainda disponível. Tempo O(n), cópia O(n); não altera o banco. `Math.random` é suficiente para variedade didática, mas não para sorteios auditáveis ou segurança.

**Resultado:** acertos / total × 100. A interface arredonda a porcentagem para exibição. O certificado compara a fração real com 0,8, sem usar a porcentagem arredondada.

**Ranking:** filtra assunto, nível e quantidade; ordena por proporção de acertos e data; seleciona a primeira ocorrência de cada usuário. Mantém no máximo 20 posições exibidas e 300 resultados recentes persistidos. Não soma tentativas para premiar repetição indiscriminada.

**Recomendação:** conta erros por categoria na última rodada e sugere até três assuntos com mais erros. É uma regra explicável, não um modelo de IA ou diagnóstico pedagógico validado.

**Certificados:** um resultado geral com 10+ questões e 80%+ dá acesso ao nível correspondente. Não exige liberar níveis em ordem. O ID é somente um identificador de registro local, sem verificador online.

## Alterar o conteúdo

Edite `js/data.js`. Cada questão contém:

```javascript
{
  id: 'arquivos-1',            // Único, estável e sem dados pessoais
  category: 'arquivos',        // ID existente em categories
  level: 1,                   // 1, 2 ou 3
  prompt: 'Qual é a finalidade de pwd?',
  code: 'pwd',                // Exemplo opcional; não é executado
  answer: 'Mostrar o caminho completo do diretório atual',
  options: [/* exatamente quatro textos distintos, incluindo answer */],
  explanation: 'Mostra o diretório de trabalho atual.',
  source: 'Jonathan Eleodoro - Exercícios.pdf'
}
```

O manual tem suas próprias entradas editoriais no mesmo arquivo. Ao alterar explicações, mantenha questões e manual consistentes. Adicionar um assunto exige também uma entrada em `categories`. A quantidade disponível é calculada automaticamente. Faça revisão pedagógica dos distratores, não apenas teste de sintaxe.

## Estilo e acessibilidade

O CSS começa pelo celular. Media queries de 600 e 1000 px expandem colunas e navegação. Tokens em `:root` concentram cores e temas; não há fontes remotas. O fundo quadriculado sutil e os cards seguem a inspiração enviada.

Há títulos hierárquicos, labels, botões reais, região de status, foco visível, link de salto, feedback escrito e respeito a `prefers-reduced-motion`. A navegação móvel usa uma faixa horizontal rolável. Tabelas podem rolar dentro do próprio contêiner. Isso não constitui auditoria completa de conformidade WCAG.

## Segurança e persistência

Consulte `seguranca.md`. O código escapa conteúdo variável antes de inserir templates e usa `textContent` no terminal. Não confie em localStorage para proteção: ele é controlado pelo cliente. A leitura valida o formato dos registros e limita tamanho e quantidade, mas não autentica notas.

O terminal tem uma árvore em `Map`, caminhos normalizados e comandos explicitamente reconhecidos. Não chama shell, sistema de arquivos do host ou rede. Arquivos de simulação desaparecem ao trocar/reiniciar missão.

O Web Audio usa osciladores curtos, sem downloads. A preferência não inicia reprodução automática ao carregar a página.

Existe um pequeno adaptador opcional de leitura para WebMCP, quando `document.modelContext` estiver disponível. Ele retorna apenas nomes de trilhas e contagem por nível; não lê perfis ou responde questões. Ausência ou falha da API não afeta a aplicação. Não é necessário ao projeto.

## Build e publicação

`node scripts/build.cjs` copia somente `index.html`, `css`, `js` e `assets` para `dist/`. Assim, a Vercel não serve arquivos de desenvolvimento nem manuais internos. `vercel.json` define diretório de saída e cabeçalhos de segurança.

Não há dependências NPM ou lockfile: nenhum pacote precisa ser resolvido. Execute `npm test` para verificar o domínio e `npm run build` para preparar a distribuição. O script `npm start` é apenas um atalho para o servidor Python quando `python` está disponível.
