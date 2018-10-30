const config = require('config')
const Koop = require('koop');

const koop = new Koop(config);
const FeatureServer = require('koop-output-geoservices')
const Provider = require('koop-provider-mongodb')

koop.register(Provider);
koop.register(FeatureServer);

// In Local Development, be aware that port has to be greater than 1024 ( Unpriviledge port)
koop.server.listen(8080);
