import Configuration
import BluemixObjectStorage
import Dispatch
import LoggerAPI

public struct ObjectStorageConn {

   let connectQueue = DispatchQueue(label: "connectQueue")
   let objStorage: ObjectStorage
   let manager: ConfigurationManager

   init (configManager: ConfigurationManager) {

       manager = configManager

       guard let pid = manager["objStorageConnProps:projectId"] as? String else {
           objStorage = ObjectStorage(projectId: "")
           return
       }

       objStorage = ObjectStorage(projectId: pid)
   }



   public func getObjectStorage() -> ObjectStorage {
       Log.verbose("Starting task in serialized block (getting ObjectStorage instance)...")
       connectQueue.sync {
           self.connect()
       }
       Log.verbose("Completed task in serialized block.")

       return objStorage
   }

   public func connect()  {

       if  let userId = manager["objStorageConnProps:userId"] as? String,
           let password = manager["objStorageConnProps:password"] as? String,
           let region = manager["objStorageConnProps:region"] as? String {

           let semaphore = DispatchSemaphore(value: 0)
           Log.verbose("Making network call synchronous...")
           objStorage.connect(userId: userId, password: password, region: region) { error in
               if let error = error {
                   let errorMsg = "Could not connect to Object Storage."
                   Log.error("\(errorMsg) Error was: '\(error)'.")
               } else {
                   Log.verbose("Successfully obtained authentication token for Object Storage.")
               }
               Log.verbose("Signaling semaphore...")
               semaphore.signal()
           }

           let _ = semaphore.wait(timeout: DispatchTime.distantFuture)
           Log.verbose("Continuing execution after synchronous network call...")

       } else {
           Log.error("Insufficient credentials, failed to connect to Object Storage.")
       }
   }
}
