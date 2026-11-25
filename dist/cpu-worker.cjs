// This bootstrap runs inside a Node worker thread. It is not a sandbox.
var parentPort, pathToFileURL;

({parentPort} = require('node:worker_threads'));

({pathToFileURL} = require('node:url'));

if (!parentPort) {
  throw new Error('CPU worker requires a parent port');
}

parentPort.on('message', async function(message) {
  var args, error, exportName, fn, id, loaded, modulePath, result;
  ({
    id,
    module: modulePath,
    exportName,
    args
  } = message);
  try {
    // Keep native import() to support ESM as well as CommonJS tasks.
    loaded = (await import(pathToFileURL(modulePath).href));
    fn = exportName === 'default' ? loaded.default : loaded[exportName];
    if (typeof fn !== 'function') {
      throw new TypeError(`Worker export \"${exportName}\" is not a function`);
    }
    result = (await fn(...args));
    parentPort.postMessage({id, result});
  } catch (error1) {
    error = error1;
    parentPort.postMessage({
      id,
      error: {
        name: (error != null ? error.name : void 0) || 'Error',
        message: (error != null ? error.message : void 0) || String(error),
        stack: error != null ? error.stack : void 0
      }
    });
  }
});
