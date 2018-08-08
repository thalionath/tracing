
const assert = require('assert');
const opentracing = require("opentracing");
const async = require('async');

function initJaegerTracer(serviceName) {
  var config = {
    serviceName: serviceName,
    sampler: {
      type: "const",
      param: 1,
    },
    reporter: {
      logSpans: true,
    },
  };
  var options = {
    logger: {
      info: function logInfo(msg) {
        console.log("INFO ", msg);
      },
      error: function logError(msg) {
        console.log("ERROR", msg);
      },
    },
  };
  return require("jaeger-client").initTracer(config, options);
}

function initZipkinTracer(serviceName) {
  const { BatchRecorder } = require("zipkin");
  const { HttpLogger } = require("zipkin-transport-http");

  const recorder = new BatchRecorder({
    logger: new HttpLogger({
      endpoint: "http://127.0.0.1:9411/api/v2/spans"
    })
  });

  const ZipkinJavascriptOpentracing = require("zipkin-javascript-opentracing");

  const tracer = new ZipkinJavascriptOpentracing({
    serviceName: serviceName,
    recorder,
    kind: "client"
  });

  return tracer;
}

function badRandom(max) {
  return Math.floor(Math.random() * Math.floor(max));
}

// const tracer = new opentracing.Tracer(); // nop implementation
const tracer = initJaegerTracer("message-bus");
// const tracer = initZipkinTracer("message-bus"); // API impl. seems incomplete

const service_a = () => {
  const span = tracer.startSpan("service a");
  const ctx = { span };
  setTimeout(
    () => { service_b(ctx); },
    100
  );
  span.finish();
};

const service_b = ctx => {
  ctx = {
    span: tracer.startSpan("service b", { childOf: ctx.span }),
  };
  setTimeout(
    () => { 
      service_c1(ctx);
      service_c2(ctx);
      ctx.span.finish();
    },
    10
  );
};

const service_c1 = ctx => {
  ctx = {
    span: tracer.startSpan("service c.1", { childOf: ctx.span }),
  };
  setTimeout(
    () => { ctx.span.finish(); },
    15
  );
};

const service_c2 = ctx => {
  ctx = {
    span: tracer.startSpan("service c.2", { childOf: ctx.span }),
  };
  setTimeout(
    () => { ctx.span.finish(); },
    42
  );

  async.parallel([
    callback => {
        var ctx1 = {
          span: tracer.startSpan("service d.1", { childOf: ctx.span }),
        };
        setTimeout(() => {
          callback(
            null,
            opentracing.followsFrom(ctx1.span.context())
          );
          ctx1.span.finish(); 
        }, 50 + badRandom(50));
    },
    callback => {
        var ctx2 = {
          span: tracer.startSpan("service d.2", { childOf: ctx.span }),
        };
        setTimeout(() => {
          callback(
            null,
            opentracing.followsFrom(ctx2.span.context())
          );
          ctx2.span.finish();    
        }, 50 + badRandom(50));
    },
    callback => {
      var ctx3 = {
        span: tracer.startSpan("service d.3", { childOf: ctx.span }),
      };
      setTimeout(() => {
        callback(
          null,
          opentracing.followsFrom(ctx3.span.context())
        );
        ctx3.span.finish();    
      }, 50 + badRandom(50));
    }
  ],
  // optional callback
  function(err, results) {
    var ctx_e = {
      span: tracer.startSpan(
        "service e", // depend on / merge parallel spans above
        // results is an array of span references
        // https://github.com/opentracing/specification/blob/master/specification.md#references-between-spans
        { references: results } 
      ),
    };
    setTimeout(
      () => { 
        ctx_e.span.finish();
        tracer.close(() => process.exit());
      },
      50
    );
  });
};

service_a();