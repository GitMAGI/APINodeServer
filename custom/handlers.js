module.exports = {
    home_get: home_get_handler,    
}

function home_get_handler(request, response){
    response.status(200).send('Ok');
}