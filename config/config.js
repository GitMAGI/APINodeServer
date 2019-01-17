const config = {};

config.app_hostname = "WIN10-DEV";
config.app_http_port =  8080;
config.app_https_port = 443;
config.https_options_key_pathfilename = "/Temp/APINodeServer.local/certificates/key-20190111-162019.pem";
config.https_options_cert_pathfilename = "/Temp/APINodeServer.local/certificates/cert-20190111-162019.crt";

config.app_authentication_path = "/v1/auth";

config.jwt_secret = "5QApqHFhIxT1Tb5hfaFp7G6XyNDrXFfR";
config.jwt_mins_validity = 100;

config.journal_file_prefixname = 'journal';
config.journal_file_path = '/Temp/APINodeServer.local/logs/';
config.journal_db_connection = {
    dialect: 'sqlite',
    storage: '/Temp/APINodeServer.local/assets/ServerJournal.db3',
    operatorsAliases: false,
    logging: false,
    define: {
        timestamps: false
    }
};

config.account_db_connection = {
    dialect: 'sqlite',
    storage: '/Temp/APINodeServer.local/assets/AccountRegistry.db3',
    operatorsAliases: false,
    logging: false,
    define: {
        timestamps: false
    }
};

config.acl_json_path_filename = "/Temp/APINodeServer.local/assets/ACL.json";

module.exports = config;