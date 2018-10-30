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
  'dijit/_WidgetsInTemplateMixin',
  'jimu/BaseWidgetSetting',
  'dijit/form/Select'
],
function(
  declare,
  _WidgetsInTemplateMixin,
  BaseWidgetSetting) {

  return declare([BaseWidgetSetting, _WidgetsInTemplateMixin], {

    baseClass: 'jimu-widget-daylight-setting',


    startup: function() {
      this.inherited(arguments);
      this._initZoneSelect();
    },

    _initZoneSelect: function(){
      var info = this.sceneView.environment.lighting.positionTimezoneInfo;
      var selectedZone = this.config.defaultTimeZone || info.hours;

      var options = [];
      var label = "";
      var option = null;
      for(var i = -12; i <= 12; i++){
        label = "GMT";
        if(i < 0){
          label += " ";
        }else if(i === 0){
          label += " ";
        }else if(i > 0){
          label += "+";
        }
        label += i;
        option = {
          value: i + "",//should use string instead of number
          label: label
        };
        options.push(option);
      }
      this.zoneSelect.addOption(options);
      this.zoneSelect.set('value', selectedZone + "");
    },

    getConfig: function(){
      this.config.defaultTimeZone = this.zoneSelect.get('value');
      return this.config;
    }

  });
});