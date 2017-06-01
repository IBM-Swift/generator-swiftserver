    let regionVar = "<%- service.region %>"
    var region: String

    regionVar.isEmpty ? (region = PushNotifications.Region.US_SOUTH) : (region = regionVar)

    pushNotifications = PushNotifications(
        bluemixRegion: region, 
        bluemixAppGuid: "<%- service.guid %>", 
        bluemixAppSecret: "<%- service.secret %>")
