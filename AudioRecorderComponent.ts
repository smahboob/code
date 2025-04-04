import { Component } from '@angular/core';
import { AudioRecorderService } from '../audio-recorder.service';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-audio-recorder',
  templateUrl: './audio-recorder.component.html'
})
export class AudioRecorderComponent {
  isRecording = false;
  audioUrl: string | null = null;

  constructor(private recorder: AudioRecorderService, private http: HttpClient) {}

  async start() {
    this.isRecording = true;
    await this.recorder.startRecording();
  }

  async stop() {
    this.isRecording = false;
    const blob = await this.recorder.stopRecording();
    this.audioUrl = URL.createObjectURL(blob);

    const formData = new FormData();
    formData.append('file', blob, 'recording.wav');

    this.http.post('http://localhost:5000/upload', formData).subscribe({
      next: res => console.log('Uploaded successfully', res),
      error: err => console.error('Upload failed', err)
    });
  }
}
