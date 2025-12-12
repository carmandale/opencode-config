# Swift & SwiftUI Patterns for visionOS

Modern Swift patterns for visionOS 26, SwiftUI, RealityKit. Curated from expert sources to prevent common AI-generated code issues and establish best practices.

## Observable & State Management

### Always Use @State for @Observable Classes

When initializing `@Observable` classes in SwiftUI views, **always** use `@State`. Without it, the model gets recreated every time the parent view's body runs.

```swift
// WRONG - model recreated on parent body evaluation
struct CountView: View {
    private let dataModel = DataModel()  // Recreated every time!
    var body: some View { ... }
}

// CORRECT - SwiftUI manages lifecycle
struct CountView: View {
    @State private var dataModel = DataModel()
    var body: some View { ... }
}
```

**Why it matters:** View structs are ephemeral - they exist only to describe the hierarchy. `@State` ties the model to the actual view lifecycle managed by SwiftUI.

### Defer Heavy Observable Initialization

Even with `@State`, the initializer expression runs every time the view struct is created. For expensive initialization, defer to `.task`:

```swift
struct ContentView: View {
    @State private var dataModel: DataModel?

    var body: some View {
        Text(dataModel?.text ?? "Loading...")
            .task {
                dataModel = DataModel()  // Runs once when view appears
            }
    }
}

// With changing dependencies - use task(id:)
struct DetailView: View {
    let itemID: UUID
    @State private var model: ItemModel?

    var body: some View {
        ItemContent(model: model)
            .task(id: itemID) {
                model = ItemModel(id: itemID)  // Re-runs when itemID changes
            }
    }
}
```

### App-Wide State in App Struct

For shared state across all scenes (iPad/Mac multi-window), initialize in `App` struct and inject via environment:

```swift
@main
struct MyApp: App {
    @State private var appState = AppState()

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environment(appState)
        }
    }
}

struct ContentView: View {
    @Environment(AppState.self) private var appState
    var body: some View { ... }
}
```

### @Observable vs ObservableObject Performance

`@Observable` only re-renders views that read changed properties. `ObservableObject` re-renders all views that reference it when _any_ `@Published` property changes.

```swift
// With @Observable - only Count1 re-renders when count1 changes
@Observable class DataModel {
    var count1 = 0
    var count2 = 0
}

// With ObservableObject - BOTH views re-render on ANY change
class DataModel: ObservableObject {
    @Published var count1 = 0
    @Published var count2 = 0
}
```

### Creating Bindings from @Observable

Use `@Bindable` to create bindings from environment-injected observables:

```swift
struct ContentView: View {
    @Environment(DataModel.self) private var dataModel

    var body: some View {
        @Bindable var dataModel = dataModel  // Must be at top of body

        TextField("Name", text: $dataModel.name)
    }
}
```

## Concurrency Patterns

### Swift 6.2 Approachable Concurrency

Enable in build settings for new projects:

- **Default Actor Isolation**: `MainActor`
- **Approachable Concurrency**: Yes

With main actor isolation by default, you don't need `@MainActor` annotations everywhere - it's the default.

### Actor State Snapshots

Snapshot mutable actor state before awaits to avoid mid-flight changes:

```swift
actor Networking {
    var apiKey: String?

    func makeRequest() async throws -> Data {
        // WRONG - apiKey could change during await
        guard let key = apiKey else { throw Error.noKey }
        return try await urlSession.data(for: request(key: key))

        // CORRECT - snapshot before await
        let key = apiKey  // Capture now
        guard let key else { throw Error.noKey }
        return try await urlSession.data(for: request(key: key))
    }
}
```

### Offload CPU Work Properly

Keep heavy work off actors. Use `Task.detached` or `Task(priority:)` from outside:

```swift
// WRONG - heavy work inside actor
actor ImageProcessor {
    func process(_ image: UIImage) async -> UIImage {
        return heavyProcessing(image)  // Blocks actor
    }
}

// CORRECT - offload pure work
struct ImageUtils {  // Stateless utility
    static func process(_ image: UIImage) -> UIImage {
        heavyProcessing(image)
    }
}

// Call from background task
Task.detached(priority: .userInitiated) {
    let result = ImageUtils.process(image)
    await MainActor.run { self.processedImage = result }
}
```

### Replace DispatchQueue with async/await

