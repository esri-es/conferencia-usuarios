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
    'dojo/_base/html',
    'dijit/_WidgetsInTemplateMixin',
    "esri/geometry/Point",
    'esri/geometry/SpatialReference',
    'jimu/BaseWidget',
    'jimu/utils',
    'jimu/dijit/Message',
    'dojo/_base/lang',
    'dojo/on',
    "dojo/dom-class",
    "dijit/DropDownMenu",
    "dijit/MenuItem",
    "dojo/aspect",
    "dojo/Deferred",
    "esri/request",
    "esri/Graphic",
    "esri/layers/GraphicsLayer",
    "esri/tasks/support/ProjectParameters",
    "esri/geometry/support/webMercatorUtils",
    "esri/symbols/PictureMarkerSymbol",
    "jimu/portalUtils",
    "esri/config",
    "libs/usng/usng",
    "jimu/SpatialReference/unitUtils",
    "dojo/throttle"
  ],
  function(declare, html, _WidgetsInTemplateMixin, Point, SpatialReference, BaseWidget, utils, Message,
           lang, on, domClass, DropDownMenu, MenuItem, aspect, Deferred, esriRequest, Graphic, GraphicsLayer,
           ProjectParameters, webMercatorUtils, PictureMarkerSymbol, portalUtils, esriConfig, usng,
           unitUtils, throttle) {
    var jimuUnitToNlsLabel = {
      "INCHES": "Inches",
      "FOOT": "Foot",
      "FEET": "Foot",
      "YARDS": "Yards",
      "MILES": "Miles",
      "NAUTICAL_MILES": "Nautical_Miles",
      "MILLIMETERS": "Millimeters",
      "CENTIMETERS": "Centimeters",
      "METER": "Meter",
      "METERS": "Meter",
      "KILOMETERS": "Kilometers",
      "DECIMETERS": "Decimeters",
      "DEGREE": "Decimal_Degrees",
      "DECIMAL_DEGREES": "Decimal_Degrees",
      "DEGREE_MINUTE_SECONDS": "Degree_Minutes_Seconds",
      "MGRS": "MGRS",
      "USNG": "USNG"
    };
    var esriUnitsToJimuUnit = {
      "esriCentimeters": "CENTIMETERS",
      "esriDecimalDegrees": "DECIMAL_DEGREES",
      "esriDegreeMinuteSeconds": "DEGREE_MINUTE_SECONDS",
      "esriDecimeters": "DECIMETERS",
      "esriFeet": "FOOT",
      "esriInches": "INCHES",
      "esriKilometers": "KILOMETERS",
      "esriMeters": "METER",
      "esriMiles": "MILES",
      "esriMillimeters": "MILLIMETERS",
      "esriNauticalMiles": "NAUTICAL_MILES",
      "esriPoints": "POINTS",
      "esriUnknownUnits": "UNKNOWN",
      "esriYards": "YARDS"
    };

    var clazz = declare([BaseWidget, _WidgetsInTemplateMixin], {
      baseClass: 'jimu-widget-coordinate',
      name: 'Coordinate',
      _cache: {
        _container: null,
        _mouseX: null, //used when watch viewpoint change
        _mouseY: null
      },

      postMixInProperties: function() {
        this.nls.enableClick = this.nls.enableClick ||
          "Click to enable clicking map to get coordinates";
        this.nls.disableClick = this.nls.disableClick ||
          "Click to disable clicking map to get coordinates";
      },

      postCreate: function() {
        this.inherited(arguments);
        this._cache._container = this.sceneView.container;

        domClass.add(this.coordinateBackground, "coordinate-background");

        this.own(on(this.sceneView, "click", lang.hitch(this, this.onMapClick)));
        this.own(on(this.locateButton, "click", lang.hitch(this, this.onLocateButtonClick)));
        this.own(on(this.foldContainer, 'click', lang.hitch(this, this.onFoldContainerClick)));
        this.graphicsLayer = new GraphicsLayer();
        this.sceneView.map.add(this.graphicsLayer); //addLayer

        this.own(this.sceneView.watch("viewpoint", throttle(lang.hitch(this, this.onWatchViewpoint), 50)));
        this.own(on(this._cache._container, "mousemove", throttle(lang.hitch(this, this.onMouseMove), 100)));
      },

      startup: function() {
        this.inherited(arguments);

        if (!(this.config.spatialReferences && this.config.spatialReferences.length > 1)) {
          html.setStyle(this.foldableNode, 'display', 'none');
        } else {
          html.setStyle(this.foldableNode, 'display', 'inline-block');
        }
      },

      onOpen: function () {
        //async load
        this.sceneView.when(
          lang.hitch(this, function () {
            try {
              //this._mapWkid;
              if (this.sceneView.spatialReference) {
                if (this.sceneView.spatialReference.isWebMercator) {
                  this._mapWkid = 3857;
                } else if (this.sceneView.spatialReference.wkid) {
                  this._mapWkid = this.sceneView.spatialReference.wkid;
                }
              }
              this.selectedWkid = this._mapWkid;
            } catch (error) {
              console.error(error);
            }

            this._processData().then(lang.hitch(this, function (spatialReferences) {
              if (!this.domNode) {
                return;
              }
              this.initPopMenu(spatialReferences);
              if (this.popMenu.getChildren().length <= 1) {
                html.setStyle(this.foldContainer, 'display', 'none');
              }
            }), lang.hitch(this, function (err) {
              console.error(err);
            }));
          }), lang.hitch(this, function (error) {
            console.error(error);
          })
        );
      },

      _processData: function() {
        var def = new Deferred();
        // types of basemap: mapServer, imageServer, bingMap, openStreetMap, webTiledMap
        var basemap = this.sceneView.map.itemInfo.itemData.baseMap.baseMapLayers[0];
        if (!(this.config.spatialReferences && this.config.spatialReferences.length)) {
          portalUtils.getUnits(this.appConfig.portalUrl).then(lang.hitch(this, function(units) {
            //basemap of local Scene
            if (!basemap) {
              basemap = this.sceneView.map.layers.items[0];
            }

            var isBingMap = basemap && (basemap.layerType === "BingMapsRoad" ||
              basemap.layerType === "BingMapsHybrid" || basemap.layerType === "BingMapsAerial");
            var isWebTiled = basemap && basemap.layerType === 'WebTiledLayer';
            var isVectorTile = basemap && basemap.layerType === 'VectorTileLayer';
            if (basemap && basemap.url) {
              esriRequest(basemap.url, {
                responseType: "json",
                callbackParamName: "callback",
                query: {
                  f: "json"
                }
              }).then(lang.hitch(this, function(mapData) {
                this._processMapUnits(mapData).then(lang.hitch(this, function(mapData) {
                  var unitOptions = this._getUnconfiguredUnitOptions(mapData.data.units, units);
                  var sr = mapData.data.spatialReference;
                  var ext = mapData.data.fullExtent;
                  var wkid = (sr && (sr.latestWkid || sr.wkid)) ||
                    (ext && ext.spatialReference && ext.spatialReference.wkid);
                  var json = {
                    'wkid': wkid,
                    'label': "",
                    'outputUnit': unitOptions.outputUnit
                  };
                  var _options = {
                    sameSRWithMap: true,
                    defaultUnit: esriUnitsToJimuUnit[mapData.data.units] || mapData.data.units,
                    isGeographicUnit: unitOptions.isGeographicUnit,
                    isGeographicCS: unitOptions.isGeographicCS,
                    isProjectUnit: unitOptions.isProjectUnit,
                    isProjectedCS: unitOptions.isProjectedCS,
                    unitRate: unitOptions.unitRate
                  };
                  json.options = _options;

                  this._configured = false;
                  def.resolve(json);
                }));
              }), lang.hitch(this, function(err) {
                console.error(err);
                def.reject(err);
              }));
            } else if (basemap && (basemap.layerType === "OpenStreetMap" || isBingMap || isWebTiled || isVectorTile)) {
              var unitOptions = this._getUnconfiguredUnitOptions("esriMeters", units);
              var json = {
                wkid: 3857,
                label: "",
                outputUnit: unitOptions.outputUnit
              };
              var _options = {
                sameSRWithMap: true,
                defaultUnit: esriUnitsToJimuUnit.esriMeters,
                isGeographicUnit: unitOptions.isGeographicUnit,
                isGeographicCS: unitOptions.isGeographicCS,
                isProjectUnit: unitOptions.isProjectUnit,
                isProjectedCS: unitOptions.isProjectedCS,
                unitRate: unitOptions.unitRate
              };
              json.options = _options;

              this._configured = false;
              def.resolve(json);
            } else {
              def.reject(new Error("no baseMap"));
            }
          }));
        } else {
          this._configured = true;
          def.resolve(this.config.spatialReferences);
        }

        return def;
      },

      _processMapUnits: function(mapData) {
        var def = new Deferred();
        if (mapData.data.units) {
          def.resolve(mapData);
        } else {
          // MapServer or VectorTileServer
          var sr = mapData.spatialReference ||
            (lang.exists('tileInfo.spatialReference', mapData) && mapData.tileInfo.spatialReference);
          var ext = mapData.extent || mapData.initialExtent || mapData.fullExtent;
          var wkid = (sr && (sr.latestWkid || sr.wkid)) || (ext && ext.spatialReference && ext.spatialReference.wkid);
          var that = this;
          require(['jimu/SpatialReference/srUtils'], function(srUtils) {
            srUtils.loadResource().then(lang.hitch(that, function() {
              var unit = srUtils.getCSUnit(wkid);
              mapData.data = {};
              mapData.data.units = unit;

              def.resolve(mapData);
            }));
          });
        }
        return def;
      },

      _getUnconfiguredUnitOptions: function(mapUnits, localeUnits) {
        var _mapUnit = esriUnitsToJimuUnit[mapUnits] || mapUnits,
          _outputUnit = "",
          _unitRate = 1,
          _isGeographicCS = "",
          _isGeographicUnit = "",
          _isProjectedCS = "",
          _isProjectUnit = "";

        if (unitUtils.isProjectUnit(_mapUnit)) {
          _isProjectUnit = true;
          _isProjectedCS = true;
          _isGeographicUnit = false;
          _isGeographicCS = false;
          _outputUnit = localeUnits === "english" ?
            esriUnitsToJimuUnit.esriFeet.toUpperCase() :
            esriUnitsToJimuUnit.esriMeters.toUpperCase();
          _unitRate = unitUtils.getUnitRate(
            _mapUnit.toUpperCase(),
            _outputUnit
          );
        } else if (unitUtils.isGeographicUnit(_mapUnit)) {
          _isProjectUnit = false;
          _isProjectedCS = false;
          _isGeographicUnit = true;
          _isGeographicCS = true;
          _outputUnit = _mapUnit.toUpperCase();
        }

        //default show mercator is degrees.
        if (this.sceneView.spatialReference.isWebMercator) {
          _outputUnit = esriUnitsToJimuUnit.esriDecimalDegrees;
          _isGeographicUnit = true;
          _isProjectUnit = false;
          _unitRate = 1;
        }

        return {
          outputUnit: _outputUnit,
          unitRate: _unitRate,
          isGeographicUnit: _isGeographicUnit,
          isGeographicCS: _isGeographicCS,
          isProjectUnit: _isProjectUnit,
          isProjectedCS: _isProjectedCS
        };
      },

      initPopMenu: function(spatialReferences) {
        this.popMenu = new DropDownMenu({}, this.coordinateMenu);
        aspect.after(this.popMenu, "onItemClick", lang.hitch(this, this.onClickMenu), true);

        //if configured spatialReferences use
        //the first sr as defalut else add the map sr as default.
        if (Object.prototype.toString.call(spatialReferences) !== "[object Array]") {
          this.selectedWkid = parseInt(spatialReferences.wkid, 10);
          this.addMenuItem(
            '',
            this.selectedWkid,
            spatialReferences.outputUnit,
            null,
            null,
            spatialReferences.options
          );
          this.selectedItem = this.popMenu.getChildren()[0];
        } else {
          this.selectedWkid = parseInt(spatialReferences[0].wkid, 10);
          this.selectedTfWkid = spatialReferences[0].transformationWkid &&
            parseInt(spatialReferences[0].transformationWkid, 10);
          this._addAllMenuItems();
          this.selectedItem = this.popMenu.getChildren()[0];
          this.selectedItem.set({
            label: this.getStatusString(
              true,
              this.selectedItem.params.name,
              this.selectedItem.params.wkid
            )
          });
          html.addClass(this.selectedItem.domNode, 'selected-item');
        }

        this._adjustCoordinateInfoUI(this.selectedWkid);
        this.popMenu.startup();
      },

      _addAllMenuItems: function() {
        var len = this.config.spatialReferences.length;
        for (var i = 0; i < len; i++) {
          this.addMenuItem(
            this.config.spatialReferences[i].label,
            this.config.spatialReferences[i].wkid,
            this.config.spatialReferences[i].outputUnit,
            this.config.spatialReferences[i].transformationWkid,
            this.config.spatialReferences[i].transformForward,
            this.config.spatialReferences[i].options
          );
        }
      },

      _isWebMercator: function(wkid) {
        // true if this spatial reference is web mercator
        if (SpatialReference.prototype._isWebMercator) {
          return SpatialReference.prototype._isWebMercator.apply({
            wkid: parseInt(wkid, 10)
          }, []);
        } else {
          var sr = new SpatialReference(parseInt(wkid, 10));
          return sr.isWebMercator;
        }
      },

      canShowInClient: function(wkid) {
        var specialCase = (this._mapWkid === 4326 && this._isWebMercator(wkid)) ||
          (this._isWebMercator(this._mapWkid) && parseInt(wkid, 10) === 4326);
        var option = this.selectedItem.get('options');
        if ((option && option.sameSRWithMap) || specialCase) {
          return true;
        } else {
          return false;
        }
      },

      onClickMenu: function(event) {
        this._setElevInfo();//clear elev when change select, because of in markerMode the elev is fixedness
        html.removeClass(this.selectedItem.domNode, 'selected-item');
        this.selectedItem.set({
          label: this.getStatusString(
            false,
            this.selectedItem.params.name,
            this.selectedItem.params.wkid
          )
        });
        this.selectedWkid = parseInt(event.params.wkid, 10);
        this.selectedTfWkid = event.params.tfWkid;
        this.forward = event.params.forward;
        event.set({
          label: this.getStatusString(true, event.params.name, event.params.wkid)
        });
        html.addClass(event.domNode, 'selected-item');
        this.selectedItem = event;

        this._adjustCoordinateInfoUI(this.selectedWkid);

        html.removeClass(this.coordinateMenuContainer, 'display-coordinate-menu');
      },

      _adjustCoordinateInfoUI: function(selectedWkid) {
        html.removeClass(this.coordinateInfoMenu, 'coordinate-info-menu-empty');
        if (this._markerGraphic) {
          this.graphicsLayer.remove(this._markerGraphic);
        }

        this._markerGraphic = null;
        if (this.canShowInClient(selectedWkid)) {
          this.enableRealtime = true;
          this.coordinateInfo.innerHTML = this.nls.realtimeLabel;
          html.setAttr(this.locateButton, 'title', this.nls.enableClick);
        } else {
          this.enableRealtime = false;
          this._clearCoordinateInfo();
          html.addClass(this.coordinateInfoMenu, 'coordinate-info-menu-empty');
          html.setAttr(this.locateButton, 'title', this.nls.enableClick);
        }
        html.removeClass(this.locateContainer, 'coordinate-locate-container-active');
        this.enableWebMapPopup();

        this.onExtentChange({
          extent: this.sceneView.map.extent
        });
      },

      disableWebMapPopup: function() {
        //this.sceneView.map.setInfoWindowOnClick(false);
      },

      enableWebMapPopup: function() {
        //this.sceneView.map.setInfoWindowOnClick(true);
      },

      onLocateButtonClick: function() {
        if (html.hasClass(this.coordinateMenuContainer, 'display-coordinate-menu')) {
          this.onFoldContainerClick();
        }
        html.removeClass(this.coordinateInfoMenu, 'coordinate-info-menu-empty');
        html.toggleClass(this.locateContainer, 'coordinate-locate-container-active');
        if (this._markerGraphic) {
          this.graphicsLayer.remove(this._markerGraphic);
        }
        this._markerGraphic = null;
        if (this.canShowInClient(this.selectedWkid)) {
          if (this.enableRealtime) {
            this.enableRealtime = false;
            this.coordinateInfo.innerHTML = this.nls.hintMessage;
            html.setAttr(this.locateButton, 'title', this.nls.disableClick);
            this.disableWebMapPopup();
          } else {
            this.enableRealtime = true;
            this.coordinateInfo.innerHTML = this.nls.realtimeLabel;
            html.setAttr(this.locateButton, 'title', this.nls.enableClick);
            this.enableWebMapPopup();
          }
        } else {
          if (html.hasClass(this.locateContainer, 'coordinate-locate-container-active')) {
            this.coordinateInfo.innerHTML = this.nls.hintMessage;
            this.disableWebMapPopup();
            html.setAttr(this.locateButton, 'title', this.nls.disableClick);
          } else {
            this._clearCoordinateInfo();
            html.addClass(this.coordinateInfoMenu, 'coordinate-info-menu-empty');
            this.enableWebMapPopup();
            html.setAttr(this.locateButton, 'title', this.nls.enableClick);
          }
        }
      },

      onDeActive: function() {
        if (html.hasClass(this.locateContainer, 'coordinate-locate-container-active')) {
          this.onLocateButtonClick();
        }
        if (html.hasClass(this.coordinateMenuContainer, 'display-coordinate-menu')) {
          this.onFoldContainerClick();
        }
      },

      getStatusString: function(selected, name, wkid) {
        var label = "";
        var mapWkid = this._mapWkid;
        wkid = parseInt(wkid, 10);

        if (selected) {
          label = "<b>" + label + name + "</b>&nbsp;" + this._rtlTheBrackets(wkid) + "&nbsp;";
        } else {
          label = label + name + "&nbsp;&nbsp;" + this._rtlTheBrackets(wkid) + "&nbsp;";
        }
        if (wkid === mapWkid) {
          label += this.nls.defaultLabel;
        }
        return label;
      },

      _rtlTheBrackets: function(str) {
        var rlmFlag = "&rlm;";
        if (window.isRTL) {
          return rlmFlag + "(" + str + ")";
        } else {
          return "(" + str + ")";
        }
      },

      addMenuItem: function(name, wkid, outputUnit, tfWkid, forward, _options) {
        var label = this.getStatusString(false, name, wkid);
        var item = {
          label: label || "",
          name: name || "",
          wkid: wkid || "",
          outputUnit: outputUnit || "",
          tfWkid: tfWkid || "",
          options: _options
        };
        if (item.tfWkid) {
          item.forward = forward;
        }

        this.popMenu.addChild(new MenuItem(item));
      },

      _toFormat: function(num) {
        return utils.localizeNumberByFieldInfo(num, {
          format: {
            places: this.config.latLonDecimalPlaces,
            digitSeparator: this.config.addSeparator
          }
        });
      },

      onProjectComplete: function(wkid, geometries) {
        if (!this.selectedWkid || wkid !== this.selectedWkid || !this.domNode) {
          return;
        }
        var point = geometries[0],
          x = point.x,
          y = point.y;
        var outputUnit = this.selectedItem.get('outputUnit');
        var options = this.selectedItem.get('options');

        if (true === isNaN(x) && true === isNaN(y)) {
          this._clearCoordinateInfo();//server maybe return double NaN
        } else if ("MGRS" === outputUnit || "USNG" === outputUnit) {
          this._displayUsngOrMgrs(outputUnit, y, x);
        } else if (options.isGeographicUnit) {
          this._displayDegOrDms(outputUnit, y, x);
        } else {
          this._displayProject(outputUnit, y, x);
        }
      },

      _unitToNls: function(outUnit) {
        var nlsLabel = jimuUnitToNlsLabel[outUnit.toUpperCase()];
        return this.nls[nlsLabel] || this.nls[outUnit] || outUnit;
      },

      onProjectError: function(msg) {
        new Message({
          message: msg.message || msg.toString()
        });
        this.coordinateInfo.innerHTML = this.nls.hintMessage;
        this._setElevInfo();//clean the elev info
      },

      onExtentChange: function(/*evt*/) {
        if (!this.selectedItem) {
          return;
        }
        /*if (window.appInfo.isRunInMobile) {
         if (this._markerGraphic) {
         this.graphicsLayer.remove(this._markerGraphic);
         }
         this._markerGraphic = null;
         html.setStyle(this.locateContainer, 'display', 'none');
         html.removeClass(this.coordinateMenuContainer, 'display-coordinate-menu');
         if (this.canShowInClient(this.selectedWkid)) {
         this._displayOnClient(evt.extent.getCenter());
         } else {
         this._projectMapPoint(evt.extent.getCenter());
         }
         } else {*/
        html.setStyle(this.locateContainer, 'display', 'block');
        if (this.popMenu.getChildren().length > 1) {
          html.setStyle(this.foldContainer, 'display', 'block');
        } else {
          html.setStyle(this.foldContainer, 'display', 'none');
        }
        /*}*/
      },

      _getMarkerGraphic: function(mapPoint) {
        var symbol = new PictureMarkerSymbol(
          this.folderUrl + "css/images/esriGreenPin16x26.png",
          16, 26);
        symbol.setXoffset = 0;
        symbol.setYoffset = 12;
        //symbol.setOffset(0, 12);
        /* api's bug , can't set offset
         symbol.set({
         xoffset:12,
         yoffset:12,
         xOffset:12,
         yOffset:12
         });
         symbol.setYoffset = 120;
         symbol.setyOffset = 120;
         symbol.setYOffset = 120;*/

        return new Graphic(mapPoint, symbol);
      },

      onMapClick: function(evt) {
        /*if (window.appInfo.isRunInMobile) {
         return;
         }*/
        if (this.enableRealtime || !this.selectedItem) {
          return;
        }
        var needMarker = this.canShowInClient(this.selectedWkid) ||
          html.hasClass(this.locateContainer, 'coordinate-locate-container-active');
        // support mark continually
        if (needMarker) {
          if (this._markerGraphic) {
            this.graphicsLayer.remove(this._markerGraphic);
          }
          this._markerGraphic = this._getMarkerGraphic(evt.mapPoint);
          this.graphicsLayer.add(this._markerGraphic);
        }

        if (this.canShowInClient(this.selectedWkid)) {
          //this._markerGraphic.setGeometry(evt.mapPoint);
          //this._displayOnClient(evt.mapPoint);
          this._setCoordinateInfo();
          return;
        }

        if (html.hasClass(this.locateContainer, 'coordinate-locate-container-active')) {
          if (evt.mapPoint && evt.mapPoint.x && evt.mapPoint.y) {
            //this._markerGraphic.setGeometry(evt.mapPoint);
            this._setCoordinateInfo(true);
            var point = new Point(evt.mapPoint.x, evt.mapPoint.y, this.sceneView.spatialReference);
            this._projectMapPoint(point);
          } else {
            //click into the outer space area of the earth
          }
        }
      },

      _projectMapPoint: function(point) {
        var params = new ProjectParameters();
        var outWkid = null;
        var options = this.selectedItem.get('options');
        params.geometries = [point];

        if (options.isProjectedCS) {
          if (options.isProjectUnit) {
            outWkid = this.selectedWkid;
          } else { // geoUnit or USNG, MGRS
            outWkid = options.spheroidCS;
          }
        } else if (options.isGeographicCS) {
          outWkid = this.selectedWkid;
        }

        if (this.selectedTfWkid) {
          params.transformation = new SpatialReference(parseInt(this.selectedTfWkid, 10));
          params.transformForward = JSON.parse(this.forward);
        }

        params.outSR = new SpatialReference(parseInt(outWkid, 10));

        this.coordinateInfo.innerHTML = this.nls.computing;
        esriConfig.geometryService.project(params)
          .then(lang.hitch(this, this.onProjectComplete, this.selectedWkid), lang.hitch(this, this.onProjectError));
      },

      _displayOnClient: function(mapPoint) {
        var outUnit = this.selectedItem.get('outputUnit');

        var x = mapPoint.x,
          y = mapPoint.y;

        var normalizedPoint = null;
        var convertInClient = (this._mapWkid === 4326 && this._isWebMercator(this.selectedWkid)) ||
          (this._isWebMercator(this._mapWkid) && this.selectedWkid === 4326);
        var options = this.selectedItem.get('options');

        // make sure longitude values stays within -180/180
        normalizedPoint = mapPoint.normalize();
        if (options.isGeographicUnit) {
          x = normalizedPoint.longitude || x;
        }
        if (options.isGeographicUnit) {
          y = normalizedPoint.latitude || y;
        }

        if (convertInClient) {
          // process special case
          if (mapPoint.spatialReference.wkid === 4326 && this._isWebMercator(this.selectedWkid)) {
            if ("MGRS" === outUnit || "USNG" === outUnit) {
              this._displayUsngOrMgrs(
                outUnit,
                normalizedPoint.latitude,
                normalizedPoint.longitude
              );
            } else if (options.isGeographicUnit) {
              this._displayDegOrDms(outUnit, y, x);
            } else if (options.isProjectUnit) {
              var mCoord = webMercatorUtils.lngLatToXY(x, y);
              this._displayProject(outUnit, mCoord[1], mCoord[0]);
            }
          } else if (mapPoint.spatialReference.isWebMercator &&
            this.selectedWkid === 4326) {
            if ("MGRS" === outUnit || "USNG" === outUnit) {
              this._displayUsngOrMgrs(
                outUnit,
                normalizedPoint.latitude,
                normalizedPoint.longitude
              );
            } else if (options.isGeographicUnit) {
              this._displayDegOrDms(outUnit, y, x);
            }
          }
        } else {
          // use default units
          if (options.defaultUnit === outUnit) {
            this._displayCoordinatesByOrder(this._toFormat(x), this._toFormat(y));
            this.coordinateInfo.innerHTML += " " + this._unitToNls(outUnit);
            return;
          }
          // setting display units
          if (mapPoint.spatialReference.wkid === 4326 ||
            mapPoint.spatialReference.isWebMercator) {
            if ("MGRS" === outUnit || "USNG" === outUnit) {
              this._displayUsngOrMgrs(
                outUnit,
                normalizedPoint.latitude,
                normalizedPoint.longitude
              );
            } else if (options.isGeographicUnit) {
              this._displayDegOrDms(outUnit, y, x);
            } else if (options.isProjectedCS) {
              this._displayProject(outUnit, y, x);
            }
          } else { // proj or geo
            if (options.isProjectedCS) {
              this._displayProject(outUnit, y, x);
            } else if (options.isGeographicCS) {
              if ("MGRS" === outUnit || "USNG" === outUnit) {
                this._displayUsngOrMgrs(outUnit, y, x);
              } else if (options.isGeographicUnit) {
                this._displayDegOrDms(outUnit, y, x);
              }
            }
          }
        }
      },

      destroy: function() {
        if (this._markerGraphic) {
          this.graphicsLayer.remove(this._markerGraphic);
        }
        if (this.graphicsLayer) {
          this.sceneView.map.remove(this.graphicsLayer);
        }

        this.inherited(arguments);
      },

      _displayUsngOrMgrs: function(outUnit, y, x) {
        if ("MGRS" === outUnit) {
          this.coordinateInfo.innerHTML = usng.LLtoMGRS(y, x, 5);
        } else if ("USNG" === outUnit) {
          this.coordinateInfo.innerHTML = usng.LLtoUSNG(y, x, 5);
        }

        this.coordinateInfo.innerHTML += " " + this._unitToNls(outUnit);
      },

      _displayDegOrDms: function(outUnit, y, x) {
        var lat_string = "";
        var lon_string = "";
        var options = this.selectedItem.get('options');

        x = x * options.unitRate;
        y = y * options.unitRate;

        if ("DEGREE_MINUTE_SECONDS" === outUnit) {
          lat_string = this.degToDMS(y, 'LAT');
          lon_string = this.degToDMS(x, 'LON');
          this._displayCoordinatesByOrder(lat_string, lon_string);
        } else {
          this._displayCoordinatesByOrder(this._toFormat(x), this._toFormat(y));

          this.coordinateInfo.innerHTML += " " + this._unitToNls(outUnit);
        }
      },

      _displayProject: function(outUnit, y, x) {
        var options = this.selectedItem.get('options');
        x = x * options.unitRate;
        y = y * options.unitRate;

        this._displayCoordinatesByOrder(this._toFormat(x), this._toFormat(y));

        this.coordinateInfo.innerHTML += " " + this._unitToNls(outUnit);
      },

      _clearCoordinateInfo: function(){
        this.coordinateInfo.innerHTML = "";
      },

      _displayCoordinatesByOrder: function(x, y) {
        var displayOrderLonLat = this.config.displayOrderLonLat;//X,Y
        if (displayOrderLonLat) {
          this.coordinateInfo.innerHTML = x + "  " + y;
        } else {
          this.coordinateInfo.innerHTML = y + "  " + x;
        }
      },

      onFoldContainerClick: function() {
        if (this._configured) {
          html.toggleClass(this.coordinateMenuContainer, 'display-coordinate-menu');
        }
      },

      onWatchViewpoint: function() {
        this.onMouseMove({
          x: this._cache._mouseX,
          y: this._cache._mouseY
        });
      },

      onMouseMove: function(evt) {
        /*if (window.appInfo.isRunInMobile) {
         return;
         }*/
        if (evt.pageX && evt.pageY) {
          this._cache._mouseX = evt.pageX;
          this._cache._mouseY = evt.pageY;
        }
        this._setEyeInfo();
        if (!this.enableRealtime || !this.selectedItem) {
          return;
        }
        this._setCoordinateInfo();
      },
      _setCoordinateInfo: function(isJustElev) {
        if (this._cache._mouseX && this._cache._mouseY) {
          this.sceneView.hitTest(this._cache._mouseX, this._cache._mouseY).then(lang.hitch(this, function(position) {
            if (!isJustElev) {
              this._setLonLat(position);
            }

            this._setElev(position);
          }));
        }
      },
      _setLonLat: function(position) {
        if (typeof position !== "undefined" && position.results && position.results[0] &&
          position.results[0].mapPoint !== null &&
          ((position.results[0].mapPoint.latitude !== null && position.results[0].mapPoint.longitude !== null) ||
          (position.results[0].mapPoint.x !== null && position.results[0].mapPoint.y !== null))
        ) {
          //with lat/lon or with x/y
          this._displayOnClient(position.results[0].mapPoint);
        } else {
          //when the mouse pointer out of earth, show eyeInfo only
          this._clearCoordinateInfo();
        }
      },
      _setElev: function(position) {
        if (typeof position !== "undefined" && position.results && position.results[0] &&
          position.results[0].mapPoint !== null &&
          typeof position.results[0].mapPoint.z !== "undefined") {
          this._setElevInfo(position.results[0].mapPoint);
        } else {
          this._setElevInfo();
        }
      },
      //there is a bug in jsAPI: pos.z is a large negative number before zoom
      _getElev: function(pos) {
        var elev = "";
        if (pos && pos.z) {
          var isElev = true;
          elev = " " + this.nls.ELEV + " " + this._trunNumToKmOrM(pos.z, isElev);
        }
        return elev;
      },
      _setElevInfo: function(pos) {
        var elev = "";
        if (pos) {
          elev = this._getElev(pos);
          elev = elev + " ";
        }

        this.elevInfo.innerHTML = elev;
      },
      _setEyeInfo: function() {
        if (!this.sceneView.camera || !this.sceneView.camera.position) {
          return;
        }

        var eyeAlt = this.sceneView.camera.position.z;
        eyeAlt = this._trunNumToKmOrM(eyeAlt);
        this.eyeInfo.innerHTML = this.nls.EYE_ALT + " " + eyeAlt;
      },
      _trunNumToKmOrM: function(num, isElev) {
        var threshold = isElev ? 10000 : 1000;//switch to km if more than 10,000 m.
        var unit = "";

        num = parseFloat(num);
        if (num >= threshold || num <= -(threshold)) {
          num = num / 1000;
          unit = this._unitToNls("KILOMETERS");
        } else {
          unit = this._unitToNls("METERS");
        }

        num = utils.localizeNumberByFieldInfo(num, {
          format: {
            places: this.config.eyeDecimalPlaces,
            digitSeparator: this.config.addSeparator
          }
        });
        if (!num) {
          return "";
        }
        num = num + " " + unit;
        return num;
      },
      /**
       * Helper function to prettify decimal degrees into DMS (degrees-minutes-seconds).
       *
       * @param {number} decDeg The decimal degree number
       * @param {string} decDir LAT or LON
       *
       * @return {string} Human-readable representation of decDeg.
       */
      degToDMS: function(decDeg, decDir) {
        /** @type {number} */
        var d = Math.abs(decDeg);
        /** @type {number} */
        var deg = Math.floor(d);
        d = d - deg;
        /** @type {number} */
        var min = Math.floor(d * 60);
        /** @type {number} */
        var sec = Math.floor((d - min / 60) * 60 * 60);
        if (sec === 60) { // can happen due to rounding above
          min++;
          sec = 0;
        }
        if (min === 60) { // can happen due to rounding above
          deg++;
          min = 0;
        }
        /** @type {string} */
        var min_string = min < 10 ? "0" + min : min;
        /** @type {string} */
        var sec_string = sec < 10 ? "0" + sec : sec;
        /** @type {string} */
        var dir = (decDir === 'LAT') ? (decDeg < 0 ? "S" : "N") : (decDeg < 0 ? "W" : "E");

        return (decDir === 'LAT') ?
        deg + "&deg;" + min_string + "&prime;" + sec_string + "&Prime;" + dir :
        deg + "&deg;" + min_string + "&prime;" + sec_string + "&Prime;" + dir;
      }
    });

    return clazz;
  });
