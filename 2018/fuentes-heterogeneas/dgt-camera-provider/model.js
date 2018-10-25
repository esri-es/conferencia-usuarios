const request = require('request').defaults({gzip: true, json: true})
const http = require('http')
const config = require('config')

function Model (koop) {}

Model.prototype.getData = function (req, callback) {
    const tunnel = 'https://little-otter-73.localtunnel.me';

    request(`${tunnel}/data.json`, (err, res, body) => {
        if (err) return callback(err)

        const geojson = translate(body)

        callback(null, geojson)
    })

}

function translate (input) {
    var cameras = input["@graph"]["d2LogicalModel"]["payloadPublication"]["genericPublicationExtension"]["cctvSiteTablePublication"]["cctvCameraList"]["cctvCameraMetadataRecord"];

    var geojson = {
        "type": "FeatureCollection",
        "features": []
    };

    for(var cam in cameras) {
        if (cameras.hasOwnProperty(cam)) {
            geojson.features.push(buildFeature(cameras[cam]));
        }
    }

    return {
        type: 'FeatureCollection',
        features: geojson.features,
        metadata: {
            idField: 'cctvCameraSerialNumber',
            geometryType: 'Point'
        }
    }
}

function buildFeature(obj){
    var f = {
        "type": "Feature",
        "geometry": {
            "type": "Point",
        }
    };

    f.id=obj.cctvCameraLocation.predefinedLocationReference["@id"]
    f.geometry.coordinates=[
        parseFloat(obj.cctvCameraLocation.locationForDisplay.longitude),
        parseFloat(obj.cctvCameraLocation.locationForDisplay.latitude)

    ];
    f.properties={
        "uid": obj.cctvCameraLocation.predefinedLocationReference["@id"].split("#")[1],
        "version": obj.version,
        "cctvCameraIdentification": obj.cctvCameraIdentification,
        "cctvCameraSerialNumber": parseInt(obj.cctvCameraSerialNumber),
        "cctvCameraRecordVersionTime": obj.cctvCameraRecordVersionTime,
        "cctvCameraType": obj.cctvCameraType,
        "cctvStillImageServiceLevel": obj.cctvStillImageService.cctvStillImageServiceLevel,
        "cctvStillImageFormat": obj.cctvStillImageService.cctvStillImageFormat,
        "stillImageUrl": obj.cctvStillImageService.stillImageUrl.urlLinkAddress
    }
    return f;
}

module.exports = Model

/* Example provider API:
- needs to be converted to GeoJSON Feature Collection
{
"resultSet": {
"queryTime": 1488465776220,
"vehicle": [
{
"tripID": "7144393",
"signMessage": "Red Line to Beaverton",
"expires": 1488466246000,
"serviceDate": 1488441600000,
"time": 1488465767051,
"latitude": 45.5873117,
"longitude": -122.5927705,
}
]
}

Converted to GeoJSON:

{
"type": "FeatureCollection",
"features": [
"type": "Feature",
"properties": {
"tripID": "7144393",
"signMessage": "Red Line to Beaverton",
"expires": "2017-03-02T14:50:46.000Z",
"serviceDate": "2017-03-02T08:00:00.000Z",
"time": "2017-03-02T14:42:47.051Z",
},
"geometry": {
"type": "Point",
"coordinates": [-122.5927705, 45.5873117]
}
]
}
*/
