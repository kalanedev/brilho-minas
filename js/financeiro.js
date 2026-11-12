// VISÃO DO FINANCEIRO
//
// A fila da Marta: cada pedido com a sugestão, o motivo, os números e os
// botões para registrar a decisão. Usa o que está em js/comum.js.

function cartaoFinanceiro(pedido) {
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
          <input type="text" id="obs-${pedido.numero}" maxlength="200">
        </label>
        <p class="erro" id="erro-${pedido.numero}" hidden></p>
        <button data-acao="LIBERADO" data-numero="${pedido.numero}" class="botao botao-liberar">Liberar</button>
        <button data-acao="BLOQUEADO" data-numero="${pedido.numero}" class="botao botao-bloquear">Bloquear</button>
      </div>`;
  } else if (pedido.status === 'bloqueado_financeiro') {
    rodape = `<p class="decisao decisao-bloqueado"><strong>Bloqueado no Sistemão.</strong> O Sistemão não registrou quem bloqueou nem quando.</p>`;
  } else {
    rodape = `<p class="discreto">${esc(ROTULO_STATUS[pedido.status])}. A sugestão acima é uma prévia.</p>`;
  }

  return `
    <article class="cartao borda-${analise.sugestao.toLowerCase()}">
      <header>
        ${selo(analise.sugestao, decisao ? 'Sugestão: ' : '')}
        <h3>Pedido ${pedido.numero} · ${esc(analise.cliente.razao_social)}</h3>
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
      <details><summary>Itens do pedido</summary><ul>${listaItens(pedido)}</ul></details>
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
  const secao = (titulo, pedidos) =>
    pedidos.length ? `<h2>${titulo} (${pedidos.length})</h2>${pedidos.map(cartaoFinanceiro).join('')}` : '';

  return `
    <p class="resumo">
      <strong>${pendentes.length}</strong> pedidos aguardando decisão:
      ${selo('BLOQUEAR', contar('BLOQUEAR') + ' ')} ${selo('ATENCAO', contar('ATENCAO') + ' ')} ${selo('LIBERAR', contar('LIBERAR') + ' ')}
    </p>
    ${pendentes.length ? '' : '<p class="vazio">Fila zerada. Nenhum pedido aguardando decisão.</p>'}
    ${secao('Aguardando decisão', pendentes.map((x) => x.pedido))}
    ${secao('Já decididos', decididos)}
    ${secao('Ainda não chegaram ao financeiro', aCaminho)}`;
}

// ---------- registrar a decisão ----------

function registrarDecisao(numero, decisao) {
  const pedido = DADOS.pedidos.find((p) => p.numero === numero);
  const analise = analisar(pedido);
  const observacao = document.getElementById(`obs-${numero}`).value.trim();

  // "Atenção" significa liberar com cobrança, então liberar segue a sugestão.
  const esperado = analise.sugestao === 'BLOQUEAR' ? 'BLOQUEADO' : 'LIBERADO';
  const contrariouSugestao = decisao !== esperado;

  if (contrariouSugestao && !observacao) {
    const erro = document.getElementById(`erro-${numero}`);
    erro.textContent = `A sugestão é ${ROTULO_SUGESTAO[analise.sugestao]}. Para decidir diferente, escreva o motivo na observação.`;
    erro.hidden = false;
    document.getElementById(`obs-${numero}`).focus();
    return;
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
  desenhar();
}
