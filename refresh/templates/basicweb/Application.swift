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
<% if (store.type === 'objectstorage') { -%>
import BluemixObjectStorage
<% } -%>
<% }); -%>

public let router = Router()
public let manager = ConfigurationManager()
public var port: Int = 8080

<% datastores.forEach(function(store) { %>
// Setting up <%= store.type %>
<% if (store.type === 'cloudantNoSQLDB') { -%>
internal var database: Database?
<% } -%>
<% if (store.type === 'compose-for-redis') { -%>
internal var redis: Redis?
<% if (bluemix) { -%>
internal var redisService: RedisService?
<% } -%>
<% } -%>
<% if (store.type === 'compose-for-postgresql') { -%>
internal var connection: Connection?
<% } -%>
<% if (store.type === 'compose-for-mongodb') { -%>
internal var server: MongoKitten.Server?
<% } -%>
<% if (store.type === 'compose-for-mysql') { -%>
internal var mysql: MySQL.Database?
internal var connection: Connection?
<% } -%>
<% }); %>

public func initialize() throws {

    try manager.load(file: "../../config.json")
                .load(.environmentVariables)

<% if (metrics) { -%>
    // Set up monitoring
    let sm = try SwiftMetrics()
    let _ = try SwiftMetricsDash(swiftMetricsInstance : sm, endpoint: router)
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
    database = dbClient.database("databaseName")
<% } -%>
<% if (store.type === 'compose-for-redis') { -%>
    redis = Redis()
<% } -%>
<% if (store.type === 'compose-for-redis' && bluemix) { -%>
    redisService = try manager.getRedisService(name: "<%- store.name -%>")
<% } -%>
<% if (store.type === 'compose-for-postgresql') { -%>
    connection = PostgreSQLConnection(host: "localhost", port: Int32(5432), options: [.databaseName("databasename")])
<% } -%>
<% if (store.type === 'compose-for-postgresql' && bluemix) { -%>
    let postgreSQLService = try manager.getPostgreSQLService(name: "<%- store.name -%>")
    connection = PostgreSQLConnection(service: postgreSQLService)
<% } -%>
<% if (store.type === 'compose-for-mongodb') { -%>
    server = try Server(mongoURL: "mongodb://username:password@127.0.0.1:27017")
<% } -%>
<% if (store.type === 'compose-for-mongodb' && bluemix) { -%>
    let mongoDBService = try manager.getMongoDBService(name: "<%- store.name -%>")
<% } -%>
<% if (store.type === 'compose-for-mysql') {  -%>
<% if (bluemix) { -%>
    let mySQLService = try manager.getMySQLService(name: "<%- store.name -%>")
    mysql = try Database(service: mySQLService)
<% } else { -%>
    mysql = try Database(host: "127.0.0.1", user: "root", password: "", database: "databasename")
<% } -%>
    connection = try mysql.makeConnection()
<% } -%>
<% }); -%>

<% if(appType === 'web') { -%>
    router.all("/", middleware: StaticFileServer())
<% } -%>

    port = manager["port"] as? Int ?? port

    router.all("/*", middleware: BodyParser())

    initializeIndex()
}

public func run() throws {
    Kitura.addHTTPServer(onPort: port, with: router)
    Kitura.run()
}
