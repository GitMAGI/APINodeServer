module.exports = {
    home_get: home_get_handler,    
    user_post: user_post_handler,  
    user_get: user_get_handler,
    test_post: test_post_handler,
    test_get: test_get_handler,
}

function home_get_handler(request, response){
    response.status(200);
    response.setHeader('Content-Type', 'plain/text');
    response.send('Ok');
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

    response.status(200);
    response.setHeader('Content-Type', 'plain/text');
    response.send('User Post');
}

function user_get_handler(request, response){
    response.status(200);
    response.setHeader('Content-Type', 'plain/text');
    response.send('User Get');
}

function test_post_handler(request, response){
    response.status(200);
    response.setHeader('Content-Type', 'plain/text');
    response.send('Tests Post');
}

function test_get_handler(request, response){
    response.status(200);
    response.setHeader('Content-Type', 'plain/text');
    response.send('Tests Get');
}