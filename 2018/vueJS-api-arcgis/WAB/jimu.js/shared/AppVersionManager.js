define(['./BaseVersionManager'],
function(BaseVersionManager) {

  //app version manager manage config and framework version
  function AppWidgetManager(){
    this.versions = [{
      version: '2.0beta',

      description: 'The version for Developer Edition beta 2.0.',

      upgrader: function(oldConfig){
        return oldConfig;
      },
      compatible: true
    }, {
      version: '2.0',

      description: 'The version for Online 4.1.',

      upgrader: function(oldConfig){
        return oldConfig;
      },
      compatible: true
    }, {
      version: '2.0.1',

      description: 'The version for Developer Edition 2.0.',

      upgrader: function(oldConfig){

        renameVizTo3DFx(oldConfig);

        /*******************functions********************/
        function renameVizTo3DFx(oldConfig){
          var widget = null;
          var i = 0;

          var onScreenWidgets = oldConfig.widgetOnScreen.widgets;
          if(onScreenWidgets && onScreenWidgets.length > 0){
            for(i = 0; i < onScreenWidgets.length; i++){
              widget = onScreenWidgets[i];
              if(widget.uri === 'widgets/Viz/Widget'){
                widget.uri = 'widgets/3DFx/Widget';
                widget.name = '3DFx';
              }
            }
          }

          var poolWidgets = oldConfig.widgetPool.widgets;
          if(poolWidgets && poolWidgets.length > 0){
            for(i = 0; i < poolWidgets.length; i++){
              widget = poolWidgets[i];
              if(widget.uri === 'widgets/Viz/Widget'){
                widget.uri = 'widgets/3DFx/Widget';
                widget.name = '3DFx';
              }
            }
          }
        }

        return oldConfig;
      },

      compatible: true
    }, {
      version: '2.1',

      description: 'The version for Online 4.2.',

      upgrader: function(oldConfig){
        return oldConfig;
      },

      compatible: true
    }, {
      version: '2.2',

      description: 'The version for Online 4.3.',

      upgrader: function(oldConfig){
        return oldConfig;
      },

      compatible: true
    }, {
      version: '2.3',

      description: 'The version for Online 4.4.',

      upgrader: function(oldConfig){
        return oldConfig;
      },

      compatible: true
    }, {
      version: '2.4',

      description: 'The version for Online 5.1.',

      upgrader: function(oldConfig){
        return oldConfig;
      },

      compatible: true
    }, {
      version: '2.5',

      description: 'The version for Online 5.2.',

      upgrader: function(oldConfig){
        return oldConfig;
      },

      compatible: true
    }, {
      version: '2.6',

      description: 'The version for Online 5.3.',

      upgrader: function(oldConfig){
        return oldConfig;
      },

      compatible: true
    }, {
      version: '2.7',

      description: 'The version for Online 5.4.',

      upgrader: function(oldConfig){

        function renameEnvironmentToDaylight(){
          updateSection('widgetOnScreen');
          updateSection('widgetPool');

          function updateSection(sectionName){
            var i = 0, j = 0;
            if(oldConfig[sectionName].widgets){
              for(i = 0; i < oldConfig[sectionName].widgets.length; i++){
                if(oldConfig[sectionName].widgets[i].uri === 'widgets/Environment/Widget'){
                  oldConfig[sectionName].widgets[i].uri = 'widgets/Daylight/Widget';
                  break;
                }
              }
            }

            if(oldConfig[sectionName].groups){
              for(i = 0; i < oldConfig[sectionName].groups.length; i++){
                var g = oldConfig[sectionName].groups[i];
                for(j = 0; j < g.widgets.length; j++){
                  if(g.widgets[j].uri === 'widgets/Environment/Widget'){
                    g.widgets[j].uri = 'widgets/Daylight/Widget';
                    break;
                  }
                }
              }
            }
          }

        }

        renameEnvironmentToDaylight();
        return oldConfig;
      },

      compatible: true
    }, {
      version: '2.8',

      description: 'The version for Online 6.1.',

      upgrader: function(oldConfig){
        return oldConfig;
      },

      compatible: true
    }, {
      version: '2.9',

      description: 'The version for Online 6.2.',

      upgrader: function(oldConfig){
        return oldConfig;
      },

      compatible: true
    }, {
      version: '2.10',

      description: 'The version for Online 6.3.',

      upgrader: function(oldConfig){
        return oldConfig;
      },

      compatible: true
    }];

    this.isCompatible = function(_oldVersion, _newVersion){
      var oldVersionIndex = this.getVersionIndex(_oldVersion);
      var newVersionIndex = this.getVersionIndex(_newVersion);
      var i;
      for(i = oldVersionIndex + 1; i <= newVersionIndex; i++){
        if(this.versions[i].compatible === false){
          return false;
        }
      }
      return true;
    };
  }

  AppWidgetManager.prototype = new BaseVersionManager();
  AppWidgetManager.prototype.constructor = AppWidgetManager;
  return AppWidgetManager;
});