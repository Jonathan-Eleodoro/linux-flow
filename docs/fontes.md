# Fontes, recorte e decisões editoriais

## Origem

A consulta de conteúdo ficou restrita ao ZIP `linux(1).zip` enviado pelo aluno. O logo veio da imagem anexada. A captura adicional foi usada como referência visual de navegação e organização, não como fonte de conteúdo Linux. Nenhum site externo foi consultado.

Cada questão e entrada de manual informa o PDF de base. As perguntas são elaboração didática, com paráfrases e exemplos adaptados; não são transcrição literal nem questões fornecidas pelo professor. As referências indicam o documento, não páginas específicas, pois parte dos PDFs contém capturas sem texto extraível.

## Mapeamento principal

| Material no ZIP | Uso |
|---|---|
| `_Aula 2 Comandos iniciais.pdf` | Navegação, arquivos, ferramentas de pacotes, diretórios |
| `Jonathan Eleodoro - Exercícios.pdf` | pwd, movimentação de arquivos, tail e exercícios básicos |
| `Jonathan Eleodoro - Exercícios.docx.pdf` | Texto, redirecionamento, pipes, operadores, tee e ps |
| `Permissões de Usuários.pdf` | rwx, octal, chmod, chown, chgrp, umask, sticky, SGID e SUID |
| `Jonathan Eleodoro - Atividade 2 Permissões de usuários.pdf` | Contexto aplicado de permissões e acesso |
| `Jonathan Eleodoro - Exercícios2.pdf` | Cenários de permissões especiais |
| `Jonathan Eleodoro - Exercícios Grupos e Usuários.pdf` | Contas, grupos, identificação e mudanças administrativas |
| `Comandos de redes.pptx (1).pdf` | Interfaces, endereços, ss e tcpdump |
| `Jonathan Eleodoro - Exercícos de redes (1).pdf` | Cenários práticos de captura e configuração |
| `Jonathan Eleodoro - Exercício 2 - Cliente _ Servidor.pdf` | Diagnóstico entre duas VMs |
| `Jonathan Eleodoro - Projeto.pdf` | Namespaces de rede |
| `SSH (3).pdf` | Acesso remoto, serviço SSH e limites do login root |
| `Su -   e Visudo.pdf` | su, sudo e edição administrativa |
| `Apresentação sem título.pdf` | Arquitetura, CPU, PCI, módulos e memória |
| `Jonathan Eleodoro - Atividade - Aula 3 Dois Servidores Virtuais.pdf` | Nginx, validação da configuração e consulta HTTP |
| `Plano_de_Trabalho_Linux_2026.pdf` | Instituição, disciplina, professor; escopo de processos e DNS |

Outros materiais do ZIP, incluindo apresentações de instalação com várias páginas de imagem, foram inventariados, mas não usados para perguntas sobre conteúdo que não pôde ser sustentado pela leitura textual disponível. Não foi realizada transcrição visual completa de todas essas páginas.

## Recorte e ressalvas

- O banco contém **99 questões**, **90 entradas de manual**, **9 categorias** e **6 missões**.
- O plano anual inclui assuntos futuros. Processos e DNS são identificados como conteúdos do plano; o aluno/professor deve decidir se entram na avaliação da etapa atual.
- `less`, `more` e `wget` aparecem como exemplos no pedido, mas não receberam questões sem apoio textual suficiente nos anexos. Não foram adicionadas referências externas para preencher a lacuna.
- A explicação de `2>>` deriva da combinação de descritor de erro e acréscimo solicitada no enunciado e trabalhada nos exercícios de redirecionamento; não é apresentada como uma citação literal do PDF.
- Não há pesquisa de versões atuais de distribuições. A comparação se limita às famílias e ferramentas descritas no material.
- Não foram incorporados os exemplos mistos de repositórios Bookworm/Trixie como uma receita executável. Configuração de repositórios exige definir uma versão-alvo coerente; o texto colado também continha links Markdown e uma entrada quebrada em duas linhas. A aplicação não modifica APT.

## Cuidados editoriais aplicados

Alguns trechos dos anexos são simplificações de aula. A aplicação delimita o contexto em vez de transformar esses trechos em regras universais:

1. `touch`: cria arquivo vazio se inexistente e atualiza timestamps se já existe; não é editor de texto.
2. `chown`: pode alterar usuário e grupo; `chgrp` altera o grupo.
3. `umask`: remove bits das permissões solicitadas, não é uma subtração aritmética universal. Os exemplos clássicos 666/777 são qualificados.
4. Sticky bit: inclui dono do arquivo, dono do diretório e usuário privilegiado; não atribui proteção de conteúdo ou criptografia.
5. SGID no diretório: herda grupo, mas não concede automaticamente permissão de escrita.
6. SUID: explicado para executáveis compatíveis; não se promete o mesmo comportamento em todo arquivo ou script.
7. `visudo`: validação de sintaxe é destacada; não se promete impossibilidade absoluta de salvar configuração incorreta.
8. Acesso root por SSH e senhas simples de laboratório não são recomendações de produção.
9. Afirmações dos exercícios sobre licenças específicas de produtos não viraram perguntas, pois havia inconsistências e não se fez consulta externa para auditá-las.
10. `ping`: ausência de resposta não é prova isolada de indisponibilidade.
11. `apt update`: atualiza o índice; não equivale a `apt upgrade`.
12. `&>`: indicado como sintaxe Bash, sem presumir suporte em todo shell.

Os ajustes são decisões de redação técnica para evitar generalizações. Para uma edição institucional ou material de avaliação formal, recomenda-se revisão do professor e conferência da documentação correspondente às versões usadas na turma.

## Publicação dos anexos

Os PDFs originais, atividades com nomes de colegas e credenciais de laboratório não acompanham a pasta pública. O pacote entrega o código, a elaboração didática e o logo fornecido, com identificação acadêmica. Nenhum dado dos perfis de teste é embutido no projeto.
