/**
 * Copyright @ 2018 Esri.
 * All rights reserved under the copyright laws of the United States and applicable international laws, treaties, and conventions.
 */
define(["require","exports","dojox/xml/parser","esri/views/3d/webgl-engine/lib/Util"],function(t,e,r,n){var a=function(){function t(t){var e=n.VertexAttrConstants;for(var r in e)this[e[r]]=n.VertexAttrConstants[r];if(t)for(var a in t)this[a]=t[a]}return t.prototype._parse=function(t){for(var e=r.parse(t),a=e.getElementsByTagName("snippet"),i=/\$[a-zA-Z0-9_]+[ \t]*/,s=/[\$\s]+/g,o=0;o<a.length;o++){var l=a[o].getAttribute("name");n.assert(null==this[l]);for(var f=a[o].textContent;;){var v=f.match(i);if(null==v)break;var p=v[0].replace(s,""),u=this[p];n.assert(void 0!==u),f=f.replace(v[0],u)}this[l]=f}},t}();return a});