module.exports = {
    home_get: home_get_handler,    
    user_post: user_post_handler,  
}

function home_get_handler(request, response){
    response.status(200).send('Ok');
}

function user_post_handler(request, response){
    const { UnauthorizedError, ForbiddenError, BadRequestError, NotFoundError, CustomError } = require('../lib/errors');
    const mime = require('mime-types');
    let msg = 'Errore di test';
    let obj = {
        titolo: "Errore",
        corpo: "Test",
        numero: 34
    }
    throw new CustomError(msg, 345, mime.lookup('json'), obj, true);
}