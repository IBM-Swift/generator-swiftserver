import Foundation
import Kitura
import KituraNet
import SwiftyJSON
import LoggerAPI
import Configuration

<% if (bluemix) { -%>
import SwiftConfiguration
<% } -%>
<% if (metrics) { %>
import SwiftMetrics
import SwiftMetricsKitura
<% } -%>
<% datastores.forEach(function(store) { %>
<% if (store.name === 'cloudant') { -%>
import CouchDB
<% } -%>
<% if (store.name === 'redis') { -%>
import SwiftRedis
<% } -%>
<% if (store.name === 'postgres') { -%>
import SwiftKuery
import SwiftKueryPostgreSQL
<% } -%>
<% if (store.name === 'mongo') { -%>
import MongoKitten
import SSLService
<% } -%>
<% if (store.name === 'mysql') { -%>
import MySql
<% } -%>
<% if (store.name === 'db2') { -%>
import IBMDB
<% } -%>
<% }); -%>

public class Controller {

    public let router = Router()

    public let manager: ConfigurationManager
<% datastores.forEach(function(store) { %>
    // Set up <%= store.name %>
<% if (store.name === 'cloudant') { -%>
    internal let database: Database
<% } -%>
<% if (store.name === 'redis') { -%>
    let redis: Redis
    <% if (bluemix) { -%>
        let redisService: RedisService
    <% } -%>
<% } -%>
<% if (store.name === 'postgres') { -%>
    let connection: Connection
<% } -%>
<% if (store.name === 'mongo') { -%>
    let server: MongoKitten.Server
<% } -%>
<% if (store.name === 'mysql') { -%>
    let mysql: MySQL.Database
    let connection: Connection
<% } -%>
<% if (store.name === 'db2') { -%>
    let db = IBMDB()
    let connString: String
<% } -%>
<% }); %>
<% if (metrics) { -%>
    let metrics: SwiftMetrics!
<% } %>

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
        // Configuring <%= store.name %>
<% if (store.name === 'cloudant') {  -%>
<% if (bluemix) { -%>
        let cloudantService = try manager.getCloudantService(name: "<%- cloudant_service_name -%>")
        let dbClient = CouchDBClient(service: cloudantService)
        dbClient.createDB("coffestore") { _, _ in }
<% } else { -%>
        let couchDBConnProps = ConnectionProperties(host: "127.0.0.1", port: 5984, secured: false)
        let dbClient = CouchDBClient(connectionProperties: couchDBConnProps)
<% } -%>
        self.database = dbClient.database("databaseName")
<% } -%>
<% if (store.name === 'redis') { -%>
        self.redis = Redis()
<% } -%>
<% if (store.name === 'redis' && bluemix) { -%>
        self.redisService = try manager.getRedisService(name: "todolist-redis")
<% } -%>
<% if (store.name === 'postgres') { -%>
        self.connection = PostgreSQLConnection(host: "localhost", port: Int32(5432), options: [.databaseName("databasename")])
<% } -%>
<% if (store.name === 'postgres' && bluemix) { -%>
        let postgreSQLService = try manager.getPostgreSQLService(name: "PostgreSQL-Service")
        self.connection = PostgreSQLConnection(service: postgreSQLService)
<% } -%>
<% if (store.name === 'mongo') { -%>
        self.server = try Server(mongoURL: "mongodb://username:password@127.0.0.1:27017")
<% } -%>
<% if (store.name === 'mongo' && bluemix) { -%>
        let mongoDBService = try manager.getMongoDBService(name: "MongoDB-Service")
<% } -%>
<% if (store.name === 'mysql') {  -%>
<% if (bluemix) { -%>
        let mySQLService = try manager.getMySQLService(name: "MySQL-Service")
        self.mysql = try Database(service: mySQLService)
<% } else { -%>
        self.mysql = try Database(host: "127.0.0.1", user: "root", password: "", database: "databasename")
<% } -%>
        self.connection = try self.mysql.makeConnection()
<% } -%>
<% if (store.name === 'db2' && bluemix) { -%>
        let db2Service = try manager.getDB2Service(name: "DB2-Analytics-Service")
        self.connString = "DRIVER={DB2};DATABASE=\(db2Service.database);HOSTNAME=\(db2Service.host);PORT=\(db2Service.port);UID=\(db2Service.uid);PWD=\(db2Service.pwd)"
<% } -%>
<% }); -%>

<% if (metrics) { -%>
        metrics = try SwiftMetrics()
        SwiftMetricsKitura(swiftMetricsInstance: metrics)
        let monitoring = metrics.monitor()
<% } -%>

<% if(appType === 'web') { -%>
        router.all("/", middleware: StaticFileServer())
<% } -%>
        router.all("/*", middleware: BodyParser())
    }
}
