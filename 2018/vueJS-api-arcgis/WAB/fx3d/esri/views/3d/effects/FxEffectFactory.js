/**
 * Copyright @ 2018 Esri.
 * All rights reserved under the copyright laws of the United States and applicable international laws, treaties, and conventions.
 */
define(["dojo/Deferred","../support/fx3dUtils"],function(e,t){var r="fx3d/views/3d/effects/",i="Effect",f={make:function(f){var n=new e;if(f instanceof Object&&f.layer&&f.view&&f.layerView){var c=f.layer.vizType;if("string"!=typeof c)n.reject("No viz type specified.");else{var a,o=c+i;a=f._test&&t.enableAddTesting?r+"_test/"+o:r+c+"/"+o;try{require([a],function(e){var t=new e(f);n.resolve(t)})}catch(s){n.reject(s)}}}else n.reject("No FxLayer object found.");return n}};return f});