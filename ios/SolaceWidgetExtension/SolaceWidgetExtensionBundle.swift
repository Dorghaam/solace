//
//  SolaceWidgetExtensionBundle.swift
//  SolaceWidgetExtension
//
//  Created by Admin on 2025-06-08.
//

import WidgetKit
import SwiftUI

@main
struct SolaceWidgetExtensionBundle: WidgetBundle {
    var body: some Widget {
        SolaceWidgetExtension()
        SolaceWidgetExtensionControl()
        SolaceWidgetExtensionLiveActivity()
    }
}
