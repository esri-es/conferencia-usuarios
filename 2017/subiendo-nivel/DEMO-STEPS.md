

# Demo generator-arcgis-js-app

Repo: [https://github.com/odoe/generator-arcgis-js-app](generator-arcgis-js-app)

ArcGIS API for JS Yeoman generator demo:

Beneficios: livereload, build, es6/es2015, saas, incluye tests unitarios y e2e

---

Paso 1) Invocamos al generador

```mkdir demo-scaffold-4.x && cd demo-scaffold-4.x && yo arcgis-js-app

? Name of application demo-scaffold-3.x
? Description of application My ArcGIS JS App
? Which version of ArcGIS JS API? 3.x
? Which CSS preprocessor? sass
```

> Nota: puede tardar unos minutos (~4min)
---


Ejecutamos el modo desarrollador

`grunt dev && echo "Open: http://localhost:8282/dist/"`

---

Generamos el built

`grunt build`

> Nota: tarda

Problema -> https://github.com/odoe/generator-arcgis-js-app/issues/17
