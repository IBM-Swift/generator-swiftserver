import Foundation
import BluemixAppID
import CloudFoundryConfig

extension WebAppKituraCredentialsPlugin {

   public convenience init(service: AppIDService, redirectUri: String) {

       let options: [String:Any] = [
                      "clientId": service.clientId,
                      "oauthServerUrl": service.oauthServerUrl,
                      "profilesUrl": service.profilesUrl,
                      "secret": service.secret,
                      "tenantId": service.tenantId,
                      "version": service.version,
                      "redirectUri": redirectUri
                     ]

       self.init(options: options)
   }
}
