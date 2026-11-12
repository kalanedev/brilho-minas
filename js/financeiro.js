// VISÃO DO FINANCEIRO
//
// A fila da Marta em cards: cada pedido com a sugestão, o motivo, os números e os
// botões para registrar a decisão. Usa o que está em js/comum.js.

// aberto = true quando o card está no diálogo, aberto em separado.
function cartaoFinanceiro(pedido, aberto = false) {
  const analise = analisar(pedido);
  const decisao = decisaoDo(pedido.numero);
  const v = analise.valores;

  let rodape;
  if (decisao) {
    const contrariou = decisao.contrariouSugestao ? ' (diferente da sugestão)' : '';
    rodape = `
      <p class="decisao decisao-${decisao.decisao.toLowerCase()}">
        <strong>${decisao.decisao === 'LIBERADO' ? 'Liberado' : 'Bloqueado'}</strong>
        por ${esc(decisao.por)} em ${esc(new Date(decisao.em).toLocaleString('pt-BR'))}${contrariou}.
        ${decisao.observacao ? `<br>Observação: ${esc(decisao.observacao)}` : ''}
        <br><span class="discreto">Sugestão na hora: ${ROTULO_SUGESTAO[decisao.sugestao]}. ${esc(decisao.motivos.join(' '))}</span>
      </p>`;
  } else if (pedido.status === 'aguardando_liberacao') {
    rodape = `
      <div class="acoes">
        <label>Observação <span class="discreto">(obrigatória se decidir diferente da sugestão)</span>
          <input type="text" class="obs" maxlength="200">
        </label>
        <p class="erro" hidden></p>
        <button data-acao="LIBERADO" class="botao botao-liberar">Liberar</button>
        <button data-acao="BLOQUEADO" class="botao botao-bloquear">Bloquear</button>
      </div>`;
  } else if (pedido.status === 'bloqueado_financeiro') {
    rodape = `<p class="decisao decisao-bloqueado"><strong>Bloqueado no Sistemão.</strong> O Sistemão não registrou quem bloqueou nem quando.</p>`;
  } else {
    rodape = `<p class="discreto">${esc(ROTULO_STATUS[pedido.status])}. A sugestão acima é uma prévia.</p>`;
  }

  return `
    <article class="cartao borda-${analise.sugestao.toLowerCase()}" data-numero="${pedido.numero}">
      <header>
        ${selo(analise.sugestao, decisao ? 'Sugestão: ' : '')}
        <h3><small>Pedido ${pedido.numero}</small>${esc(analise.cliente.razao_social)}</h3>
        <p class="discreto">${esc(pedido.cliente_id)} · ${esc(nomeVendedor(pedido.vendedor_id))} · ${diaHora(pedido.criado_em)}</p>
      </header>
      <ul class="motivos">${analise.motivos.map((m) => `<li>${esc(m)}</li>`).join('')}</ul>
      ${listaAlertas(analise.alertas)}
      <dl class="numeros">
        <div><dt>Pedido</dt><dd>${Regra.formatarReais(v.pedido)}</dd></div>
        <div><dt>Já deve</dt><dd>${Regra.formatarReais(v.boletos + v.jaLiberado)}</dd></div>
        <div><dt>Limite</dt><dd>${Regra.formatarReais(v.limite)}</dd></div>
        <div><dt>Maior atraso</dt><dd>${v.maiorAtraso ? v.maiorAtraso + ' d' : 'nenhum'}</dd></div>
      </dl>
      ${itensOuBotao(pedido, aberto)}
      ${rodape}
    </article>`;
}

function telaFinanceiro() {
  const comAnalise = (p) => ({ pedido: p, sugestao: analisar(p).sugestao });
  const naFila = DADOS.pedidos.filter((p) => p.status === 'aguardando_liberacao');

  const pendentes = naFila
    .filter((p) => !decisaoDo(p.numero))
    .map(comAnalise)
    .sort((a, b) => ORDEM_SUGESTAO[a.sugestao] - ORDEM_SUGESTAO[b.sugestao] || porCriacao(a.pedido, b.pedido));

  const decididos = [
    ...naFila.filter((p) => decisaoDo(p.numero)),
    ...DADOS.pedidos.filter((p) => p.status === 'bloqueado_financeiro'),
  ].sort(porCriacao);

  const aCaminho = DADOS.pedidos.filter((p) => p.status === 'recebido').sort(porCriacao);

  const contar = (s) => pendentes.filter((x) => x.sugestao === s).length;

  return `
    <section class="painel">
      <div><b>${pendentes.length}</b><span>aguardando decisão</span></div>
      <div class="p-bloquear"><b>${contar('BLOQUEAR')}</b><span>Bloquear</span></div>
      <div class="p-atencao"><b>${contar('ATENCAO')}</b><span>Atenção</span></div>
      <div class="p-liberar"><b>${contar('LIBERAR')}</b><span>Liberar</span></div>
    </section>
    ${pendentes.length ? '' : '<p class="vazio">Fila zerada. Nenhum pedido aguardando decisão.</p>'}
    ${secao('Aguardando decisão', pendentes.map((x) => x.pedido), cartaoFinanceiro)}
    ${secao('Já decididos', decididos, cartaoFinanceiro)}
    ${secao('Ainda não chegaram ao financeiro', aCaminho, cartaoFinanceiro)}`;
}

// ---------- registrar a decisão ----------

// cartaoEl: o card onde o botão foi clicado (na grade ou no diálogo). O campo de
// observação e a mensagem de erro são procurados dentro dele, porque o mesmo
// pedido pode estar desenhado nos dois lugares ao mesmo tempo.
// Devolve true se a decisão foi registrada.
function registrarDecisao(cartaoEl, decisao) {
  const numero = Number(cartaoEl.dataset.numero);
  const pedido = pedidoDe(numero);
  const analise = analisar(pedido);
  const campoObservacao = cartaoEl.querySelector('.obs');
  const observacao = campoObservacao.value.trim();

  // "Atenção" significa liberar com cobrança, então liberar segue a sugestão.
  const esperado = analise.sugestao === 'BLOQUEAR' ? 'BLOQUEADO' : 'LIBERADO';
  const contrariouSugestao = decisao !== esperado;

  if (contrariouSugestao && !observacao) {
    const erro = cartaoEl.querySelector('.erro');
    erro.textContent = `A sugestão é ${ROTULO_SUGESTAO[analise.sugestao]}. Para decidir diferente, escreva o motivo na observação.`;
    erro.hidden = false;
    campoObservacao.focus();
    return false;
  }

  // Guarda também a sugestão e o motivo daquele momento: é o registro que o
  // Sistemão não tem (liberado_por e liberado_em estão vazios nos 110 pedidos).
  decisoes.push({
    numero,
    decisao,
    por: NOME_FINANCEIRO,
    em: new Date().toISOString(),
    sugestao: analise.sugestao,
    motivos: analise.motivos,
    contrariouSugestao,
    observacao,
  });
  salvarDecisoes();
  return true;
}
