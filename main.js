const http = require('http');
const https = require('https');
const fs = require('fs');
const uuidv1 = require('uuid/v1');
const config = require('./config/config');
const logger = require('./lib/logger');

const app_hostname = config.app_hostname;
const app_http_port = config.app_http_port;
const app_https_port = config.app_https_port;
const https_options = {
    key: fs.readFileSync(config.https_options_key_pathfilename),
    cert: fs.readFileSync(config.https_options_cert_pathfilename)
};

const app = require('./lib/core');

http.createServer(app).listen(app_http_port, app_hostname, null, serverBootHandler);
https.createServer(https_options, app).listen(app_https_port, app_hostname, null, serverBootHandler);

function serverBootHandler(){
    let _port = this.address().port;
    let _address = this.address().address;
    logger.info(uuidv1().toLowerCase(), "Server is listening to " + _address + ":" + _port);
}