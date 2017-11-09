const fs = require('fs');
import {spawn} from 'child_process';
import mongoose, {Schema} from 'mongoose';
import {configuration} from './config';

require('dotenv').config();

let options = {
    useMongoClient: true,
    autoIndex: false, // Don't build indexes
    reconnectTries: 5, // Never stop trying to reconnect
    reconnectInterval: 500, // Reconnect every 500ms
    poolSize: 10, // Maintain up to 10 socket connections
    bufferMaxEntries: 0
};

let info = require('debug')('mongo-atlas-backup:info'),
    warn = require('debug')('mongo-atlas-backup:warn'),
    log = require('debug')('mongo-atlas-backup:log'),
    error = require('debug')('mongo-atlas-backup:error');

export default class MongoBackup {
    constructor(config = configuration) {
        return new Promise((resolve, reject) => {
            this.extendArguments(config.atlas_connection)
                .then((res) => {
                    this.atlasArgs = res;
                    info('atlasArgs set');
                    return this.extendArguments(config.restore, false);
                })
                .then((res) => {
                    this.restoreArgs = res;
                    info('restoreArgs set');
                    this.dump = () => this.execute(true);
                    this.restore = () => this.execute(false);
                    resolve(this);
                })
                .catch((err) => {
                    error(err);
                    reject(err);
                });
        });
    }

    checkDirectory(directory, callback) {
        fs.stat(directory, function (err, stats) {
            //Check if error defined and the error code is "not exists"
            if (err && err.errno === -2) {
                //Create the directory, call the callback.
                fs.mkdir(directory, callback);
                info('Good to go! Directory created!!');
            } else {
                //just in case there was a different error:
                info('Good to go! Directory exits!!');
                callback(err);
            }
        });
    }

    checkExistingDatabase(config = configuration) {
        return new Promise((resolve, reject) => {

            let usrpwd = !config.restore.user ? undefined : !config.restore.password ? "" : `${config.restore.user}:${config.restore.password}@`;
            let connection = "";
            if (config.restore.nodes) {
                `mongodb://${config.restore.user}:${config.restore.password}@${config.restore.nodes.join(`,`)}`;
                connection += `/${config.restore.database}?replicaSet=${config.restore.replicaSet}`;
                connection += `&authSource=admin&ssl=true`;
                // mongodb://cluster0-shard-00-00-abcdef.mongodb.net:27017,cluster0-shard-00-01-abcdef.mongodb.net:27017,cluster0-shard-00-02-abcdef.mongodb.net:27017
                // /test?replicaSet=Cluster0-shard-0" --authenticationDatabase admin --ssl --username omfd --password <password>>
            }

            if (config.restore.host) {
                connection = `mongodb://${!usrpwd ? "" : usrpwd }${config.restore.host}:${config.restore.port || 27017}`;
            }

            mongoose.connect(connection, options, (err) => {
                if (err) {
                    error(err);
                    reject(err)
                } else {
                    info('Mongooose Connection Established');
                    info(connection);
                    resolve(this);
                }
            });
        });
    }

    extendArguments(config, dump = true) {

        return new Promise((resolve, reject) => {

            if (config.skip) {
                resolve(null);
            }

            let keys = Object.keys(config);
            let args = [];

            if (dump) {
                args = args.concat(['--ssl', '--authenticationDatabase', 'admin',
                    '--excludeCollectionsWithPrefix=system']);
            } else {
                if (config.host != 'localhost')
                    args = args.concat(['--ssl']);
            }

            for (let key of keys) {
                if (config[key]) {

                    switch (key) {
                        case 'user':
                            args = args.concat('-u');
                            args = args.concat(config[key]);
                            break;
                        case 'password':
                            args = args.concat('-p');
                            args = args.concat(config[key]);
                            break;
                        case 'port':
                            args = args.concat('--port');
                            args = args.concat(config[key]);
                            break;
                        case 'database':
                            args = args.concat('-d');
                            args = args.concat(config[key]);
                            break;
                        case 'directory':
                            if (dump) {
                                args = args.concat('-o');
                                args = args.concat(config[key]);
                            } else {
                                args = args.concat('--dir');
                                args = args.concat(`${config[key]}/${config['database']}`);
                            }
                            break;
                        case 'host':
                            args = args.concat('--host');
                            args = args.concat(config[key]);
                            break;
                        case 'nodes':
                            args = args.concat('--host');
                            args = args.concat(`${config.replicaSet}/${config.nodes.join(',')}`);
                            break;
                        default:
                            break;
                    }
                }
            }
            resolve(args);
        });
    }

    execute(dump = true) {
        return new Promise((resolve, reject) => {
            info(dump ? 'getting the Atlas MongoDbDump' : 'restoring the MongoDbDump')
            info(dump ? this.atlasArgs : this.restoreArgs);
            const backup = spawn(
                dump ? 'mongodump' : 'mongorestore',
                dump ? this.atlasArgs : this.restoreArgs
            );

            backup.stderr.on('data', (data) => {
                log(data.toString());
            });

            backup.on('close', (code) => {
                info(`mongodump done!! child process exited with code ${code}`);
                resolve(this);
            });

        });
    }
}
