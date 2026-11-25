# Contratos e migração

## Comportamento preservado

Exporta CpuWorkerPool, CpuQueueFullError e CpuTaskTimeoutError, além de provideWorkers(host). O provedor inicia na fase boot e publica o pool no estado runtime. workers:false mantém a capacidade desativada.

size limita threads; maxQueue limita espera; taskTimeoutMs define o timeout padrão. run exige caminho absoluto e argumentos em array. exportName seleciona a função; signal permite cancelamento. Timeout ou cancelamento de trabalho ativo termina e substitui o worker. snapshot informa execução, fila e contadores. close rejeita tarefas pendentes e termina threads. Workers executam código confiável, têm autoridade Node e não são sandbox.

## Fronteira da plataforma

A migração mantém APIs Node onde a implementação original as utiliza. O formato .type não elimina dependências de processos, threads, sistema de arquivos ou IPC. Uma implementação embarcada exigirá outro adaptador com os mesmos contratos e uma validação específica.

## Distribuição

src contém a implementação editável. scripts/build.cjs compila recursivamente para dist; arquivos na raiz e em compat são fachadas CommonJS. O bootstrap child.js ou cpu-worker.js, quando presente, continua no pacote. Não editar dist diretamente.

## Validação

Testes em test/*.test.cjs exercitam a implementação original congelada em test/reference e a implementação .type com os mesmos cenários. Não representam prova de equivalência para toda entrada possível. Testes de integração no Lógos verificam autoridade, isolamento, reload e distribuição independente com a composição real.

## Integração

A base usa @thinkiac/module-workers fixado por commit. As entradas antigas podem encaminhar a esse pacote. createRuntimeModule permanece apenas como alias de compatibilidade; os comentários @register do provedor continuam sendo descobertos no código compilado.
