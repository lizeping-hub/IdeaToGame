import Foundation

@main
struct DictationTranscriptTests {
    static func main() {
        if CommandLine.arguments.contains("--conversation-json") {
            var transcript = DictationTranscript()
            var snapshots: [String] = []
            transcript.receive("做一个小猫游戏")
            snapshots.append(transcript.text)
            transcript.receive("做一个小猫游戏。", speechDuration: 2.4)
            snapshots.append(transcript.text)
            transcript.receive("")
            snapshots.append(transcript.text)
            transcript.receive("还要收集")
            snapshots.append(transcript.text)
            transcript.receive("还要收集星星。", speechDuration: 1.8)
            snapshots.append(transcript.text)
            transcript.receive("做一个小猫游戏。", speechDuration: 2.1)
            snapshots.append(transcript.text)
            transcript.receive("", isFinal: true)
            snapshots.append(transcript.text)
            print(String(data: try! JSONSerialization.data(withJSONObject: snapshots), encoding: .utf8)!)
            return
        }
        var transcript = DictationTranscript()
        assert(transcript.update("做一个小猫游戏") == "做一个小猫游戏")
        assert(transcript.update("") == "做一个小猫游戏", "Empty partial erased recognized text")
        assert(transcript.update(" \n ") == "做一个小猫游戏", "Whitespace erased recognized text")
        transcript.commitSegment() // The recognizer closes a segment after silence.
        assert(transcript.update("") == "做一个小猫游戏")
        transcript.commitSegment() // Another silent segment cannot empty the session.
        assert(transcript.text == "做一个小猫游戏")
        assert(transcript.update("还能收集金币") == "做一个小猫游戏还能收集金币")
        assert(transcript.update("") == "做一个小猫游戏还能收集金币")
        // Nonempty revisions are legitimate and should replace the current hypothesis.
        assert(transcript.update("收集星星") == "做一个小猫游戏收集星星")
        transcript.commitSegment()
        assert(transcript.text == "做一个小猫游戏收集星星")
        assert(DictationTranscript().text.isEmpty, "A new session inherited the previous text")
        var conversation = DictationTranscript()
        assert(!conversation.receive("做一个小猫游戏"))
        // Apple's on-device completion callback can carry metadata while isFinal is false.
        assert(conversation.receive("做一个小猫游戏。", isFinal: false, speechDuration: 2.4))
        assert(!conversation.receive("", speechDuration: nil))
        assert(!conversation.receive("还要收集"))
        assert(conversation.text == "做一个小猫游戏。还要收集", "A later utterance erased the first")
        assert(conversation.receive("还要收集星星。", speechDuration: 1.8))
        assert(conversation.receive("做一个小猫游戏。", speechDuration: 2.1))
        assert(conversation.text == "做一个小猫游戏。还要收集星星。做一个小猫游戏。", "A repeated sentence is valid dictation")
        assert(conversation.receive("", isFinal: true))
        assert(conversation.text == "做一个小猫游戏。还要收集星星。做一个小猫游戏。")
        var correction = DictationTranscript()
        assert(!correction.receive("小狗", speechDuration: 0))
        assert(!correction.receive("小猫", speechDuration: nil))
        assert(correction.text == "小猫", "An in-progress correction was appended twice")
        print("Native transcript regression passed: silence, empty results, multiple segments, corrections, new session")
    }
}
