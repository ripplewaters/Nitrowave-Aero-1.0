use serde::Serialize;
use std::sync::{Arc, Mutex};
use std::thread;
use std::time::Duration;
use wasapi::{initialize_mta, DeviceEnumerator, Direction, SampleType, StreamMode, WaveFormat};

#[derive(Clone, Copy, Default, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AudioFrame {
    pub bass: f32,
    pub mid: f32,
    pub treble: f32,
    pub level: f32,
    pub available: bool,
}

pub struct AudioState(pub Arc<Mutex<AudioFrame>>);

#[tauri::command]
pub fn audio_levels(state: tauri::State<'_, AudioState>) -> AudioFrame {
    state.0.lock().map(|frame| *frame).unwrap_or_default()
}

pub fn start_audio_loop(state: Arc<Mutex<AudioFrame>>) {
    thread::spawn(move || loop {
        if let Err(error) = capture_audio(&state) {
            eprintln!("Nitrowave audio capture: {error}");
            if let Ok(mut frame) = state.lock() {
                *frame = AudioFrame::default();
            }
        }
        thread::sleep(Duration::from_secs(2));
    });
}

fn capture_audio(state: &Arc<Mutex<AudioFrame>>) -> Result<(), Box<dyn std::error::Error>> {
    initialize_mta().ok()?;
    let enumerator = DeviceEnumerator::new()?;
    let device = enumerator.get_default_device(&Direction::Render)?;
    let mut client = device.get_iaudioclient()?;
    let format = WaveFormat::new(32, 32, &SampleType::Float, 48_000, 2, None);
    client.initialize_client(
        &format,
        &Direction::Capture,
        &StreamMode::PollingShared { autoconvert: true, buffer_duration_hns: 500_000 },
    )?;
    let capture = client.get_audiocaptureclient()?;
    client.start_stream()?;

    let mut bass_filter = 0.0_f32;
    let mut mid_filter = 0.0_f32;
    let mut smoothed = AudioFrame { available: true, ..AudioFrame::default() };
    loop {
        let mut had_data = false;
        while let Some(frames) = capture.get_next_packet_size()? {
            if frames == 0 { break; }
            let mut bytes = vec![0_u8; frames as usize * 8];
            let (read, _) = capture.read_from_device(&mut bytes)?;
            if read == 0 { break; }
            had_data = true;
            let mut bass_power = 0.0_f32;
            let mut mid_power = 0.0_f32;
            let mut treble_power = 0.0_f32;
            let mut total_power = 0.0_f32;
            for sample in bytes[..read as usize * 8].chunks_exact(8) {
                let left = f32::from_le_bytes(sample[0..4].try_into()?);
                let right = f32::from_le_bytes(sample[4..8].try_into()?);
                let mono = ((left + right) * 0.5).clamp(-1.0, 1.0);
                bass_filter += 0.0207 * (mono - bass_filter);
                mid_filter += 0.1770 * (mono - mid_filter);
                let mid = mid_filter - bass_filter;
                let treble = mono - mid_filter;
                bass_power += bass_filter * bass_filter;
                mid_power += mid * mid;
                treble_power += treble * treble;
                total_power += mono * mono;
            }
            let count = read as f32;
            let next = AudioFrame {
                bass: ((bass_power / count).sqrt() * 5.5).clamp(0.0, 1.0),
                mid: ((mid_power / count).sqrt() * 5.0).clamp(0.0, 1.0),
                treble: ((treble_power / count).sqrt() * 6.0).clamp(0.0, 1.0),
                level: ((total_power / count).sqrt() * 4.0).clamp(0.0, 1.0),
                available: true,
            };
            let attack = if next.level > smoothed.level { 0.65 } else { 0.24 };
            smoothed.bass += (next.bass - smoothed.bass) * attack;
            smoothed.mid += (next.mid - smoothed.mid) * attack;
            smoothed.treble += (next.treble - smoothed.treble) * attack;
            smoothed.level += (next.level - smoothed.level) * attack;
            if let Ok(mut frame) = state.lock() { *frame = smoothed; }
        }
        if !had_data {
            smoothed.bass *= 0.82;
            smoothed.mid *= 0.82;
            smoothed.treble *= 0.82;
            smoothed.level *= 0.82;
            if let Ok(mut frame) = state.lock() { *frame = smoothed; }
        }
        thread::sleep(Duration::from_millis(16));
    }
}
