//
//  SharedDataManager.swift
//  Solace
//
//  Created by Admin on 2025-06-08.
//

import Foundation
import WidgetKit

class SharedDataManager {

    private let userDefaults: UserDefaults

    init?() {
        guard let defaults = UserDefaults(suiteName: "group.com.dorghaamhaidar.solace.iphone.widget") else {
            print("❌ Could not initialize UserDefaults with the specified App Group suite name.")
            return nil
        }
        self.userDefaults = defaults
    }

    // Saves the quote string to the shared container.
    func saveQuote(_ quoteText: String) {
        userDefaults.set(quoteText, forKey: "widgetQuoteText")
        // This command is essential to tell the widget to update.
        WidgetCenter.shared.reloadTimelines(ofKind: "SolaceWidget")
        print("✅ Quote saved and widget timeline reloaded.")
    }

    // Loads the quote string from the shared container.
    func loadQuote() -> String? {
        return userDefaults.string(forKey: "widgetQuoteText")
    }
}
