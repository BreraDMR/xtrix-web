import { useCallback, useEffect, useRef, useState } from 'react'

export const MAX_RECORDING_SECONDS = 60
// first one the browser can do wins: Chrome/Firefox give webm/opus, Safari only mp4
const AUDIO_TYPES = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus', 'audio/ogg']

export type VoiceProblem = 'unsupported' | 'denied' | 'failed' | 'empty' | 'audio_too_large'

export function canRecordAudio(): boolean {
  return typeof window !== 'undefined' && typeof window.MediaRecorder === 'function'
    && typeof navigator.mediaDevices?.getUserMedia === 'function'
}

function pickType(): string | undefined {
  const check = window.MediaRecorder.isTypeSupported
  return typeof check === 'function' ? AUDIO_TYPES.find((type) => check.call(window.MediaRecorder, type)) : undefined
}

// Records one short clip from the microphone. The clip goes to onAudio once and isn't kept
// anywhere here; the microphone is released as soon as recording ends.
export function useVoiceRecorder(onAudio: (audio: Blob) => void) {
  const [recording, setRecording] = useState(false)
  const [seconds, setSeconds] = useState(0)
  const [problem, setProblem] = useState<VoiceProblem | null>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const discardRef = useRef(false)
  const startingRef = useRef(false)
  const aliveRef = useRef(true)
  const onAudioRef = useRef(onAudio)
  onAudioRef.current = onAudio

  const release = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = null
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    recorderRef.current = null
  }, [])

  const finish = useCallback((discard: boolean) => {
    const recorder = recorderRef.current
    if (!recorder || recorder.state === 'inactive') return
    discardRef.current = discard
    recorder.stop()
  }, [])

  const stop = useCallback(() => finish(false), [finish])
  const discard = useCallback(() => finish(true), [finish])

  const start = useCallback(async () => {
    if (recorderRef.current || startingRef.current) return
    setProblem(null)
    if (!canRecordAudio()) {
      setProblem('unsupported')
      return
    }
    startingRef.current = true
    let stream: MediaStream
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    } catch (error) {
      const name = (error as { name?: string } | null)?.name
      if (aliveRef.current) setProblem(name === 'NotAllowedError' || name === 'SecurityError' ? 'denied' : 'failed')
      return
    } finally {
      startingRef.current = false
    }
    if (!aliveRef.current) {
      stream.getTracks().forEach((track) => track.stop())
      return
    }
    const type = pickType()
    let recorder: MediaRecorder
    try {
      recorder = new window.MediaRecorder(stream, type ? { mimeType: type } : undefined)
    } catch {
      stream.getTracks().forEach((track) => track.stop())
      setProblem('failed')
      return
    }
    let chunks: Blob[] = []
    recorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) chunks.push(event.data)
    }
    recorder.onstop = () => {
      const parts = chunks
      chunks = []
      release()
      if (!aliveRef.current) return
      setRecording(false)
      if (discardRef.current) return
      const audio = new Blob(parts, { type: recorder.mimeType || type || 'audio/webm' })
      if (!audio.size) {
        setProblem('empty')
        return
      }
      onAudioRef.current(audio)
    }
    recorder.onerror = () => {
      discardRef.current = true
      if (recorder.state !== 'inactive') recorder.stop()
      else release()
      if (aliveRef.current) {
        setRecording(false)
        setProblem('failed')
      }
    }
    streamRef.current = stream
    recorderRef.current = recorder
    discardRef.current = false
    recorder.start()
    const startedAt = Date.now()
    setSeconds(0)
    setRecording(true)
    timerRef.current = setInterval(() => {
      const elapsed = Math.min(MAX_RECORDING_SECONDS, Math.floor((Date.now() - startedAt) / 1000))
      setSeconds(elapsed)
      if (elapsed >= MAX_RECORDING_SECONDS) finish(false)
    }, 250)
  }, [finish, release])

  // leaving the page mid-recording drops the clip and frees the microphone
  useEffect(() => {
    aliveRef.current = true
    return () => {
      aliveRef.current = false
      discardRef.current = true
      const recorder = recorderRef.current
      if (recorder && recorder.state !== 'inactive') recorder.stop()
      release()
    }
  }, [release])

  return { recording, seconds, problem, setProblem, start, stop, discard }
}
