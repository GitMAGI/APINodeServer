const uuidv1 = require('uuid/v1');
const moment = require('moment');
const jwt = require('jsonwebtoken');
const express = require('express'); 
const Sequelize = require('sequelize');
const { performance } = require('perf_hooks');
const compression = require('compression');     // Is this useful?
const bodyParser = require('body-parser');      // Is this useful? 
const mime = require('mime-types');             // Is this useful?
const logger = require('../lib/logger');
const utilities = require('../lib/utilities');
const config = require('../config/config');
const routes = require('../custom/routes');
const handlers = require('../custom/handlers');
const authentication = require('../custom/authentication');
const authorization = require('../custom/authorization');
const { UnauthorizedError, ForbiddenError, BadRequestError, NotFoundError, CustomError } = require('../lib/errors');

var app = express();
let _execution_id = null;
let _start_watch = null;

function before_middleware(request, response, next){
    _execution_id = uuidv1().toLowerCase();    
    _start_watch = performance.now();
    let request_info = retrieve_request_info(request);

    let _port = request_info.port;
    let _address = request_info.address;
    let _method = request_info.method;
    let _path = request_info.path;
    let _protocol = request_info.protocol;
        
    logger.info(_execution_id, "Incoming " + _protocol + " Request from Remote Socket " + _address + ":" + _port + ". '" + _method + "' for '" + _path + "'");
        
    try { trace_request_db(request); } catch(err){ logger.warning(_execution_id, 'Error during Request Tracing', err.stack); }

    // Add EventHanlders for Response Tracing
    const original_write = response.write;
    const original_end = response.end;
    var chunks = [];
    response.write = function(chunk) {
        chunks.push(chunk);
        original_write.apply(response, arguments);
    };
    response.end = function(chunk) {
        if (chunk)
            chunks.push(chunk);        

        let responseType = response.getHeader("Content-Type");
        let body_string = chunks && chunks.length > 0 ? Buffer.concat(chunks).toString('utf8') : null;
        let body = parse_json_from_string(body_string, responseType);

        try { trace_response_db(body, response); } catch(err){ logger.warning(_execution_id, 'Error during Response Tracing', err.stack); }

        original_end.apply(response, arguments);
    };
    
    next();
}

function finally_middleware(request, response, next){ 
    let _end_watch = performance.now();
    logger.info(_execution_id, "Completed in " + utilities.elapsedTime(_end_watch - _start_watch) + " (mm:ss.ms)");
    next();
}

async function execute_middleware(request, response, handler, next){    
    let request_info = retrieve_request_info(request);
 
    let _path = request_info.path;

    try {
        if(_path != config.app_authentication_path){
            // ACL
            await authorize(request);

            // EXECUTION
            await handler(request, response);
        }
    } 
    catch (err) {
        next(err);
    }
    finally{
        next();
    }
}

function error_middleware(error, request, response, next){
    logger.error(_execution_id, error.message, error.stack);

    if (error instanceof BadRequestError){
        response.status(400);
        response.setHeader('Content-Type', 'plain/text');
        response.send(error.message);
    } else 
    if( error instanceof UnauthorizedError){
        response.status(401);
        response.setHeader('Content-Type', 'plain/text');
        response.send(error.message);
    } else 
    if (error instanceof ForbiddenError){
        response.status(403);
        response.setHeader('Content-Type', 'plain/text');
        response.send(error.message);
    } else     
    if (error instanceof BadRequestError){
        response.status(400);
        response.setHeader('Content-Type', 'plain/text');
        response.send(error.message);
    } else 
    if (error instanceof NotFoundError){
        response.status(404);
        response.setHeader('Content-Type', 'plain/text');
        response.send(error.message);
    } else
    if(error instanceof CustomError){
        let _message = error.visible ? error.message : 'Service Unavailable';
        response.status(error.code);
        response.setHeader('Content-Type', error.contentType);
        if(error.contentType === mime.lookup('json')){
            if(error.visible)
                response.json(error.data);
            else
                response.json({});
        } 
        else
            response.send(_message);
    } else
    {
        response.status(500);
        response.setHeader('Content-Type', 'plain/text');
        response.send("Internal error");
    }

    next();
}

