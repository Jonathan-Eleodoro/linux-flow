# Linux_Flow

Quiz e laboratório de aprendizagem de Linux, criado para a disciplina Sistemas operacionais Linux do curso Técnico em Informática do **Colégio Sinodal Progresso**.

**Aluno:** Jonathan Eleodoro · **Professor:** Cristiano Forte · **Ano:** 2026.

O objetivo é transformar os conteúdos das aulas em prática interativa: responder, compreender o erro, consultar o material e experimentar novamente.

## Experimente em dois passos

1. Extraia o ZIP inteiro, preservando as pastas.
2. Abra `index.html` no navegador. Não abra o HTML de dentro do ZIP.

Não há bibliotecas de terceiros, fontes remotas, chave de API ou instalação obrigatória. A interface e os exercícios funcionam offline quando abertos a partir dos arquivos extraídos. Não é um PWA: uma versão hospedada não garante recarregamento offline.

Para desenvolvimento com uma origem HTTP estável, execute na pasta do projeto:

```bash
python -m http.server 4173
```

Acesse `http://localhost:4173`. Em Windows, se necessário, use `py -m http.server 4173`. O salvamento via `file://` depende das regras de cada navegador; HTTP é preferível para verificar persistência.

## O que está implementado

- Tela inicial com nome, aluno, descrição e acesso direto ao quiz.
- 99 questões, 9 assuntos e 3 níveis; seleção de quantidade conforme disponibilidade.
- Perguntas e alternativas embaralhadas sem repetição na rodada.
- Confirmação de resposta, correção imediata, explicação e fonte do material.
- Resultado com perguntas, acertos, erros e aproveitamento; revisão e recomendações por erros.
- Cadastro simples de apelido, troca de perfis e persistência local opcional.
- Ranking imediato por assunto, dificuldade e quantidade, com melhor tentativa por perfil.
- Seis missões com terminal simulado e histórico de comandos por setas.
- 90 entradas no manual pesquisável; mapa de arquitetura e comparação DEB/RPM.
- Mascotes por nível e certificados didáticos imprimíveis/salváveis em PDF.
- Temas claro e escuro, som opcional, layout mobile first, controles semânticos e foco visível.
- Políticas de acesso, privacidade e armazenamento na tela Sobre.
- Identidade institucional, autoria, ano, motivo e campos para telefone/e-mail.

## Limites importantes

**Cadastro local não é autenticação.** Não existe senha ou servidor de usuários. Perfis e ranking pertencem a um navegador/origem, e não a uma turma inteira conectada pela internet. Qualquer pessoa com acesso ao dispositivo pode escolher outro perfil.

**Certificados são didáticos.** Não são certificados oficiais do colégio, LPI, Linux Foundation ou de outra entidade. A identidade do aluno e a integridade da nota não são verificadas no servidor.

**Terminal é uma simulação limitada.** Nada é executado no computador. Digite `help` para ver os comandos e limitações. Saídas de rede são fictícias.

**Recorte das fontes:** foram usados somente os anexos como base de consulta. Não se afirma que todo o plano anual já tenha sido ministrado. `less`, `more` e `wget` não receberam entradas avaliativas sem apoio textual suficiente no material lido. Veja [fontes e decisões](docs/fontes.md).

## Onde configurar seus dados

Edite `js/config.js`. Os campos `phone` e `email` estão vazios e a interface mostra “Não informado”. Preencha somente contatos que deseja publicar. Os campos não são validados como canais ativos.

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
  scripts/build.cjs   Publicação somente dos arquivos necessários
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

Não é necessário `npm install`: o projeto não declara dependências. O build gera `dist/` a partir de uma lista de arquivos autorizados. Não edite `dist/` diretamente.

## Manuais

- [Uso da aplicação](docs/manual-do-aluno.md)
- [Arquitetura e manutenção](docs/manual-tecnico.md)
- [Publicar no GitHub e na Vercel](docs/publicacao.md)
- [Fontes, recorte e decisões editoriais](docs/fontes.md)
- [Políticas de acesso e segurança](docs/seguranca.md)
- [Melhorias sugeridas](docs/melhorias.md)
- [Relatório de verificação](docs/validacao.md)

Os PDFs originais não foram incorporados ao repositório público. A marca do colégio mantém seus direitos próprios e identifica o contexto acadêmico. Não foi presumida uma licença aberta para materiais de terceiros. Antes de atribuir uma licença de redistribuição ao repositório, separe o código autoral dos recursos institucionais.
