
const assert = require('assert');
const opentracing = require("opentracing");

var initJaegerTracer = require("jaeger-client").initTracer;

function initTracer(serviceName) {
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
  return initJaegerTracer(config, options);
}

// const tracer = new opentracing.Tracer(); // nop implementation
const tracer = initTracer("hello-world");

const sayHello = helloTo => {
  const span = tracer.startSpan("say-hello");
  const helloStr = `Hello, ${helloTo}!`;
  console.log(helloStr);
  span.finish();
};

assert(process.argv.length == 3, "Expecting one argument");
const helloTo = process.argv[2];
sayHello(helloTo);

tracer.close(() => process.exit());
