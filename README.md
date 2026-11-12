# Brilho Minas — Fila do financeiro

Tela única que mostra a fila de pedidos aguardando liberação, com a sugestão de crédito (Liberar, Atenção ou Bloquear) e o motivo de cada uma. Um seletor no topo troca quem está vendo: o financeiro ou um dos vendedores.

O diagnóstico da Parte 1 está em [DIAGNOSTICO.md](DIAGNOSTICO.md).

## Como abrir

- **Pelo link:** https://kalanedev.github.io/brilho-minas/
- **Testes da regra:** `node --test` na pasta do projeto (Node 20 ou mais novo). São 12 testes.
- **Atualizar os dados:** troque os arquivos em `dados/` e rode `node scripts/gerar-dados.js`.

### Onde está cada coisa

| Arquivo | O que faz |
|---|---|
| `index.html` | A página: topo com o seletor, área da fila e rodapé. |
| `css/estilo.css` | A aparência: cores, cards em grade e o pedido aberto em separado. |
| `js/regra.js` | A regra de crédito. Recebe um pedido e devolve a sugestão e o motivo. Não mexe na tela. |
| `js/comum.js` | O que as duas visões compartilham: decisões registradas e ajudantes de texto. |
| `js/financeiro.js` | A visão do financeiro: fila, sugestão, motivo e registro da decisão. |
| `js/vendedor.js` | A visão do vendedor: os próprios pedidos, sem valores de dívida. |
| `js/app.js` | O seletor do topo, que decide qual das duas visões mostrar, e a abertura do pedido em separado. |
| `js/dados.js` | Os dados do Sistemão em um arquivo só. Gerado por `scripts/gerar-dados.js`. |
| `dados/` | Os arquivos originais do Sistemão, sem alteração. |
| `testes/regra.test.js` | Os testes da regra. |

## Decisões e por quê

| Decisão | Por quê |
|---|---|
| HTML, CSS e JavaScript puros, sem framework e sem servidor. | A entrega é uma tela única. |
| Os dados entram por `js/dados.js`, gerado a partir dos JSON originais. | Página aberta direto do disco não consegue ler `.json`. Os originais ficam intactos em `dados/`. |
| A regra fica sozinha em `js/regra.js`, separada da tela. | É o coração do sistema. Separada, pode ser testada sem navegador e reaproveitada depois. |
| Bloquear: boleto vencido há mais de 5 dias, ou dívida (boletos abertos e vencidos) + pedido acima do limite. Atenção: vencido de 1 a 5 dias. Liberar: o resto. | É a regra que o financeiro aplica de cabeça. "Passar o limite" foi lido como maior que o limite: igual ao limite não bloqueia. |
| O atraso é contado pela data de vencimento, não pelo campo `status` do boleto. | O status pode estar desatualizado (caso T0132). A data não depende de alguém atualizar. |
| Dinheiro calculado em centavos inteiros. | Evita erro de arredondamento na comparação com o limite. |
| Cadastros com o mesmo CNPJ são analisados juntos, com o menor limite. | São a mesma empresa. Sem isso, um cliente bloqueado compraria pelo cadastro duplicado. |
| Pedido já liberado na tela entra na dívida do cliente nos pedidos seguintes. | Ele ainda não virou boleto, mas o cliente já deve. Sem isso, dois pedidos que cabem sozinhos no limite passariam juntos. |
| A fila do financeiro mostra primeiro Bloquear, depois Atenção, depois Liberar, do mais antigo para o mais novo. | A Marta vê primeiro o que exige decisão. |
| Toda decisão é registrada com quem decidiu, quando, a sugestão e o motivo daquele momento. | O Sistemão não guarda quem liberou. Não vamos repetir essa falha. |
| Decidir diferente da sugestão exige observação escrita. Liberar um pedido em Atenção segue a sugestão. | Permite medir quantas exceções existem (pergunta 2a do diagnóstico) e deixa o motivo registrado. |
| O sistema sugere e a Marta decide. Nada é liberado sozinho. | A liberação automática depende da resposta à pergunta 2a do diagnóstico. |
| As decisões ficam no `localStorage` do navegador. O Sistemão não é alterado. | Os dados são uma amostra só de leitura. Limite: a decisão só existe no navegador de quem decidiu. |
| O vendedor vê só os próprios pedidos em andamento, sem valor de dívida, limite ou boleto. Vê apenas "há pendência" ou "cobre o cliente". | Ele precisa saber se o pedido anda e se deve cobrar. Os valores são assunto do financeiro. |
| Pedidos em cards numa grade, e o pedido abre sozinho por cima da página, com a tabela de itens e a decisão ali mesmo. | No computador a Marta vê vários pedidos de uma vez; no celular vira uma coluna. Aberto em separado, o pedido é conferido sem distração. |
| Seletor no topo em vez de login. | Suficiente para demonstrar as duas visões. Não é segurança: veja "O que ficou de fora". |
| Data de referência fixa em 11/11/2026 (`DATA_REFERENCIA` em `js/comum.js`). | É a data da amostra. Com a data de hoje, todos os atrasos mudariam. |

## O que encontrei de estranho nos dados

Data de referência usada: 11/11/2026, como indica o LEIA-ME dos dados.

