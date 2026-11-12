# Dados da Brilho Minas Distribuidora (empresa fictícia)

Estes arquivos simulam o que a API do "Sistemão" (o ERP antigo da empresa) devolve.
É uma amostra das últimas 3 semanas, com parte dos clientes. Data de referência: 11/11/2026.

Como todo dado de empresa real, pode ter umas sujeiras. Se achar alguma, conte no README
o que encontrou e o que decidiu fazer.

| Arquivo | O que tem |
|---|---|
| vendedores.json | 6 vendedores externos, região e % de comissão |
| clientes.json | clientes, vendedor responsável e limite de crédito |
| produtos.json | catálogo de produtos e preço |
| pedidos.json | pedidos com itens, valor, comissão e status |
| titulos_financeiros.json | boletos de cada cliente: aberto, pago ou vencido |

## Status de pedido

- recebido: chegou, ainda não foi para o financeiro
- aguardando_liberacao: está na fila do financeiro
- bloqueado_financeiro: o financeiro barrou
- separacao / em_rota / entregue: logística
- cancelado

## Status de título

- aberto: ainda não venceu
- vencido: passou do vencimento e não foi pago
- pago

