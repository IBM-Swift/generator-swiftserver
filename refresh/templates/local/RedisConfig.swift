import SwiftyJSON
import ConfigurationManager

public struct RedisConfig {

    public let host: String
    public let port: Int
    public let password: String?

    public init(manager: ConfigurationManager) {

        host = manager["services:redis:0:host"] as? String ?? "localhost"
        port = manager["services:redis:0:port"] as? Int ?? 6397
        password = manager["services:redis:0:password"] as? String

    }

}
