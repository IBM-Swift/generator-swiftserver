/*
 * Copyright IBM Corporation 2016
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

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
        let host = try extractValueFromJSON(fromKey: "host", ofType: .string, fromJSON: storeConfig, defaultingTo: "localhost")
        let port = Int16(try extractValueFromJSON(fromKey: "port", ofType: .number, fromJSON: storeConfig, defaultingTo: 5984))
        let secured = try extractValueFromJSON(fromKey: "secured", ofType: .bool, fromJSON: storeConfig, defaultingTo: false)
        let username: String? = try extractValueFromJSON(fromKey: "username", ofType: .string, fromJSON: storeConfig, defaultingTo: nil)
        let password: String? = try extractValueFromJSON(fromKey: "password", ofType: .string, fromJSON: storeConfig, defaultingTo: nil)

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


func extractValueFromJSON<T>(fromKey key: String, ofType type: Type, fromJSON json: [String: JSON]?, defaultingTo defaultValue: T) throws -> T {
    guard let json = json, let value = json[key] else {
        Log.info("Using default value '\(defaultValue)' for '\(key)'")
        return defaultValue
    }

    guard value.type == type else {
        throw ConfigurationError.typeMismatch(name: key, expectedType: "\(type)", type: "\(value.type)")
    }

    return value.rawValue as! T
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
