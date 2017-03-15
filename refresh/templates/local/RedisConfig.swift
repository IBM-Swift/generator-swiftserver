import SwiftyJSON
import Configuration

public struct RedisConfig {

    public let host: String
    public let port: Int32
    public let password: String?

    public init(manager: ConfigurationManager) {

        host = manager["services:redis:0:host"] as? String ?? "localhost"
        port = manager["services:redis:0:port"] as? Int32 ?? 6397
        password = manager["services:redis:0:password"] as? String

    }

}
