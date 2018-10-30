/**
 * Copyright @ 2018 Esri.
 * All rights reserved under the copyright laws of the United States and applicable international laws, treaties, and conventions.
 */
var profile={resourceTags:{test:function(t,n){return/test/.test(n)},copyOnly:function(t,n){return/libs/.test(t)},amd:function(t,n){return!this.copyOnly(t,n)&&/\.js$/.test(t)},miniExclude:function(t,n){return n in{"jimu/package":1}}}};