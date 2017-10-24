define([
  "esri/config",
  "esri/core/promiseUtils",
  "esri/geometry/geometryEngine",
  "esri/geometry/Extent",
  "esri/geometry/Polygon"
],
function(esriConfig, promiseUtils, geometryEngine, Extent, Polygon) {
  class MyWorker {
    magic({ extent }, { proxy }){
      proxy.connection.invoke("progress", "starting");
      const area = Polygon.fromExtent(Extent.fromJSON(extent));
      proxy.connection.invoke("progress", "polygon created");
      const centroid = area.centroid;
      const buffers = [];
      proxy.connection.invoke("progress", "starting buffer creation");
      for (let i = 100; i <= 100000; i = i + 100){
        const ptBuff = geometryEngine.geodesicBuffer(centroid, i, "feet");
        const data = ptBuff.toJSON();
        buffers.push(data);

      }
      proxy.connection.invoke("progress", "creation done");
      return promiseUtils.resolve({ data: buffers });
    }
  }

  return MyWorker;
});