function error404_middleware(request, response, next){
    if(response && response.finished)
        next()
    else{
        try{
            var route, routes = [];
    
            app._router.stack.forEach(function(middleware){
                if(middleware.route){ // routes registered directly on the app
                    routes.push(middleware.route);
                } else if(middleware.name === 'router'){ // router middleware 
                    middleware.handle.stack.forEach(function(handler){
                        route = handler.route;
                        route && routes.push(route);
                    });
                }
            });
            
            let _current_method = request.method;
            let _current_path = request.route ? request.route.path : request.url;
    
            let notfound = true;
            for(let i=0; i<routes.length; i++){
                let r = routes[i];
                let _methods = r.methods;
                let _path = r.path;
    
                if(_methods[_current_method.toLowerCase()] && _path.toLowerCase() === _current_path.toLowerCase()){
                    notfound = false;
                    break;
                }
            }
    
            if (notfound){
                return next (new NotFoundError('Cannot ' + request.method + ' on ' + request.url, request.url, request.method));  
            }
            
            next();
        }
        catch(err){
            logger.warning(_execution_id, "Bug! Failure during the 404 Error eveluation", err.stack);
            next()
        };
    }
}

async function authenticate(request){
    // VALIDATE AUTH Request
    if(!request.body)
        throw new BadRequestError('Request Body is missing');                

    // AUTHENTICATION (Credentials) AND GET USER INFO
    let data = await authentication.authenticate(request.body);
    
    // GENERATE JWT
    let jwt_token_expiration = moment().add(config.jwt_mins_validity, 'm').format('YYYY-MM-DD hh:mm:ss.SSSS');
    let jwt_token = jwt.sign(
        {
            data: {
                user: data
            }
        }, 
        config.jwt_secret, 
        { 
            expiresIn: config.jwt_mins_validity * 60
        }
    );
    
    return {
        token: jwt_token,
        expiration: jwt_token_expiration
    };
}

async function authorize(request){
    let _auth_header = request.headers['x-access-token'] || request.headers['authorization']; // Express headers are auto converted to lowercase
    if(!_auth_header)
        throw new UnauthorizedError("Token is missing");
    let _jwt_token = _auth_header
    if (_auth_header.startsWith('Bearer ')) {
        // Remove Bearer from string
        _jwt_token = _auth_header.slice(7, _auth_header.length);
    }
	else
		throw new UnauthorizedError("A Bearer Token was expected");

    let _user_id = null;
    let _user_name = null;
    let _user_groups = [];

    let _method = request.method;
    let _path = request.route ? request.route.path : request.url;

    try{
        // AUTHENTICATION (JWT Validation)
        let _decoded = jwt.verify(_jwt_token, config.jwt_secret);
        let _user = _decoded.data.user;
        if(!_user){
            throw new UnauthorizedError("User object not found into data of the Jwt");
        }
        _user_id = _user.id;
        _user_name = _user.username;
        _user_groups = _user.groups;
    }
    catch(err){
        let msg = err.message;
        switch(err.name){
            case "TokenExpiredError":
                msg = "Token expired";
                break; 
            case "JsonWebTokenError":
                msg = "Invalid or Malformed Token";
                break;
            default:
                if(msg)
                    msg = msg.charAt(0).toUpperCase() + msg.slice(1);
        }
        throw new UnauthorizedError(msg);
    }

    try{
        // AUTHORIZATION (Based on groups, operation and resources)        
        await authorization.authorize(_user_id, _user_name, _user_groups, _method, _path);
    }
    catch(err){
        throw new ForbiddenError(err.message);
    }    
}

async function authentication_handler(request, response, next){
    // AUTHENTICATE AND JWT GENERATION
    const jwt = await authenticate(request);
    response.status(200);
    response.setHeader('Content-Type', 'application/json');
    response.send(jwt);
    next();
}

