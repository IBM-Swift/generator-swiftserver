import Foundation
import AlertNotifications
import CloudFoundryConfig

extension ServiceCredentials {

   public init(service: AlertNotificationService) {
    
        self.init(url: service.url, name: service.id, password: service.password)
        
    }
}