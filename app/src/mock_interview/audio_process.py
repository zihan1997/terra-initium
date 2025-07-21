import pyaudio
import wave
import typing


class AudioProcess:
    def __init__(self,
                 file_name: str = "default.wav",
                 chunk: int = 1024,
                 audio_format: typing.Any = pyaudio.paInt16,
                 channels: int = 2,
                 rate: int = 44100
                 ):
        self.p = pyaudio.PyAudio()
        self.stream = None
        self.file_name = file_name
        self.chunk = chunk
        self.audio_format = audio_format
        self.channels = channels
        self.rate = rate

    def record(self):
        with wave.open(self.file_name, mode="wb") as wf:
            wf.setnchannels(self.channels)
            wf.setsampwidth(self.p.get_sample_size(self.audio_format))
            wf.setframerate(self.rate)

            stream = self.p.open(format=self.audio_format, channels=self.channels, rate=self.rate, input=True)

            print("recording")
            print("Recording... Press Ctrl+C to stop.")

            try:
                while True:
                    data = stream.read(self.chunk)
                    wf.writeframes(data)
            except KeyboardInterrupt:
                print("\nrecording interrupted")
            finally:
                # clean up
                stream.stop_stream()
                stream.close()
                self.p.terminate()
                print(f'Audio saved to {self.file_name}')
