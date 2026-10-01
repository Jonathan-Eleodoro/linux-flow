# Linux Flow

Plataforma de estudo de Linux criada por Jonathan Eleodoro para o curso Técnico em Informática do Colégio Sinodal Progresso, com orientação do professor Cristiano Forte.

O projeto reúne trilhas, quiz com explicações, terminal simulado, ranking e espaços de estudo em grupo. Há acesso individual gratuito; perfis sincronizados permitem duelos, salas coletivas e acompanhamento do progresso. O Premium usa contribuição Pix de no mínimo R$ 9,90 com liberação manual.

## Executar localmente

Com Node.js 20 ou superior:

```bash
npm ci
npm test
npm start
```

Abra `http://127.0.0.1:4173`. A prévia serve o frontend; recursos de nuvem exigem Pages Functions e D1. O quiz e o terminal também podem ser abertos pelo `index.html` sem a API.

## Publicação

O frontend usa **Cloudflare Pages**, a API usa **Pages Functions** e os dados sincronizados usam **D1**. Para gerar `dist/`, execute `npm run build`. O passo a passo de banco, GitHub, binding `DB` e validação está em [docs/cloudflare-d1.md](docs/cloudflare-d1.md).

O [painel HTML de implantação](guias-cloudflare/index.html) compara o que está no código e o que falta validar na Cloudflare. O [plano e roteiro de testes](guias-cloudflare/08-plano-testes.html) acompanha a preparação para a primeira oferta. Esses guias ficam fora do site publicado.

## Limites

O terminal é uma simulação; não executa comandos no aparelho. O ranking compartilhado exige perfil sincronizado e rodada verificada. Pedidos Premium têm histórico financeiro preservado por pelo menos um ano após o último evento. Ranking, relatórios e certificados são didáticos: apelidos não verificam identidade, e o gabarito do quiz é público. O criador de uma sala controla a partida como mestre, e somente o criador com concessão docente manual pode ler registros nominativos e relatórios individuais do seu grupo. A escola deve verificar a pessoa antes da concessão. Google, GitHub e Apple aparecem como possibilidades futuras de login e não estão ativos.

## Documentação

- [Guia de uso](docs/manual-do-aluno.md)
- [Arquitetura e manutenção](docs/manual-tecnico.md)
- [Privacidade e segurança](docs/seguranca.md)
- [Fontes didáticas](docs/fontes.md)

Contato do projeto: [linuxflow2026@gmail.com](mailto:linuxflow2026@gmail.com).

Os materiais de terceiros e a marca institucional mantêm seus direitos próprios. Os PDFs originais não são distribuídos no repositório.
