import WidgetKit
import SwiftUI

struct Provider: TimelineProvider {
    // This is the view shown in the widget gallery
    func placeholder(in context: Context) -> SimpleEntry {
        SimpleEntry(date: Date(), quote: "I am worthy of peace and happiness.")
    }

    // This is the view shown for a moment when the widget is first added
    func getSnapshot(in context: Context, completion: @escaping (SimpleEntry) -> ()) {
        let entry = SimpleEntry(date: Date(), quote: "I am healing and growing stronger.")
        completion(entry)
    }

    // This function builds the update schedule for the widget
    func getTimeline(in context: Context, completion: @escaping (Timeline<Entry>) -> ()) {
        print("🎯 SolaceWidget: getTimeline called at \(Date())")
        var entries: [SimpleEntry] = []
        let currentDate = Date()
        
        // Load the quotes from our shared data manager
        print("🔄 SolaceWidget: Initializing SharedDataManager...")
        let dataManager = SharedDataManager()
        if dataManager == nil {
            print("❌ SolaceWidget: Failed to initialize SharedDataManager")
        }
        
        var affirmations = dataManager?.loadQuotes() ?? []
        print("📱 SolaceWidget: Loaded \(affirmations.count) quotes from SharedDataManager")

        // If no quotes were loaded from the app yet, show a placeholder
        if affirmations.isEmpty {
            print("⚠️ SolaceWidget: No quotes found, using placeholder message")
            affirmations.append("Open Solace to update your widget with new affirmations.")
        } else {
            print("✅ SolaceWidget: Using real quotes: \(affirmations)")
        }

        // Create a timeline of entries from the loaded quotes
        // Each quote will be displayed for 2 hours
        for index in 0..<affirmations.count {
            let entryDate = Calendar.current.date(byAdding: .hour, value: index * 2, to: currentDate)!
            let entry = SimpleEntry(date: entryDate, quote: affirmations[index])
            entries.append(entry)
            print("📝 SolaceWidget: Created entry \(index): '\(affirmations[index])' for \(entryDate)")
        }

        // After the last quote, the timeline ends and iOS will request a new one later.
        let timeline = Timeline(entries: entries, policy: .atEnd)
        print("🏁 SolaceWidget: Timeline created with \(entries.count) entries, policy: .atEnd")
        completion(timeline)
    }
}

// This is the data for a single widget view
struct SimpleEntry: TimelineEntry {
    let date: Date
    let quote: String
}

// This is the SwiftUI view that displays the widget
struct SolaceWidgetEntryView : View {
    var entry: Provider.Entry
    @Environment(\.widgetFamily) var family
    
    var body: some View {
        GeometryReader { geometry in
            ZStack {
                // Background with subtle gradient
                LinearGradient(
                    colors: [
                        Color(red: 1.0, green: 0.98, blue: 0.96), // Very light peachy
                        Color(red: 0.99, green: 0.94, blue: 0.91)  // Slightly deeper
                    ],
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )
                .opacity(0.8)
                
                // Subtle pattern overlay
                RoundedRectangle(cornerRadius: 0)
                    .fill(
                        RadialGradient(
                            colors: [
                                Color.white.opacity(0.3),
                                Color.clear
                            ],
                            center: .topLeading,
                            startRadius: 0,
                            endRadius: geometry.size.width * 0.8
                        )
                    )
                
                // Content
                VStack(spacing: family == .systemSmall ? 8 : 12) {
                    // Small decorative element
                    HStack {
                        Circle()
                            .fill(Color(red: 0.96, green: 0.45, blue: 0.68).opacity(0.6))
                            .frame(width: family == .systemSmall ? 4 : 6, height: family == .systemSmall ? 4 : 6)
                        
                        Spacer()
                        
                        // Small "Solace" branding
                        Text("SOLACE")
                            .font(.system(size: family == .systemSmall ? 8 : 10, weight: .medium, design: .rounded))
                            .foregroundColor(Color(red: 0.5, green: 0.4, blue: 0.4))
                            .opacity(0.7)
                    }
                    .padding(.horizontal, family == .systemSmall ? 16 : 20)
                    .padding(.top, family == .systemSmall ? 12 : 16)
                    
                    Spacer()
                    
                    // Main quote text
                    Text(entry.quote)
                        .font(.system(
                            size: family == .systemSmall ? 14 : (family == .systemMedium ? 16 : 18), 
                            weight: .medium, 
                            design: .rounded
                        ))
                        .foregroundColor(Color(red: 0.25, green: 0.2, blue: 0.2))
                        .multilineTextAlignment(.center)
                        .lineSpacing(family == .systemSmall ? 3 : 4)
                        .lineLimit(nil)
                        .padding(.horizontal, family == .systemSmall ? 16 : 24)
                    
                    Spacer()
                    
                    // Bottom accent
                    HStack {
                        Spacer()
                        
                        RoundedRectangle(cornerRadius: 1)
                            .fill(Color(red: 0.96, green: 0.45, blue: 0.68).opacity(0.4))
                            .frame(
                                width: family == .systemSmall ? 20 : 30, 
                                height: family == .systemSmall ? 2 : 3
                            )
                    }
                    .padding(.horizontal, family == .systemSmall ? 16 : 20)
                    .padding(.bottom, family == .systemSmall ? 12 : 16)
                }
                
                // Subtle border effect
                RoundedRectangle(cornerRadius: 0)
                    .stroke(
                        LinearGradient(
                            colors: [
                                Color.white.opacity(0.8),
                                Color(red: 0.96, green: 0.45, blue: 0.68).opacity(0.1)
                            ],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        ),
                        lineWidth: 0.5
                    )
            }
        }
        .containerBackground(for: .widget) {
            // Transparent background to work with system
            Color.clear
        }
    }
}

// Lock Screen Widget View - Simple text only
struct SolaceLockScreenWidgetView: View {
    var entry: Provider.Entry
    
    var body: some View {
        Text(entry.quote)
            .font(.system(size: 13, weight: .medium, design: .default))
            .multilineTextAlignment(.leading)
            .lineLimit(3)
            .foregroundColor(.primary)
    }
}

// This is the main widget configuration struct
struct SolaceWidget: Widget {
    let kind: String = "SolaceWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: Provider()) { entry in
            SolaceWidgetEntryView(entry: entry)
        }
        .configurationDisplayName("Daily Affirmation")
        .description("Display a daily affirmation from your Solace app.")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}

// Lock Screen Widget
struct SolaceLockScreenWidget: Widget {
    let kind: String = "SolaceLockScreenWidget"
    
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: Provider()) { entry in
            SolaceLockScreenWidgetView(entry: entry)
        }
        .configurationDisplayName("Solace Lock Screen")
        .description("Display affirmations on your lock screen.")
        .supportedFamilies([.accessoryRectangular])
    }
}

// This is the entry point that registers the widgets
@main
struct SolaceWidgets: WidgetBundle {
    var body: some Widget {
        SolaceWidget()
        SolaceLockScreenWidget()
    }
}