| O que encontrei | Onde | O que fiz |
|---|---|---|
| Boleto marcado como "aberto", mas vencido há 12 dias (venceu em 30/10). O cliente tem pedido na fila. | Boleto T0132, cliente C006 | Tratado como vencido, pela data. O pedido 1106 sai como Bloquear, com um aviso para a Marta confirmar se o boleto já foi pago. |
| Mesmo cliente cadastrado duas vezes: mesmo CNPJ e telefone, limites diferentes (8.000 e 5.000). O C001 tem boletos vencidos desde agosto; o C037 não tem boleto nenhum e tem pedido na fila. | Clientes C001 e C037, pedido 1110 | Analisados juntos: boletos somados e menor limite (5.000). O pedido 1110 sai como Bloquear, com aviso do cadastro duplicado. Os cadastros não foram unidos: isso é correção para fazer no Sistemão. |
| Cliente sem CNPJ, sem telefone, sem vendedor e com limite zero. Não tem pedidos nem boletos. | Cliente C038 | Mantido como está. Não aparece na fila. Se fizer um pedido, o limite zero bloqueia e a tela avisa do cadastro incompleto. |
| Dois pedidos idênticos, criados no mesmo minuto, os dois na fila. Um tem a observação "digitado 2x? conferir". | Pedidos 1105 e 1108 | Nenhum foi apagado. Os dois aparecem com aviso de possível repetição, também para o vendedor. Se a Marta liberar um, o outro passa a Bloquear por estourar o limite. |
| Pedido com 120 unidades de um item e a observação "cliente pediu 12, conferir". A comissão gravada também não bate com o total. Já foi entregue. | Pedido 1013 | Nada: já foi entregue e está fora da fila. Fica registrado aqui para conferência da cobrança e da comissão. |
| Pedido sem vendedor, com a observação "pedido veio por áudio, vendedor não identificado". Já foi entregue. | Pedido 1006 | Nada: já foi entregue. Não aparece para nenhum vendedor. A comissão precisa ser resolvida fora do sistema. |
| Nenhum pedido tem registro de quem liberou nem quando, nem os já entregues. | Campos `liberado_por` e `liberado_em`, nos 110 pedidos | A tela passa a registrar quem decidiu, quando e por quê. O histórico antigo não tem como ser recuperado. O pedido 1095, já bloqueado, aparece com esse aviso. |
| O catálogo só tem preço de venda, sem custo. Não dá para calcular margem com esses dados. | `produtos.json` | Margem ficou fora do escopo, como previsto no diagnóstico. |

Casos de borda da regra que aparecem na fila (não são erro, mas pedem atenção e teste):

- Boleto vencido há exatamente 5 dias: T0111, cliente C032. Pela regra, é Atenção.
- Boleto vencido há 6 dias: T0077, cliente C023. Pela regra, é Bloquear.

## Como usei a IA

Usei o Claude Code. Conversa exportada sem edição:

- [brilho-minas.txt](brilho-minas.txt): a construção da tela e da regra de crédito.

**Onde ajudou**

- Perguntou antes de escrever código o que não estava em nenhum arquivo: a regra completa de crédito,
como seria o acesso e se a Marta só veria a sugestão ou registraria a decisão.
- Escreveu a regra de crédito separada da tela, com 12 testes, incluindo os casos de borda (5 e 6 dias
 de atraso, dívida igual ao limite, boleto que vence hoje).
- Avisou onde foi além da regra que eu passei: pedido já liberado na tela entra na dívida do cliente,
e "passar o limite" foi lido como maior que o limite. Deixou as duas escolhas para eu conferir.
- Sugeriu a divisão dos commits na ordem em que uma parte depende da outra (dados, regra, tela, README
).
- Aplicou o novo visual a partir de uma descrição escrita e, no fim, listou os pontos em que o resulta
do ficou diferente do pedido.

**Onde precisei corrigir**

- Comecei pedindo Laravel com Inertia e voltei atrás: para uma tela única, sem servidor, HTML, CSS e J
avaScript puros bastam e eu consigo explicar cada linha.
- A primeira versão juntou a visão do financeiro e a do vendedor em um arquivo só. Pedi a separação em
 `js/financeiro.js` e `js/vendedor.js`, mantendo o seletor.
- A IA ia criar um repositório novo e fazer os commits sozinha, sem perceber que o repositório já exis
tia com o diagnóstico como primeiro commit. Interrompi, pedi para conferir e fiz os commits eu mesma,
com a divisão sugerida.
- Interrompi a conferência visual que ela começou por conta própria: quem abre a tela e corrige o visu
al sou eu. Por isso a IA nunca viu a página em um navegador, só rodou os testes da regra e montou as t
elas de forma simulada.
- O comentário dos testes mandava rodar `node --test testes/`, que falha. O comando certo é `node --te
st`.
- O protótipo do novo visual tinha texto branco sobre a cor da marca em um botão, contra a regra de co
ntraste que eu mesma tinha definido. Foi trocado por texto escuro sobre fundo rosa suave.

## O que ficou de fora

- **Acesso de verdade.** O seletor não protege nada: qualquer pessoa troca de perfil, e todos os dados (inclusive dívidas) são carregados no navegador de quem abre a página. A visão exclusiva de cada perfil só é possível com login e com um servidor que entregue a cada pessoa apenas os dados dela. É o primeiro passo antes de usar com dados reais.
- **Gravar a decisão no Sistemão.** Hoje fica só no navegador de quem decidiu: outro aparelho não vê, e limpar o navegador apaga.
- **Ler o Sistemão ao vivo.** A tela usa a amostra de 11/11/2026.
- **Desfazer ou rever uma decisão.** Só existe o botão de reiniciar a demonstração.
- **Pedidos em separação ou em rota na conta da dívida.** Não sei se já viraram boleto no Sistemão. Hoje não entram.
- **Semanas 2 e 3 do diagnóstico:** registro do pedido pelo vendedor e lista para a logística.
- **Testes da tela.** Os testes automáticos cobrem só a regra.

## Tempo utilizado para a realização do teste

- **3h23min**