```swift
// WRONG - legacy pattern
DispatchQueue.main.async {
    self.updateUI()
}

// CORRECT - modern concurrency
await MainActor.run {
    updateUI()
}

// Or if already in async context on main actor
@MainActor
func handleResult() {
    updateUI()  // Already on main actor
}
```

### Task.sleep Duration

```swift
// WRONG - deprecated nanoseconds API
try await Task.sleep(nanoseconds: 1_000_000_000)

// CORRECT - Duration API
try await Task.sleep(for: .seconds(1))
try await Task.sleep(for: .milliseconds(500))
```

## AI-Generated Code Fixes

Common issues in AI-generated Swift code and their fixes:

### Deprecated APIs

| AI Generates                    | Replace With                                          |
| ------------------------------- | ----------------------------------------------------- |
| `foregroundColor()`             | `foregroundStyle()`                                   |
| `cornerRadius()`                | `clipShape(.rect(cornerRadius:))`                     |
| `NavigationView`                | `NavigationStack`                                     |
| `ObservableObject`              | `@Observable` macro                                   |
| `onChange(of:) { newValue in }` | `onChange(of:) { old, new in }` or `onChange(of:) {}` |
| `tabItem()`                     | `Tab` API                                             |

### GeometryReader Overuse

AI loves `GeometryReader`. Prefer alternatives:

```swift
// WRONG - GeometryReader for simple relative sizing
GeometryReader { geo in
    Text("Hello")
        .frame(width: geo.size.width * 0.8)
}

// CORRECT - containerRelativeFrame
Text("Hello")
    .containerRelativeFrame(.horizontal) { width, _ in
        width * 0.8
    }

// CORRECT - visualEffect for position-based effects
Text("Hello")
    .visualEffect { content, proxy in
        content.offset(y: proxy.frame(in: .global).minY * 0.5)
    }
```

### Button Accessibility

```swift
// WRONG - image-only button (bad for VoiceOver)
Button(action: doSomething) {
    Image(systemName: "plus")
}

// CORRECT - inline label API
Button("Add Item", systemImage: "plus", action: doSomething)

// CORRECT - explicit label
Button(action: doSomething) {
    Label("Add Item", systemImage: "plus")
}
```

### Replace onTapGesture with Button

```swift
// WRONG - tap gesture (bad for accessibility, eye tracking)
Text("Tap me")
    .onTapGesture { doSomething() }

// CORRECT - actual button
Button("Tap me", action: doSomething)
```

### NavigationLink Destinations

```swift
// WRONG - inline destination (performance issue in lists)
List(items) { item in
    NavigationLink(destination: DetailView(item: item)) {
        ItemRow(item: item)
    }
}

// CORRECT - navigationDestination
List(items) { item in
    NavigationLink(value: item) {
        ItemRow(item: item)
    }
}
.navigationDestination(for: Item.self) { item in
    DetailView(item: item)
}
```

### Dynamic Type Fonts

```swift
// WRONG - fixed font sizes
.font(.system(size: 24))

// CORRECT - Dynamic Type
.font(.title)
.font(.body)
.font(.headline)

// iOS 26+ scaled fonts
.font(.body.scaled(by: 1.5))
```

### Number Formatting

```swift
// WRONG - C-style formatting
Text(String(format: "%.2f", value))

// CORRECT - type-safe formatting
Text(value, format: .number.precision(.fractionLength(2)))
```

### ForEach with Enumerated

```swift
// WRONG - unnecessary Array conversion
ForEach(Array(items.enumerated()), id: \.element.id) { ... }

// CORRECT - direct enumerated
ForEach(items.enumerated(), id: \.element.id) { index, item in
    ...
}
```

### Documents Directory

```swift
// WRONG - verbose path construction
FileManager.default.urls(for: .documentDirectory, in: .userDomainMask).first!

// CORRECT - modern API
URL.documentsDirectory
```

### ImageRenderer vs UIGraphicsImageRenderer

```swift
// WRONG - UIKit renderer for SwiftUI
let renderer = UIGraphicsImageRenderer(size: size)
let image = renderer.image { context in ... }

// CORRECT - SwiftUI ImageRenderer
let renderer = ImageRenderer(content: mySwiftUIView)
if let image = renderer.uiImage { ... }
```

## Xcode Project Setup

### New Project Checklist

1. **Enable Approachable Concurrency** - Build Settings → Default Actor Isolation = MainActor
2. **Switch to Swift 6** - Don't stay on Swift 5 default
3. **Remove unused targets** - Delete UI test target if not using
4. **Add App Group early** - Prevents painful migration later for widgets/extensions
5. **Set compilation mode** - Incremental for debug, whole-module for release
6. **Establish folder structure** - Views, Models, Services, Features

