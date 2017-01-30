import Foundation
import Kitura
import KituraNet
import SwiftyJSON
import LoggerAPI
import SwiftConfiguration

<% if (bluemix) { -%>
import BluemixConfig
<% } -%>
<% datastores.forEach(function(store) { -%>
<% if (store === 'cloudant') { -%>
import CouchDB
<% } -%>
<% if (store === 'redis') { -%>
import SwiftRedis
<% } -%>
<% }); -%>

public class Controller {

    public let router = Router()

    public let manager: ConfigurationManager

<% datastores.forEach(function(store) { -%>
<% if (store === 'cloudant') { -%>
    internal let database: Database
<% } -%>
<% if (store === 'redis') { -%>
    let redis: Redis
    let redisService: RedisService
<% } -%>
<% }); %>

    public var port: Int {
        return manager.applicationPort
    }

    public init() throws {

        manager = ConfigurationManager()
        try manager.load(.environmentVariables).load(file: "../../config.json")
<% datastores.forEach(function(store) { %>
<% if (store === 'cloudant') {  -%>
<% if (bluemix) { -%>
        let cloudantService = try manager.getCloudantService(name: "<%- cloudant_service_name -%>")
        let dbClient = CouchDBClient(service: cloudantService)
<% } else if (!bluemix) { -%>
        let couchDBConnProps = ConnectionProperties(host: "127.0.0.1", port: 5984, secured: false)
        let dbClient = CouchDBClient(connectionProperties: couchDBConnProps)
<% } -%>
        self.database = dbClient.database("databaseName")
<% } -%>
<% if (store === 'redis') { -%>
        self.redis = Redis()
<% } -%>
<% if (store === 'redis' && bluemix) { -%>
        self.redisService = try manager.getRedisService(name: "todolist-redis")
<% } -%>
<% }); -%>

<% if(appType === 'web') { -%>
        router.all("/", middleware: StaticFileServer())
<% } -%>
        router.all("/*", middleware: BodyParser())
    }
}
