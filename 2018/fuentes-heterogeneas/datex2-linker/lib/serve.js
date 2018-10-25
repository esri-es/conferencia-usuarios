'use strict';
const http = require('http');
const url = require('url');
const path = require('path');
const dispatcher = require('httpdispatcher');
const pug = require('pug');
const parse = require('datex2-linker-api');

/**
 * serve up a json-ld feed and make its id's accessible
 * @param  {string}  source  The datex2 source url
 * @param  {Url}     uri     The uri at which to serve
 * @param  {string}  title   The title of the datafeed
 * @return {Promise}         Will return resolved when running
 */
function serve(source, uri, title, silent) {
  // 1. set up a server at the current `port`
  // 2. return the json at `/data.json` and `/data.json-ld` with correct MIME-type
  // 4. make `/` available

  return new Promise((resolve, reject) => {
    // handle a request
    function handleRequest(request, response) {
      try {
        // log the request on console
        if (!silent) {
          console.log(request.url);
        }
        // Dispatch
        dispatcher.dispatch(request, response);
      } catch (err) {
        console.error(err);
      }
    }

    /**
     * Return linked data from a datex2 url
     * @see                         https://github.com/osoc16/datex2-linker-api
     * @param  {object} req         The request object
     * @param  {object} res         The request result given back
     * @param  {string} contentType A valid MIME content type to serve as
     */
    function returnLinked(req, res, contentType) {
      res.writeHead(200, {
        'Content-Type': contentType
      });
      // href is available at the jsonld
      parse(source, url.format(uri) + 'data.jsonld').then(result => {
        res.end(JSON.stringify(result));
      }).catch(err => {
        reject(err);
      });
    }

    // resolve requests to the json via `/data.jsonld` and `/data.json`
    dispatcher.onGet('/data.json', (req, res) => {
      returnLinked(req, res, 'application/json');
    });
    dispatcher.onGet('/data.jsonld', (req, res) => {
      returnLinked(req, res, 'application/ld+json');
    });

    // serve the index
    dispatcher.onGet('/', (req, res) => {
      const options = {};
      const data = {
        title,
        source
      };
      res.end(pug.renderFile(path.join(__dirname, '/../lib/index.pug'), {
        options,
        data
      }));
    });

    // create a server
    const server = http.createServer(handleRequest);

    // start the server
    server.listen(uri.port, () => {
      resolve(`Server listening on: ${url.format(uri)}`);
    });

    server.on('error', err => {
      switch (err.code) {
        case 'EACCES':
          reject('You don\'t have enough permissions to run on this port. Try running this with sudo.');
          break;
        case 'EADDRINUSE':
          reject('This address (or port) is already in use. Try changing the port.');
          break;
        default:
          reject('There was an error with code', err.code, '\nand message', err.message);
          break;
      }
    });
  });
}

module.exports = serve;
