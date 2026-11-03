// Teste de fumaça: percorre o fluxo principal da API contra uma instância
// em execução (Docker Compose no CI ou local). Uso:
//   BASE_URL=http://localhost:3000 node scripts/smoke-test.mjs
// Cada execução usa códigos e CPF novos, então pode rodar no mesmo banco.

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3000';
const sufixo = Date.now().toString().slice(-8);

let falhas = 0;

async function chamar(metodo, caminho, corpo) {
  const resposta = await fetch(BASE_URL + caminho, {
    method: metodo,
    headers: { 'Content-Type': 'application/json' },
    body: corpo === undefined ? undefined : JSON.stringify(corpo),
  });
  const texto = await resposta.text();
  return { status: resposta.status, corpo: texto ? JSON.parse(texto) : null };
}

function verificar(descricao, resultado, statusEsperado, conferir) {
  const ok =
    resultado.status === statusEsperado &&
    (conferir ? conferir(resultado.corpo) : true);
  console.log(
    `${ok ? 'OK  ' : 'FALHOU'}  ${descricao} (HTTP ${resultado.status})`,
  );
  if (!ok) {
    falhas++;
    console.log(
      `      esperado HTTP ${statusEsperado}, corpo: ${JSON.stringify(resultado.corpo)}`,
    );
  }
  return resultado.corpo;
}

/** CPF válido gerado a partir de 9 dígitos, para não colidir entre execuções */
function gerarCpf(base9) {
  const digitos = base9.split('').map(Number);
  for (const tamanho of [9, 10]) {
    const soma = digitos
      .slice(0, tamanho)
      .reduce((acc, n, i) => acc + n * (tamanho + 1 - i), 0);
    const resto = (soma * 10) % 11;
    digitos.push(resto === 10 ? 0 : resto);
  }
  return digitos.join('');
}

verificar(
  'GET /health',
  await chamar('GET', '/health'),
  200,
  (c) => c.status === 'ok',
);

verificar(
  'GET /openapi.json (documentação da API)',
  await chamar('GET', '/openapi.json'),
  200,
  (c) =>
    c.openapi?.startsWith('3') &&
    '/produtos-quimicos' in c.paths &&
    '/cargas-quimicas' in c.paths,
);

const usuario = verificar(
  'Cadastrar responsável técnico',
  await chamar('POST', '/usuarios', {
    nome: 'Responsável Smoke Test',
    cpf: gerarCpf(`1${sufixo}`),
    cargoProfissional: 'RESPONSAVEL_TECNICO',
    dataNascimento: '1990-05-14',
    senha: 'senhaForte123',
  }),
  201,
);

const produto = verificar(
  'Cadastrar produto químico',
  await chamar('POST', '/produtos-quimicos', {
    nome: `Ácido Sulfúrico ${sufixo}`,
    numeroOnu: 'UN1830',
    classeRisco: 'CLASSE_8',
    grupoCompatibilidade: 'CORROSIVOS',
  }),
  201,
  (c) => c.status === 'ATIVO',
);

verificar(
  'Bloquear produto sem nome (RN001)',
  await chamar('POST', '/produtos-quimicos', {
    numeroOnu: 'UN1830',
    classeRisco: 'CLASSE_8',
    grupoCompatibilidade: 'CORROSIVOS',
  }),
  400,
);

if (usuario?.id && produto?.id) {
  const autorId = usuario.id;
  const novaCarga = (extra = {}) => ({
    codigo: `CG-${sufixo}`,
    produtoId: produto.id,
    quantidade: 1500.5,
    unidadeMedida: 'KG',
    origem: 'Terminal A',
    destino: 'Navio X',
    responsavelTecnicoId: usuario.id,
    documentacaoValida: true,
    autorId,
    ...extra,
  });

  verificar(
    'Bloquear carga com quantidade zero (RN004)',
    await chamar(
      'POST',
      '/cargas-quimicas',
      novaCarga({ codigo: `CG-Z-${sufixo}`, quantidade: 0 }),
    ),
    400,
  );

  const carga = verificar(
    'Registrar carga química',
    await chamar('POST', '/cargas-quimicas', novaCarga()),
    201,
    (c) => c.status === 'REGISTRADA',
  );

  if (carga?.id) {
    const status = (novo) =>
      chamar('PATCH', `/cargas-quimicas/${carga.id}/status`, {
        status: novo,
        autorId,
      });

    verificar(
      'Status REGISTRADA -> EM_ANALISE',
      await status('EM_ANALISE'),
      200,
    );
    verificar(
      'Status EM_ANALISE -> EM_INSPECAO',
      await status('EM_INSPECAO'),
      200,
    );
    verificar(
      'Liberar carga',
      await chamar('PATCH', `/cargas-quimicas/${carga.id}/liberar`, {
        autorId,
      }),
      200,
      (c) => c.status === 'LIBERADA',
    );
    verificar(
      'Bloquear transição LIBERADA -> REGISTRADA (RN010)',
      await status('REGISTRADA'),
      422,
      (c) => c.codigo === 'TRANSICAO_STATUS_INVALIDA',
    );
    verificar(
      'Status LIBERADA -> EM_MOVIMENTACAO',
      await status('EM_MOVIMENTACAO'),
      200,
    );
    verificar(
      'Status EM_MOVIMENTACAO -> FINALIZADA',
      await status('FINALIZADA'),
      200,
    );
    verificar(
      'Buscar carga finalizada',
      await chamar('GET', `/cargas-quimicas/${carga.id}`),
      200,
      (c) => c.status === 'FINALIZADA',
    );
  }

  verificar(
    'Inativar produto químico',
    await chamar('PATCH', `/produtos-quimicos/${produto.id}/inativar`),
    200,
  );
  verificar(
    'Bloquear carga com produto inativo (RN003)',
    await chamar(
      'POST',
      '/cargas-quimicas',
      novaCarga({ codigo: `CG-I-${sufixo}` }),
    ),
    422,
    (c) => c.codigo === 'PRODUTO_QUIMICO_INATIVO',
  );
}

verificar(
  'Listar cargas químicas',
  await chamar('GET', '/cargas-quimicas'),
  200,
  (c) => Array.isArray(c.itens),
);

if (falhas > 0) {
  console.error(`\n${falhas} verificação(ões) falharam`);
  process.exit(1);
}
console.log('\nTeste de fumaça concluído sem falhas');
