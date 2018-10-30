define([
  './vue',
  'dojo/_base/declare', 
  'jimu/BaseWidget',

  // "esri/Map",
  // "esri/views/SceneView",
  "esri/layers/SceneLayer",
  "esri/layers/GraphicsLayer",
  "esri/Graphic",

  "esri/request",

  "dojo/_base/array",
  "dojo/_base/lang"
],
function(
  Vue,
  declare, 
  BaseWidget,

  // Map, SceneView, 
  SceneLayer, GraphicsLayer, Graphic,
  esriRequest,
  array,
  lang
  ) {
  //To create a widget, you need to derive from BaseWidget.
  return declare([BaseWidget], {
    //Please note that the widget depends on the 4.0 API

    // DemoWidget code goes here

    //please note that this property is be set by the framework when widget is loaded.
    //templateString: template,

    baseClass: 'jimu-widget-demo',

    postCreate: function() {
      this.inherited(arguments);
      console.log('postCreate');
    },

    startup: function() {

    },

    onOpen: function(){
      const IDCLIENT = 'WEB.SERV.lut34959@nbzmr.com';
      const APIKEY = '735D56E1-2A72-4A83-8EE1-1106052B75E9';

      // const map = new Map({
      //   basemap: "streets-night-vector"
      // });
      // this.map = map;

      const initialCamera = {
        position: [-3.797, 40.324, 5184],
        tilt: 69.379,
        heading: 36.112
      };

      const layer = new SceneLayer({
        url: "https://tiles.arcgis.com/tiles/g60HdxU2rDSe4oky/arcgis/rest/services/Madrid3DSinT/SceneServer/layers/0"
      });
      // map.add(layer);

      // const view = new SceneView({
      //   container: "viewDiv",
      //   map: map,
      //   camera: initialCamera
      // });

      this.sceneView.camera = initialCamera;

      this.dataBiciMad = "";

      const urlStationsBiciMad = "http://cors.io/?https://rbdata.emtmadrid.es:8443/BiciMad/get_stations/" + IDCLIENT + "/" + APIKEY;

      esriRequest(urlStationsBiciMad, {
        responseType: "json"
      })
        .then(lang.hitch(this, function (dataBiciMad) {
          this.dataBiciMad = JSON.parse(dataBiciMad.data.data).stations;  // Parse data 

          const graphicsLayer = new GraphicsLayer();
          this.sceneView.map.add(graphicsLayer)

          // Add graphics points for event
          array.forEach(this.dataBiciMad, function (data, index) {
            let point = {
              type: "point", // autocasts as new Point()
              x: data.longitude,
              y: data.latitude,
              z: 1000
            };
            let markerSymbol = {
              type: "simple-marker", // autocasts as new SimpleMarkerSymbol()
              color: [226, 119, 40],
              outline: { // autocasts as new SimpleLineSymbol()
                color: [255, 255, 255],
                width: 2
              }
            };
            let pointGraphic = new Graphic({
              geometry: point,
              symbol: markerSymbol
            });
            let polyline = {
              type: "polyline", // autocasts as new Polyline()
              paths: [
                [data.longitude, data.latitude, 0],
                [data.longitude, data.latitude, 1000]
              ]
            };
            let lineSymbol = {
              type: "simple-line", // autocasts as SimpleLineSymbol()
              color: [226, 119, 40],
              width: 2
            };

            let polylineGraphic = new Graphic({
              geometry: polyline,
              symbol: lineSymbol
            });

            graphicsLayer.add(pointGraphic);
            graphicsLayer.add(polylineGraphic);
          });

          const _info = new Vue({
            el: '#container',
            data: {
              places: this.dataBiciMad,
              map: this.map
            }
          });

        }));

      // Create Vue component to show cards 
      Vue.component('blog-card', {
        template: [
          // "<div class='card' style='width: 18rem;'  v-on:mouseover='functionHover()'>",
          "<div class='card' style='width: 18rem;'>",
          "<div class='card-body'>",
          "<h5 class='card-title'>{{ place.name }}</h5>",
          "<p class='card-text'>Ocupación: {{ place.light }}</p>",
          "<p class='card-text'>Número de bases libres:  {{ place.free_bases }}</p>",
          "<p class='card-text'>Número de bicicletas ancladas:  {{ place.dock_bikes }}</p>",
          "<p class='card-text'>Número total de bases:  {{ place.total_bases }}</p>",
          "<p class='card-text'>Número de reservas activas:  {{ place.reservations_count }}</p>",

          "<a href='#' v-on:click='goTo' class='btn btn-primary'>Ir al sitio</a>",
          "</div>",
          "</div>"

        ].join(""),
        props: {
          place: Object,
          // map: Object
        },
        methods: {
          goTo: function () {
            const newCamera = {
              position: [parseFloat(this.place.longitude), parseFloat(this.place.latitude), 5184],
              tilt: 20,
              heading: 20

            };
            var camera = _sceneView.camera.clone();
            camera.set(newCamera);
            _sceneView.goTo(camera);
          },

        }
      });

    },

    onClose: function(){
      console.log('onClose');
    },

    onMinimize: function(){
      console.log('onMinimize');
    },

    onMaximize: function(){
      console.log('onMaximize');
    }
  });
});