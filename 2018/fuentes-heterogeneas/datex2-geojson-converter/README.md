# datex2-geojson-converter

Proof of concepts to convert Datex2 XML from DGT to GeoJSON

## Requirements

* Git
* NodeJS
* Datex2-linker

## Instructions

First clone this repo:

`$ git clone git@github.com:esri-es/datex2-geojson-converter.git`

Now clone [datex2-linker](https://github.com/osoc16/datex2-linker):

`$ git clone git@github.com:osoc16/datex2-linker && cd datex2-linker`

Install datex2 linked:

`$ npm install -g datex2-linker`

### Convert DGT cameras from XML to GeoJSON

Here you will a [Datex2 listing from DGT](http://infocar.dgt.es/datex2/dgt/).

In this sample we will convert [cameras](http://infocar.dgt.es/datex2/dgt/CCTVSiteTablePublication/all/content.xml) from XML to GeoJSON.

First run datex2-linker consuming the service:

`$ datex2-linker --source "http://infocar.dgt.es/datex2/dgt/CCTVSiteTablePublication/all/content.xml" --base "http://localhost:8000/" `

Now open de service `http://localhost:8000/data.json` and save the JSON output in `datex2-geojson-converter/data/json` as `cameras.json` (you can overwrite the existing file).

Now go to `datex2-geojson-converter` folder and run:

`$ node scripts/camaras_to_geojson.js`

This will update the file `datex2-geojson-converter/data/geojson/cameras.geojson`.

Feel free to test the output uploading it to your [developer's account](https://developers.arcgis.com/sign-up/) [content folder in www.arcgis.com](https://www.arcgis.com/home/content.html).

## Notes

This proof of concept is a batch ETL process, but in order to convert this process into the fly you can use [Koop](http://koopjs.github.io/) and build a [provider](https://github.com/koopjs?utf8=%E2%9C%93&q=provider&type=&language=) for each datex2 service.

More resources about [Koop](https://esri-es.github.io/awesome-arcgis/arcgis/developers/profiles/devops/technologies/koop/)
