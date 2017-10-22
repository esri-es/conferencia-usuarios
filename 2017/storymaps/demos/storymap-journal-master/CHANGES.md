Descargamos [cedar.zip](https://github.com/esri-es/conferencia-usuarios/raw/master/2017/storymaps/demos/storymap-journal-master/cedar.zip) y lo descomprimimos en `src/lib-app`.


# Desde el editor WYSIWYG

**1) Añadimos este estilo usando el editor**

```css
<style type="text/css">
.navDots.vertical{background-color: #000 !important;}
</style>
```

**2) Añadimos una sección con el mapa: Densidad de población - Madrid

```
<p>El mapa que vemos a la derecha representa la densidad de los barrios m&aacute;s poblados de Madrid, y la siguiente gr&aacute;fica la proporci&oacute;n entre hombres&nbsp;y mujeres por barrio:</p>

<div id="cedarChart">&nbsp;</div>
```

# Añadimos Cedar

En el fichero `src/index.html` a partir de la línea 344:

```html
<script type="text/javascript" src="lib-app/cedar/d3.min.js"></script>
<script type="text/javascript" src="lib-app/cedar/vega.js"></script>
<script type="text/javascript" src="lib-app/cedar/cedar.js"></script>
```

Ahora modificamos el fichero `Grunfile.js` línea 165, para que al hacer el build
copie las librerías de Cedar a la carpeta `deploy`:

```js
src:['resources/**', 'lib-app/cedar/**'],
```

Ahora por último vamos a reemplazar el contenido del fichero
`src/app/custom-scripts.js` por el siguiente:

```js
define([
  "dojo/topic",
  "esri/tasks/query"
], function(topic, Query) {
  /*
   * Custom Javascript to be executed while the application is initializing goes here
   */

  console.log("Map Journal is initializing");

  // The application is ready
  topic.subscribe("tpl-ready", function(){
    /*
     * Custom Javascript to be executed when the application is ready goes here
     */

    console.log("Map Journal is ready");
  });

  // When a section is being loaded (don't wait for the Main Stage media to be loaded)
  topic.subscribe("story-load-section", function(index){
    console.log("The section", index, "is being loaded");
  });

  // After a map is loaded (when the map starts to render)
  topic.subscribe("story-loaded-map", function(result){
    if ( result.index !== null ){
      console.log("The map", result.id, "has been loaded from the section", result.index);

      if ( result.id === "b6f8eac09db9482084886803dc0ce376"){
        // We are in 'Poblacion de Madrid'

        // Recover layer.url from Web Map
        var map = app.maps[result.id].response.map;
        var layer = map.getLayer("Barrios de Madrid con población_3636");
        var serviceUrl = layer.url;

        // Config and display scatter plot
        var chart = new Cedar({
          "type": "scatter",
          "tooltip": {
            "title": "{NOMBRE}",
            "content": "Hay {MALES_CY} hombres y {FEMALES_CY} mujeres"
          },
          "dataset": {
            url: serviceUrl,
            "mappings": {
              "x": {"field":"MALES_CY","label":"Nº de hombres"},
              "y": {"field":"FEMALES_CY","label":"Nº de mujeres"},
              "color": {"field":"NOMDIS","label":"Distrito"}
            }
          }
        });
        chart.show({elementId: "#cedarChart", height: 400 });

        // Add behaviour: zoom on click
        chart.on("click", function(e,d){
          var query = new Query();
          query.objectIds = [d.OBJECTID];
          query.outFields = [ "*" ];
          layer.queryFeatures(query, function(featureSet) {
            map.setExtent(featureSet.features[0]._extent);
          });
        });

      }
    }else
    console.log("The map", result.id, "has been loaded from a Main Stage Action");

  });

  // When a main stage action that loads a new media or reconfigures the current media is performed
  // Note that this event is not fired for the "Locate an address or a place action"
  topic.subscribe("story-perform-action-media", function(media){
    console.log("A Main Stage action is performed:", media);
  });
});
```
