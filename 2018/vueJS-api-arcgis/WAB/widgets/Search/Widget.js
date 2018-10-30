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
    'dojo/when',
    'dojo/on',
    // 'dojo/aspect',
    'dojo/query',
    'dojo/keys',
    'dojo/Deferred',
    'dojo/promise/all',
    'jimu/BaseWidget',
    // 'jimu/LayerInfos/LayerInfos',
    'jimu/utils',
    // 'esri/dijits/Search',
    'esri/widgets/Search',
    'esri/widgets/Search/SearchViewModel',
    // 'esri/tasks/locator',
    'esri/tasks/Locator',
    // 'esri/layers/FeatureLayer',
    // 'esri/InfoTemplate',
    'esri/symbols/PictureMarkerSymbol',
    './utils',
    'dojo/NodeList-dom'
  ],
  function(declare, lang, array, html, when, on, /*aspect,*/ query, keys, Deferred, all,
    BaseWidget, /*LayerInfos,*/ jimuUtils, Search, SearchViewModel, Locator,
    /*FeatureLayer, InfoTemplate,*/ PictureMarkerSymbol, utils) {
    //To create a widget, you need to derive from BaseWidget.
    return declare([BaseWidget], {
      name: 'Search',
      baseClass: 'jimu-widget-search',
      searchDijit: null,
      searchResults: null,

      postCreate: function() {
        // if (this.closeable || !this.isOnScreen) {
        //   // html.addClass(this.searchNode, 'default-width-for-openAtStart');
        // }

        this.listenWidgetIds.push('framework');
      },

      startup: function() {
        this.inherited(arguments);

        if (!(this.config && this.config.sources)) {
          this.config.sources = [];
        }

        utils.setAppConfig(this.appConfig);
        when(utils.getConfigInfo(this.config)).then(lang.hitch(this, function(config) {
          return all(this._convertConfig(config)).then(function(searchSouces) {
            return array.filter(searchSouces, function(source) {
              return source;
            });
          });
        })).then(lang.hitch(this, function(searchSouces) {
          if (!this.domNode) {
            return;
          }

          var svm = new SearchViewModel({
            activeSourceIndex: searchSouces.length === 1 ? 0 : 'all',
            allPlaceholder: jimuUtils.stripHTML(jimuUtils.isDefined(this.config.allPlaceholder) ?
              this.config.allPlaceholder : ""),
            autoSelect: true,
            buttonModeEnabled: false,
            labelEnabled: false,
            popupEnabled: true,
            popupOpenOnSelect: jimuUtils.isDefined(this.config.showInfoWindowOnSelect) ?
              !!this.config.showInfoWindowOnSelect : true,//change property name from 4.5
            view: this.sceneView,
            sources: searchSouces,
            theme: 'arcgisSearch'
          });
          this.searchDijit = new Search({
            viewModel: svm,
            includeDefaultSources: false,
            container: this.searchNode
          });
          this.searchDijit.startup();

          this._resetSearchDijitStyle();

          this.own(
            this.searchDijit.viewModel.watch(
              'activeSourceIndex',
              lang.hitch(this, '_onSourceIndexChange')
            )
          );

          this.own(
            on(this.searchDijit.domNode, 'click', lang.hitch(this, '_onSearchDijitClick'))
          );
          this.own(on(this.searchDijit._inputNode, "keyup", lang.hitch(this, function(e) {
            if (e.keyCode !== keys.ENTER) {
              this._onClearSearch();
            }
          })));
          /*this.own(
            aspect.before(this.searchDijit.viewModel, 'select', lang.hitch(this, '_captureSelect'))
            );*/
          this.own(
            on(this.searchDijit.viewModel, 'search-results', lang.hitch(this, '_onSearchResults'))
          );
          this.own(
            on(this.searchDijit.viewModel, 'suggest-results', lang.hitch(this, '_onSuggestResults'))
          );
          // this.own(
          //   on(this.searchDijit.viewModel, 'select-result', lang.hitch(this, '_onSelectResult'))
          // );
          this.own(
            on(this.searchResultsNode, 'li:click', lang.hitch(this, '_onSelectSearchResult'))
          );
          this.own(on(
            this.searchResultsNode,
            '.show-all-results:click',
            lang.hitch(this, '_showResultMenu')
          ));
          this.own(
            on(window.document, 'click', lang.hitch(this, function(e) {
              if (!html.isDescendant(e.target, this.searchResultsNode)) {
                this._hideResultMenu();
                this._resetSelectorPosition('.show-all-results');
              }
            }))
          );
          this.own(
            on(this.searchDijit.viewModel, 'clear-search', lang.hitch(this, '_onClearSearch'))
          );
          this.own(this.sceneView.popup.viewModel.watch('visible',
            lang.hitch(this, function(newValue, oldValue) {
            if (!newValue && oldValue) {
              this.searchDijit.viewModel.clearGraphics();
              query('li', this.searchResultsNode).removeClass('result-item-selected');
            }
          })));

          this.fetchData('framework');
        }));
      },

      onReceiveData: function(name, widgetId, data) {
        if (name === 'framework' && widgetId === 'framework' && data && data.searchString) {
          this.searchDijit.viewModel.set('value', data.searchString);
          this.searchDijit.viewModel.search();
        }
      },

      setPosition: function() {
        this._resetSearchDijitStyle();
        this.inherited(arguments);
      },

      resize: function() {
        this._resetSearchDijitStyle();
      },

      _resetSearchDijitStyle: function() {
        // return;
        // html.removeClass(this.domNode, 'use-absolute');
        // if (this.searchDijit && this.searchDijit.domNode) {
        //   html.setStyle(this.searchDijit.domNode, 'width', 'auto');
        // }

        // setTimeout(lang.hitch(this, function() {
        //   if (this.searchDijit && this.searchDijit.domNode) {
        //     // only need width of domNode
        //     // var box = html.getMarginBox(this.domNode);
        //     var box = {
        //       w: parseInt(html.getComputedStyle(this.domNode).width, 10)
        //     };
        //     var sourcesBox = html.getMarginBox(this.searchDijit.sourcesBtnNode);
        //     var submitBox = html.getMarginBox(this.searchDijit.submitNode);
        //     var style = null;
        //     if (box.w) {
        //       html.setStyle(this.searchDijit.domNode, 'width', box.w + 'px');
        //       html.addClass(this.domNode, 'use-absolute');

        //       if (isFinite(sourcesBox.w) && isFinite(submitBox.w)) {
        //         if (window.isRTL) {
        //           style = {
        //             left: submitBox.w + 'px',
        //             right: sourcesBox.w + 'px'
        //           };
        //         } else {
        //           style = {
        //             left: sourcesBox.w + 'px',
        //             right: submitBox.w + 'px'
        //           };
        //         }
        //         var inputGroup = query('.esri-input-container', this.searchDijit.domNode)[0];

        //         if (inputGroup) {
        //           html.setStyle(inputGroup, style);
        //           var groupBox = html.getMarginBox(inputGroup);
        //           // var extents = html.getPadBorderExtents(this.searchDijit.inputNode);
        //           // box-sizzing(content-box) be removed in 4.0 api
        //           html.setStyle(this.searchDijit.inputNode,
        //             'width',
        //             groupBox.w/* - extents.w*/ + 'px');
        //         }
        //       }
        //     }
        //   }
        // }), 50);
      },

      _convertConfig: function(config) {
        var sourceDefs = array.map(config.sources, lang.hitch(this, function(source) {
          var def = new Deferred();
          if (source && source.url && source.type === 'locator') {
            def.resolve({
              locator: new Locator(source.url || ""),
              outFields: ["*"],
              singleLineFieldName: source.singleLineFieldName || "",
              name: jimuUtils.stripHTML(source.name || ""),
              placeholder: jimuUtils.stripHTML(source.placeholder || ""),
              highlightSymbol: new PictureMarkerSymbol({
                url: this.folderUrl + "css/images/search-pointer.png",
                size: 36,
                width: 36,
                height: 36,
                xoffset: 9,
                yoffset: 18
              }),
              countryCode: source.countryCode || "",
              maxSuggestions: source.maxSuggestions || 6,
              maxResults: source.maxResults || 6,
              zoomScale: source.zoomScale || 50000,
              useMapExtent: !!source.searchInCurrentMapExtent
            });
          } else {
            def.resolve(null);
          }
          // if (source && source.url && source.type === 'query') {
          //   var searchLayer = new FeatureLayer(source.url || null, {
          //     outFields: ["*"]
          //   });

          //   this.own(on(searchLayer, 'load', lang.hitch(this, function(result) {
          //     var flayer = result.layer;
          //     var template = this._getInfoTemplate(flayer, source, source.displayField);
          //     var fNames = null;
          //     if (source.searchFields && source.searchFields.length > 0) {
          //       fNames = source.searchFields;
          //     } else {
          //       fNames = [];
          //       array.forEach(flayer.fields, function(field) {
          //         if (field.type !== "esriFieldTypeOID" && field.name !== flayer.objectIdField &&
          //           field.type !== "esriFieldTypeGeometry") {
          //           fNames.push(field.name);
          //         }
          //       });
          //     }
          //     var convertedSource = {
          //       featureLayer: flayer,
          //       outFields: ["*"],
          //       searchFields: fNames,
          //       displayField: source.displayField || "",
          //       exactMatch: !!source.exactMatch,
          //       name: jimuUtils.stripHTML(source.name || ""),
          //       placeholder: jimuUtils.stripHTML(source.placeholder || ""),
          //       maxResults: source.maxResults || 6,
          //       infoTemplate: template,
          //       useMapExtent: !!source.searchInCurrentMapExtent
          //     };
          //     if (!template) {
          //       delete convertedSource.infoTemplate;
          //     }
          //     def.resolve(convertedSource);
          //   })));

          //   this.own(on(searchLayer, 'error', function() {
          //     def.resolve(null);
          //   }));
          // } else {
          //   def.resolve(null);
          // }
          return def;
        }));

        return sourceDefs;
      },

      // _getInfoTemplate: function(fLayer, source, displayField) {
      //   var layerInfo = this.layerInfosObj.getLayerInfoById(source.layerId);
      //   var template = layerInfo && layerInfo.getInfoTemplate();
      //   var validTemplate = layerInfo && template;

      //   if (layerInfo && !validTemplate) { // doesn't enabled pop-up
      //     return null;
      //   } else if (validTemplate) {
      //     // configured media or attachments
      //     return template;
      //   } else { // (added by user in setting) or (only configured fieldInfo)
      //     template = new InfoTemplate();
      //     template.setTitle('&nbsp;');
      //     template.setContent(
      //       lang.hitch(this, '_formatContent', source.name, fLayer, displayField)
      //     );

      //     return template;
      //   }
      // },

      _captureSelect: function(e) {
        var sourceIndex = this.searchDijit.viewModel.activeSourceIndex;
        if (sourceIndex === 'all') {
          sourceIndex = this._getSourceIndexOfResult(e);
        }
        if (isFinite(sourceIndex) && jimuUtils.isDefined(sourceIndex)) {
          var source = this.searchDijit.viewModel.sources[sourceIndex];
          if (source && 'featureLayer' in source) {
            var formatedAttrs = this._getFormatedAttrs(
              lang.clone(e.feature.attributes),
              source.featureLayer.fields,
              source.featureLayer.typeIdField,
              source.featureLayer.types
            );
            e.feature.attributes = formatedAttrs;
          }
        }

        return [e];
      },

      _getSourceIndexOfResult: function(e) {
        if (this.searchResults){
          for (var i in this.searchResults) {
            var sourceResults = this.searchResults[i];
            var pos = array.indexOf(sourceResults, e);
            if (pos > -1) {
              return parseInt(i, 10);
            }
          }
        }

        return null;
      },

      _formatContent: function(title, fLayer, displayField, graphic) {
        var content = "";
        if (graphic && graphic.attributes && fLayer && fLayer.url) {
          var aliasAttrs = {};
          array.forEach(fLayer.fields, lang.hitch(this, function(field) {
            if (field.name in graphic.attributes){
              aliasAttrs[field.alias || field.name] = graphic.attributes[field.name];
            }
          }));
          var displayValue = graphic.attributes[displayField];
          content += '<div class="esriViewPopup">' +
            '<div class="mainSection">' +
            (jimuUtils.isDefined(displayValue) ?
              ('<div class="header">' + title + ': ' + displayValue + '</div>') : "") +
            '<div class="hzLine"></div>' +
            '<div>' +
            '<table class="attrTable" cellpading="0" cellspacing="0">' +
            '<tbody>';
          for (var p in aliasAttrs) {
            if (aliasAttrs.hasOwnProperty(p)) {
              content += '<tr valign="top">' +
                '<td class="attrName">' + p + '</td>' +
                '<td class="attrValue">' + aliasAttrs[p] + '</td>' +
                '</tr>';
            }
          }
          content += '</tbody>' +
            '</table>' +
            '</div>' +
            '<div class="break"></div>' +
            '</div>';
        }

        return content;
      },

      _getFormatedAttrs: function(attrs, fields, typeIdField, types) {
        var aliasAttrs = {};
        array.forEach(fields, lang.hitch(this, function(_field, i) {
          if (!attrs[_field.name]) {
            return;
          }
          var isCodeValue = !!(_field.domain && _field.domain.type === 'codedValue');
          var isDate = _field.type === "esriFieldTypeDate";
          var isTypeIdField = typeIdField && (_field.name === typeIdField);
          var fieldAlias = _field.name;

          if (fields[i].type === "esriFieldTypeString") {
            aliasAttrs[fieldAlias] = jimuUtils.fieldFormatter.getFormattedUrl(attrs[_field.name]);
          } else if (fields[i].type === "esriFieldTypeDate") {
            aliasAttrs[fieldAlias] = jimuUtils.fieldFormatter.getFormattedDate(attrs[_field.name]);
          } else if (fields[i].type === "esriFieldTypeDouble" ||
            fields[i].type === "esriFieldTypeSingle" ||
            fields[i].type === "esriFieldTypeInteger" ||
            fields[i].type === "esriFieldTypeSmallInteger") {
            aliasAttrs[fieldAlias] = jimuUtils.fieldFormatter.getFormattedNumber(
              attrs[_field.name]
              );
          }

          if (isCodeValue) {
            aliasAttrs[fieldAlias] = jimuUtils.fieldFormatter.getCodedValue(
              _field.domain, attrs[_field.name]
              );
          } else if (isTypeIdField) {
            aliasAttrs[fieldAlias] = jimuUtils.fieldFormatter.getTypeName(
              attrs[_field.name], types
              );
          } else if (!isCodeValue && !isDate && !isTypeIdField) {
            // Not A Date, Domain or Type Field
            // Still need to check for codedType value
            aliasAttrs[fieldAlias] = fieldAlias in aliasAttrs ?
              aliasAttrs[fieldAlias] : attrs[_field.name];
            aliasAttrs[fieldAlias] = this.getCodeValueFromTypes(
              _field,
              typeIdField,
              types,
              attrs,
              aliasAttrs
            );
          }
        }));
        return aliasAttrs;
      },

      getCodeValueFromTypes: function(field, typeIdField, types, obj, aliasAttrs) {
        var codeValue = null;
        if (typeIdField && types && types.length > 0) {
          var typeChecks = array.filter(types, lang.hitch(this, function(item) {
            // value of typeIdFild has been changed above
            return item.name === obj[typeIdField];
          }));
          var typeCheck = (typeChecks && typeChecks[0]) || null;

          if (typeCheck && typeCheck.domains &&
            typeCheck.domains[field.name] && typeCheck.domains[field.name].codedValues) {
            codeValue = jimuUtils.fieldFormatter.getCodedValue(
              typeCheck.domains[field.name],
              obj[field.name]
            );
          }
        }
        var fieldAlias = field.name;
        var _value = codeValue !== null ? codeValue : aliasAttrs[fieldAlias];
        return _value || isFinite(_value) ? _value : "";
      },

      _resetSelectorPosition: function(cls) {
        var layoutBox = html.getMarginBox(window.jimuConfig.layoutId);
        query(cls, this.domNode).forEach(lang.hitch(this, function(menu) {
          var menuPosition = html.position(menu);
          var sc = lang.getObject('viewModel.sources.length', false, this.searchDijit);
          if (sc > 1 && cls === '.esri-source-menu') {
            var li = query(cls + ' li[data-index]', this.domNode)[0];
            var itemHeight = jimuUtils.isDefined(li) ? html.getMarginBox(li).h : 30;
            menuPosition.h = itemHeight * (sc + 1);
          }
          if (html.getStyle(menu, 'display') === 'none') {
            return;
          }
          var dijitPosition = html.position(this.searchDijit.domNode);
          var up = dijitPosition.y - 2;
          var down = layoutBox.h - dijitPosition.y - dijitPosition.h;
          if ((down > menuPosition.y + menuPosition.h) || (up > menuPosition.h)) {
            html.setStyle(
              menu,
              'top',
              (
                (down > menuPosition.y + menuPosition.h) ?
                dijitPosition.h : -menuPosition.h - 2
              ) + 'px'
            );
          } else {
            html.setStyle(menu, 'height', Math.max(down, up) + 'px');
            html.setStyle(menu, 'top', (down > up ? dijitPosition.h : -up - 2) + 'px');
          }
        }));
      },

      _onSourceIndexChange: function() {
        if (this.searchDijit.viewModel.value) {
          this.searchDijit.viewModel.search(this.searchDijit.viewModel.value);
        }
      },

      _onSearchDijitClick: function() {
        this._resetSelectorPosition('.esri-source-menu');
      },

      _onSearchResults: function(evt) {
        var sources = this.searchDijit.viewModel.get('sources');
        var activeSourceIndex = this.searchDijit.viewModel.get('activeSourceIndex');
        var value = this.searchDijit.viewModel.get('value');
        var htmlContent = "";
        var results = evt.results;
        var _activeSourceNumber = null;
        if (results && evt.numResults > 0) {
          html.removeClass(this.searchDijit._containerNode, 'showSuggestions');

          this.searchResults = results;
          htmlContent += '<div class="show-all-results jimu-ellipsis" title="' +
            this.nls.showAll + '">' +
            this.nls.showAllResults + '<strong >' + value + '</strong></div>';
          htmlContent += '<div class="searchMenu esri-menu" role="menu">';
          for (var i in results) {
            if (results[i] && results[i].length) {
              var name = sources[parseInt(i, 10)].name;
              if (sources.length > 1 && activeSourceIndex === 'all') {
                htmlContent += '<div title="' + name + '" class="menu-header">' + name + '</div>';
              }
              htmlContent += "<ul>";
              var partialMatch = value;
              var r = new RegExp("(" + partialMatch + ")", "gi");
              var maxResults = sources[i].maxResults;

              for (var j = 0, len = results[i].length; j < len && j < maxResults; j++) {
                var text = jimuUtils.isDefined(results[i][j].name) ?
                  results[i][j].name : this.nls.untitled;

                htmlContent += '<li title="' + text + '" data-index="' + j +
                  '" data-source-index="' + i + '" role="menuitem" tabindex="0">' +
                  text.toString().replace(r, "<strong >$1</strong>") + '</li>';
              }
              htmlContent += '</url>';

              if (evt.numResults === 1) {
                _activeSourceNumber = i;
              }
            }
          }
          htmlContent += "</div>";
          this.searchResultsNode.innerHTML = htmlContent;

          this._showResultMenu();

          this._resetSelectorPosition('.searchMenu');
        } else {
          this._onClearSearch();
        }
      },

      _onSuggestResults: function() {
        this._resetSelectorPosition('.searchMenu');

        this._hideResultMenu();
      },

      _onSelectSearchResult: function(evt) {
        var target = evt.target;
        while(!(html.hasAttr(target, 'data-source-index') && html.getAttr(target, 'data-index'))) {
          target = target.parentNode;
        }
        var result = null;
        var dataSourceIndex = html.getAttr(target, 'data-source-index');
        var dataIndex = parseInt(html.getAttr(target, 'data-index'), 10);
        // var sources = this.searchDijit.get('sources');

        if (dataSourceIndex !== 'all') {
          dataSourceIndex = parseInt(dataSourceIndex, 10);
        }
        if (this.searchResults && this.searchResults[dataSourceIndex] &&
          this.searchResults[dataSourceIndex][dataIndex]) {
          result = this.searchResults[dataSourceIndex][dataIndex];
          this.searchDijit.viewModel.select(result);
        }
      },

      _onSelectResult: function(e) {
        var result = e.result;
        if (!(result && result.name)) {
          return;
        }
        var dataSourceIndex = e.sourceIndex;
        var sourceResults = this.searchResults[dataSourceIndex];
        var dataIndex = 0;
        for (var i = 0, len = sourceResults.length; i < len; i++) {
          if (jimuUtils.isEqual(sourceResults[i], result)) {
            dataIndex = i;
            break;
          }
        }
        query('li', this.searchResultsNode)
          .forEach(lang.hitch(this, function(li) {
            html.removeClass(li, 'result-item-selected');
            var title = html.getAttr(li, 'title');
            var dIdx = html.getAttr(li, 'data-index');
            var dsIndex = html.getAttr(li, 'data-source-index');

            if (title === result.name &&
              dIdx === dataIndex.toString() &&
              dsIndex === dataSourceIndex.toString()) {
              html.addClass(li, 'result-item-selected');
            }
          }));
      },

      _onClearSearch: function() {
        html.setStyle(this.searchResultsNode, 'display', 'none');
        this.searchResultsNode.innerHTML = "";
        this.searchResults = null;
      },

      _hideResultMenu: function() {
        query('.show-all-results', this.searchResultsNode).style('display', 'block');
        query('.searchMenu', this.searchResultsNode).style('display', 'none');
      },

      _showResultMenu: function() {
        html.setStyle(this.searchResultsNode, 'display', 'block');
        query('.show-all-results', this.searchResultsNode).style('display', 'none');
        query('.searchMenu', this.searchResultsNode).style('display', 'block');

        var groupNode = query('.esri-input-container', this.searchDijit.domNode)[0];
        if (groupNode) {
          var groupBox = html.getMarginBox(groupNode);
          var style = {
            width: groupBox.w + 'px'
          };
          if (window.isRTL) {
            var box = html.getMarginBox(this.searchDijit.domNode);
            style.right = (box.w - groupBox.l - groupBox.w) + 'px';
          } else {
            style.left = groupBox.l + 'px';
          }
          query('.show-all-results', this.searchResultsNode).style(style);
          query('.searchMenu', this.searchResultsNode).style(style);
        }
      },

      destroy: function() {
        utils.setAppConfig(null);
        var popupVm = this.sceneView.popup.viewModel;
        if (popupVm) {
          popupVm.visible = false;
        }
        if (this.searchDijit && this.searchDijit.viewModel) {
          this.searchDijit.viewModel.set('view', null);
          this.searchDijit.viewModel.clear();
        }

        this.inherited(arguments);
      }

    });
  });
