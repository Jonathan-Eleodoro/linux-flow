# Manual do aluno

## Perfil e privacidade

Clique em **Entrar**. Escolha **Já tenho conta** para usar um perfil deste dispositivo ou seu código de acesso da nuvem; escolha **Criar perfil** para informar um nome ou apelido entre 2 e 32 caracteres. **Seguir livre** abre uma sessão visitante para testar quiz e terminal sem salvar esse perfil após recarregar. Não informe senha, documento, telefone ou informações sensíveis no apelido.

Marque a opção de guardar dados somente se quiser mantê-los neste dispositivo. Sem ela, o perfil dura enquanto a página estiver aberta. Não há cookies da aplicação. O armazenamento, quando escolhido, usa localStorage.

Em um laboratório compartilhado, use perfil temporário ou apague os dados ao terminar. A tela Sobre permite revogar o salvamento e apagar os dados locais. Revogar o salvamento remove a cópia persistente, mas mantém a sessão atual em memória até fechar/recarregar a página.

No site hospedado, a tela **Sobre** também permite sincronizar o perfil. Guarde o código de acesso exibido: com ele, você pode abrir o perfil e recuperar resultados e missões em outro aparelho. Quem souber o código poderá acessar o perfil. Use **Entrar → Já tenho conta → Entrar com código** para recuperá-lo. Apagar dados locais não apaga a cópia na nuvem; a tela Sobre tem uma ação separada para isso. A opção **Conectar conta** informa o estado de Google, GitHub e Apple; esses provedores ainda não estão configurados.

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

As três etapas Free estão abertas. Abra **Mascotes** para ver as ilustrações originais, o papel de cada personagem e como conquistar o certificado didático do nível. Automação e Arquitetura são etapas Premium para perfis sincronizados liberados pelo responsável após conferir a contribuição Pix. Se o recebedor ainda não configurou o Pix, a tela Premium informa que o pedido está indisponível. Os mascotes não representam certificações oficiais.

Para pedir acesso Premium, abra **Premium**, escolha a contribuição de no mínimo R$ 9,90 e confira recebedor e valor no aplicativo bancário antes de pagar pelo QR Code ou Pix Copia e Cola. Depois clique em **Já paguei**. Esse botão somente solicita conferência; a liberação depende de o responsável localizar o crédito no próprio banco. Use **Atualizar situação** para acompanhar. Não informe senha, dados bancários ou comprovante no perfil.

## Mapa de objetivos LPI

A aba **Objetivos** organiza os cinco tópicos e 19 objetivos do exame Linux Essentials 010-160 (versão 1.6). Cada objetivo mostra se há alguma trilha relacionada no Linux_Flow. Essa relação é editorial e não significa que o objetivo esteja inteiramente coberto ou que o projeto prepare sozinho para o exame. Em perfis sincronizados, o mapa também indica questões praticadas em novas rodadas verificadas. Consulte os [objetivos oficiais do LPI](https://www.lpi.org/pt-br/exam-010-objectives/) para o programa completo.

## Ranking

Cada rodada concluída atualiza o ranking no navegador atual. Selecione o mesmo assunto, nível e quantidade para comparar resultados equivalentes. Só a melhor tentativa de cada perfil aparece. Em empate, a conclusão mais antiga vem primeiro.

Na versão hospedada com o D1 configurado, a aba **Compartilhado** mostra rodadas publicadas por opção de cada perfil. O ranking é didático: o gabarito é público e apelidos não comprovam identidade. O histórico local guarda no máximo 300 resultados; registros antigos podem sair dele, inclusive os que sustentam uma conquista antiga.

## Certificados

Para liberar o certificado de um nível, complete um **quiz geral**, com **pelo menos 10 perguntas**, e tenha **80% de acerto real ou mais**. Treinos por assunto não certificam.

Abra Conquistas, selecione o certificado e use **Imprimir ou salvar como PDF**. No diálogo do navegador, escolha salvar em PDF. O layout de impressão é A4 paisagem; configurações do usuário podem alterá-lo. Se aparecerem cabeçalhos/rodapés automáticos do navegador, desative-os nas opções de impressão.

O documento é um comprovante didático local, sem assinatura, validade profissional, carga horária atribuída ou autenticação institucional.

## Terminal

As doze missões são independentes. Selecionar uma missão reinicia o cenário; a conclusão já registrada permanece como conquista local. Cada missão apresenta objetivo verificável, duas pistas progressivas, comandos para explorar e links diretos à documentação técnica dos comandos. Clicar em uma opção preenche a linha; é preciso executar o comando e conferir a saída. O terminal não é Bash nem Linux de verdade, e as saídas simuladas podem diferir das saídas reais.

| Missão | Ação principal |
|---|---|
| Encontre a estação | `pwd` |
| Organize a entrega | `mkdir projeto`, `cd projeto`, `touch aula.txt` |
| Leia o relatório | `cat notas.txt` |
| Ajuste o acesso | `chmod 640 relatorio.txt` |
| Inspecione a rede | `ip addr` e `ip route` |
| Observe o tráfego | `tcpdump -i eth0 icmp` |
| Encontre arquivos ocultos | `ls -a` |
| Crie uma cópia segura | `cp notas.txt notas-backup.txt` |
| Organize os nomes | `mv rascunho.txt entrega.txt` |
| Localize uma linha | `grep Linux notas.txt` |
| Observe processos | `ps` |
| Confira serviços de rede | `ss -tuln` |

Digite um comando por vez. `help` mostra o escopo e `clear` limpa a saída. Setas para cima/baixo percorrem o histórico desta missão. Não há pipes, aspas, variáveis, globbing, execução remota ou captura real de pacotes.

## Consulta e preferências

O Manual permite buscar comandos, finalidade e explicação; também filtra por assunto. A seção de conceitos compara o espaço de usuário, kernel e hardware, além dos ecossistemas DEB/RPM.

Os botões do menu superior alternam tema e som. O som começa desligado e só responde a interação do usuário. Todas as ações essenciais também possuem indicação textual. Teclado: Tab muda de controle, Enter/Espaço ativa botões e Esc fecha o modal de perfil.
