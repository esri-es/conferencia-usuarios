
require([
    "esri/Map",
    "esri/views/SceneView",
    "esri/layers/SceneLayer",
    "esri/layers/GraphicsLayer",
    "esri/Graphic",

    "esri/request",

    "dojo/_base/array",

    "vue"
    
], function (
    Map, SceneView, SceneLayer, GraphicsLayer, Graphic,
    esriRequest, 
    array,
    Vue
) {

    const IDCLIENT = 'WEB.SERV.lut34959@nbzmr.com';
    const APIKEY = '735D56E1-2A72-4A83-8EE1-1106052B75E9';


    // Instancia Mapa
    const map = new Map({
        basemap: "streets-night-vector"
    });
    this.map = map;

    // Posición inicial cámara
    const initialCamera = {
        position: [-3.797, 40.324, 5184],
        tilt: 69.379,
        heading: 36.112  
    };

    const layer = new SceneLayer({
        url: "https://tiles.arcgis.com/tiles/g60HdxU2rDSe4oky/arcgis/rest/services/Madrid3DSinT/SceneServer/layers/0"
    });
    // map.add(layer);

    // Instancia Escena
    const view = new SceneView({
        container: "viewDiv",
        map: map,
        camera: initialCamera
    });

    this.dataBiciMad = "";

    // Url para realizar petición de la lista de estaciones de BiciMad
    const urlStationsBiciMad = "http://cors.io/?https://rbdata.emtmadrid.es:8443/BiciMad/get_stations/" + IDCLIENT + "/" + APIKEY;

    // Request Url BiciMad
    // Añadir datos a la escena
    // Instancia de Vue
    



    // Create Vue component to show cards  Componente Vue para mostrar datos de estaciones

});