// modules/solace-widget-bridge/SolaceWidgetBridge.swift
import ExpoModulesCore
import WidgetKit

public class SolaceWidgetBridge: Module {
  public func definition() -> ModuleDefinition {
    // Sets the name of the module that JavaScript code will use.
    Name("SolaceWidgetBridge")

    // Defines a function that can be called from JavaScript.
    // It takes one argument, a dictionary of [String: String].
    Function("update") { (data: [String: String]) in
      if let userDefaults = UserDefaults(suiteName: "group.com.dorghaamhaidar.solace.iphone.widget") {
        // Save the quote as an array to match what the widget expects
        if let quoteText = data["quoteText"] {
          userDefaults.set([quoteText], forKey: "widgetQuotesArray")
          WidgetCenter.shared.reloadTimelines(ofKind: "SolaceWidget")
          print("✅ Widget data saved via bridge: \(quoteText)")
        } else {
          print("❌ No quoteText provided to widget bridge")
        }
      } else {
        print("❌ Failed to initialize UserDefaults for widget bridge")
      }
    }
  }
} 