// Tool for Hash Generation
// https://hash.online-convert.com/sha256-generator

// Tool for UUID Generation
// https://www.uuidgenerator.net/

// Tool for JWT Verification
// https://jwt.io/

const config = require('../config/config');
const crypto = require('crypto');
const moment = require('moment');
const Sequelize = require('sequelize');
const { UnauthorizedError, ForbiddenError, BadRequestError } = require('../lib/errors');

module.exports = {    
    authenticate: authentication,
}

async function authentication(body){
    let username = body.username;
    let password = body.password;

    // Request Validation
    let errs = [];
    if(!username)
        errs.push("username");
    if(!password)
        errs.push("password");
    if(errs.length > 0)
        throw new BadRequestError('Missing mandatory fields', errs);

    const user = await getUserByUsername(username);
    if(!user)
        throw new UnauthorizedError("Can't access your account");

    let hashAlg = user.PasswordHASHAlgorithm;
    let hashPassDB = user.PasswordHASH.toString().trim();    
    let hashPass = crypto.createHash(hashAlg).update(password).digest('base64').toString();

    if(hashPassDB === hashPass){
        let _now = moment();
        if(moment(user.ExpirationDate).isBefore(_now)){
            throw new UnauthorizedError("Account Expired");
        }

        if(moment(user.PasswordExpirationDate).isBefore(_now)){
            throw new UnauthorizedError("Password Expired");
        }

        if(moment(user.UnlockingDate).isAfter(_now)){
            throw new UnauthorizedError("Account Locked. Will be unlocked at " + user.UnlockingDate);
        }

        if(user.Disabled)
            throw new UnauthorizedError("Account Disabled");
    }
    else{
        throw new UnauthorizedError("Can't access your account"); 
    }

    const groupnames = await getGroupsByUsername(username);

    // Retrieve User Info
    return {
        id: user.UserId,
        username: user.Username,
        groups: groupnames ? groupnames : []
    };
}

function getUserByUsername(username){
    const sequelize = new Sequelize(config.account_db_connection);

    return sequelize.query(
        "SELECT * FROM [Account] WHERE [username] = :username AND [Deleted] = 0", 
        {
            replacements: {
                username: username
            },
            type: sequelize.QueryTypes.SELECT
        }
    ).then(results => {
        var result = null;
        if(results != null && results.length > 0)
            result = results[0];
        
        return result;
    });
}

function getGroupsByUsername(username){
    const sequelize = new Sequelize(config.account_db_connection);

    return sequelize.query(
        "SELECT G.[Groupname] FROM [Account] AS A INNER JOIN [GroupMember] AS GM ON GM.[UserId] = A.[UserId] INNER JOIN [Group] AS G ON G.[GroupId] = GM.[GroupId] WHERE A.[username] = :username", 
        {
            replacements: {
                username: username
            },
            type: sequelize.QueryTypes.SELECT
        }
    ).then(results => {
        if(results && results.length > 0){
            let groups = [];
            for(let i = 0; i < results.length; i++){
                groups.push(results[i].GroupName);
            }
            return groups;
        } 
        else{
            return null;
        }

        return results ? results : [];
    });
}