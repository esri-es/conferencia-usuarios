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
  'dojo/_base/declare',
  'dojo/_base/lang',
  'dojo/_base/array',
  'dojo/_base/html',
  'dojo/topic',
  'dojo/on',
  // 'dojo/aspect',
  'dojo/keys',
  // 'dojo/Deferred',
  // 'esri/dijit/InfoWindow',
  // "esri/dijit/PopupMobile",
  // 'esri/InfoTemplate',
  'esri/geometry/Extent',
  'esri/geometry/Point',
  './utils',

  './dijit/LoadingShelter',
  // 'jimu/LayerInfos/LayerInfos',
  // './MapUrlParamsHandler',
  './AppStateManager',
  './WebSceneLoader',
  'esri/Viewpoint'
], function(declare, lang, array, html, topic, on,/* aspect,*/ keys,/* Deferred, InfoWindow,
  PopupMobile, InfoTemplate,*/ Extent, Point, jimuUtils, LoadingShelter, /*LayerInfos,
  MapUrlParamsHandler,*/ AppStateManager, WebSceneLoader, Viewpoint) {

  var instance = null,
    clazz = declare(null, {
      appConfig: null,
      mapDivId: '',
      map: null,
      previousInfoWindow: null,
      mobileInfoWindow: null,
      isMobileInfoWindow: false,

      layerInfosObj: null,

      constructor: function( /*Object*/ options, mapDivId) {
        this.appConfig = options.appConfig;
        this.urlParams = options.urlParams;
        this.mapDivId = mapDivId;
        this.id = mapDivId;
        this.appStateManager = AppStateManager.getInstance(this.urlParams);
        topic.subscribe("appConfigChanged", lang.hitch(this, this.onAppConfigChanged));
        topic.subscribe("changeMapPosition", lang.hitch(this, this.onChangeMapPosition));
        // topic.subscribe("syncExtent", lang.hitch(this, this.onSyncExtent));
        topic.subscribe("syncViewpoint", lang.hitch(this, this.onSyncViewpoint));

        on(window, 'resize', lang.hitch(this, this.onWindowResize));
        on(window, 'beforeunload', lang.hitch(this, this.onBeforeUnload));
      },

      showMap: function() {
        // console.timeEnd('before map');
        this._showMap(this.appConfig);
      },

      _showMap: function(appConfig) {
        // console.timeEnd('before map');
        console.time('Load Map');
        this.loading = new LoadingShelter();
        this.loading.placeAt(this.mapDivId);
        this.loading.startup();
        //for now, we can't create both 2d and 3d map
        if (appConfig.map['3D']) {
          if (appConfig.map.itemId) {
            this._show3DWebScene(appConfig);
          } else {
            console.log('No webscene found. Please set map.itemId in config.json.');
          }
        } else {
          if (appConfig.map.itemId) {
            this._show2DWebMap(appConfig);
          } else {
            console.log('No webmap found. Please set map.itemId in config.json.');
          }
        }
      },

      onBeforeUnload: function() {
        this.appStateManager.saveWabAppState(this.map, this.layerInfosObj);
      },

      onWindowResize: function() {
        if (this.map && this.map.resize) {
          this.map.resize();
          this.resetInfoWindow(false);
        }
      },

      getMapInfoWindow: function(){
        return {
          mobile: this._mapMobileInfoWindow,
          bigScreen: this._mapInfoWindow
        };
      },

      resetInfoWindow: function(isNewMap) {
        if(isNewMap){
          this._mapInfoWindow = this.map.infoWindow;
          if(this._mapMobileInfoWindow){
            this._mapMobileInfoWindow.destroy();
          }
          // this._mapMobileInfoWindow =
          // new PopupMobile(null, html.create("div", null, null, this.map.root));
          this.isMobileInfoWindow = false;
        }
        if (window.appInfo.isRunInMobile && !this.isMobileInfoWindow) {
          // this.map.infoWindow.hide();
          // this.map.setInfoWindow(this._mapMobileInfoWindow);
          this.isMobileInfoWindow = true;
        } else if (!window.appInfo.isRunInMobile && this.isMobileInfoWindow) {
          // this.map.infoWindow.hide();
          // this.map.setInfoWindow(this._mapInfoWindow);
          this.isMobileInfoWindow = false;
        }
      },

      onChangeMapPosition: function(position) {
        var pos = lang.clone(this.mapPosition);
        lang.mixin(pos, position);
        this.setMapPosition(pos);
      },

      setMapPosition: function(position){
        this.mapPosition = position;

        var posStyle = jimuUtils.getPositionStyle(position);
        html.setStyle(this.mapDivId, posStyle);
        if (this.map && this.map.resize) {
          this.map.resize();
        }
      },

      getMapPosition: function(){
        return this.mapPosition;
      },

      // onSyncExtent: function(map){
      //   //we should sync viewpoint here
      //   if(this.map){
      //     var extJson = map.extent;
      //     var ext = new Extent(extJson);
      //     this.map.setExtent(ext);
      //   }
      // },

      onSyncViewpoint: function(viewpoint){
        if(this.sceneView){
          this.sceneView.viewpoint = viewpoint.clone();
        }
      },

      _visitConfigMapLayers: function(appConfig, cb) {
        array.forEach(appConfig.map.basemaps, function(layerConfig, i) {
          layerConfig.isOperationalLayer = false;
          cb(layerConfig, i);
        }, this);

        array.forEach(appConfig.map.operationallayers, function(layerConfig, i) {
          layerConfig.isOperationalLayer = true;
          cb(layerConfig, i);
        }, this);
      },

      _destroySceneView: function(){
        if(this.sceneView){
          // If we destroy map, we will can't switch web scene.
          // var map = this.sceneView.map;
          // if(map){
          //   map.destroy();
          // }
          try{
            this.sceneView.destroy();
          }catch(e){
            console.error(e);
          }
        }
        this.sceneView = null;
        window._sceneView = null;
      },

      _show3DWebScene: function(appConfig) {
        var portalUrl = appConfig.map.portalUrl;
        var itemId = appConfig.map.itemId;
        this._destroySceneView();
        var def = WebSceneLoader.createMap(this.mapDivId, portalUrl, itemId);

        def.then(lang.hitch(this, function(sceneView){
          // this._publishMapEvent(map);
          this._publishSceneViewEvent(sceneView);
          if(appConfig.map.mapOptions){
            var initialState = appConfig.map.mapOptions.initialState;
            if(initialState && initialState.viewpoint){
              try{
                var vp = Viewpoint.fromJSON(initialState.viewpoint);
                if(vp){
                  this.sceneView.map.initialViewProperties.viewpoint = vp;
                  this.sceneView.viewpoint = vp.clone();
                }
              }catch(e){
                console.error(e);
              }
            }
          }
        }), lang.hitch(this, function(){
          if (this.loading) {
            this.loading.destroy();
          }
          topic.publish('mapCreatedFailed');
        }));
      },

      // _publishMapEvent: function(map) {
      //   //add this property for debug purpose
      //   window._viewerMap = map;
      //   if (this.loading) {
      //     this.loading.destroy();
      //   }

      //   MapUrlParamsHandler.postProcessUrlParams(this.urlParams, map);

      //   console.timeEnd('Load Map');
      //   if (this.map) {
      //     this.map = map;
      //     this.resetInfoWindow(true);
      //     console.log('map changed.');
      //     topic.publish('mapChanged', this.map);
      //   } else {
      //     this.map = map;
      //     this.resetInfoWindow(true);
      //     topic.publish('mapLoaded', this.map);
      //   }
      // },

      _publishSceneViewEvent: function(sceneView){
        window._sceneView = sceneView;

        console.timeEnd('Load Map');

        if(this.loading){
          this.loading.destroy();
        }

        if(this.sceneView){
          this.sceneView = sceneView;
          //this.resetInfoWindow(true);
          console.log("sceneView changed");
          topic.publish('sceneViewChanged', this.sceneView);
        }else{
          this.sceneView = sceneView;
          //this.resetInfoWindow(true);
          console.log("sceneView loaded");
          topic.publish('sceneViewLoaded', this.sceneView);
        }
      },

      _show2DWebMap: function(appConfig) {
        //should use appConfig instead of this.appConfig, because appConfig is new.
        // if (appConfig.portalUrl) {
        //   var url = portalUrlUtils.getStandardPortalUrl(appConfig.portalUrl);
        //   agolUtils.arcgisUrl = url + "/sharing/content/items/";
        // }
        if(!appConfig.map.mapOptions){
          appConfig.map.mapOptions = {};
        }
        var mapOptions = this._processMapOptions(appConfig.map.mapOptions) || {};
        mapOptions.isZoomSlider = false;

        var webMapPortalUrl = appConfig.map.portalUrl;
        var webMapItemId = appConfig.map.itemId;
        var webMapOptions = {
          mapOptions: mapOptions,
          bingMapsKey: appConfig.bingMapsKey,
          usePopupManager: true
        };

        var mapDeferred = jimuUtils.createWebMap(webMapPortalUrl, webMapItemId,
          this.mapDivId, webMapOptions);

        mapDeferred.then(lang.hitch(this, function(response) {
          var map = response.map;

          //hide the default zoom slider
          map.hideZoomSlider();

          // set default size of infoWindow.
          map.infoWindow.resize(270, 316);
          //var extent;
          map.itemId = appConfig.map.itemId;
          map.itemInfo = response.itemInfo;
          map.webMapResponse = response;
          // enable snapping
          var options = {
            snapKey: keys.copyKey
          };
          map.enableSnapping(options);

          html.setStyle(map.root, 'zIndex', 0);

          map._initialExtent = map.extent;

          //URL parameters that affect map extent
          var urlKeys = ['extent', 'center', 'marker', 'find', 'query', 'scale', 'level'];
          var useAppState = true;
          array.forEach(urlKeys, function(k){
            if(k in this.urlParams){
              useAppState = false;
            }
          }, this);

          // if(useAppState){
          //   this._applyAppState(map).then(lang.hitch(this, function() {
          //     this._publishMapEvent(map);
          //   }));
          // }else{
          //   this._publishMapEvent(map);
          // }

          this._publishMapEvent(map);
        }), lang.hitch(this, function() {
          if (this.loading) {
            this.loading.destroy();
          }
          topic.publish('mapCreatedFailed');
        }));
      },

      // _applyAppState: function(map) {
      //   var def = new Deferred();

      //   this.appStateManager.getWabAppState()
      //   .then(lang.hitch(this, function(stateData) {
      //     var layerOptions = stateData.layers;
      //     LayerInfos.getInstance(map, map.itemInfo, {
      //       layerOptions: layerOptions || null
      //     }).then(lang.hitch(this, function(layerInfosObj) {
      //       this.layerInfosObj = layerInfosObj;
      //       if (stateData.extent) {
      //         return map.setExtent(stateData.extent);
      //       }
      //     })).always(function() {
      //       def.resolve();
      //     });
      //   }));

      //   return def;
      // },

      _processMapOptions: function(mapOptions) {
        if (!mapOptions) {
          return;
        }

        if(!mapOptions.lods){
          delete mapOptions.lods;
        }
        if(mapOptions.lods && mapOptions.lods.length === 0){
          delete mapOptions.lods;
        }

        var ret = lang.clone(mapOptions);
        if (ret.extent) {
          ret.extent = new Extent(ret.extent);
        }
        if (ret.center && !lang.isArrayLike(ret.center)) {
          ret.center = new Point(ret.center);
        }
        // if (ret.infoWindow) {
        //   ret.infoWindow = new InfoWindow(ret.infoWindow, html.create('div', {}, this.mapDivId));
        // }

        return ret;
      },

      onAppConfigChanged: function(appConfig, reason, changedJson) {
        // jshint unused:false
        this.appConfig = appConfig;
        if(reason === 'mapChange'){
          this._recreateMap(appConfig);
        }
        else if(reason === 'mapOptionsChange'){
          if(changedJson.initialState){
            var vp = changedJson.initialState.viewpoint;
            if(vp){
              //update initial viewpoint
              this.sceneView.map.initialViewProperties.viewpoint = Viewpoint.fromJSON(vp);
              //update current viewpoint
              this.sceneView.animateTo(Viewpoint.fromJSON(vp));
            }
          }
        }
      },

      _recreateMap: function(appConfig){
        if(this.sceneView){
          // topic.publish('beforeMapDestory', this.map);
          //this.map.destroy();
          topic.publish('beforeSceneViewDestory', this.sceneView);
          this._destroySceneView();
        }
        this._showMap(appConfig);
      },

      disableWebMapPopup: function() {
        // this.map.setInfoWindowOnClick(false);
      },

      enableWebMapPopup: function() {
        // this.map.setInfoWindowOnClick(true);
      }

    });

  clazz.getInstance = function(options, mapDivId) {
    if (instance === null) {
      instance = new clazz(options, mapDivId);
    }
    return instance;
  };

  return clazz;
});