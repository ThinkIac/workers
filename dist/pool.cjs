var CpuQueueFullError, CpuTaskTimeoutError, CpuWorkerPool, __importDefault, abortError, node_path_1, node_worker_threads_1, nonNegativeInteger, positiveInteger;

positiveInteger = function(value, fallback) {
  if (Number.isInteger(value) && Number(value) > 0) {
    return Number(value);
  } else {
    return fallback;
  }
};

nonNegativeInteger = function(value, fallback) {
  if (Number.isInteger(value) && Number(value) >= 0) {
    return Number(value);
  } else {
    return fallback;
  }
};

abortError = function() {
  var error;
  error = new Error('CPU task aborted');
  error.name = 'AbortError';
  return error;
};

'use strict';

__importDefault = this && this.__importDefault || function(mod) {
  if (mod && mod.__esModule) {
    return mod;
  } else {
    return {
      'default': mod
    };
  }
};

Object.defineProperty(exports, '__esModule', {
  value: true
});

exports.CpuWorkerPool = exports.CpuTaskTimeoutError = exports.CpuQueueFullError = void 0;

node_worker_threads_1 = require('node:worker_threads');

node_path_1 = __importDefault(require('node:path'));

CpuQueueFullError = class CpuQueueFullError extends Error {
  constructor(capacity) {
    super('CPU worker queue is full ('.concat(capacity, ')'));
    this.code = 'CPU_QUEUE_FULL';
    this.capacity = capacity;
    this.name = 'CpuQueueFullError';
    return;
  }

};

exports.CpuQueueFullError = CpuQueueFullError;

CpuTaskTimeoutError = class CpuTaskTimeoutError extends Error {
  constructor(timeoutMs) {
    super('CPU task timed out after '.concat(timeoutMs, 'ms'));
    this.code = 'CPU_TASK_TIMEOUT';
    this.timeoutMs = timeoutMs;
    this.name = 'CpuTaskTimeoutError';
    return;
  }

};

exports.CpuTaskTimeoutError = CpuTaskTimeoutError;