function add_app_handler(app, method, route, handler){
    if(!method)
        throw new Error('Method must be not empty');
    if(!route)
        throw new Error('Route must be not empty');           
    if(!handler)
        throw new Error('Handler must be not empty');
        
    let _method = method.toLowerCase();
    switch(_method){
        case "checkout":
            app.checkout(route, function(request, response, next){ execute_middleware(request, response, handler, next); });
            break;
        case "copy":
            app.copy(route, function(request, response, next){ execute_middleware(request, response, handler, next); });
            break;
        case "delete":
            app.delete(route, function(request, response, next){ execute_middleware(request, response, handler, next); });
            break;
        case "get":
            app.get(route, function(request, response, next){ execute_middleware(request, response, handler, next); });
            break;
        case "head":
            app.head(route, function(request, response, next){ execute_middleware(request, response, handler, next); });
            break;
        case "lock":
            app.lock(route, function(request, response, next){ execute_middleware(request, response, handler, next); });
            break;
        case "merge":
            app.merge(route, function(request, response, next){ execute_middleware(request, response, handler, next); });
            break;
        case "move":
            app.move(route, function(request, response, next){ execute_middleware(request, response, handler, next); });
            break;
        case "notify":
            app.notify(route, function(request, response, next){ execute_middleware(request, response, handler, next); });
            break;
        case "options":
            app.options(route, function(request, response, next){ execute_middleware(request, response, handler, next); });
            break;
        case "patch":
            app.patch(route, function(request, response, next){ execute_middleware(request, response, handler, next); });
            break;
        case "post":
            app.post(route, function(request, response, next){ execute_middleware(request, response, handler, next); });
            break;
        case "purge":
            app.purge(route, function(request, response, next){ execute_middleware(request, response, handler, next); });
            break;
        case "put":
            app.put(route, function(request, response, next){ execute_middleware(request, response, handler, next); });
            break;
        case "report":
            app.report(route, function(request, response, next){ execute_middleware(request, response, handler, next); });
            break;
        case "search":
            app.search(route, function(request, response, next){ execute_middleware(request, response, handler, next); });
            break;
        case "subscribe":
            app.subscribe(route, function(request, response, next){ execute_middleware(request, response, handler, next); });
            break;
        case "trace":
            app.trace(route, function(request, response, next){ execute_middleware(request, response, handler, next); });
            break;
        case "unlock":
            app.unlock(route, function(request, response, next){ execute_middleware(request, response, handler, next); });
            break;
        case "unsubscribe":
            app.unsubscribe(route, function(request, response, next){ execute_middleware(request, response, handler, next); });
            break;
        default:
            throw new Error(_method + " is not recognized as valid HTTP Method");
    }
    return app;
}

function retrieve_request_info(request){
    let _port = request.connection.remotePort;
    let _address = request.connection.remoteAddress;
    let _behindProxyAddresses = null
    if(request.get('x-forwarded-for')){
       try{
            _behindProxyAddresses = request.get('x-forwarded-for').split(',').map(function(item) { return item.trim(); });
       }
       catch(err){}
    }

    let _behindProxyPorts = null
    if(request.get('x-forwarded-port')){
        try{
            _behindProxyPorts = request.get('x-forwarded-port').split(',').map(function(item) { return item.trim(); });
        }
        catch(err){}
     }
    
    if(_behindProxyAddresses){
        _behindProxyAddresses.push(_address);
        _address = _behindProxyAddresses[0];
        _behindProxyAddresses.splice(0, 1)
    }

    if(_behindProxyPorts){
        _behindProxyPorts.push(_port);
        _port = _behindProxyPorts[0];
        _behindProxyPorts.splice(0, 1)
    }

    let _method = request.method;
    let _path = request.url;
    let _protocol = request.protocol ? request.protocol.toUpperCase() : null;

    let _localPort = request.connection.localPort
    let _localAddress = request.connection.localAddress;

    return {
        address: _address,
        port: _port,
        behindProxyAddresses: _behindProxyAddresses,
        behindProxyPorts: _behindProxyPorts,
        method: _method,
        path: _path,
        protocol: _protocol,
        localAddress: _localAddress,
        localPort: _localPort
    };
}

