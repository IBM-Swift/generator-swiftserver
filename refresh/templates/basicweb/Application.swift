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
<% Object.keys(services).forEach(function(serviceType) { %>
<% if (serviceType === 'cloudant') { -%>
import CouchDB
<% } -%>
<% if (serviceType === 'redis') { -%>
import SwiftRedis
<% } -%>
<% if (serviceType === 'postgresql') { -%>
import SwiftKuery
import SwiftKueryPostgreSQL
<% } -%>
<% if (serviceType === 'mongodb') { -%>
import MongoKitten
import SSLService
<% } -%>
<% if (serviceType === 'mysql') { -%>
import MySql
<% } -%>
<% if (serviceType === 'objectstorage') { -%>
import BluemixObjectStorage
<% } -%>
<% }); -%>

public let router = Router()
public let manager = ConfigurationManager()
public var port: Int = 8080

<% Object.keys(services).forEach(function(serviceType) { %>
// Setting up <%= serviceType %>
<% if (serviceType === 'cloudant') { -%>
internal var database: Database?
<% } -%>
<% if (serviceType === 'redis') { -%>
internal var redis: Redis?
<% if (bluemix) { -%>
internal var redisService: RedisService?
<% } -%>
<% } -%>
<% if (serviceType === 'postgresql') { -%>
internal var connection: Connection?
<% } -%>
<% if (serviceType === 'mongodb') { -%>
internal var server: MongoKitten.Server?
<% } -%>
<% if (serviceType === 'mysql') { -%>
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

<% Object.keys(services).forEach(function(serviceType) { %>
    // Configuring <%= serviceType %>
<% services[serviceType].forEach(function(serviceDef) { -%>
<% if (serviceType === 'cloudant') {  -%>
<% if (bluemix) { -%>
    let cloudantService = try manager.getCloudantService(name: "<%- serviceDef.name -%>")
    let dbClient = CouchDBClient(service: cloudantService)
<% } else { -%>
    let couchDBConnProps = ConnectionProperties(host: "<%- serviceDef.host || localhost %>", port: <%- serviceDef.port || 5984 %>, secured: <% serviceDef.secured || false %>)
    let dbClient = CouchDBClient(connectionProperties: couchDBConnProps)
<% } -%>
<% } -%>
<% if (serviceType === 'redis') { -%>
    redis = Redis()
<% } -%>
<% if (serviceType === 'redis' && bluemix) { -%>
    redisService = try manager.getRedisService(name: "<%- serviceDef.name -%>")
<% } -%>
<% if (serviceType === 'postgresql') { -%>
    connection = PostgreSQLConnection(host: "localhost", port: Int32(5432), options: [.databaseName("<%- serviceDef.name %>DB")])
<% } -%>
<% if (serviceType === 'postgresql' && bluemix) { -%>
    let postgreSQLService = try manager.getPostgreSQLService(name: "<%- serviceDef.name -%>")
    connection = PostgreSQLConnection(service: postgreSQLService)
<% } -%>
<% if (serviceType === 'mongodb') { -%>
    server = try Server(mongoURL: "mongodb://<%-serviceDef.username%>:<%serviceDef.password%>@<%serviceDef.host || localhost%>:<%serviceDef.port || 27017%>")
<% } -%>
<% if (serviceType === 'mongodb' && bluemix) { -%>
    let mongoDBService = try manager.getMongoDBService(name: "<%- serviceDef.name -%>")
<% } -%>
<% if (serviceType === 'mysql') {  -%>
<% if (bluemix) { -%>
    let mySQLService = try manager.getMySQLService(name: "<%- serviceDef.name -%>")
    mysql = try Database(service: mySQLService)
<% } else { -%>
    mysql = try Database(host: "<%serviceDef.host || localhost%>", user: "<%serviceDef.username || root%>", password: "", database: "<%- serviceDef.name %>DB")
<% } -%>
    connection = try mysql.makeConnection()
<% } -%>
<% }); -%>
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
