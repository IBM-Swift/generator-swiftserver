
    let pushNotificationsService = try manager.getPushSDKService(name: "<%- service.name %>")

    let region = "<%- service.region %>".isEmpty ? PushNotifications.Region.US_SOUTH : "<%- service.region %>"

    pushNotifications = PushNotifications(service: pushNotificationsService, region: region)
