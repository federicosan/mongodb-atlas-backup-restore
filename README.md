#### The human way to `mongodump` and `mongorestore` your MongoDB Atlas cluster. Extending the mongodb-atlas-backup(https://github.com/kysely/mongodb-atlas-backup) package to make it
more configuration driven

## Improvements
Configuration driven -
#mongodump - dump to specific directory
#skip a process if you dont want to - using skip flag
#promisified the whole process - get the whole dump and than restore it to new server(localhost/atlascluster)
#for atlascluster restoration - use the same object as the dump with proper credentials. "host" is for other db connection
#proper logs to get to know the progress

## Install
```sh
npm install
npm start
```

## Setup & Use
```js
import MongoBackup from './src/index'

// Create an instance of the database atlas_connection
const backup = new MongoBackup(
    {
        atlas_connection: {
            user: '<almightyUserName>',
            password: '<PASSWORD>',
            replicaSet: 'Cluster0-shard-0',
            nodes: [
                'cluster0-shard-00-00-abcdef.mongodb.net:27017',
                'cluster0-shard-00-01-abcdef.mongodb.net:27017',
                'cluster0-shard-00-02-abcdef.mongodb.net:27017'
            ],
            database: 'mydb',
            directory: "dump",
            skip: 0
        },
        restore: {
            user: undefined,
            password: undefined,
            host: 'localhost',
            port: 27017,
            database: 'mydb',
            directory: 'dump',
            skip: 0
        }
    })
    .then((res) => {
        // Dump your cluster
        return res.dump()
    })
    .then((res) => {
        // Restore data to your cluster
        return res.restore()
    })
    .catch((err) => {
        console.log(err);
        process.exit(0)
    });
```