### Build Settings Worth Checking

- **Compilation Mode**: Incremental (Debug), Whole Module (Release)
- **Debug Optimization**: None (for reliable debugging)
- **Upcoming Features**: Review and enable intentionally

## Service Architecture Pattern

From RetroDiffusionApp - clean separation of actors and observable clients:

```swift
// Actor for isolation-critical work (networking, persistence)
actor Networking {
    func fetch(_ request: URLRequest) async throws -> Data { ... }
}

// Observable client wraps actor for SwiftUI
@MainActor @Observable
class NetworkClient {
    private let networking = Networking()
    var isLoading = false

    func fetch(_ request: URLRequest) async throws -> Data {
        isLoading = true
        defer { isLoading = false }
        return try await networking.fetch(request)
    }
}

// Stateless utilities for pure work
struct ImageUtils {
    static func resize(_ image: UIImage, to size: CGSize) -> UIImage { ... }
}

// Environment injection at app level
@main
struct MyApp: App {
    @State private var networkClient = NetworkClient()
    @State private var libraryClient = LibraryClient()

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environment(networkClient)
                .environment(libraryClient)
        }
    }
}
```

**Key principles:**

- Actors only where state isolation matters (networking, database)
- `@MainActor @Observable` clients for SwiftUI binding
- Stateless utilities for CPU-heavy pure functions
- Environment injection from App struct
- Wire dependencies explicitly with setter methods

## Core Data with SwiftData Patterns

Using custom actor executors to get SwiftData-like concurrency in Core Data (iOS 17+):

```swift
@NSModelActor
actor DataHandler {
    func updateItem(identifier: NSManagedObjectID, timestamp: Date) throws {
        guard let item = self[identifier, as: Item.self] else {
            throw MyError.objectNotExist
        }
        item.timestamp = timestamp
        try modelContext.save()
    }
}

// Usage
let handler = DataHandler(container: persistentContainer)
try await handler.updateItem(identifier: objectID, timestamp: Date())
```

This provides SwiftData-style actor isolation for Core Data operations.

## View Composition

### Split Views, Not Computed Properties

AI often creates computed properties for view sections. This breaks `@Observable` optimization:

```swift
// WRONG - computed properties don't benefit from @Observable tracking
struct ContentView: View {
    @Environment(Model.self) var model

    var headerSection: some View {
        Text(model.title)  // Always re-evaluated
    }

    var body: some View {
        VStack {
            headerSection
            bodySection
        }
    }
}

// CORRECT - separate views get independent tracking
struct ContentView: View {
    var body: some View {
        VStack {
            HeaderView()
            BodyView()
        }
    }
}

struct HeaderView: View {
    @Environment(Model.self) var model
    var body: some View {
        Text(model.title)  // Only re-renders when title changes
    }
}
```

### One Type Per File

AI loves putting multiple types in one file. This hurts build times:

```swift
// WRONG - multiple types in one file
// Models.swift
struct User { ... }
struct Post { ... }
struct Comment { ... }

// CORRECT - one type per file
// User.swift
struct User { ... }

// Post.swift
struct Post { ... }
```

## Sources

- [Nil Coalescing: Initializing Observable Classes](https://nilcoalescing.com/blog/InitializingObservableClassesWithinTheSwiftUIHierarchy/)
- [Nil Coalescing: Observable in SwiftUI](https://nilcoalescing.com/blog/ObservableInSwiftUI/)
- [Hacking with Swift: What to Fix in AI-Generated Swift Code](https://www.hackingwithswift.com/articles/281/what-to-fix-in-ai-generated-swift-code)
- [SwiftLee: 7 Changes for Every New Xcode Project](https://www.avanderlee.com/xcode/the-7-changes-i-do-for-every-new-xcode-project/)
- [Fat Bob Man: Core Data Reform with SwiftData Patterns](https://fatbobman.com/en/posts/core-data-reform-achieving-elegant-concurrency-operations-like-swiftdata/)
- [Tuist: Teaching AI to Read Xcode Builds](https://tuist.dev/blog/2025/11/27/teaching-ai-to-read-xcode-builds)
- [RetroDiffusionApp AGENTS.MD](https://github.com/Dimillian/RetroDiffusionApp/blob/main/AGENTS.MD)
