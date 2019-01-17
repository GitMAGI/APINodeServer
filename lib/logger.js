const moment = require('moment');
const path = require('path');
const Sequelize = require('sequelize');
const fs = require('fs');
const os = require("os");
const config = require('../config/config');

module.exports = {
    debug: function(execution_id, msg, payload) { log(msg, payload, 0, arguments.callee.caller.name, execution_id); },
    info: function(execution_id, msg, payload) { log(msg, payload, 1, arguments.callee.caller.name, execution_id); },
    warning: function(execution_id, msg, payload) { log(msg, payload, 2, arguments.callee.caller.name, execution_id); },
    error: function(execution_id, msg, payload) { log(msg, payload, 3, arguments.callee.caller.name, execution_id); },
    fatal: function(execution_id, msg, payload) { log(msg, payload, 4, arguments.callee.caller.name, execution_id); }
}

function log(msg, payload, severity, scope, execution_id){
    try{
        logConsole(msg, payload, severity, scope, execution_id);
    }
    catch(err){
        console.log("Console Logger failure!");
        console.log(err);
    }

    if(config.journal_db_connection){
        try{
            logDB(msg, payload, severity, scope, execution_id);
        }
        catch(err){            
            console.log("DB Logger failure!")
            console.log(err);
        }
    }
    
    if(config.journal_file_path && config.journal_file_prefixname){
        try{
            logFS(msg, payload, severity, scope, execution_id);
        }
        catch(err){
            console.log("File Logger failure!")
            console.log(err);
        }
    }
}

function logConsole(msg, payload, severity, scope, execution_id){  
    var userName = process.env['USERPROFILE'].split(path.sep)[2];
    var loginId = userName;
    
    let _now = moment().format('YYYY-MM-DD hh:mm:ss.SSSS');

    let _severity_string = getSeverity(severity);
    
    let line = _now + " >>> " + loginId + " | " + scope + " | " + _severity_string + " | " + execution_id + " | " + msg;
    if(payload){
        line += " | " + payload.toString();
    }

    console.log(line);
}

function logDB(msg, payload, severity, scope, execution_id){    
    var userName = process.env['USERPROFILE'].split(path.sep)[2];
    var loginId = userName;

    let _now = moment().format('YYYY-MM-DD hh:mm:ss.SSSS');

    const sequelize = new Sequelize(config.journal_db_connection);
    sequelize.query('INSERT INTO [Trace] (Scope, ServerName, User, Severity, OperationId, Timestamp, Message, Data) VALUES (:scope, :serverName, :user, :severity, :operationId, :timestamp, :message, :data)',
    {
        replacements: { 
            scope: scope, 
            serverName: config.app_hostname, 
            user: loginId, 
            severity: severity, 
            operationId: execution_id, 
            timestamp: _now, 
            message: msg, 
            data: payload ? payload : null
        }, 
        type: sequelize.QueryTypes.INSERT 
    });
}

function logFS(msg, payload, severity, scope, execution_id){
    var userName = process.env['USERPROFILE'].split(path.sep)[2];
    var loginId = userName;

    let _now = moment().format('YYYY-MM-DD hh:mm:ss.SSSS');

    let _severity_string = getSeverity(severity);
    
    let line = _now + " >>> " + loginId + " | " + scope + " | " + _severity_string + " | " + execution_id + " | " + msg;
    if(payload){
        line += " | " + payload.toString();
    }

    if (!fs.existsSync(config.journal_file_path)){
        fs.mkdirSync(config.journal_file_path);
    }

    let pathfilename = config.journal_file_path + config.journal_file_prefixname + "_" + moment().format('YYYY_MM_DD') + ".txt";
    fs.appendFile(pathfilename, line + os.EOL, function (err) {
        if (err) throw err;
    });

}

function getSeverity(severity){
    let _severity_string = 'UNDEFINED';
    switch(severity){
        case 0:
            _severity_string = 'DEBUG';
            break;
        case 1:
            _severity_string = 'INFO';
            break;
        case 2:
            _severity_string = 'WARNING';
            break;
        case 3:
            _severity_string = 'ERROR';
            break;
        case 4:
            _severity_string = 'FATAL';
            break;
    }
    return _severity_string;
}