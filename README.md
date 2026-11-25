# @thinkiac/module-workers

Executa trabalho de CPU confiável em um pool limitado de threads.

Fontes em LógosType (`src/*.type`); JavaScript gerado em `dist/`. Entradas CommonJS preservam imports e descoberta declarativa. Migração de linguagem e distribuição, sem novos recursos.

## Instalação

```sh
npm install ThinkIac/workers#main
```

Para reproduzir uma instalação, substitua main pelo hash do commit. Requer Node 22 ou superior. Não foi validado em QuickJS ou ESP32.

## API e funcionamento

Exporta CpuWorkerPool, CpuQueueFullError e CpuTaskTimeoutError, além de provideWorkers(host). O provedor inicia na fase boot e publica o pool no estado runtime. workers:false mantém a capacidade desativada.

```text
pool.run → fila limitada → worker thread → import do módulo → função exportada → resultado serializável.
```

size limita threads; maxQueue limita espera; taskTimeoutMs define o timeout padrão. run exige caminho absoluto e argumentos em array. exportName seleciona a função; signal permite cancelamento. Timeout ou cancelamento de trabalho ativo termina e substitui o worker. snapshot informa execução, fila e contadores. close rejeita tarefas pendentes e termina threads. Workers executam código confiável, têm autoridade Node e não são sandbox.

## Exemplo

```js
const { CpuWorkerPool } = require('@thinkiac/module-workers');
const pool = new CpuWorkerPool({ size: 2, maxQueue: 8 });
try {
  const result = await pool.run('/app/tasks.mjs', [10], {
    exportName: 'fibonacci', timeoutMs: 3000
  });
  console.log(result);
} finally { await pool.close(); }
```

## Desenvolvimento

```sh
npm ci
npm test
npm run build
```

O build usa [LogosType](https://github.com/ThinkIac/LogosType) fixado por commit. A distribuição inclui JS compilado para uso sem compilador em produção. prepare recompila ao instalar pelo Git. Dependências entre módulos usam repositórios fixados, sem caminhos vizinhos.

[Contratos e migração](docs/contracts.md). MIT.
