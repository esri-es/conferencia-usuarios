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
    'jimu/BaseWidget',
    'dijit/_WidgetsInTemplateMixin',
    'dojo/on',
    'dojo/_base/lang',
    'dojo/_base/html',
    'jimu/utils',
    'esri/core/watchUtils',
    'dijit/form/HorizontalSlider',
    'dijit/form/Select',
    'jimu/dijit/CheckBox',
    'dijit/form/DateTextBox'
  ], function(declare, BaseWidget, _WidgetsInTemplateMixin, on, lang, html, jimuUtils, watchUtils) {

    var clazz = declare([BaseWidget, _WidgetsInTemplateMixin], {

      baseClass: 'jimu-widget-daylight',

      //lighting._lastTimezone:The time zone which map shows
      //lighting.date: The date map uses

      postCreate: function(){
        this.inherited(arguments);

        this.sceneView.when(lang.hitch(this, this._init));
      },

      _init: function() {
        //init UI
        var date = this._getDateOfLighting();
        //use lighting.date to init date picker
        this._initDatePaker(date);
        //use initialTimeZone to init zoneSelect
        this._initZoneSelect();
        //use lighting.date and GMT to init slider
        this._updateSliderUIByDate(date);

        //bind events
        var lighting = this.sceneView.environment.lighting;
        this.own(on(lighting, "date-will-change", lang.hitch(this, this._onDateWillChange)));
        this.own(on(this.zoneSelect, 'change', lang.hitch(this, this._onZoneSelectChanged)));
        this.own(on(this.datePicker, 'change', lang.hitch(this, this._onDatePickerChanged)));
        this.own(on(this.slider, 'change', lang.hitch(this, this._onSliderValueChanged)));
        // this.own(on(lighting, "timezone-will-change", lang.hitch(this, function(evt){
        //   console.log("timezone-will-change: " + evt);
        // })));
        var showShadowContainer = false;
        if(this.sceneView._stage.getRenderParams().shadowMap !== undefined){
          showShadowContainer = true;
          var directShadowLabel = this.nls.directShadow + "&lrm;";
          this.cbxDirect.setLabel(directShadowLabel);
          this.own(watchUtils.init(this.sceneView,
                                "environment.lighting.directShadowsEnabled",
                                lang.hitch(this, this._onWatchDirectShadows)));
          this.cbxDirect.onChange = lang.hitch(this, this._onDirectShadowChange);
        }else{
          html.setStyle(this.directShadowSection, 'display', 'none');
        }

        if(this.sceneView._stage.getRenderParams().ssao !== undefined){
          showShadowContainer = true;
          // var diffuseShadowLabel = this.nls.diffuseShadow + "&lrm;";
          // this.cbxDiffuse.setLabel(diffuseShadowLabel);
          // this.own(watchUtils.init(this.sceneView,
          //                          "environment.lighting.ambientOcclusionEnabled",
          //                          lang.hitch(this, this._onWatchAmbientOcclusion)));
          // this.cbxDiffuse.onChange = lang.hitch(this, this._onDiffuseShadowChange);
        }else{
          // html.setStyle(this.diffuseShadowSection, 'display', 'none');
        }

        if(!showShadowContainer){
          html.setStyle(this.shadowContainer, 'display', 'none');
        }
      },

      _setDateOfLighting: function(newDate){
        var date = this._getDateOfLighting();
        if(date.getTime() !== newDate.getTime()){
          this.sceneView.environment.lighting.date = newDate;
        }
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

      _initDatePaker:function(date){
        this.datePicker.set('value', date);
      },

      _updateSliderUIByDate: function(newDate){
        var timeZone = this._getTimeZoneByUI();
        var h = (((newDate.getUTCHours() + timeZone) % 24) + 24) % 24;
        var m = newDate.getUTCMinutes();
        var s = newDate.getUTCSeconds();

        var oldValue = this.slider.get("value");
        var newValue = h + (m / 60) + (s / 3600);
        this._updateSunTimeUIByDate(newDate);
        if(oldValue !== newValue){
          this.slider.set('value', newValue);
        }
      },

      _updateSunTimeUIByDate: function(date){
        var tempDate = new Date(date);
        var timeZone = this._getTimeZoneByUI();
        var h = (((date.getUTCHours() + timeZone) % 24) + 24) % 24;
        tempDate.setHours(h);
        var formatteredDate = jimuUtils.localizeDate(tempDate, {
          fullYear: false,
          selector: 'time',
          formatLength: 'short'
        });
        this.sunTime.innerHTML = formatteredDate;
      },

      _getDateOfLighting: function(){
        return this.sceneView.environment.lighting.get('date');
      },

      _getDateByUI: function(){
        //return the Date object configured by UI settings
        var lightValue = this._getDateOfLighting();
        var lightDate = new Date(lightValue);
        var timeZone = this._getTimeZoneByUI();
        var sliderValue = this.slider.get('value');

        var h = (((Math.floor(sliderValue) - timeZone) % 24) + 24) % 24;
        var m = 60 * (sliderValue - Math.floor(sliderValue));
        var minfrac = m % 1;
        m -= minfrac;
        var s = Math.round(minfrac * 60);

        var pickerDate = this.datePicker.get('value');
        var year = pickerDate.getFullYear();
        var mounth = pickerDate.getMonth();
        var dateDay = pickerDate.getDate();

        lightDate.setUTCFullYear(year);
        lightDate.setUTCMonth(mounth);
        lightDate.setUTCDate(dateDay);

        lightDate.setUTCHours(h);
        lightDate.setUTCMinutes(m);
        lightDate.setUTCSeconds(s);

        return lightDate;
      },

      _getTimeZoneByUI: function(){
        return parseInt(this.zoneSelect.get('value'), 10);
      },

      _getPositionTimeZone: function(){
        return this.sceneView.environment.lighting.positionTimezoneInfo.hours;
      },

      _onDateWillChange: function(evt){
        this._updateSliderUIByDate(evt.date);
      },

      _onZoneSelectChanged: function(){
        this.slider.ignoreChangeEvent = true;
        var date = this._getDateOfLighting();
        this._updateSliderUIByDate(date);
      },

      _onDatePickerChanged: function(pickerDate) {
        if(!this.datePicker.isValid()){
          return;
        }
        var lightValue = this._getDateOfLighting();
        var lightDate = new Date(lightValue);

        var year = pickerDate.getFullYear();
        var mounth = pickerDate.getMonth();
        var dateDay = pickerDate.getDate();

        lightDate.setUTCFullYear(year);
        lightDate.setUTCMonth(mounth);
        lightDate.setUTCDate(dateDay);
        this._setDateOfLighting(lightDate);
      },

      _onSliderValueChanged: function(){
        //When Slider UI change, time zone doesn't change but hour is changed.
        //Once hour is changed, we should update date.
        var newDate = this._getDateByUI();
        this._updateSunTimeUIByDate(newDate);

        var ignoreChangeEvent = this.slider.ignoreChangeEvent;

        delete this.slider.ignoreChangeEvent;

        if (ignoreChangeEvent) {
          return;
        }

        this._setDateOfLighting(newDate);
      },

      _onWatchDirectShadows: function(directShadows){
        this.cbxDirect.setValue(directShadows);
      },

      _onWatchAmbientOcclusion: function(/*ambientOcclusion*/){
        // this.cbxDiffuse.setValue(ambientOcclusion);
      },

      _onDirectShadowChange: function(){
        var value = this.cbxDirect.getValue();
        this.sceneView.environment.lighting.directShadowsEnabled = value;
      },

      _onDiffuseShadowChange: function(){
        // var value = this.cbxDiffuse.getValue();
        // this.sceneView.environment.lighting.ambientOcclusionEnabled = value;
      }

    });
    return clazz;
  });