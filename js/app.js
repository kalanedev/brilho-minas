// O SELETOR E A MONTAGEM DA PÁGINA
//
// Decide qual visão mostrar: a do financeiro (js/financeiro.js) ou a de um
// vendedor (js/vendedor.js). O fluxo é sempre o mesmo: algo muda (perfil ou
// decisão) -> desenhar() refaz a tela.

let perfil = FINANCEIRO;

function desenhar() {
  const conteudo = document.getElementById('conteudo');
  conteudo.innerHTML = perfil === FINANCEIRO ? telaFinanceiro() : telaVendedor(perfil);
  document.getElementById('reiniciar').hidden = perfil !== FINANCEIRO || decisoes.length === 0;
}

function iniciar() {
  const seletor = document.getElementById('perfil');
  seletor.innerHTML =
    `<option value="${FINANCEIRO}">${esc(NOME_FINANCEIRO)}</option>` +
    DADOS.vendedores.map((v) => `<option value="${esc(v.id)}">${esc(v.nome)} (vendedor, ${esc(v.regiao)})</option>`).join('');
  seletor.addEventListener('change', () => {
    perfil = seletor.value;
    desenhar();
  });

  // Um único "ouvinte" de clique para todos os botões Liberar/Bloquear.
  document.getElementById('conteudo').addEventListener('click', (evento) => {
    const botao = evento.target.closest('button[data-acao]');
    if (botao) registrarDecisao(Number(botao.dataset.numero), botao.dataset.acao);
  });

  document.getElementById('reiniciar').addEventListener('click', () => {
    if (!confirm('Apagar as decisões registradas neste navegador e recomeçar a demonstração?')) return;
    apagarDecisoes();
    desenhar();
  });

  document.getElementById('data-referencia').textContent = DATA_REFERENCIA.split('-').reverse().join('/');
  desenhar();
}

iniciar();
