import Foundation
import AppKit
import AVFoundation
import Speech

func emit(_ value: [String: Any]) {
    guard let data = try? JSONSerialization.data(withJSONObject: value),
          let line = String(data: data, encoding: .utf8) else { return }
    print(line)
    fflush(stdout)
}

final class DictationSession {
    private let engine = AVAudioEngine()
    private var recognizer: SFSpeechRecognizer?
    private var request: SFSpeechAudioBufferRecognitionRequest?
    private var task: SFSpeechRecognitionTask?
    private var recognizedText = DictationTranscript()
    private var transcript: String { recognizedText.text }
    private var generation = 0
    private let requestLock = NSLock()
    private var listening = false
    private var ending = false
    private var finished = false
    private var lastLevelAt = Date.distantPast

    func start() {
        guard let recognizer = SFSpeechRecognizer(locale: Locale(identifier: "zh-CN")),
              recognizer.isAvailable, recognizer.supportsOnDeviceRecognition else {
            fail("本机普通话识别暂不可用。请在系统设置中启用中文听写并下载语言资源后重试。")
            return
        }
        self.recognizer = recognizer
        SFSpeechRecognizer.requestAuthorization { status in
            DispatchQueue.main.async {
                guard !self.finished else { return }
                guard status == .authorized else {
                    self.fail("未获得语音识别权限。请到系统设置 → 隐私与安全性 → 语音识别中允许简游。")
                    return
                }
                AVCaptureDevice.requestAccess(for: .audio) { allowed in
                    DispatchQueue.main.async {
                        guard !self.finished else { return }
                        guard allowed else {
                            self.fail("未获得麦克风权限。请到系统设置 → 隐私与安全性 → 麦克风中允许简游。")
                            return
                        }
                        self.beginAudio()
                    }
                }
            }
        }
    }

    private func beginAudio() {
        guard !finished, !ending else { return }
        startRecognitionSegment()
        let input = engine.inputNode
        let format = input.outputFormat(forBus: 0)
        guard format.sampleRate > 0, format.channelCount > 0 else {
            fail("没有找到可用麦克风。请连接麦克风后重试。")
            return
        }
        input.installTap(onBus: 0, bufferSize: 1024, format: format) { buffer, _ in
            self.requestLock.lock()
            self.request?.append(buffer)
            self.requestLock.unlock()
            guard let samples = buffer.floatChannelData?[0], buffer.frameLength > 0 else { return }
            var sum: Float = 0
            let count = Int(buffer.frameLength)
            for index in stride(from: 0, to: count, by: 8) { sum += samples[index] * samples[index] }
            let level = min(1, sqrt(sum / Float(max(1, count / 8))) * 9)
            DispatchQueue.main.async {
                guard !self.finished, !self.ending, Date().timeIntervalSince(self.lastLevelAt) > 0.08 else { return }
                self.lastLevelAt = Date()
                emit(["type": "level", "level": level])
            }
        }
        do {
            engine.prepare()
            try engine.start()
            listening = true
            emit(["type": "listening"])
        } catch {
            input.removeTap(onBus: 0)
            fail("无法开启麦克风。请检查输入设备是否被占用后重试。")
        }
    }

    private func startRecognitionSegment() {
        guard !finished, !ending else { return }
        generation += 1
        let currentGeneration = generation
        let previousTask = task
        task = nil
        requestLock.lock()
        let previousRequest = self.request
        self.request = nil
        requestLock.unlock()
        previousRequest?.endAudio()
        previousTask?.cancel()
        let request = SFSpeechAudioBufferRecognitionRequest()
        request.requiresOnDeviceRecognition = true
        request.shouldReportPartialResults = true
        request.taskHint = .dictation
        if #available(macOS 13, *) { request.addsPunctuation = true }
        requestLock.lock()
        self.request = request
        requestLock.unlock()
        task = recognizer?.recognitionTask(with: request) { result, error in
            DispatchQueue.main.async {
                guard !self.finished, self.generation == currentGeneration else { return }
                if let result = result {
                    let part = result.bestTranscription.formattedString
                    let utteranceComplete = self.recognizedText.receive(
                        part, isFinal: result.isFinal,
                        speechDuration: result.speechRecognitionMetadata?.speechDuration
                    )
                    emit(["type": "transcript", "text": self.transcript])
                    if utteranceComplete {
                        if self.ending { self.finish() }
                        else {
                            // Completing one utterance must not end the microphone session.
                            self.startRecognitionSegment()
                        }
                        return
                    }
                }
                if let error = error as NSError? {
                    if self.ending { self.finish() }
                    else if error.code == 1110 {
                        // Silence may end a recognition task; keep the microphone session open.
                        self.recognizedText.commitSegment()
                        self.generation += 1
                        DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) { self.startRecognitionSegment() }
                    } else {
                        self.fail("本机语音识别暂时中断，请重试。已识别文字会保留。")
                    }
                }
            }
        }
    }

    func stop() {
        guard !finished, !ending else { return }
        ending = true
        stopAudio()
        request?.endAudio()
        emit(["type": "stopping"])
        // Some local recognizers never send a final result after endAudio.
        DispatchQueue.main.asyncAfter(deadline: .now() + 4) { self.finish() }
    }

    func cancel() {
        guard !finished else { return }
        finished = true
        stopAudio()
        task?.cancel()
        emit(["type": "finished", "text": transcript])
        exit(0)
    }

    private func stopAudio() {
        if listening {
            listening = false
            engine.stop()
            engine.inputNode.removeTap(onBus: 0)
        }
    }

    private func finish() {
        guard !finished else { return }
        finished = true
        stopAudio()
        task?.cancel()
        emit(["type": "finished", "text": transcript])
        exit(0)
    }

    private func fail(_ message: String) {
        guard !finished else { return }
        finished = true
        stopAudio()
        task?.cancel()
        emit(["type": "error", "message": message])
        exit(1)
    }
}

@main
enum SpeechHelperMain {
    static func main() {
        if CommandLine.arguments.contains("--check") {
            let recognizer = SFSpeechRecognizer(locale: Locale(identifier: "zh-CN"))
            emit(["available": recognizer?.isAvailable ?? false,
                  "onDevice": recognizer?.supportsOnDeviceRecognition ?? false,
                  "locale": "zh-CN"])
            exit(0)
        }
        let application = NSApplication.shared
        application.setActivationPolicy(.accessory)
        let session = DictationSession()
        DispatchQueue.global(qos: .userInitiated).async {
            while let line = readLine() {
                DispatchQueue.main.async {
                    if line == "stop" { session.stop() }
                    if line == "cancel" { session.cancel() }
                }
            }
            DispatchQueue.main.async { session.cancel() }
        }
        DispatchQueue.main.async { session.start() }
        RunLoop.main.run()
    }
}
