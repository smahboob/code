import { Injectable } from '@angular/core';
import WavEncoder from 'wav-encoder';

@Injectable({
  providedIn: 'root'
})
export class AudioRecorderService {
  private audioContext = new AudioContext();
  private scriptProcessor!: ScriptProcessorNode;
  private mediaStream!: MediaStream;
  private input!: MediaStreamAudioSourceNode;
  private recordingData: Float32Array[] = [];

  private isRecording = false;
  private sampleRate = 44100;

  async startRecording(): Promise<void> {
    this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    this.input = this.audioContext.createMediaStreamSource(this.mediaStream);

    this.scriptProcessor = this.audioContext.createScriptProcessor(4096, 1, 1);
    this.input.connect(this.scriptProcessor);
    this.scriptProcessor.connect(this.audioContext.destination);

    this.scriptProcessor.onaudioprocess = (e: AudioProcessingEvent) => {
      if (!this.isRecording) return;
      const channelData = e.inputBuffer.getChannelData(0);
      this.recordingData.push(new Float32Array(channelData));
    };

    this.isRecording = true;
  }

  async stopRecording(): Promise<Blob> {
    this.isRecording = false;
    this.scriptProcessor.disconnect();
    this.input.disconnect();
    this.mediaStream.getTracks().forEach(track => track.stop());

    const combined = this.mergeBuffers(this.recordingData);
    const audioData = {
      sampleRate: this.sampleRate,
      channelData: [combined]
    };

    const wavBuffer = await WavEncoder.encode(audioData);
    return new Blob([wavBuffer], { type: 'audio/wav' });
  }

  private mergeBuffers(buffers: Float32Array[]): Float32Array {
    const length = buffers.reduce((acc, b) => acc + b.length, 0);
    const result = new Float32Array(length);
    let offset = 0;
    for (const buffer of buffers) {
      result.set(buffer, offset);
      offset += buffer.length;
    }
    return result;
  }
}
