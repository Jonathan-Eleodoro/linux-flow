# Manual do aluno

## Perfil e privacidade

Clique em **Criar perfil**, informe um nome ou apelido entre 2 e 32 caracteres e entre no laboratório. Não informe senha, documento, telefone ou informações sensíveis nesse campo.

Marque a opção de guardar dados somente se quiser mantê-los neste dispositivo. Sem ela, o perfil dura enquanto a página estiver aberta. Não há cookies da aplicação. O armazenamento, quando escolhido, usa localStorage.

Em um laboratório compartilhado, use perfil temporário ou apague os dados ao terminar. O perfil não é protegido por senha. A tela Sobre permite revogar o salvamento e apagar os dados. Revogar o salvamento remove a cópia persistente, mas mantém a sessão atual em memória até fechar/recarregar a página.

## Quiz

1. Escolha uma trilha ou clique em **Começar um quiz**.
2. Selecione assunto, dificuldade e quantidade. A lista só permite quantidades disponíveis no recorte.
3. Clique em **Iniciar quiz**.
4. Leia a questão e o exemplo. Selecione uma alternativa e confirme.
5. A resposta correta é identificada, mesmo quando você erra. Leia a explicação e sua fonte.
6. Avance até o resultado. Veja acertos, erros, aproveitamento e revisão completa.

As alternativas mudam de posição. Perguntas podem reaparecer em rodadas diferentes, mas não se repetem na mesma rodada. Não há timer. Navegar ao Manual e voltar ao Quiz retoma a rodada na página atual; recarregar a página não restaura uma rodada incompleta. Encerrar antes do fim descarta o resultado parcial.

## Níveis e mascotes

| Nível | Foco | Mascote |
|---|---|---|
| Fundamentos | Reconhecer comandos e conceitos | Pinguim explorador |
| Aplicação | Interpretar opções e operações | Coruja analista |
| Diagnóstico | Avaliar cenários e detalhes | Raposa administradora |

Todos os níveis estão abertos. Os mascotes são representados por emojis; a aparência depende do sistema operacional.

## Ranking

Cada rodada concluída atualiza o ranking no navegador atual. Selecione o mesmo assunto, nível e quantidade para comparar resultados equivalentes. Só a melhor tentativa de cada perfil aparece. Em empate, a conclusão mais antiga vem primeiro.

O ranking não é global, não se comunica com outras máquinas e não impede adulteração pelo dono do navegador. O limite é de 300 resultados recentes; registros antigos podem sair do histórico, inclusive os que sustentam uma conquista antiga.

## Certificados

Para liberar o certificado de um nível, complete um **quiz geral**, com **pelo menos 10 perguntas**, e tenha **80% de acerto real ou mais**. Treinos por assunto não certificam.

Abra Conquistas, selecione o certificado e use **Imprimir ou salvar como PDF**. No diálogo do navegador, escolha salvar em PDF. O layout de impressão é A4 paisagem; configurações do usuário podem alterá-lo. Se aparecerem cabeçalhos/rodapés automáticos do navegador, desative-os nas opções de impressão.

O documento é um comprovante didático local, sem assinatura, validade profissional, carga horária atribuída ou autenticação institucional.

## Terminal

As seis missões são independentes. Selecionar uma missão reinicia o cenário; a conclusão já registrada permanece como conquista local. O terminal não é Bash nem Linux de verdade.

| Missão | Ação principal |
|---|---|
| Encontre a estação | `pwd` |
| Organize a entrega | `mkdir projeto`, `cd projeto`, `touch aula.txt` |
| Leia o relatório | `cat notas.txt` |
| Ajuste o acesso | `chmod 640 relatorio.txt` |
| Inspecione a rede | `ip addr` e `ip route` |
| Observe o tráfego | `tcpdump -i eth0 icmp` |

Digite um comando por vez. `help` mostra o escopo e `clear` limpa a saída. Setas para cima/baixo percorrem o histórico desta missão. Não há pipes, aspas, variáveis, globbing, execução remota ou captura real de pacotes.

## Consulta e preferências

O Manual permite buscar comandos, finalidade e explicação; também filtra por assunto. A seção de conceitos compara o espaço de usuário, kernel e hardware, além dos ecossistemas DEB/RPM.

Os botões do menu superior alternam tema e som. O som começa desligado e só responde a interação do usuário. Todas as ações essenciais também possuem indicação textual. Teclado: Tab muda de controle, Enter/Espaço ativa botões e Esc fecha o modal de perfil.
