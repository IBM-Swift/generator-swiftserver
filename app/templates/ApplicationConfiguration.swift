import Foundation
import SwiftyJSON
import GeneratedSwiftServer
import HeliumLogger
import LoggerAPI
import CouchDB
import GeneratedSwiftServer_CloudantStore

public func readConfig(configURL: URL) throws -> Int {
    let fileData = try Data(contentsOf: configURL)
    let json = JSON(data: fileData)

    if json == nil {
        throw ConfigurationError.invalidStoreConfiguration(message: "Invalid JSON - check your config.json file")
    }

    //Check if the port has been defined in the config and is of type integer else default to 8090
    guard let port = json["port"].exists() ? json["port"].int : 8090 else {
        throw ConfigurationError.typeMismatch(name: "port", expectedType: "int", type: "\(json["port"].type)")
    }
    //Check if the logger has been defined in the config and is of type string else default to 'helium'
    guard let logger = json["logger"].exists() ? json["logger"].string : "helium" else {
        throw ConfigurationError.typeMismatch(name: "logger", expectedType: "string", type: "\(json["logger"].type)")
    }

    var storeType: String
    var storeConfig: [String:JSON]? = nil

    if let storeSpec = json["store"].dictionary {
        storeType = storeSpec["type"]?.string ?? "memory"
        storeConfig = storeSpec
    } else {
        storeType = json["store"].string ?? "memory"
    }

    // Set up logger
    switch logger {
    case "helium":
        HeliumLogger.use()
    default:
        throw ConfigurationError.unrecognizedLoggerType(logger: logger)
    }

    // Set up store
    switch storeType {
    case "memory":
        Model.store = MemoryStore()

    case "cloudant":
        let keys = storeConfig?.keys
        guard let host = (keys?.contains("host"))! ? storeConfig?["host"]?.string : "localhost" else {
            throw ConfigurationError.typeMismatch(name: "host", expectedType: "string", type: "\((storeConfig?["host"]?.type)!)")
        }
        guard let port = (keys?.contains("port"))! ? storeConfig?["port"]?.int16 : 5984 else {
            throw ConfigurationError.typeMismatch(name: "port", expectedType: "int16", type: "\((storeConfig?["port"]?.type)!)")
        }
        guard let secured = (keys?.contains("secured"))! ? storeConfig?["secured"]?.bool : false else {
            throw ConfigurationError.typeMismatch(name: "secured", expectedType: "bool", type: "\((storeConfig?["secured"]?.type)!)")
        }

        //Check if the username has been defined in the config and is of type string else default to nil
        var username: String? = nil
        if (keys?.contains("username"))! {
            guard let tempUser = storeConfig?["username"]?.string else {
                throw ConfigurationError.typeMismatch(name: "username", expectedType: "string", type: "\((storeConfig?["username"]?.type)!)")
            }
            username = tempUser
        }

        //Check if the password has been defined in the config and is of type string else default to nil
        var password: String? = nil
        if (keys?.contains("password"))! {
            guard let tempPass = storeConfig?["password"]?.string else {
                throw ConfigurationError.typeMismatch(name: "password", expectedType: "string", type: "\((storeConfig?["password"]?.type)!)")
            }
            password = tempPass
        }

        Model.store = CloudantStore(ConnectionProperties(
            host: host,
            port: port,
            secured: secured,
            username: username,
            password: password
        ))

    default:
        throw ConfigurationError.unrecognizedStoreType(type: storeType)
    }
    return port
}

public enum ConfigurationError: Error {
    case invalidStoreConfiguration(message: String)
    case typeMismatch(name: String, expectedType: String, type: String)
    case unrecognizedStoreType(type: String)
    case unrecognizedLoggerType(logger: String)

    public func defaultMessage() -> String {
        switch self {
        case let .invalidStoreConfiguration(message): return message
        case let .typeMismatch(name, expectedType, type): return "Type mismatch for '\(name)'. Expected type: \(expectedType) - Actual type: \(type)"
        case let .unrecognizedStoreType(type):        return "\(type) is not a recognised store type"
        case let .unrecognizedLoggerType(logger):     return "\(logger) is not a recognised logger"
        }
    }
}
