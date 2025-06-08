//
//  SolaceWidget.swift
//  SolaceWidget
//
//  Created by Admin on 2025-06-08.
//

import WidgetKit
import SwiftUI

// 1. Define the Timeline Provider
// This object decides WHEN to update the widget.
struct Provider: TimelineProvider {
    // Provides a placeholder view for the widget gallery.
    func placeholder(in context: Context) -> SimpleEntry {
        SimpleEntry(date: Date(), quote: "I cannot control how others act; only how I choose to react.")
    }

    // Provides the view for a transient state (e.g., when the user is choosing a widget).
    func getSnapshot(in context: Context, completion: @escaping (SimpleEntry) -> ()) {
        // Attempt to load the last known quote for a more relevant snapshot.
        let dataManager = SharedDataManager()
        let quote = dataManager?.loadQuote() ?? "Your daily affirmation will appear here."
        let entry = SimpleEntry(date: Date(), quote: quote)
        completion(entry)
    }

    // Provides the timeline for future widget updates.
    // This is where we load the shared data.
    func getTimeline(in context: Context, completion: @escaping (Timeline<Entry>) -> ()) {
        let currentDate = Date()
        let dataManager = SharedDataManager()
        let quote = dataManager?.loadQuote() ?? "Open Solace to set up your widget."
        
        let entry = SimpleEntry(date: currentDate, quote: quote)

        // Create a timeline that never automatically updates.
        // We will only update it manually from the main app.
        let timeline = Timeline(entries: [entry], policy: .never)
        completion(timeline)
    }
}

// 2. Define the Timeline Entry
// This is the data model for a single point in time for the widget.
struct SimpleEntry: TimelineEntry {
    let date: Date
    let quote: String
}

// 3. Define the Widget's View
// This is the SwiftUI code that describes what the widget looks like.
struct SolaceWidgetEntryView : View {
    var entry: Provider.Entry

    var body: some View {
        // Using a ZStack to layer the background color
        ZStack {
            // This is the light pink background color from your app's theme
            Color(red: 255/255, green: 247/255, blue: 245/255)
            
            VStack {
                Text(entry.quote)
                    .font(.system(size: 15, weight: .semibold, design: .rounded))
                    .foregroundColor(Color(white: 0.2)) // A dark gray for good contrast
                    .multilineTextAlignment(.center)
                    .lineSpacing(4)
                    .minimumScaleFactor(0.5) // Allows text to shrink if it's too long
            }
            .padding()
        }
        .edgesIgnoringSafeArea(.all) // Ensure the background color fills the whole widget
    }
}


// 4. Define the Widget Configuration
// This brings everything together.
struct SolaceWidget: Widget {
    // This is a unique identifier for your widget.
    let kind: String = "SolaceWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: Provider()) { entry in
            SolaceWidgetEntryView(entry: entry)
        }
        .configurationDisplayName("Daily Affirmation")
        .description("Display a daily affirmation on your home screen.")
        .supportedFamilies([.systemSmall]) // We will only support the small square widget for now
    }
}

#Preview(as: .systemSmall) {
    SolaceWidget()
} timeline: {
    SimpleEntry(date: .now, quote: "I cannot control how others act; only how I choose to react.")
    SimpleEntry(date: .now, quote: "Open Solace to set up your widget.")
}
