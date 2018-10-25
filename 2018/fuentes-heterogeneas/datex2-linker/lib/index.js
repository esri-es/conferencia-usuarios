#!/usr/bin/env node
'use strict';
const url = require('url');
const open = require('opener');
const yargs = require('yargs');
const serve = require('./serve');

const argv = yargs
  .usage('$0')
  .boolean('silent')
  .option('source', {
    alias: 's',
    describe: 'A valid datex2 feed'
  })
  .option('base', {
    alias: 'b',
    describe: 'baseuri for the created API'
  })
  .option('port', {
    alias: 'p',
    describe: 'port on which the API is served',
    default: 80
  })
  .option('title', {
    alias: 't',
    describe: 'the title of the datafeed',
    default: 'Datex2 Linked'
  })
  .demand('source', 'base')
  .describe('silent', 'runs without opening a browser and without output for every request')
  .help('help')
  .alias('h', 'help')
  .argv;

// FIXME: get port inside the baseuri
let uri = url.parse(argv.base);
uri.port = argv.port;
// this is a hack because somehow url.format doesn't apply new changes.
uri = url.parse(uri.protocol + '//' + uri.hostname + ':' + uri.port);

// serve that datafeed and create accessible URIs
serve(argv.source, uri, argv.title, argv.silent).then(res => {
  console.log(`The feed is now accessible on ${uri.href}\n${res}`);
  // open a browser to the index
  if (!argv.silent) {
    open(uri.href);
  }
}).catch(err => {
  console.error(`There was an error serving the provided datafeed:\n${err}`);
});
