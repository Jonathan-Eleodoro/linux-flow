# Do projeto ao GitHub público e à Vercel

Este guia usa as contas que você já possui. O projeto não foi publicado nem conectado às suas contas durante a criação. Os nomes de telas podem variar; nenhuma documentação externa foi consultada, respeitando o pedido de trabalhar somente com os anexos.

## 1. Prepare a pasta

1. Baixe e extraia `Linux_Flow.zip`.
2. Entre na pasta que contém **index.html**, **package.json** e **vercel.json**.
3. Abra `index.html` e experimente a aplicação.
4. Edite `js/config.js` para preencher `phone` e `email`, se quiser publicá-los. Caso contrário, ficam “Não informado”.
5. Confira nome, instituição, ano e professor.
6. Se Node.js já estiver instalado, execute `npm test` e `npm run build` nessa pasta. Não precisa instalar dependências.

Não envie o ZIP de aulas ou arquivos pessoais ao repositório. O pacote do projeto já está separado dos PDFs originais.

## 2. Crie o repositório público

No [GitHub](https://github.com):

1. Use **New repository**.
2. Nome sugerido: `linux-flow`.
3. Descrição: `Quiz e laboratório interativo de Linux — projeto acadêmico de Jonathan Eleodoro.`
4. Selecione **Public**.
5. Se for usar os comandos abaixo, crie o repositório vazio, sem adicionar README automaticamente: o projeto já possui um.
6. Crie o repositório.

### Opção A — Enviar pelo navegador

1. No repositório, use **Add file → Upload files**, ou o link de upload na tela do repositório vazio.
2. Arraste o conteúdo **de dentro** da pasta `Linux_Flow`: `index.html`, pastas `css`, `js`, `assets`, `docs`, `scripts`, `tests` e arquivos de configuração.
3. Não arraste somente o ZIP; ele não é um site executável no repositório.
4. Verifique que `index.html` e `vercel.json` aparecem na raiz, não dentro de outra pasta `Linux_Flow`.
5. Mensagem do commit: `Adiciona Linux_Flow com quiz, trilhas e laboratório`.
6. Confirme o envio.

A interface pode ocultar arquivos iniciados por ponto. O `.gitignore` é útil para desenvolvimento, mas sua ausência não impede a aplicação de funcionar. Não envie `dist/`, `node_modules/` ou `.env`.

### Opção B — Enviar com Git

Abra Git Bash ou terminal na pasta extraída e execute:

```bash
git init
git branch -M main
git add .
git commit -m "Adiciona Linux_Flow com quiz, trilhas e laboratório"
git remote add origin https://github.com/SEU_USUARIO/linux-flow.git
git push -u origin main
```

Substitua `SEU_USUARIO` pelo seu usuário GitHub. Se o Git pedir nome e e-mail, configure sua identidade de commit; você pode usar o endereço privado/noreply fornecido pelo GitHub. Use autenticação pelo navegador/Git Credential Manager quando oferecida. Não coloque token ou senha em arquivos do projeto.

Se o repositório remoto já possuir commits, prefira clonar esse repositório e copiar os arquivos para ele. Não use push forçado para contornar diferenças sem entender o que será sobrescrito.

**Link da entrega:** `https://github.com/SEU_USUARIO/linux-flow`.

## 3. Importe na Vercel

No [painel da Vercel](https://vercel.com/dashboard):

1. Escolha criar/importar um projeto, geralmente **Add New → Project**.
2. Conecte GitHub se ainda não estiver conectado.
3. Autorize acesso ao repositório `linux-flow` e selecione **Import**.
4. A pasta raiz deve ser a pasta que contém `package.json` e `vercel.json`.
5. O projeto é estático. Se for solicitado um preset, escolha **Other**.
6. Confira:

| Configuração | Valor |
|---|---|
| Framework | Other / sem framework |
| Root directory | Raiz do repositório |
| Build command | `node scripts/build.cjs` |
| Output directory | `dist` |
| Dependências | Nenhuma dependência externa |
| Variáveis de ambiente | Nenhuma necessária |

O `vercel.json` já contém build e saída. Não escolha Next.js ou React para este projeto.

7. Clique em **Deploy**.
8. Aguarde o estado de conclusão e abra o domínio fornecido pela Vercel. O endereço exato depende da disponibilidade do nome e da sua conta.

## 4. Confira o site publicado

- Crie um perfil temporário, faça um quiz e veja o resultado.
- Confira o logo, tema claro/escuro e navegação no celular.
- Faça uma missão do terminal.
- Confira a busca por `chmod` no manual.
- Faça uma rodada geral de dez questões para testar certificação.
- Se marcou persistência, recarregue para conferir o perfil.
- Na tela Sobre, apague seus dados de teste.

O ranking seguirá local após a publicação. Publicar na Vercel não cria automaticamente um banco de dados ou ranking global.

## 5. Atualize depois

Modifique os arquivos de origem, faça os testes e envie novo commit. Com a integração configurada, a Vercel costuma gerar uma nova implantação a partir do repositório; confirme o estado no painel.

```bash
git add .
git commit -m "Atualiza conteúdo das trilhas"
git push
```

Não edite a pasta `dist` para manter mudanças: ela é recriada pelo build.

## Problemas frequentes

| Situação | Verificação |
|---|---|
| Página não encontrada | `index.html` precisa existir em `dist` depois do build; confira raiz e output directory. |
| Sem estilo ou scripts | Preserve nomes e estrutura de `css`, `js` e `assets`; extraia o ZIP inteiro. |
| Perfil não aparece em outro aparelho | Esperado: os dados são locais por navegador e origem. |
| Resultados sumiram ao mudar de URL | Domínios e endereços locais diferentes têm armazenamentos separados. |
| Certificado bloqueado | Use quiz geral, 10+ questões e 80%+ de acerto. |
| Site abre, mas o ranking da turma está vazio | Esta versão não possui ranking centralizado. |
| Print inclui menu do navegador | Ajuste cabeçalhos e rodapés no diálogo de impressão. |

## Entrega ao professor

Entregue o link público do repositório e, como complemento, o link do site. Mantenha o README acessível: ele explica o objetivo, o funcionamento e os limites. A escolha de publicação pública já atende ao pedido, mas os PDFs de aula não precisam ser publicados junto.
