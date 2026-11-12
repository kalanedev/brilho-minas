// Junta os JSON da pasta dados/ em um único arquivo js/dados.js.
//
// Por quê: uma página aberta direto do disco (file://) não consegue buscar
// arquivos .json com fetch(). Um <script src="js/dados.js"> funciona sempre.
//
// Rodar de novo sempre que os arquivos de dados/ mudarem:
//   node scripts/gerar-dados.js

const fs = require('node:fs');
const path = require('node:path');

const pastaDados = path.join(__dirname, '..', 'dados');
const ler = (nome) => JSON.parse(fs.readFileSync(path.join(pastaDados, nome + '.json'), 'utf8'));

const dados = {
  vendedores: ler('vendedores'),
  clientes: ler('clientes'),
  produtos: ler('produtos'),
  pedidos: ler('pedidos'),
  titulos: ler('titulos_financeiros'),
};

const conteudo =
  '// ARQUIVO GERADO por scripts/gerar-dados.js. Não edite à mão.\n' +
  'const DADOS = ' + JSON.stringify(dados, null, 1) + ';\n' +
  "if (typeof module !== 'undefined') module.exports = DADOS;\n";

fs.writeFileSync(path.join(__dirname, '..', 'js', 'dados.js'), conteudo);
console.log('js/dados.js gerado:', Object.entries(dados).map(([k, v]) => `${v.length} ${k}`).join(', '));