/** Bounded pool for trusted, CPU-bound modules. Workers are reused; overload is rejected. */
CpuWorkerPool = class CpuWorkerPool {
  constructor(options) {
    if (options == void 0) {
      options = {};
    }
    this.slots = [];
    this.queue = [];
    this.sequence = 0;
    this.closed = false;
    this.totals = {
      submitted: 0,
      completed: 0,
      failed: 0,
      rejected: 0,
      timedOut: 0,
      cancelled: 0
    };
    this.size = positiveInteger(options.size, Math.max(1, Math.min(4, Number(process.env.UV_THREADPOOL_SIZE) || 4)));
    this.maxQueue = nonNegativeInteger(options.maxQueue, this.size * 8);
    this.taskTimeoutMs = positiveInteger(options.taskTimeoutMs, 30000);
    return;
  }

  run(modulePath, args, options) {
    var _a, _this, idle;
    _this = this;
    _a = void 0;
    if (args == void 0) {
      args = [];
    }
    if (options == void 0) {
      options = {};
    }
    if (this.closed) {
      return Promise.reject(new Error('CPU worker pool is closed'));
    }
    if (!node_path_1.default.isAbsolute(modulePath)) {
      return Promise.reject(new TypeError('CPU worker module path must be absolute'));
    }
    if (!Array.isArray(args)) {
      return Promise.reject(new TypeError('CPU worker arguments must be an array'));
    }
    if (((_a = options.signal) == null || _a == void 0 ? void 0 : _a.aborted)) {
      return Promise.reject(abortError());
    }
    idle = this.slots.find(function(slot) {
      return !slot.task;
    });
    if (!idle && this.slots.length >= this.size && this.queue.length >= this.maxQueue) {
      this.totals.rejected++;
      return Promise.reject(new CpuQueueFullError(this.maxQueue));
    }
    this.totals.submitted++;
    return new Promise(function(resolve, reject) {
      var _a;
      var _b, slot, task;
      _a = void 0;
      _b = void 0;
      task = {
        id: ++_this.sequence,
        module: modulePath,
        exportName: ((_a = options.exportName) != null && _a != void 0 ? _a : 'default'),
        args: args,
        timeoutMs: positiveInteger(options.timeoutMs, _this.taskTimeoutMs),
        signal: options.signal,
        resolve: resolve,
        reject: reject
      };
      task.abort = function() {
        return _this.cancel(task);
      };
      ((_b = task.signal) == null || _b == void 0 ? void 0 : _b.addEventListener('abort', task.abort, {
        once: true
      }));
      if (idle) {
        _this.assign(idle, task);
      } else if (_this.slots.length < _this.size) {
        slot = _this.createSlot();
        _this.assign(slot, task);
      } else {
        _this.queue.push(task);
      }
    });
  }

  snapshot() {
    var __assign;
    __assign = function() {
      __assign = Object.assign || function(t) {
        var i, n, p, s;
        s = void 0;
        i = 1;
        n = arguments.length;
        while (i < n) {
          s = arguments[i];
          for (p in s) {
            if (Object.prototype.hasOwnProperty.call(s, p)) {
              t[p] = s[p];
            }
          }
          i++;
        }
        return t;
      };
      return __assign.apply(this, arguments);
    };
    return __assign({
      size: this.size,
      running: this.slots.filter(function(slot) {
        return slot.task;
      }).length,
      queued: this.queue.length,
      maxQueue: this.maxQueue
    }, this.totals);
  }

  async close() {
    var __caught, __values, _a, _b, _c, _d, e_1, e_1_1, e_2, e_2_1, slot, slots, slots_1, slots_1_1, task;
    __values = function(o) {
      var i, m, s;
      s = typeof Symbol == 'function' && Symbol.iterator;
      m = s && o[s];
      i = 0;
      if (m) {
        return m.call(o);
      }
      if (o && typeof o.length == 'number') {
        return {
          next: function() {
            if (o && i >= o.length) {
              o = void 0;
            }
            return {
              value: o && o[i++],
              done: !o
            };
          }
        };
      }
      throw new TypeError((s ? 'Object is not iterable.' : 'Symbol.iterator is not defined.'));
    };
    e_1 = void 0;
    _a = void 0;
    e_2 = void 0;
    _b = void 0;
    if (false) {
      await void 0;
    }
    if (this.closed) {
      return;
    }
    this.closed = true;
    try {
      _c = __values(this.queue.splice(0));
      _d = _c.next();
      while (!_d.done) {
        task = _d.value;
        this.finishTask(task, new Error('CPU worker pool closed'));
        _d = _c.next();
      }
    } catch (error1) {
      e_1_1 = error1;
      e_1 = {
        error: e_1_1
      };
    } finally {
      try {
        if (_d && !_d.done && (_a = _c.return)) {
          _a.call(_c);
        }
      } catch (error1) {
        __caught = error1;
        throw __caught;
      } finally {
        if (e_1) {
          throw e_1.error;
        }
      }
    }
    slots = this.slots.splice(0);
    try {
      slots_1 = __values(slots);
      slots_1_1 = slots_1.next();
      while (!slots_1_1.done) {
        slot = slots_1_1.value;
        if (slot.timer) {
          clearTimeout(slot.timer);
        }
        if (slot.task) {
          this.finishTask(slot.task, new Error('CPU worker pool closed'));
        }
        slots_1_1 = slots_1.next();
      }
    } catch (error1) {
      e_2_1 = error1;
      e_2 = {
        error: e_2_1
      };
    } finally {
      try {
        if (slots_1_1 && !slots_1_1.done && (_b = slots_1.return)) {
          _b.call(slots_1);
        }
      } catch (error1) {
        __caught = error1;
        throw __caught;
      } finally {
        if (e_2) {
          throw e_2.error;
        }
      }
    }
    await Promise.all(slots.map(function(slot) {
      return slot.worker.terminate().catch(function() {
        return undefined;
      });
    }));
  }

  createSlot() {
    var _this, slot, workerPath;
    _this = this;
    slot = {
      worker: null,
      task: null,
      timer: null
    };
    workerPath = node_path_1.default.join(__dirname, 'cpu-worker.js');
    slot.worker = new node_worker_threads_1.Worker(workerPath);
    slot.worker.on('message', function(message) {
      return _this.onMessage(slot, message);
    });
    slot.worker.on('error', function(error) {
      return _this.replace(slot, error);
    });
    slot.worker.on('exit', function(code) {
      if (!_this.closed && code != 0) {
        _this.replace(slot, new Error('CPU worker exited ('.concat(code, ')')));
      }
    });
    this.slots.push(slot);
    return slot;
  }

  assign(slot, task) {
    var _a, _b, _this;
    _this = this;
    _a = void 0;
    _b = void 0;
    slot.task = task;
    slot.timer = setTimeout((function() {
      _this.totals.timedOut++;
      _this.replace(slot, new CpuTaskTimeoutError(task.timeoutMs));
    }), task.timeoutMs);
    ((_b = (_a = slot.timer).unref) == null || _b == void 0 ? void 0 : _b.call(_a));
    slot.worker.postMessage({
      id: task.id,
      module: task.module,
      exportName: task.exportName,
      args: task.args
    });
  }

  onMessage(slot, message) {
    var error, task;
    task = slot.task;
    if (!task || (message === null || message === void 0 ? void 0 : message.id) != task.id) {
      return;
    }
    if (slot.timer) {
      clearTimeout(slot.timer);
    }
    slot.timer = null;
    slot.task = null;
    if (message.error) {
      error = new Error(message.error.message);
      error.name = message.error.name;
      if (message.error.stack) {
        error.stack = message.error.stack;
      }
      this.finishTask(task, error);
      this.totals.failed++;
    } else {
      this.finishTask(task, null, message.result);
      this.totals.completed++;
    }
    this.drain(slot);
  }

  cancel(task) {
    var queued, slot;
    queued = this.queue.indexOf(task);
    if (queued >= 0) {
      this.queue.splice(queued, 1);
      this.totals.cancelled++;
      this.finishTask(task, abortError());
      return;
    }
    slot = this.slots.find(function(candidate) {
      return candidate.task == task;
    });
    if (slot) {
      this.totals.cancelled++;
      this.replace(slot, abortError());
    }
  }

  replace(slot, error) {
    var _this, index, replacement, task, workerPath;
    _this = this;
    if (!this.slots.includes(slot)) {
      return;
    }
    if (slot.timer) {
      clearTimeout(slot.timer);
    }
    task = slot.task;
    slot.task = null;
    slot.timer = null;
    if (task) {
      this.finishTask(task, error);
      if (!error.name == 'AbortError' && !(error instanceof CpuTaskTimeoutError)) {
        this.totals.failed++;
      }
    }
    slot.worker.terminate().catch(function() {
      return undefined;
    });
    if (this.closed) {
      return;
    }
    index = this.slots.indexOf(slot);
    replacement = {
      worker: null,
      task: null,
      timer: null
    };
    workerPath = node_path_1.default.join(__dirname, 'cpu-worker.js');
    replacement.worker = new node_worker_threads_1.Worker(workerPath);
    replacement.worker.on('message', function(message) {
      return _this.onMessage(replacement, message);
    });
    replacement.worker.on('error', function(next) {
      return _this.replace(replacement, next);
    });
    replacement.worker.on('exit', function(code) {
      if (!_this.closed && code != 0) {
        _this.replace(replacement, new Error('CPU worker exited ('.concat(code, ')')));
      }
    });
    this.slots[index] = replacement;
    this.drain(replacement);
  }

  drain(slot) {
    var next;
    next = this.queue.shift();
    if (next) {
      this.assign(slot, next);
    }
  }

  finishTask(task, error, result) {
    var _a;
    _a = void 0;
    if (task.abort) {
      ((_a = task.signal) == null || _a == void 0 ? void 0 : _a.removeEventListener('abort', task.abort));
    }
    (error ? task.reject(error) : task.resolve(result));
  }

};

exports.CpuWorkerPool = CpuWorkerPool;
