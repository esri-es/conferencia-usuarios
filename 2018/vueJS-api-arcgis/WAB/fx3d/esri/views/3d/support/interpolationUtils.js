/**
 * Copyright @ 2018 Esri.
 * All rights reserved under the copyright laws of the United States and applicable international laws, treaties, and conventions.
 */
define(["dojo/_base/lang"],function(n){var r={_b3p0:function(n,r){var t=1-n;return t*t*t*r},_b3p1:function(n,r){var t=1-n;return 3*t*t*n*r},_b3p2:function(n,r){var t=1-n;return 3*t*n*n*r},_b3p3:function(n,r){return n*n*n*r},_b3:function(n,t,u,_,e){return r._b3p0(n,t)+r._b3p1(n,u)+r._b3p2(n,_)+r._b3p3(n,e)},_getPoint:function(n,t,u,_,e){var o,b,i;return o=r._b3(n,t[0],u[0],_[0],e[0]),b=r._b3(n,t[1],u[1],_[1],e[1]),i=r._b3(n,t[2],u[2],_[2],e[2]),[o,b,i]},getPoints:function(n,t,u,_,e){n||(n=10);for(var o=[],b=0;b<=n;b++)o.push(r._getPoint(b/n,t,u,_,e));return o}};return r});