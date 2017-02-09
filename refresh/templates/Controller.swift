import Foundation
import Kitura
import KituraNet
import SwiftyJSON
import LoggerAPI
import Configuration

<% if (bluemix) { -%>
import CloudFoundryConfig
<% } -%>
<% if (metrics) { %>
import SwiftMetrics
import SwiftMetricsDash
<% } -%>
<% datastores.forEach(function(store) { %>
<% if (store.type === 'cloudantNoSQLDB') { -%>
import CouchDB
<% } -%>
<% if (store.type === 'compose-for-redis') { -%>
import SwiftRedis
<% } -%>
<% if (store.type === 'compose-for-postgresql') { -%>
import SwiftKuery
import SwiftKueryPostgreSQL
<% } -%>
<% if (store.type === 'compose-for-mongodb') { -%>
import MongoKitten
import SSLService
<% } -%>
<% if (store.type === 'compose-for-mysql') { -%>
import MySql
<% } -%>
<% }); -%>

public class Controller {

    public let router = Router()

    public let manager: ConfigurationManager
<% datastores.forEach(function(store) { %>
    // Set up <%= store.type %>
<% if (store.type === 'cloudantNoSQLDB') { -%>
    internal let database: Database
<% } -%>
<% if (store.type === 'compose-for-redis') { -%>
    let redis: Redis
<% if (bluemix) { -%>
    let redisService: RedisService
<% } -%>
<% } -%>
<% if (store.type === 'compose-for-postgresql') { -%>
    let connection: Connection
<% } -%>
<% if (store.type === 'compose-for-mongodb') { -%>
    let server: MongoKitten.Server
<% } -%>
<% if (store.type === 'compose-for-mysql') { -%>
    let mysql: MySQL.Database
    let connection: Connection
<% } -%>
<% }); %>

    public var port: Int {
<% if (bluemix) { -%>
        return manager.applicationPort
<% } else { %>
        return (manager["port"] as? Int) ?? 8090
<% } -%>
    }

    public init() throws {

        manager = ConfigurationManager()
<% if(bluemix) { -%>
        try manager.load(.environmentVariables)
<% } else { -%>
        try manager.load(.environmentVariables).load(file: "../../config.json")
<% } -%>
<% datastores.forEach(function(store) { %>
        // Configuring <%= store.type %>
<% if (store.type === 'cloudantNoSQLDB') {  -%>
<% if (bluemix) { -%>
        let cloudantService = try manager.getCloudantService(name: "<%- store.name -%>")
        let dbClient = CouchDBClient(service: cloudantService)
<% } else { -%>
        let couchDBConnProps = ConnectionProperties(host: "127.0.0.1", port: 5984, secured: false)
        let dbClient = CouchDBClient(connectionProperties: couchDBConnProps)
<% } -%>
        self.database = dbClient.database("databaseName")
<% } -%>
<% if (store.type === 'compose-for-redis') { -%>
        self.redis = Redis()
<% } -%>
<% if (store.type === 'compose-for-redis' && bluemix) { -%>
        self.redisService = try manager.getRedisService(name: "<%- store.name -%>")
<% } -%>
<% if (store.type === 'compose-for-postgresql') { -%>
        self.connection = PostgreSQLConnection(host: "localhost", port: Int32(5432), options: [.databaseName("databasename")])
<% } -%>
<% if (store.type === 'compose-for-postgresql' && bluemix) { -%>
        let postgreSQLService = try manager.getPostgreSQLService(name: "<%- store.name -%>")
        self.connection = PostgreSQLConnection(service: postgreSQLService)
<% } -%>
<% if (store.type === 'compose-for-mongodb') { -%>
        self.server = try Server(mongoURL: "mongodb://username:password@127.0.0.1:27017")
<% } -%>
<% if (store.type === 'compose-for-mongodb' && bluemix) { -%>
        let mongoDBService = try manager.getMongoDBService(name: "<%- store.name -%>")
<% } -%>
<% if (store.type === 'compose-for-mysql') {  -%>
<% if (bluemix) { -%>
        let mySQLService = try manager.getMySQLService(name: "<%- store.name -%>")
        self.mysql = try Database(service: mySQLService)
<% } else { -%>
        self.mysql = try Database(host: "127.0.0.1", user: "root", password: "", database: "databasename")
<% } -%>
        self.connection = try self.mysql.makeConnection()
<% } -%>
<% }); -%>

<% if (metrics) { -%>
    let sm = try SwiftMetrics()
    let _ = try SwiftMetricsDash(swiftMetricsInstance : sm, endpoint: router)
<% } -%>

<% if(appType === 'web') { -%>
        router.all("/", middleware: StaticFileServer())
<% } -%>
        router.all("/*", middleware: BodyParser())
    }
}
