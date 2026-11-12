# Diagnóstico — Brilho Minas

## 1. O problema de verdade

A dor principal para a Brilho Minas distribuidora é **o que vem depois do pedido do cliente**: ele é reescrito três vezes e ainda depende da resposta de uma só pessoa, que fica sobrecarregada e demora para dar o retorno.

**O robô não resolveria essa dor**, pois mesmo que ele adiantasse o processo inicial do pedido, a trava permanece em outro lugar: a análise de crédito. Além disso, ele não veria um terço dos pedidos, que na amostra de dados chegaram por telefone ou e-mail, modificaria a regra de comissão dos vendedores e pode afastar clientes fiéis, habituados a conversar com o vendedor.

## 2. Antes de construir

**a) Inicialmente, gostaria de entender se as sugestões de liberação de crédito para o cliente recebem muitas exceções.**

- **Caso não**, o sistema libera automaticamente os pedidos sem pendência, e a Marta analisa os bloqueados e “em atenção”.

**b) Quanto tempo leva para que o Sistemão registre o pagamento de um boleto?**

- **Caso seja no mesmo dia**, a regra de análise de crédito funciona e permanece.
- **Caso leve um tempo**, adicionamos um botão de confirmação de pagamento do boleto para que Marta confirme e a análise seja sempre transparente.

**c) Os pedidos se perdem entre o cliente e o vendedor, ou entre o grupo e a planilha?**

- **Caso seja antes do vendedor ver**, os pedidos precisam chegar por um canal único da empresa, e o atendimento automático é priorizado.
- **Caso seja depois do vendedor**, ele registra o pedido uma única vez no celular, direto no Sistemão.

## 3. A proposta

**Desde o primeiro dia:** cada pessoa entra com o próprio acesso e vê somente o que o próprio perfil permite. Dados de clientes não saem do sistema.

### As três primeiras semanas

**Para a primeira semana:** o sistema lê os clientes, pedidos e boletos do Sistemão e aplica a regra da Marta em cada pedido: liberar, atenção ou bloquear, com o motivo escrito. Marta vê primeiro o que exige decisão. O vendedor vê no celular o status dos próprios pedidos, sem valores de dívidas. Assim, a demora na liberação é atacada primeiro, porque é a maior trava e só depende de ler o Sistemão.

**Para a segunda semana:** o vendedor registra o pedido no celular, escolhendo o cliente da sua carteira e os produtos do catálogo, e o pedido é gravado direto no Sistemão. Assim, o pedido é escrito uma vez só, com menos erros de digitação e menos pedidos perdidos.

**Para a terceira semana:** os seis vendedores passam a usar o sistema e a planilha deixa de existir. A logística monta a rota de entrega baseada na lista de pedidos liberados. Assim, garantimos todos os objetivos com um treinamento curto e simples.

### Para ser feito futuramente

1. **Rascunho do pedido pela IA:** o vendedor encaminha a mensagem do cliente para a IA, ela monta o rascunho do pedido, o vendedor confere e confirma, para então ser registrado no Sistemão.
2. **Margem do mês:** atualizada diariamente com base nos pedidos realizados para a visualização da Renata. Depende do custo dos produtos, que pela descrição o Sistemão não entrega.
3. **Robô no atendimento:** o robô atende diretamente o cliente, após decidir como ficaria a divisão de comissão dos vendedores se o robô fosse responsável pelo atendimento do cliente ao invés do vendedor.

## 4. Para a Renata entender

> Renata, olhei os números: o pedido não trava quando o cliente pede, trava depois, quando é reescrito e fica esperando a Marta conferir cada cliente. Por isso o robô sozinho não resolveria. Proponho começar pela liberação: em 3 semanas ela sai no mesmo dia, o vendedor vê no celular se o cliente está liberado, e o pedido é escrito uma vez só. O robô vem na etapa seguinte, quando o pedido já tiver um caminho rápido pra seguir. O que acha?
>