function retrieve_response_info(response){
    let _port = response.connection.remotePort;
    let _address = response.connection.remoteAddress;
    let _localPort = response.connection.localPort
    let _localAddress = response.connection.localAddress;
    let _status = response.statusCode;

    return {
        address: _address,
        port: _port,
        localAddress: _localAddress,
        localPort: _localPort,
        status: _status
    };
}

function trace_request_db(http_package){
    if(!http_package)
        return;

    let _package_info = retrieve_request_info(http_package);

    const sequelize = new Sequelize(config.journal_db_connection);
    sequelize.query('INSERT INTO [Request] ([OperationId], [Timestamp], [RemoteIp], [RemotePort], [RemoteProxyIp], [RemoteProxyPort], [LocalIp], [LocalPort], [Protocol], [Verb], [Path], [Headers], [Body]) VALUES (:operationid, :timestamp, :remoteip, :remoteport, :remoteproxyip, :remoteproxyport, :localip, :localport, :protocol, :verb, :path, :headers, :body)',
    {
        replacements: { 
            operationid: _execution_id, 
            timestamp: moment().format('YYYY-MM-DD hh:mm:ss.SSSS'), 
            remoteip: _package_info.address, 
            remoteport: _package_info.port, 
            remoteproxyip: _package_info.behindProxyAddresses ? JSON.stringify(_package_info.behindProxyAddresses) : null,
            remoteproxyport: _package_info.behindProxyPorts ? JSON.stringify(_package_info.behindProxyPorts) : null,
            localip: _package_info.localAddress, 
            localport: _package_info.localPort, 
            protocol: _package_info.protocol,
            verb: _package_info.method,
            path: _package_info.path,
            headers: http_package.headers ? JSON.stringify(http_package.headers) : null, 
            body: http_package.body ? JSON.stringify(http_package.body) : null
        }, 
        type: sequelize.QueryTypes.INSERT 
    }).catch(function(err){ logger.warning(_execution_id, 'Sequelize Error during Request DB Tracing', err); });
}

function trace_response_db(body, http_package){
    if(!http_package)
        return;

    let _package_info = retrieve_response_info(http_package);
    
    const sequelize = new Sequelize(config.journal_db_connection);
    sequelize.query('INSERT INTO [Response] ([OperationId], [Timestamp], [Status], [RemoteIp], [RemotePort], [LocalIp], [LocalPort], [Headers], [Body]) VALUES (:operationid, :timestamp, :status, :remoteip, :remoteport, :localip, :localport, :headers, :body)',
    {
        replacements: { 
            operationid: _execution_id, 
            timestamp: moment().format('YYYY-MM-DD hh:mm:ss.SSSS'), 
            status: _package_info.status,
            remoteip: _package_info.behindProxyAddress ? _package_info.behindProxyAddress : _package_info.address, 
            remoteport: _package_info.port, 
            localip: _package_info.localAddress, 
            localport: _package_info.localPort, 
            headers: http_package._headers ? JSON.stringify(http_package._headers) : null,  
            body: body ? JSON.stringify(body) : null
        }, 
        type: sequelize.QueryTypes.INSERT 
    }).catch(function(err){ logger.warning(_execution_id, 'Sequelize Error during Response DB Tracing', err); });
}

function parse_json_from_string(body_string, contentType){
    let body = null;

    if(!body_string || !contentType)
        return null;

    if(contentType && contentType.toLowerCase().indexOf('json') > -1){
        try { body = body_string ? JSON.parse(body_string) : null } catch(err) { logger.warning(_execution_id, 'Error during string to JSON parsing', err.stack); }            
    } else {
        body = body_string;
    }

    return body;
}

app.use(express.json());
app.use(bodyParser.urlencoded({extended: true}));  
app.use(bodyParser.json());
app.use(compression());

app.use(before_middleware);
app.post(config.app_authentication_path, authentication_handler);
if(routes && routes.length>0){
    for(let i = 0; i < routes.length; i++){
        let _route = routes[i];
        let _method = _route.method;
        let _path = _route.path;
        let _handler = handlers[_route.handler];

        app = add_app_handler(app, _method, _path, _handler);
    }    
}
app.use(error404_middleware);
app.use(error_middleware);
app.use(finally_middleware);

module.exports = app;