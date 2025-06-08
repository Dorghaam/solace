//
//  WidgetModule.swift
//  Solace
//
//  Created by Admin on 2025-06-08.
//

import Foundation
import WidgetKit

@objc(WidgetModule)
class WidgetModule: NSObject {

  @objc
  static func requiresMainQueueSetup() -> Bool {
    return true
  }

  // This is the function we will call from JavaScript.
  // We'll pass a single dictionary to keep it simple.
  @objc
  func updateWidget(_ data: [String: String]) {
    guard let quoteText = data["quoteText"] else {
      print("❌ WidgetModule: quoteText not provided.")
      return
    }

    print("WidgetModule: Received quote text: \(quoteText)")
    
    // Use our SharedDataManager to save the data
    if let dataManager = SharedDataManager() {
        dataManager.saveQuote(quoteText)
    } else {
        print("❌ WidgetModule: Failed to initialize SharedDataManager.")
    }
  }
}
