Descargamos [chardinjs.zip](https://github.com/esri-es/conferencia-usuarios/raw/master/2017/storymaps/demos/storymap-tour-master/chardinjs.zip) y lo descomprimimos en `src/lib`.

# HTML
En la línea 45 añadimos el appid (por ej: `4f0f875e0668408f8c8f3c3afdc2d8a7`).

Copiamos el nuevo preloader al principio de la línea 390 del fichero `src/index.html`.

```html
<div class="loader">
  <div class="side"></div>
  <div class="side"></div>
  <div class="side"></div>
  <div class="side"></div>
  <div class="side"></div>
  <div class="side"></div>
  <div class="side"></div>
  <div class="side"></div>
</div>
```

Y añadimos en la línea 6:

```html
<link href="https://fonts.googleapis.com/css?family=Lato:300,400" rel="stylesheet">
```

Añadimos los meta description

```html
<title>City of Santa Clara: Development Projects | Custom Story Map Tour</title>

<meta name="description" content="This is a customized story map made by @hhkaos for a demo at the developer track during the Esri Spain's User Conference in 2017.">

<!-- Facebook sharing -->
<meta property="og:type" content="article"/>
<meta property="og:title" content="City of Santa Clara | Custom Story Map Tour"/>
<meta property="og:description" content="This is a customized story map made by @hhkaos for a demo at the developer track during the Esri Spain's User Conference in 2017."/>
<meta property="og:image" content="https://esri-es.github.io/conferencia-usuarios/2017/storymaps/demos/storymap-tour-master/MapTour/deploy/resources/icons/hhkaos_thug_life.jpg"/>
```

# CSS
Copiamos después de la línea 202 del fichero `src/index.html`.

```css
body,
.carouselScroller .carousel-item-div div{
  font-family: 'Lato', sans-serif;
}

/* Customize header */
#header{
  background-color: rgba(216, 88, 54,.8) !important;
  position: absolute;
  z-index: 499;
  top: .5rem;
  left: 1.2rem;
  text-align: center;
}
.rightArea,
.switchBuilder{
  display: none !important;
}
.textArea{
  width: 470px !important;
  padding-right: 25px;
}
#headerDesktop .textArea h1.title{
  font-size: 1.3rem;
  font-weight: 300;
  text-align: center;
}

/* Customize top carousel */
.modern-layout .member-image.current {
  border: 1px solid white;
}
.modern-layout #picturePanel{
  right: 10px !important;
}
#picturePanel{
  top: 0 !important;
}
#cfader{
  margin-top: 0 !important;
}
#placard .description,
#placard .name{
  font-weight: 300;
}
#mainMap_zoom_slider{
  margin-top: 7rem;
}

/* Customize footer and carousel at footer */
#footer{
  background-color: rgba(228, 225, 220, 0.85) !important;
}
#footer{
  background-color: rgba(216, 88, 54,.8) !important;
  color: white;
}
.modern-layout #footer{
  bottom: -135px;
  -webkit-transition: bottom 1s; /* Safari */
  transition: bottom 1s;
}
.modern-layout #footer:hover{
  bottom: -10px !important;
}
.carousel-item-div img{
  height: 100%;
}
.carouselScroller span{
  position: relative;
}
.carouselScroller span:before{
  border: 1px solid;
  right: 1px;
  top: 1px;
}
.carouselScroller .carousel-item-div.selected,
.carouselScroller.no-touch .carousel-item-div:hover{
  background-color: transparent !important;
}
.carousel-item-div.selected div{
  text-decoration: underline;
}

/* Extend map */
#contentPanel,
#mainMap_root{
  height: 100% !important;
}

/* Preloader modification */
#loadingIndicator{
  display: none;
}
#loadingOverlay{
  background-color: #efecca !important;
  color: #1d1d1d;
  box-shadow: none !important;
}
#loadingMessage{
  margin-top:40px;
}
.loader {
  position: absolute;
  z-index:500;
  left: 50%;
  top: 50%;
  width: 48.2842712474619px;
  height: 48.2842712474619px;
  margin-left: -24.14213562373095px;
  margin-top: -24.14213562373095px;
  border-radius: 100%;
  -webkit-animation-name: loader;
  animation-name: loader;
  -webkit-animation-iteration-count: infinite;
  animation-iteration-count: infinite;
  -webkit-animation-timing-function: linear;
  animation-timing-function: linear;
  -webkit-animation-duration: 4s;
  animation-duration: 4s;
}
.loader .side {
  display: block;
  width: 6px;
  height: 20px;
  background-color: #046380;
  margin: 2px;
  position: absolute;
  border-radius: 50%;
  -webkit-animation-duration: 1.5s;
  animation-duration: 1.5s;
  -webkit-animation-iteration-count: infinite;
  animation-iteration-count: infinite;
  -webkit-animation-timing-function: ease;
  animation-timing-function: ease;
}
.loader .side:nth-child(1),
.loader .side:nth-child(5) {
  -webkit-transform: rotate(0deg);
  transform: rotate(0deg);
  -webkit-animation-name: rotate0;
  animation-name: rotate0;
}
.loader .side:nth-child(3),
.loader .side:nth-child(7) {
  -webkit-transform: rotate(90deg);
  transform: rotate(90deg);
  -webkit-animation-name: rotate90;
  animation-name: rotate90;
}
.loader .side:nth-child(2),
.loader .side:nth-child(6) {
  -webkit-transform: rotate(45deg);
  transform: rotate(45deg);
  -webkit-animation-name: rotate45;
  animation-name: rotate45;
}
.loader .side:nth-child(4),
.loader .side:nth-child(8) {
  -webkit-transform: rotate(135deg);
  transform: rotate(135deg);
  -webkit-animation-name: rotate135;
  animation-name: rotate135;
}
.loader .side:nth-child(1) {
  top: 24.14213562373095px;
  left: 48.2842712474619px;
  margin-left: -3px;
  margin-top: -10px;
  -webkit-animation-delay: 0;
  animation-delay: 0;
}
.loader .side:nth-child(2) {
  top: 41.21320343109277px;
  left: 41.21320343109277px;
  margin-left: -3px;
  margin-top: -10px;
  -webkit-animation-delay: 0;
  animation-delay: 0;
}
.loader .side:nth-child(3) {
  top: 48.2842712474619px;
  left: 24.14213562373095px;
  margin-left: -3px;
  margin-top: -10px;
  -webkit-animation-delay: 0;
  animation-delay: 0;
}
.loader .side:nth-child(4) {
  top: 41.21320343109277px;
  left: 7.07106781636913px;
  margin-left: -3px;
  margin-top: -10px;
  -webkit-animation-delay: 0;
  animation-delay: 0;
}
.loader .side:nth-child(5) {
  top: 24.14213562373095px;
  left: 0px;
  margin-left: -3px;
  margin-top: -10px;
  -webkit-animation-delay: 0;
  animation-delay: 0;
}
.loader .side:nth-child(6) {
  top: 7.07106781636913px;
  left: 7.07106781636913px;
  margin-left: -3px;
  margin-top: -10px;
  -webkit-animation-delay: 0;
  animation-delay: 0;
}
.loader .side:nth-child(7) {
  top: 0px;
  left: 24.14213562373095px;
  margin-left: -3px;
  margin-top: -10px;
  -webkit-animation-delay: 0;
  animation-delay: 0;
}
.loader .side:nth-child(8) {
  top: 7.07106781636913px;
  left: 41.21320343109277px;
  margin-left: -3px;
  margin-top: -10px;
  -webkit-animation-delay: 0;
  animation-delay: 0;
}
@-webkit-keyframes rotate0 {
  0% {
    -webkit-transform: rotate(0deg);
    transform: rotate(0deg);
  }
  60% {
    -webkit-transform: rotate(180deg);
    transform: rotate(180deg);
  }
  100% {
    -webkit-transform: rotate(180deg);
    transform: rotate(180deg);
  }
}
@keyframes rotate0 {
  0% {
    -webkit-transform: rotate(0deg);
    transform: rotate(0deg);
  }
  60% {
    -webkit-transform: rotate(180deg);
    transform: rotate(180deg);
  }
  100% {
    -webkit-transform: rotate(180deg);
    transform: rotate(180deg);
  }
}
@-webkit-keyframes rotate90 {
  0% {
    -webkit-transform: rotate(90deg);
    transform: rotate(90deg);
  }
  60% {
    -webkit-transform: rotate(270deg);
    transform: rotate(270deg);
  }
  100% {
    -webkit-transform: rotate(270deg);
    transform: rotate(270deg);
  }
}
@keyframes rotate90 {
  0% {
    -webkit-transform: rotate(90deg);
    transform: rotate(90deg);
  }
  60% {
    -webkit-transform: rotate(270deg);
    transform: rotate(270deg);
  }
  100% {
    -webkit-transform: rotate(270deg);
    transform: rotate(270deg);
  }
}
@-webkit-keyframes rotate45 {
  0% {
    -webkit-transform: rotate(45deg);
    transform: rotate(45deg);
  }
  60% {
    -webkit-transform: rotate(225deg);
    transform: rotate(225deg);
  }
  100% {
    -webkit-transform: rotate(225deg);
    transform: rotate(225deg);
  }
}
@keyframes rotate45 {
  0% {
    -webkit-transform: rotate(45deg);
    transform: rotate(45deg);
  }
  60% {
    -webkit-transform: rotate(225deg);
    transform: rotate(225deg);
  }
  100% {
    -webkit-transform: rotate(225deg);
    transform: rotate(225deg);
  }
}
@-webkit-keyframes rotate135 {
  0% {
    -webkit-transform: rotate(135deg);
    transform: rotate(135deg);
  }
  60% {
    -webkit-transform: rotate(315deg);
    transform: rotate(315deg);
  }
  100% {
    -webkit-transform: rotate(315deg);
    transform: rotate(315deg);
  }
}
@keyframes rotate135 {
  0% {
    -webkit-transform: rotate(135deg);
    transform: rotate(135deg);
  }
  60% {
    -webkit-transform: rotate(315deg);
    transform: rotate(315deg);
  }
  100% {
    -webkit-transform: rotate(315deg);
    transform: rotate(315deg);
  }
}
@-webkit-keyframes loader {
  0% {
    -webkit-transform: rotate(0deg);
    transform: rotate(0deg);
  }
  100% {
    -webkit-transform: rotate(360deg);
    transform: rotate(360deg);
  }
}
@keyframes loader {
  0% {
    -webkit-transform: rotate(0deg);
    transform: rotate(0deg);
  }
  100% {
    -webkit-transform: rotate(360deg);
    transform: rotate(360deg);
  }
}
```

# JS
```js
// src/app/storymaps/core/Core.js (715) <- añadimos para que oculte el core
$("#loadingOverlay, #loadingIndicator, #loadingMessage, .loader").fadeOut();

// src/app/storymaps/maptour/ui/desktop/Carousel.js (362) //Helper.addCSSRule(".carouselScroller.no-touch .carousel-item-div:not(.selected):hover { background-color: " + hoverColor + " !important; }");

// src/index.html (127)
loadCSS("lib/chardinjs/css/chardinjs.css");

// src/index.html (1575)
loadJS('lib/chardinjs/js/chardinjs.min.js');

// src/app/main-app.js (16)
"dojo/topic",

// src/app/main-app.js (21)
LoadingIndicator,
topic

// src/app/main-app.js (41)
/* CUSTOM SCRIPTS */

// The application is ready
topic.subscribe("maptour-ready", function(){
  console.log("maptour-ready");
  $('body').chardinJs('start');
});

// Before loading the new point picture/video
topic.subscribe("maptour-point-change-before", function(oldIndex, newIndex){
  console.log("maptour-point-change-before", oldIndex, newIndex);
});

// After the new point is displayed
topic.subscribe("maptour-point-change-after", function(newIndex){
  console.log("maptour-point-change-after", newIndex, app.data.getCurrentGraphic());
});

```

> Al final añadir los atributos HTML en el fichero `src/index.html`.

```html
<!-- 597 -->
<h2 class="subtitle" tabindex="0" data-intro="Leyenda" data-position="bottom" ></h2>

<!-- 648 -->
<div id="cfader" data-intro="Puede utilizar este menú de navegación" data-position="left" ></div>

<!-- 713 -->
<div id="footer" data-intro="Acercando el ratón aparecerá un menú de navegación oculto" data-position="top" style="bottom: -135px">
```
