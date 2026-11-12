// A REGRA DE CRÉDITO DO FINANCEIRO
//
// Este arquivo não mexe na tela. Ele só recebe um pedido e os dados e devolve
// a sugestão (BLOQUEAR, ATENCAO ou LIBERAR) com o motivo escrito.
// Por não depender da tela, pode ser testado sozinho (veja testes/regra.test.js).
//
// A regra, como o financeiro aplica de cabeça:
//   1. BLOQUEAR se o cliente tem boleto vencido há mais de 5 dias, OU se tudo
//      que ele deve (boletos em aberto e vencidos) + o pedido passa do limite.
//   2. ATENCAO se tem boleto vencido há 1 a 5 dias: libera, mas o vendedor cobra.
//   3. LIBERAR nos demais casos.

const DIAS_TOLERANCIA = 5;

// Dinheiro é calculado em centavos (números inteiros) para não ter erro de
// arredondamento: em JavaScript, 0.1 + 0.2 dá 0.30000000000000004.
function paraCentavos(reais) {
  return Math.round(reais * 100);
}

function formatarReais(centavos) {
  return (centavos / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// '2026-10-30' -> '30/10'
function formatarDia(dataIso) {
  const [, mes, dia] = dataIso.slice(0, 10).split('-');
  return `${dia}/${mes}`;
}

// Quantos dias se passaram desde o vencimento. 0 = ainda não venceu.
function diasDeAtraso(vencimento, hoje) {
  const ms = Date.parse(hoje + 'T00:00:00Z') - Date.parse(vencimento + 'T00:00:00Z');
  return Math.max(0, Math.round(ms / 86400000));
}

// Cadastros com o mesmo CNPJ são a mesma empresa (caso C001 e C037).
// A análise de crédito olha para todos juntos.
function cadastrosDoMesmoCnpj(cliente, clientes) {
  if (!cliente.cnpj) return [cliente];
  return clientes.filter((c) => c.cnpj === cliente.cnpj);
}

function mesmosItens(a, b) {
  const resumo = (p) => JSON.stringify(p.itens.map((i) => [i.produto_id, i.quantidade, i.preco_unitario]));
  return resumo(a) === resumo(b);
}

// pedido: o pedido a analisar
// dados: { clientes, pedidos, titulos, ... }
// hoje: data de referência, 'AAAA-MM-DD'
// liberadosSemBoleto: pedidos já liberados nesta tela. Ainda não viraram boleto
//   no Sistemão, mas o cliente já deve esse valor, então entram na conta.
function analisarPedido(pedido, dados, hoje, liberadosSemBoleto = []) {
  const cliente = dados.clientes.find((c) => c.id === pedido.cliente_id);
  const cadastros = cadastrosDoMesmoCnpj(cliente, dados.clientes);
  const idsDoCliente = cadastros.map((c) => c.id);

  // Com cadastro duplicado, vale o menor limite (escolha conservadora).
  const limite = Math.min(...cadastros.map((c) => paraCentavos(c.limite_credito)));

  // Tudo que não está pago é dívida. O atraso é calculado pela data de
  // vencimento, e não pelo status: o T0132 está "aberto" mas já venceu.
  const naoPagos = dados.titulos
    .filter((t) => idsDoCliente.includes(t.cliente_id) && t.status !== 'pago')
    .map((t) => ({ ...t, atraso: diasDeAtraso(t.vencimento, hoje) }));

  const vencidos = naoPagos.filter((t) => t.atraso > 0).sort((a, b) => b.atraso - a.atraso);
  const maiorAtraso = vencidos.length ? vencidos[0].atraso : 0;

  const boletos = naoPagos.reduce((soma, t) => soma + paraCentavos(t.valor), 0);
  const jaLiberado = liberadosSemBoleto
    .filter((p) => p.numero !== pedido.numero && idsDoCliente.includes(p.cliente_id))
    .reduce((soma, p) => soma + paraCentavos(p.valor_total), 0);
  const valorPedido = paraCentavos(pedido.valor_total);
  const total = boletos + jaLiberado + valorPedido;

  // ---- a regra em si ----
  const atrasoGrave = maiorAtraso > DIAS_TOLERANCIA;
  const passaDoLimite = total > limite;

  let sugestao;
  if (atrasoGrave || passaDoLimite) sugestao = 'BLOQUEAR';
  else if (maiorAtraso >= 1) sugestao = 'ATENCAO';
  else sugestao = 'LIBERAR';

  // ---- o motivo, escrito ----
  const motivos = [];
  const descreverBoleto = (t) =>
    `Boleto ${t.id} vencido há ${t.atraso} ${t.atraso === 1 ? 'dia' : 'dias'} ` +
    `(venceu em ${formatarDia(t.vencimento)}, ${formatarReais(paraCentavos(t.valor))}).`;

  const conta =
    `Deve ${formatarReais(boletos)} em boletos` +
    (jaLiberado ? ` + ${formatarReais(jaLiberado)} em pedidos já liberados` : '') +
    ` + ${formatarReais(valorPedido)} deste pedido = ${formatarReais(total)}`;

  if (atrasoGrave) vencidos.filter((t) => t.atraso > DIAS_TOLERANCIA).forEach((t) => motivos.push(descreverBoleto(t)));
  if (passaDoLimite) motivos.push(`${conta}, acima do limite de ${formatarReais(limite)}.`);
  if (sugestao === 'ATENCAO') {
    vencidos.forEach((t) => motivos.push(descreverBoleto(t)));
    motivos.push('Liberar, mas o vendedor precisa cobrar o cliente.');
  }
  if (sugestao === 'LIBERAR') {
    motivos.push(`Nenhum boleto vencido. ${conta}, dentro do limite de ${formatarReais(limite)}.`);
  }

  // ---- alertas: coisas estranhas nos dados que a pessoa precisa saber ----
  // paraVendedor: true = não revela nada financeiro, o vendedor também vê.
  const alertas = [];

  naoPagos
    .filter((t) => t.status === 'aberto' && t.atraso > 0)
    .forEach((t) =>
      alertas.push({
        texto: `O Sistemão mostra o boleto ${t.id} como "aberto", mas ele venceu em ${formatarDia(t.vencimento)}. Foi tratado como vencido. Vale confirmar se já foi pago.`,
      })
    );

  if (cadastros.length > 1) {
    alertas.push({
      texto: `Cliente cadastrado ${cadastros.length} vezes com o mesmo CNPJ (${idsDoCliente.join(' e ')}). Os boletos foram somados e foi usado o menor limite, ${formatarReais(limite)}.`,
    });
  }

  if (!cliente.cnpj || !cliente.vendedor_id) {
    alertas.push({ texto: 'Cadastro do cliente incompleto (sem CNPJ ou sem vendedor).' });
  }

  const naFila = ['recebido', 'aguardando_liberacao'];
  dados.pedidos
    .filter(
      (p) =>
        p.numero !== pedido.numero &&
        naFila.includes(p.status) &&
        idsDoCliente.includes(p.cliente_id) &&
        p.criado_em === pedido.criado_em &&
        mesmosItens(p, pedido)
    )
    .forEach((p) =>
      alertas.push({
        texto: `Possível pedido repetido: igual ao pedido ${p.numero}, criado no mesmo minuto. Conferir antes de liberar os dois.`,
        paraVendedor: true,
      })
    );

  if (pedido.observacao) {
    alertas.push({ texto: `Observação no Sistemão: "${pedido.observacao}"`, paraVendedor: true });
  }

  return {
    sugestao,
    motivos,
    alertas,
    cliente,
    valores: { boletos, jaLiberado, pedido: valorPedido, total, limite, maiorAtraso },
  };
}

const Regra = { DIAS_TOLERANCIA, analisarPedido, diasDeAtraso, paraCentavos, formatarReais, formatarDia };

// Permite usar este mesmo arquivo nos testes (Node) e no navegador.
if (typeof module !== 'undefined') module.exports = Regra;
