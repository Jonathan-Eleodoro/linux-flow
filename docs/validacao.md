# Relatório de verificação

Verificações realizadas durante a preparação da entrega em 23/09/2026.

## Verificações aprovadas

| Verificação | Resultado |
|---|---|
| Sintaxe de JavaScript | Arquivos verificados com Node.js |
| JSON de configuração | package.json e vercel.json válidos |
| Integridade do banco | 99 IDs únicos, quatro alternativas distintas e resposta presente em todas as questões |
| Sorteio | Sem reposição na rodada, sem mutação do banco e com gabarito preservado |
| Certificação | Exige quiz geral, 10+ questões e fração real de acerto >= 0,8 |
| Ranking | Melhor tentativa por usuário e desempate por data |
| Terminal | Todas as doze missões atingem o estado esperado |
| Segurança do terminal | Comandos arbitrários, pipes e operações fora do escopo recusados |
| Fluxo DOM | Cadastro, quiz, correção, retomada, ranking, certificado, manual e preferências exercitados |
| Persistência | Resultados e missões reidratados; revogação e exclusão verificadas |
| Texto de usuário | Apelido contendo marcação HTML foi exibido como texto, sem criar elementos |
| Build | Saída estática gerada somente com arquivos autorizados |

## Como o fluxo foi exercitado

Além dos seis testes de domínio entregues em `tests/domain.test.cjs`, uma sessão de QA em DOM simulado executou os scripts da aplicação em sequência. Foram realizados:

- Cadastro com persistência e apelido contendo caracteres de marcação.
- Rodada geral de dez perguntas com dez acertos.
- Saída para o manual e retorno após confirmar uma resposta, sem duplicar nota.
- Abertura do certificado e consulta ao ranking atualizado.
- Conclusão das doze missões de terminal.
- Busca por chmod e troca de tema.
- Reabertura com dados persistidos.
- Rodada curta com erro, sem certificação.
- Revogação do salvamento e exclusão dos dados locais.

O teste DOM usou jsdom somente no ambiente temporário de QA. A aplicação entregue não depende desse pacote.

## Limites desta validação

Não foi possível concluir a validação visual em um navegador renderizado: o navegador remoto não acessou a origem local e o ambiente não disponibilizou um Chromium local utilizável. Portanto, não se afirma que houve inspeção visual de screenshots, auditoria real de overflow móvel, medição de contraste, teste de áudio físico, impressão real ou conferência do PDF impresso.

O layout mobile first, as regras de impressão e os comportamentos acessíveis estão implementados, mas devem ser conferidos no navegador do aluno. O teste DOM confirma comportamentos e elementos, não substitui renderização.

Os cabeçalhos HTTP da Vercel estão configurados, mas não foram verificados em uma implantação real. Nenhum repositório foi criado e nenhuma publicação foi feita nas contas GitHub/Vercel do usuário.

O adaptador opcional WebMCP não foi validado em um navegador com a API disponível. Ele é progressivo e não é necessário para utilizar a aplicação.

## Verificação sugerida antes da entrega

Abra a aplicação em celular e desktop, experimente uma rodada, ouça o feedback opcional, salve um certificado como PDF e confira os dados institucionais. Depois da publicação, confira os mesmos fluxos no domínio da Vercel. O guia `publicacao.md` descreve esse processo.
