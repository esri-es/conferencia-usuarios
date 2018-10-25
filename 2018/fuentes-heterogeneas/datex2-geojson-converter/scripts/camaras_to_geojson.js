var output = require("../data/json/cameras.json");

var cameras = output["@graph"]["d2LogicalModel"]["payloadPublication"]["genericPublicationExtension"]["cctvSiteTablePublication"]["cctvCameraList"]["cctvCameraMetadataRecord"];

var geojson = {
  "type": "FeatureCollection",
  "features": []
};

for(var cam in cameras) {
  if (cameras.hasOwnProperty(cam)) {
    geojson.features.push(buildFeature(cameras[cam]));
  }
}

var fs = require('fs');
fs.writeFile("./data/geojson/cameras.geojson", JSON.stringify(geojson,null,2), function(err) {
    if(err) {
        return console.log(err);
    }

    console.log("The file was saved!");
});

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
    "cctvCameraSerialNumber": obj.cctvCameraSerialNumber,
    "cctvCameraRecordVersionTime": obj.cctvCameraRecordVersionTime,
    "cctvCameraType": obj.cctvCameraType,
    "cctvStillImageServiceLevel": obj.cctvStillImageService.cctvStillImageServiceLevel,
    "cctvStillImageFormat": obj.cctvStillImageService.cctvStillImageFormat,
    "stillImageUrl": obj.cctvStillImageService.stillImageUrl.urlLinkAddress
  }
  return f;
}
