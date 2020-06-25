const EventEmitter = require("events");
const equal = require("deep-equal");
const { query: q } = require("faunadb");
const dynamicAsyncInterval = require("./DynamicAsyncInterval");
const LivePageHelper = require("./LivePageHelper");
const { v4: uuidv4 } = require("uuid");

const withRealTimeMethods = (client) => {
  client.lastActivityAt = new Date();
  client.emitter = new EventEmitter();

  client.markClientActivity = function () {
    this.lastActivityAt = new Date();
    this.emitter.emit("newClientActivity", this.lastActivityAt);
  };

  client.liveQuery = function (
    expression,
    {
      activeMs = 5000,
      passiveMs = 10000,
      passiveAfter = 10000,
      ...options
    } = {}
  ) {
    const eventId = uuidv4();
    let useActiveMs = true;
    let isDynamic = activeMs !== passiveMs;
    let poll;

    const scheduler = () => {
      const now = new Date();
      const shouldUseActiveMs = now - this.lastActivityAt < passiveAfter;
      if (shouldUseActiveMs !== useActiveMs) {
        useActiveMs = shouldUseActiveMs;
        if (this.emitter.listenerCount(eventId) > 0 && poll !== undefined) {
          poll.reschedule(useActiveMs ? activeMs : passiveMs);
        }
      }
    };

    return {
      subscribe: (callback) => {
        this.emitter.on(eventId, callback);

        if (this.emitter.listenerCount(eventId) === 1) {
          (async () => {
            let prevResult;
            poll = dynamicAsyncInterval(async () => {
              let result = await client.query(expression, options);
              if (!equal(result, prevResult)) {
                prevResult = result;
                this.emitter.emit(eventId, {
                  result,
                  pollFrequency: useActiveMs ? activeMs : passiveMs,
                });
              }

              if (isDynamic) scheduler();
            }, activeMs);

            if (isDynamic) this.emitter.on("newClientActivity", scheduler);
          })();
        }

        return () => {
          this.emitter.off(eventId, callback);
          if (this.emitter.listenerCount(eventId) === 0) {
            poll.destroy();
            this.emitter.off("newClientActivity", scheduler);
          }
        };
      },
    };
  };

  // has to return an object with at least 3 methods:
  // map, filter, and subscribe
  client.livePaginate = function (
    set,
    params = {},
    {
      activeMs = 5000,
      passiveMs = 10000,
      passiveAfter = 10000,
      ...options
    } = {}
  ) {
    const eventId = uuidv4();
    let useActiveMs = true;
    let isDynamic = activeMs !== passiveMs;
    let poll;

    // wrapped because PageHelper's methods will replace itself, removing any instance added methods
    const livePaginateHelper = new LivePageHelper(client, set, params, options);

    const scheduler = () => {
      const now = new Date();
      const shouldUseActiveMs = now - this.lastActivityAt < passiveAfter;
      if (shouldUseActiveMs !== useActiveMs) {
        useActiveMs = shouldUseActiveMs;
        if (this.emitter.listenerCount(eventId) > 0 && poll !== undefined) {
          poll.reschedule(useActiveMs ? activeMs : passiveMs);
        }
      }
    };

    livePaginateHelper.subscribe = (callback) => {
      this.emitter.on(eventId, callback);

      if (this.emitter.listenerCount(eventId) === 1) {
        (async () => {
          let watermark = await this.query(q.ToMicros(q.Now()));
          poll = dynamicAsyncInterval(async () => {
            let data = [];
            livePaginateHelper.repaginate(
              set,
              {
                ...params,
                after: watermark,
              },
              options
            );
            await livePaginateHelper.each((page) => {
              data = data.concat(page);
            });
            if (data.length) {
              let lastItem = data.slice(-1)[0];
              if (lastItem.ts) watermark = lastItem.ts + 1;
              else watermark = lastItem[0] + 1; // should be a FaunaDB timestamp
              this.emitter.emit(eventId, {
                data,
                pollFrequency: useActiveMs ? activeMs : passiveMs,
              });
            }
            if (isDynamic) scheduler();
          }, activeMs);

          if (isDynamic) this.emitter.on("newClientActivity", scheduler);
        })();
      }

      return () => {
        this.emitter.off(eventId, callback);
        if (this.emitter.listenerCount(eventId) === 0) {
          poll.destroy();
          this.emitter.off("newClientActivity", scheduler);
        }
      };
    };

    return livePaginateHelper;
  };

  return client;
};

module.exports = { withRealTimeMethods };
