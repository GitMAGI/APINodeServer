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

http.createServer(app).listen(app_http_port, app_hostname, null, serverBootHttp);
https.createServer(https_options, app).listen(app_https_port, app_hostname, null, serverBootHttps);

function serverBootHttp(){
    let _port = this.address().port;
    let _address = this.address().address;
    let _full_address = "http://" + _address + ":" + _port;
    let _full_hostname = "http://" + app_hostname + ":" + _port;    
    logger.info(uuidv1().toLowerCase(), "Server is listening at " + _full_address + " or " + _full_hostname);
}

function serverBootHttps(){
    let _port = this.address().port;
    let _address = this.address().address;
    let _full_address = "https://" + _address + ":" + _port;
    let _full_hostname = "https://" + app_hostname + ":" + _port;
    logger.info(uuidv1().toLowerCase(), "Server is listening at " + _full_address + " or " + _full_hostname);
}