import wave
import struct
import math
import os

def generate_pop(filename):
    sr = 44100
    duration = 0.11
    num_samples = int(sr * duration)
    
    with wave.open(filename, 'wb') as w:
        w.setnchannels(1) # mono
        w.setsampwidth(2) # 16-bit PCM
        w.setframerate(sr)
        
        for i in range(num_samples):
            t = i / sr
            
            # Quick frequency sweep from 140Hz to 520Hz exponentially
            if t <= 0.1:
                phase = 2 * math.pi * (140 * t + 0.5 * (520 - 140) * (t**2) / 0.1)
            else:
                phase = 2 * math.pi * (140 * t + 0.5 * (520 - 140) * (0.1**2) / 0.1 + 520 * (t - 0.1))
                
            val = math.sin(phase)
            
            # Volume envelope: fast attack (15ms), exponential decay
            if t <= 0.015:
                gain = 0.25 * (t / 0.015)
            else:
                gain = 0.25 * math.exp(-35 * (t - 0.015))
                
            sample = int(val * gain * 32767)
            sample = max(-32768, min(32767, sample))
            w.writeframes(struct.pack('<h', sample))

def generate_success_chime(filename):
    sr = 44100
    duration = 0.6
    num_samples = int(sr * duration)
    
    with wave.open(filename, 'wb') as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(sr)
        
        for i in range(num_samples):
            t = i / sr
            val = 0
            
            # Tone 1: C5 (523.25 Hz)
            t1 = t
            if t1 >= 0 and t1 <= 0.4:
                # Triangle wave shape: 2/pi * arcsin(sin(2*pi*f*t))
                phase1 = 2 * math.pi * 523.25 * t1
                tone1 = (2 / math.pi) * math.asin(math.sin(phase1))
                
                if t1 <= 0.02:
                    gain1 = 0.15 * (t1 / 0.02)
                else:
                    gain1 = 0.15 * math.exp(-12 * (t1 - 0.02))
                val += tone1 * gain1
                
            # Tone 2: G5 (783.99 Hz) delayed by 0.08s
            t2 = t - 0.08
            if t2 >= 0 and t2 <= 0.5:
                phase2 = 2 * math.pi * 783.99 * t2
                tone2 = (2 / math.pi) * math.asin(math.sin(phase2))
                
                if t2 <= 0.02:
                    gain2 = 0.15 * (t2 / 0.02)
                else:
                    gain2 = 0.15 * math.exp(-10 * (t2 - 0.02))
                val += tone2 * gain2
                
            sample = int(val * 32767)
            sample = max(-32768, min(32767, sample))
            w.writeframes(struct.pack('<h', sample))

def generate_notification_chime(filename):
    sr = 44100
    duration = 0.5
    num_samples = int(sr * duration)
    
    with wave.open(filename, 'wb') as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(sr)
        
        for i in range(num_samples):
            t = i / sr
            val = 0
            
            # Tone 1: E5 (659.25 Hz)
            t1 = t
            if t1 >= 0 and t1 <= 0.3:
                phase1 = 2 * math.pi * 659.25 * t1
                tone1 = math.sin(phase1)
                
                if t1 <= 0.03:
                    gain1 = 0.12 * (t1 / 0.03)
                else:
                    gain1 = 0.12 * math.exp(-15 * (t1 - 0.03))
                val += tone1 * gain1
                
            # Tone 2: A5 (880.00 Hz) delayed by 0.07s
            t2 = t - 0.07
            if t2 >= 0 and t2 <= 0.4:
                phase2 = 2 * math.pi * 880.00 * t2
                tone2 = math.sin(phase2)
                
                if t2 <= 0.03:
                    gain2 = 0.12 * (t2 / 0.03)
                else:
                    gain2 = 0.12 * math.exp(-12 * (t2 - 0.03))
                val += tone2 * gain2
                
            sample = int(val * 32767)
            sample = max(-32768, min(32767, sample))
            w.writeframes(struct.pack('<h', sample))

if __name__ == '__main__':
    # Ensure output folder exists
    os.makedirs('sounds', exist_ok=True)
    
    print("Generating pop.wav...")
    generate_pop(os.path.join('sounds', 'pop.wav'))
    
    print("Generating success.wav...")
    generate_success_chime(os.path.join('sounds', 'success.wav'))
    
    print("Generating notification.wav...")
    generate_notification_chime(os.path.join('sounds', 'notification.wav'))
    
    print("All sounds generated successfully!")
