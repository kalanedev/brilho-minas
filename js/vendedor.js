// VISÃO DO VENDEDOR
//
// O vendedor vê só os próprios pedidos em andamento e nunca vê valores de
// dívida, limite ou boletos. Usa o que está em js/comum.js.

function situacaoParaVendedor(pedido) {
  const decisao = decisaoDo(pedido.numero);
  if (decisao?.decisao === 'LIBERADO') {
    const cobrar = decisao.sugestao === 'ATENCAO' ? ' Cobre o cliente: há boleto vencido há poucos dias.' : '';
    return { classe: 'liberar', titulo: 'Liberado pelo financeiro', texto: 'Segue para a separação.' + cobrar };
  }
  if (decisao?.decisao === 'BLOQUEADO' || pedido.status === 'bloqueado_financeiro') {
    return { classe: 'bloquear', titulo: 'Bloqueado pelo financeiro', texto: 'Há pendência financeira do cliente. Fale com o financeiro.' };
  }
  if (pedido.status === 'recebido' || pedido.status === 'aguardando_liberacao') {
    const previa = {
      BLOQUEAR: { classe: 'bloquear', texto: 'Prévia: há pendência financeira do cliente. O financeiro vai analisar.' },
      ATENCAO: { classe: 'atencao', texto: 'Prévia: deve ser liberado, mas cobre o cliente: há boleto vencido há poucos dias.' },
      LIBERAR: { classe: 'liberar', texto: 'Prévia: sem pendências, deve ser liberado.' },
    }[analisar(pedido).sugestao];
    return { ...previa, titulo: ROTULO_STATUS[pedido.status] };
  }
  return { classe: 'neutro', titulo: ROTULO_STATUS[pedido.status], texto: '' };
}

// aberto = true quando o card está no diálogo, aberto em separado.
function cartaoVendedor(pedido, aberto = false) {
  const cliente = DADOS.clientes.find((c) => c.id === pedido.cliente_id);
  const situacao = situacaoParaVendedor(pedido);
  const alertas = analisar(pedido).alertas.filter((a) => a.paraVendedor);

  return `
    <article class="cartao borda-${situacao.classe}" data-numero="${pedido.numero}">
      <header>
        <span class="selo selo-${situacao.classe}">${esc(situacao.titulo)}</span>
        <h3><small>Pedido ${pedido.numero}</small>${esc(cliente.razao_social)}</h3>
        <p class="discreto">${diaHora(pedido.criado_em)} · ${reais(pedido.valor_total)} · comissão ${reais(pedido.comissao_valor)}</p>
      </header>
      ${situacao.texto ? `<p>${esc(situacao.texto)}</p>` : ''}
      ${listaAlertas(alertas)}
      ${itensOuBotao(pedido, aberto)}
    </article>`;
}

function telaVendedor(vendedorId) {
  const emAndamento = DADOS.pedidos
    .filter((p) => p.vendedor_id === vendedorId && !['entregue', 'cancelado'].includes(p.status))
    .sort((a, b) => porCriacao(b, a)); // mais novo primeiro

  if (!emAndamento.length) return '<p class="vazio">Nenhum pedido seu em andamento.</p>';
  return `
    <section class="painel">
      <div class="painel-unico"><b>${emAndamento.length}</b><span>pedidos seus em andamento</span></div>
    </section>
    ${secao('Meus pedidos', emAndamento, cartaoVendedor)}`;
}
