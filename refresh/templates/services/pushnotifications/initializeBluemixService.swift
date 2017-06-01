    let regionVar = "<%- service.region %>"
    var region: String

    regionVar.isEmpty ? (region = PushNotifications.Region.US_SOUTH) : (region = regionVar)

    let guid = "<%- service.guid %>"
    let secret = "<%- service.secret %>"

    pushNotifications = PushNotifications(bluemixRegion: region, bluemixAppGuid: guid, bluemixAppSecret: secret)
