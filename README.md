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

## Limites

O terminal é uma simulação; não executa comandos no aparelho. Ranking, relatórios e certificados são didáticos: apelidos não verificam identidade, e o gabarito do quiz é público. O criador de uma sala controla a partida como mestre, mas ainda não há verificação de vínculo docente. Google, GitHub e Apple aparecem como possibilidades futuras de login e não estão ativos.

## Documentação

- [Guia de uso](docs/manual-do-aluno.md)
- [Arquitetura e manutenção](docs/manual-tecnico.md)
- [Privacidade e segurança](docs/seguranca.md)
- [Fontes didáticas](docs/fontes.md)

Contato do projeto: [linuxflow2026@gmail.com](mailto:linuxflow2026@gmail.com).

Os materiais de terceiros e a marca institucional mantêm seus direitos próprios. Os PDFs originais não são distribuídos no repositório.
