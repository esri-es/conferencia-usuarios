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
    './ConfigManager',
    './LayoutManager',
    './DataManager',
    'dojo/_base/html',
    'dojo/_base/lang',
    'dojo/_base/array',
    'dojo/on',
    'dojo/mouse',
    'dojo/topic',
    'dojo/cookie',
    'dojo/Deferred',
    'dojo/promise/all',
    'dojo/io-query',
    'dojo/domReady!',
    'esri/config',
    'esri/request',
    'esri/core/urlUtils',
    'esri/identity/IdentityManager',
    'jimu/portalUrlUtils',
    './utils',
    'require',
    'dojo/i18n',
    'dojo/i18n!./nls/main',
    'dojo/ready'
  ],
  function(ConfigManager, LayoutManager, DataManager, html, lang, array, on, mouse, topic, cookie,
    Deferred, all, ioquery, domReady, esriConfig, esriRequest, urlUitls, IdentityManager,
    portalUrlUtils, jimuUtils, require, i18n, mainBundle, dojoReady) {
    /* global jimuConfig:true */
    var mo = {};

    //set the default timeout to 3 minutes
    var io = jimuUtils.getEsriConfigRequestObject();
    io.timeout = 60000 * 3;

    //patch for JS API 3.10
    var hasMethod = typeof cookie.getAll === 'function';
    if (!hasMethod) {
      cookie.getAll = function(e) {
        var result = [];
        var v = cookie(e);
        if (v) {
          result.push(v);
        }
        return result;
      };
    }

    //jimu nls
    window.jimuNls = mainBundle;

    IdentityManager.setProtocolErrorHandler(function() {
      return true;
    });

    var ancestorWindow = jimuUtils.getAncestorWindow();
    var parentHttps = false;

    try {
      parentHttps = ancestorWindow.location.href.indexOf("https://") === 0;
    } catch (err) {
      //if it's in different domain, we do not force https

      // console.log(err);
      // parentHttps = window.location.protocol === "https:";
    }

    var regex = /\/SceneServer\/layers\/\d+\/?$/;

    io.interceptors = [{
      before: function(params){
        if (params && typeof params.requestOptions === "object" && !params.requestOptions.content &&
            regex.test(params.url)) {
          params.content = {
            f: "json"
          };
        }

        if (params.requestOptions.query && params.requestOptions.query.printFlag) { // printTask
          params.timeout = 300000;
        }

        //use https protocol
        if (parentHttps) {
          var patt = /^http(s?):\/\//gi;
          params.url = params.url.replace(patt, '//');
        }

        //working around an arcgis server feature service bug.
        //Requests to queryRelatedRecords operation fail with feature service 10.
        //Detect if request conatins the queryRelatedRecords operation
        //and then change the source url for that request to the corresponding mapservice.
        if (params.url.indexOf("/queryRelatedRecords?") !== -1) {
          if (!jimuUtils.isHostedService(params.url)) { // hosted service doesn't depend on MapServer
            params.url = params.url.replace("FeatureServer", "MapServer");
          }
        }
      }
    }];

    // esriRequest.setRequestPreCallback(function(ioArgs) {

    //   if (ioArgs && typeof ioArgs === "object" && !ioArgs.content && regex.test(ioArgs.url)) {
    //     ioArgs.content = {
    //       f: "json"
    //     };
    //   }

    //   if (ioArgs.query && ioArgs.query.printFlag) { // printTask
    //     ioArgs.timeout = 300000;
    //   }

    //   //use https protocol
    //   if (parentHttps) {
    //     var patt = /^http(s?):\/\//gi;
    //     ioArgs.url = ioArgs.url.replace(patt, '//');
    //   }

    //   //working around an arcgis server feature service bug.
    //   //Requests to queryRelatedRecords operation fail with feature service 10.
    //   //Detect if request conatins the queryRelatedRecords operation
    //   //and then change the source url for that request to the corresponding mapservice.
    //   if (ioArgs.url.indexOf("/queryRelatedRecords?") !== -1) {
    //     if (!jimuUtils.isHostedService(ioArgs.url)) { // hosted service doesn't depend on MapServer
    //       ioArgs.url = ioArgs.url.replace("FeatureServer", "MapServer");
    //     }
    //   }

    //   return ioArgs;
    // });


    // disable middle mouse button scroll
    on(window, 'mousedown', function(evt) {
      if (!mouse.isMiddle(evt)) {
        return;
      }

      evt.preventDefault();
      evt.stopPropagation();
      evt.returnValue = false;
      return false;
    });

    String.prototype.startWith = function(str) {
      if (this.substr(0, str.length) === str) {
        return true;
      } else {
        return false;
      }
    };

    String.prototype.endWith = function(str) {
      if (this.substr(this.length - str.length, str.length) === str) {
        return true;
      } else {
        return false;
      }
    };

    /*jshint unused: false*/
    if (typeof jimuConfig === 'undefined') {
      jimuConfig = {};
    }
    jimuConfig = lang.mixin({
      loadingId: 'main-loading',
      loadingImageId: 'app-loading',
      loadingGifId: 'loading-gif',
      layoutId: 'jimu-layout-manager',
      mapId: 'map',
      mainPageId: 'main-page',
      timeout: 5000,
      breakPoints: [600, 1280]
    }, jimuConfig);

    window.wabVersion = '2.10';
    // window.productVersion = 'Online 6.3';
    window.productVersion = 'Web AppBuilder for ArcGIS (Developer Edition) 2.10';
    // window.productVersion = 'Portal for ArcGIS 10.5';

    function initApp() {
      var urlParams, configManager, layoutManager;
      console.log('jimu.js init...');
      urlParams = getUrlParams();

      DataManager.getInstance();

      html.setStyle(jimuConfig.loadingId, 'display', 'none');
      html.setStyle(jimuConfig.mainPageId, 'display', 'block');

      layoutManager = LayoutManager.getInstance({
        mapId: jimuConfig.mapId,
        urlParams: urlParams
      }, jimuConfig.layoutId);
      configManager = ConfigManager.getInstance(urlParams);

      layoutManager.startup();
      configManager.loadConfig();

      //temp fix for this issue: https://devtopia.esri.com/WebGIS/arcgis-webappbuilder/issues/14224
      dojoReady(function(){
        setTimeout(function(){
          html.removeClass(document.body, 'dj_a11y');
        }, 50);
      });
    }

    function getUrlParams() {
      var s = window.location.search,
        p;
      if (s === '') {
        return {};
      }

      p = ioquery.queryToObject(s.substr(1));

      for(var k in p){
        p[k] = jimuUtils.sanitizeHTML(p[k]);
      }
      return p;
    }

    mo.initApp = initApp;
    return mo;
  });