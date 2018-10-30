///////////////////////////////////////////////////////////////////////////
// Copyright © 2014 - 2018 Esri. All Rights Reserved.
//
// Licensed under the Apache License Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
///////////////////////////////////////////////////////////////////////////

define([
  'dojo/Deferred',
  'dojo/_base/lang',
  'dojo/_base/array',
  'dojo/_base/html',
  'dojo/promise/all',
  'esri/kernel',
  'esri/WebScene',
  'esri/views/SceneView',
  'esri/portal/Portal',
  'esri/portal/PortalItem',
  'esri/core/has',
  './utils',
  './portalUtils',
  './portalUrlUtils'
], function(Deferred, lang, array, html, all, esriNS, WebScene, SceneView, Portal, PortalItem, has,
  jimuUtils, portalUtils, portalUrlUtils) {

  var mo = {
    createMap: function(mapDivId, portalUrl, itemId) {
      var def = new Deferred();
      if(has("esri-webgl")){
        def = this._createMap(mapDivId, portalUrl, itemId);
      }else{
        def.reject("The browser doesn't support webgl.");
        var webglSupportTip = lang.getObject("webSceneLoader.webglSupportTip", false, window.jimuNls);
        if(!webglSupportTip){
          webglSupportTip = "3D web apps aren't supported in your browser.";
        }
        html.create('div', {
          'class': 'app-error',
          innerHTML: webglSupportTip
        }, document.body);
      }
      return def;
    },

    _createMap: function(mapDivId, portalUrl, itemId) {
      var esriConfig = jimuUtils.getEsriConfig();
      esriConfig.portalUrl = portalUrlUtils.getStandardPortalUrl(portalUrl);

      var def = new Deferred();
      var defs = [];

      /************************************************************
       * Creates a new WebScene instance. A WebScene must reference
       * a PortalItem ID that represents a WebScene saved to
       * arcgis.com or an on premise portal.
       *
       * To load a WebScene from an onpremise portal, set the portal
       * url in esriConfig.portalUrl.
       ************************************************************/
      Portal._default = null;
      var scene = new WebScene({
        portalItem: new PortalItem({
          id: itemId
        })
      });

      /************************************************************
       * Set the WebScene instance to the map property in a SceneView.
       ************************************************************/
      //we add extra attribute 'view' for scene
      // View can emit 'resize' event
      var sceneView = new SceneView({
        map: scene,
        container: mapDivId,
        constraints: {
          collision: {
            enabled: false
          },
          tilt: {
            max: 179.99
          }
        }
      });

      defs.push(scene);
      defs.push(sceneView);

      var portal = portalUtils.getPortal(portalUrl);
      defs.push(portal.getItemById(itemId));
      defs.push(portal.getItemData(itemId));

      all(defs).then(lang.hitch(this, function(results) {
        if(sceneView.popup){
          sceneView.popup.closeOnViewChangeEnabled = true;
        }
        scene.id = mapDivId;
        scene.itemId = itemId;
        scene.itemInfo = {
          item: results[2],
          itemData: results[3]
        };
        this._handleLocalScene(sceneView);
        def.resolve(sceneView);
        //this._handleAttribution(sceneView);
      }), lang.hitch(this, function(err) {
        console.error(err);
        def.reject(err);
      }));

      return def;
    },

    _handleLocalScene: function(sceneView){
      try{
        if(sceneView.viewingMode && sceneView.viewingMode.toLowerCase() === 'local'){
          lang.setObject("constraints.collision.enabled", false, sceneView);
          lang.setObject("constraints.tilt.max", 179.99, sceneView);
        }
      }catch(e){
        console.error(e);
      }
    },

    _handleAttribution: function(sceneView) {
      try {
        if (esriNS.version !== "4.0") {
          var components = sceneView.ui && sceneView.ui._components;
          if (components && components.length > 0) {
            array.some(components, function(component) {
              var widget = component && component._widget;
              if (widget && widget.declaredClass === "esri.widgets.Attribution") {
                widget.domNode.parentNode.style.width = "100%";
                html.create("span", {
                  "innerHTML": "Powered by Esri",
                  "class": "esri-attribution-powered-by"
                }, widget.domNode);
                return true;
              } else {
                return false;
              }
            });
          }
        }
      } catch (e) {
        console.error(e);
      }
    }
  };

  return mo;
});