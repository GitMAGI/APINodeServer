const { UnauthorizedError, ForbiddenError, BadRequestError } = require('../lib/errors');
const fs = require('fs');
const config = require('../config/config');
const utilities = require('../lib/utilities');

module.exports = {
    authorize: authorization,
}

function authorization(user_id, user_name, user_groups, method, path){
    if(!user_groups || user_groups.length == 0)
        throw new ForbiddenError("You don't have rights to perform this operation");

    let acls = JSON.parse(fs.readFileSync(config.acl_json_path_filename, 'utf8'));

    if(!acls || acls.length == 0)
        throw new ForbiddenError("You don't have rights to perform this operation");

    let user_acls = [];
    for(let i = 0; i < user_groups.length ; i++){
        let user_group = user_groups[i];
        for(let j = 0; j < acls.length ; j++){
            let acl = acls[j];
            //if((acl.Subject.toLowerCase().trim() === user_group.toLowerCase().trim()) || (acl.Subject.toLowerCase().trim() ===  user_name.toLowerCase().trim()))
            if(acl && acl.Subject.toLowerCase().trim() === user_group.toLowerCase().trim())
                user_acls.push(acl);
        }
    }

    if(!user_acls || user_acls.length == 0)
        throw new ForbiddenError("You don't have rights to perform this operation");

    let forbidden = true;
    for(let i = 0; i < user_acls.length; i++){
        let user_acl = user_acls[i];
        let acl_methods = user_acl.Action;
        let acl_paths = user_acl.Object;

        if(!user_acl || !acl_methods || !acl_paths){
            continue;
        }

        if(
            (acl_methods === '*' || (utilities.findInArray(acl_methods, method, true))) &&
            (acl_paths === '*' || (utilities.findInArray(acl_paths, path, true)))
        )
        {
            forbidden = false;
            break;
        }
    }

    if(forbidden)
        throw new ForbiddenError("You don't have rights to perform this operation");
}