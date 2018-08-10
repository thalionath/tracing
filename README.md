
docker run -d --name jaeger \
  -e COLLECTOR_ZIPKIN_HTTP_PORT=9411 \
  -p 5775:5775/udp \
  -p 6831:6831/udp \
  -p 6832:6832/udp \
  -p 5778:5778 \
  -p 16686:16686 \
  -p 14268:14268 \
  -p 9411:9411 \
  jaegertracing/all-in-one:latest

Frontend: http://localhost:16686/

 * https://github.com/opentracing/specification/blob/master/semantic_conventions.md#message-bus
 * https://github.com/opentracing/specification/blob/master/specification.md#references-between-spans
 * https://doc.esdoc.org/github.com/opentracing/opentracing-javascript/variable/index.html#static-variable-REFERENCE_FOLLOWS_FROM
 * https://github.com/yurishkuro/opentracing-tutorial