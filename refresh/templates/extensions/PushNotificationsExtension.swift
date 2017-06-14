import Foundation
import BluemixPushNotifications
import CloudFoundryConfig

extension PushNotifications {

   public init(service: PushSDKService, region: String) {

        self.init(
            bluemixRegion: region,
            bluemixAppGuid: service.appGuid, 
            bluemixAppSecret: service.appSecret )
        
    }
}
