// Testes da regra de crédito. Rodar com:  node --test
//
// Usam os dados reais do Sistemão (js/dados.js) na data de referência,
// mais alguns casos inventados para os limites exatos da regra.

const test = require('node:test');
const assert = require('node:assert/strict');

const Regra = require('../js/regra.js');
const DADOS = require('../js/dados.js');

const HOJE = '2026-11-11';
const pedido = (numero) => DADOS.pedidos.find((p) => p.numero === numero);
const sugestao = (numero, liberados = []) => Regra.analisarPedido(pedido(numero), DADOS, HOJE, liberados).sugestao;

test('cliente sem dívida e dentro do limite: LIBERAR', () => {
  assert.equal(sugestao(1090), 'LIBERAR');
});

test('boleto vencido há exatamente 5 dias (T0111, C032): ATENCAO', () => {
  const analise = Regra.analisarPedido(pedido(1109), DADOS, HOJE);
  assert.equal(analise.valores.maiorAtraso, 5);
  assert.equal(analise.sugestao, 'ATENCAO');
});

test('boleto vencido há 6 dias (T0077, C023): BLOQUEAR', () => {
  const analise = Regra.analisarPedido(pedido(1104), DADOS, HOJE);
  assert.equal(analise.valores.maiorAtraso, 6);
  assert.equal(analise.sugestao, 'BLOQUEAR');
});

test('sem atraso, mas dívida + pedido passa do limite (C004): BLOQUEAR', () => {
  const analise = Regra.analisarPedido(pedido(1096), DADOS, HOJE);
  assert.equal(analise.valores.maiorAtraso, 0);
  assert.equal(analise.sugestao, 'BLOQUEAR');
});

test('boleto "aberto" que já venceu conta como vencido (T0132, C006)', () => {
  const analise = Regra.analisarPedido(pedido(1106), DADOS, HOJE);
  assert.equal(analise.valores.maiorAtraso, 12);
  assert.equal(analise.sugestao, 'BLOQUEAR');
  assert.ok(analise.alertas.some((a) => a.texto.includes('T0132')));
});

test('cadastro duplicado: C037 herda os boletos do C001 e o menor limite', () => {
  const analise = Regra.analisarPedido(pedido(1110), DADOS, HOJE);
  assert.equal(analise.sugestao, 'BLOQUEAR');
  assert.equal(analise.valores.limite, 500000); // R$ 5.000,00 em centavos
  assert.ok(analise.alertas.some((a) => a.texto.includes('C001 e C037')));
});

test('pedidos 1105 e 1108 são sinalizados como possível repetição', () => {
  const a = Regra.analisarPedido(pedido(1105), DADOS, HOJE);
  const b = Regra.analisarPedido(pedido(1108), DADOS, HOJE);
  assert.ok(a.alertas.some((x) => x.texto.includes('1108')));
  assert.ok(b.alertas.some((x) => x.texto.includes('1105')));
});

test('pedido já liberado entra na dívida: liberar o 1105 faz o 1108 passar do limite', () => {
  assert.equal(sugestao(1108), 'LIBERAR');
  assert.equal(sugestao(1108, [pedido(1105)]), 'BLOQUEAR');
});

test('a fila de hoje: 6 bloquear, 2 atenção, 6 liberar', () => {
  const contagem = { BLOQUEAR: 0, ATENCAO: 0, LIBERAR: 0 };
  DADOS.pedidos.filter((p) => p.status === 'aguardando_liberacao').forEach((p) => contagem[sugestao(p.numero)]++);
  assert.deepEqual(contagem, { BLOQUEAR: 6, ATENCAO: 2, LIBERAR: 6 });
});

// ---- casos inventados, para os limites exatos ----

function cenario({ limite, titulos, valorPedido }) {
  const dados = {
    clientes: [{ id: 'X', cnpj: '1', vendedor_id: 'V01', limite_credito: limite }],
    titulos: titulos.map((t, i) => ({ id: 'T' + i, cliente_id: 'X', status: 'aberto', ...t })),
    pedidos: [],
  };
  const p = { numero: 1, cliente_id: 'X', valor_total: valorPedido, criado_em: HOJE + 'T10:00', itens: [], observacao: '' };
  return Regra.analisarPedido(p, dados, HOJE).sugestao;
}

test('dívida + pedido igual ao limite não bloqueia; um centavo a mais bloqueia', () => {
  const titulos = [{ valor: 900, vencimento: '2026-12-01' }];
  assert.equal(cenario({ limite: 1000, titulos, valorPedido: 100 }), 'LIBERAR');
  assert.equal(cenario({ limite: 1000, titulos, valorPedido: 100.01 }), 'BLOQUEAR');
});

test('boleto que vence hoje não está vencido; vencido ontem é ATENCAO', () => {
  assert.equal(cenario({ limite: 1000, titulos: [{ valor: 10, vencimento: '2026-11-11' }], valorPedido: 10 }), 'LIBERAR');
  assert.equal(cenario({ limite: 1000, titulos: [{ valor: 10, vencimento: '2026-11-10' }], valorPedido: 10 }), 'ATENCAO');
});

test('boleto pago não conta, mesmo pago com atraso', () => {
  const titulos = [{ valor: 5000, vencimento: '2026-09-01', status: 'pago' }];
  assert.equal(cenario({ limite: 1000, titulos, valorPedido: 10 }), 'LIBERAR');
});
