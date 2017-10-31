## The human way to `mongodump` and `mongorestore` your MongoDB Atlas cluster. 
### Extending the [mongodb-atlas-backup](https://github.com/kysely/mongodb-atlas-backup) package to make it more configuration driven

## Improvements
* Configuration parameters -
+ mongodump - dump to specific directory. create the directory if it doesn't exist
+ skip a process(*lets say only mongorestore not mongodump and vice-versa*). __skip = 1 to skip it__
+ __Promisified the whole process__ - get the full mongodump and than restore it to new server(localhost/atlascluster)
+ for atlascluster restoration - use the same config object as the atlas_connection with proper credentials. "host" is for other db connection
+ proper logs to get to know the progress
+ config.js in the src/config folder contains the default configuration if you want to set it once and not pass it as an argument to the MongoBackup constructor

### Install
```js
npm install
npm start
```

### Setup & Use
```javascript
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

> sample.js contains the example for the using it. Can be improved further in terms of making the further more configurable to support more mongodump/mongorestore parameters
