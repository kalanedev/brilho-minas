// O SELETOR E A MONTAGEM DA PÁGINA
//
// Decide qual visão mostrar: a do financeiro (js/financeiro.js) ou a de um
// vendedor (js/vendedor.js). O fluxo é sempre o mesmo: algo muda (perfil ou
// decisão) -> desenhar() refaz a tela.

let perfil = FINANCEIRO;

const dialogo = document.getElementById('aberto');

// O card do pedido, na visão de quem está vendo.
function cartaoDoPerfil(pedido, aberto) {
  return perfil === FINANCEIRO ? cartaoFinanceiro(pedido, aberto) : cartaoVendedor(pedido, aberto);
}

function desenhar() {
  const conteudo = document.getElementById('conteudo');
  conteudo.innerHTML = perfil === FINANCEIRO ? telaFinanceiro() : telaVendedor(perfil);
  document.getElementById('reiniciar').hidden = perfil !== FINANCEIRO || decisoes.length === 0;
}

// Abre um pedido sozinho, por cima da página. É o mesmo card da grade,
// com a tabela de itens no lugar do botão. A tecla Esc fecha sozinha:
// é o comportamento padrão do <dialog> aberto com showModal().
function abrirPedido(numero) {
  dialogo.innerHTML =
    cartaoDoPerfil(pedidoDe(numero), true) +
    '<button class="fechar" data-fechar aria-label="Fechar">✕</button>';
  if (!dialogo.open) dialogo.showModal();
}

function fecharPedido() {
  if (dialogo.open) dialogo.close();
}

// Um único "ouvinte" de clique para a página inteira:
// abrir card, fechar o diálogo e decidir.
function aoClicar(evento) {
  const botaoAbrir = evento.target.closest('[data-abrir]');
  if (botaoAbrir) return abrirPedido(Number(botaoAbrir.dataset.abrir));

  // Clique no "✕" ou fora do card (o que sobra do diálogo é o fundo escurecido).
  if (evento.target.closest('[data-fechar]') || evento.target === dialogo) return fecharPedido();

  const botaoDecidir = evento.target.closest('button[data-acao]');
  if (botaoDecidir) {
    const registrou = registrarDecisao(botaoDecidir.closest('.cartao'), botaoDecidir.dataset.acao);
    if (registrou) {
      fecharPedido();
      desenhar();
    }
  }
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

  document.addEventListener('click', aoClicar);

  document.getElementById('reiniciar').addEventListener('click', () => {
    if (!confirm('Apagar as decisões registradas neste navegador e recomeçar a demonstração?')) return;
    apagarDecisoes();
    desenhar();
  });

  document.getElementById('data-referencia').textContent = DATA_REFERENCIA.split('-').reverse().join('/');
  desenhar();
}

iniciar();
