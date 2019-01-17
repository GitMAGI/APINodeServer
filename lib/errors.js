class UnauthorizedError extends Error {
    constructor(message) {
        super(message);
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
    }
}

class ForbiddenError extends Error {
    constructor(message) {
        super(message);
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
    }
}

class NotFoundError extends Error{
    constructor(message, path, verb) {
        super(message);
        this.name = this.constructor.name;
        this.path = path;
        this.verb = verb;
        Error.captureStackTrace(this, this.constructor);
    }
}

class BadRequestError extends Error {
    constructor(message, fields) {
        let _msg = message;
        if(fields){
            _msg += ": ";
            if(fields instanceof Array){            
                for(var i = 0; i < fields.length; i++){
                    if(i>0)
                        _msg += ", " + fields[i].toString(); 
                    else
                        _msg += fields[i].toString(); 
                }
            }
            else{
                _msg += fields.toString();
            }
        }
        super(_msg);
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);      
    }
}

class CustomError extends Error {
    constructor(message, code = 500, contentType = 'plain/text', data = null, visible = false) {
        super(message);
        this.name = this.constructor.name;
        this.visible = visible;
        this.code = code;
        this.contentType = contentType;
        this.data = data;
        Error.captureStackTrace(this, this.constructor);
    }
}

module.exports = {
    UnauthorizedError,
    ForbiddenError,  
    BadRequestError,
    NotFoundError,
    CustomError
};