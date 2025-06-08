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
        userDefaults.set(data["quoteText"], forKey: "widgetQuoteText")
        WidgetCenter.shared.reloadAllTimelines()
        print("✅ Widget data saved via bridge.")
      }
    }
  }
} 