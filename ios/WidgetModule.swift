import Foundation
import WidgetKit

@objc(WidgetModule)
class WidgetModule: NSObject {

  @objc
  static func requiresMainQueueSetup() -> Bool {
    return true
  }

  @objc
  func updateWidget(_ data: [String: String]) {
    guard let quoteText = data["quoteText"] else {
      print("❌ WidgetModule: quoteText not provided.")
      return
    }
    
    if let dataManager = SharedDataManager() {
        dataManager.saveQuote(quoteText)
    } else {
        print("❌ WidgetModule: Failed to initialize SharedDataManager.")
    }
  }
}
