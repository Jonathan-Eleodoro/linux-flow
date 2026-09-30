# Implantação anterior: PRO com Pix e ativação manual no MySQL

Este guia descreve a implantação anterior com Vercel/Aiven. Para a publicação atual na Cloudflare Pages/D1, siga [cloudflare-d1.md](cloudflare-d1.md).

O PRO exige um perfil sincronizado. O aluno escolhe um valor de pelo menos R$ 9,90, gera um pedido com referência própria e usa o QR Code ou Pix Copia e Cola. Ao clicar em **Já paguei**, o pedido muda para `claimed`; isso **não libera** conteúdo. O responsável confere o crédito no aplicativo ou extrato do banco recebedor e ativa o perfil manualmente no MySQL. O cliente não recebe uma senha de administrador nem pode conceder PRO a si mesmo. Os pagamentos não são verificados automaticamente.

## Preparar a publicação

1. Execute [profiles.sql](../sql/profiles.sql) novamente na Aiven, depois de `ranking.sql`. Ele cria `pro_requests` e `pro_entitlements` sem apagar as tabelas anteriores.
2. Na Vercel, configure `PIX_KEY`, `PIX_RECEIVER_NAME` e `PIX_RECEIVER_CITY` como variáveis de ambiente. Use uma chave Pix da conta que receberá as contribuições. Nome e cidade aparecem no BR Code; a chave também é visível para quem recebe o código. Não inclua esses valores no GitHub. Faça novo deploy.
3. Confira um QR Code gerado no ambiente publicado com o aplicativo do seu banco **antes de divulgar a opção de pagamento**: o nome do recebedor, o valor e a chave precisam corresponder à sua conta. A geração do QR não movimenta dinheiro.
4. Teste com um perfil sincronizado e um pagamento real pequeno de R$ 9,90. Não marque PRO ativo antes de localizar o crédito no extrato.

Se as variáveis Pix não estiverem configuradas, a tela PRO informa isso e não oferece geração de pedido. O QR é produzido no servidor com a biblioteca `qrcode`. O formato do código segue as [especificações de QR Code estático do Banco Central](https://www.bcb.gov.br/content/estabilidadefinanceira/pix/Regulamento_Pix/II_ManualdePadroesparaIniciacaodoPix.pdf).

## Conferir e liberar

Consulte os pedidos declarados como pagos:

```sql
SELECT r.id, r.profile_id, p.nickname, r.txid, r.amount_cents,
       r.payer_reference, r.created_at, r.claimed_at
FROM pro_requests AS r
JOIN synced_profiles AS p ON p.id = r.profile_id
WHERE r.status = 'claimed'
ORDER BY r.claimed_at;
```

`payer_reference` é apenas uma pista fornecida pelo aluno. Confira no banco recebedor o pagamento efetivo, o valor, a data e um identificador único da transação. A referência do pedido (`txid`) pode ajudar a localizar o Pix; a forma como ela aparece no extrato depende do banco. Se não conseguir relacionar o crédito ao pedido com segurança, não libere o acesso até esclarecer.

Depois da conferência, substitua o ID do pedido e a referência bancária em [approve-pro.sql](../sql/approve-pro.sql), mude `@confirmed_in_bank` de `0` para `1` e execute-o no MySQL. Verifique se o `SELECT` final mostra `approved`. Com `0`, o script não concede acesso. O aluno clica em **Atualizar situação** e passa a acessar Automação e Arquitetura. A referência bancária confirmada é única no banco para evitar usar o mesmo pagamento em dois perfis.

Para rejeitar um pedido informado sem pagamento confirmado, atualize-o manualmente apenas após investigar a situação:

```sql
UPDATE pro_requests SET status = 'rejected'
WHERE id = 'ID_DO_PEDIDO' AND status = 'claimed';
```

Pedidos rejeitados podem ser substituídos por um novo pedido. Apagar um perfil da nuvem remove seus pedidos e sua liberação PRO. Não publique comprovantes, identificadores bancários nem códigos de acesso de perfis no repositório.
