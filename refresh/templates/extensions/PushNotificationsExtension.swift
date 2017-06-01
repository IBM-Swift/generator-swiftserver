import Foundation
import BluemixPushNotifications
import CloudFoundryConfig

extension PushNotifications {

   public convenience init(service: PushNotificationsService) {

        let regionVar = "<%- service.region %>"
        var region: String

        regionVar.isEmpty ? (region = PushNotifications.Region.US_SOUTH) : (region = regionVar)

        self.init(
            bluemixRegion: region,
            bluemixAppGuid: "<%- service.guid %>", 
            bluemixAppSecret: "<%- service.secret %>" )
        
    }
}
