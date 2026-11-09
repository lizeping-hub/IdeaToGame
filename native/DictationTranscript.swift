import Foundation

/// A silence/empty callback must never replace a nonempty recognition hypothesis.
struct DictationTranscript {
    private var committed = ""
    private var currentSegment = ""

    var text: String { committed + currentSegment }

    @discardableResult
    mutating func update(_ hypothesis: String) -> String {
        if !hypothesis.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
            currentSegment = hypothesis
        }
        return text
    }

    /// On-device recognition can finish an utterance without setting isFinal.
    /// Its nonzero speech-duration metadata marks the stable utterance boundary.
    @discardableResult
    mutating func receive(_ hypothesis: String, isFinal: Bool = false, speechDuration: Double? = nil) -> Bool {
        update(hypothesis)
        let complete = isFinal || (speechDuration.map { $0.isFinite && $0 > 0 } ?? false)
        if complete { commitSegment() }
        return complete
    }

    mutating func commitSegment() {
        committed = text
        currentSegment = ""
    }
}
