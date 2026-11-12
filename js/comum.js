// O QUE AS DUAS VISÕES USAM EM COMUM
//
// Constantes, as decisões registradas e os ajudantes de texto.
// Usa DADOS (js/dados.js) e Regra (js/regra.js), carregados antes no index.html.

// Data de referência indicada no LEIA-ME dos dados. Em produção seria a data de hoje.
const DATA_REFERENCIA = '2026-11-11';

const FINANCEIRO = 'FIN';
const NOME_FINANCEIRO = 'Marta (financeiro)';
const CHAVE_DECISOES = 'brilho-minas:decisoes';

const ROTULO_SUGESTAO = { BLOQUEAR: 'Bloquear', ATENCAO: 'Atenção', LIBERAR: 'Liberar' };
const ORDEM_SUGESTAO = { BLOQUEAR: 0, ATENCAO: 1, LIBERAR: 2 }; // o que exige decisão vem primeiro
const ROTULO_STATUS = {
  recebido: 'Recebido, ainda não foi para o financeiro',
  aguardando_liberacao: 'Na fila do financeiro',
  bloqueado_financeiro: 'Bloqueado pelo financeiro',
  separacao: 'Em separação',
  em_rota: 'Em rota de entrega',
  entregue: 'Entregue',
  cancelado: 'Cancelado',
};

// ---------- decisões registradas ----------

let decisoes = lerDecisoes();

// As decisões ficam no localStorage: só existem neste navegador.
// No sistema real seriam gravadas no Sistemão (veja o README).
function lerDecisoes() {
  try {
    return JSON.parse(localStorage.getItem(CHAVE_DECISOES)) || [];
  } catch {
    return [];
  }
}

function salvarDecisoes() {
  try {
    localStorage.setItem(CHAVE_DECISOES, JSON.stringify(decisoes));
  } catch {
    // navegador sem localStorage: a decisão vale até fechar a página
  }
}

function apagarDecisoes() {
  decisoes = [];
  salvarDecisoes();
}

const decisaoDo = (numero) => decisoes.find((d) => d.numero === numero);

function analisar(pedido) {
  const liberadosAqui = DADOS.pedidos.filter((p) => decisaoDo(p.numero)?.decisao === 'LIBERADO');
  return Regra.analisarPedido(pedido, DADOS, DATA_REFERENCIA, liberadosAqui);
}

// ---------- ajudantes de texto ----------

// Todo texto que vem dos dados passa por aqui antes de virar HTML.
function esc(texto) {
  return String(texto ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

const reais = (valor) => Regra.formatarReais(Regra.paraCentavos(valor));
const diaHora = (iso) => `${Regra.formatarDia(iso)} às ${iso.slice(11, 16)}`;
const nomeVendedor = (id) => DADOS.vendedores.find((v) => v.id === id)?.nome ?? 'Vendedor não identificado';
const porCriacao = (a, b) => a.criado_em.localeCompare(b.criado_em);

function listaItens(pedido) {
  return pedido.itens.map((i) => `<li>${i.quantidade} × ${esc(i.descricao)}</li>`).join('');
}

function selo(sugestao, prefixo = '') {
  return `<span class="selo selo-${sugestao.toLowerCase()}">${prefixo}${ROTULO_SUGESTAO[sugestao]}</span>`;
}

function listaAlertas(alertas) {
  if (!alertas.length) return '';
  return `<ul class="alertas">${alertas.map((a) => `<li>${esc(a.texto)}</li>`).join('')}</ul>`;
}
