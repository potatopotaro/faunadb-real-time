const AsyncInterval = require("interval-promise");

function asyncInterval(promise, ms) {
  const self = this;

  this._shouldStop = false;

  this._interval = AsyncInterval(async (iteration, stop) => {
    if (self._shouldStop) {
      stop();
      this._shouldStop = undefined;
      this._interval = undefined;
    } else {
      await promise();
    }
  }, ms);

  this.destroy = function () {
    self._shouldStop = true;
  };
}

function DynamicAsyncInterval(promise, interval) {
  const self = this;

  this._promise = promise;

  this._interval = new asyncInterval(promise, interval);

  this.reschedule = function (interval) {
    // if no interval entered, use the interval passed in on creation
    if (!interval) interval = self._interval;

    if (self._interval) self._interval.destroy();
    self._interval = new asyncInterval(self._promise, interval);
  };

  this.clear = function () {
    if (self._interval) {
      self._interval.destroy();
      self._interval = undefined;
    }
  };

  this.destroy = function () {
    if (self._interval) {
      self._interval.destroy();
    }
    self._promise = undefined;
    self._interval = undefined;
  };
}

function dynamicAsyncInterval(promise, ms) {
  if (typeof promise !== "function") throw new Error("promise/callback needed");
  if (typeof ms !== "number")
    throw new Error("interval (in milliseconds) needed");

  return new DynamicAsyncInterval(promise, ms);
}

module.exports = dynamicAsyncInterval;
