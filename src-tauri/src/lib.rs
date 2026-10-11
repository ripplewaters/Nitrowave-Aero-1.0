#[cfg(windows)]
mod audio;
#[cfg(windows)]
mod media;

#[derive(serde::Serialize)]
#[serde(rename_all = "camelCase")]
struct PlatformCapabilities {
    platform: &'static str,
    system_audio: bool,
    system_media: bool,
}

#[tauri::command]
fn platform_capabilities() -> PlatformCapabilities {
    PlatformCapabilities {
        platform: std::env::consts::OS,
        system_audio: cfg!(windows),
        system_media: cfg!(windows),
    }
}

#[tauri::command]
fn open_youtube(app: tauri::AppHandle, video_id: String) -> Result<(), String> {
    use tauri_plugin_opener::OpenerExt;
    if video_id.len() < 6 || video_id.len() > 20 || !video_id.bytes().all(|c| c.is_ascii_alphanumeric() || c == b'_' || c == b'-') {
        return Err("Invalid YouTube video ID".into());
    }
    app.opener()
        .open_url(format!("https://www.youtube.com/watch?v={video_id}"), None::<&str>)
        .map_err(|error| error.to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let builder = tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![open_youtube, platform_capabilities]);
    #[cfg(windows)]
    let builder = builder
        .manage(audio::AudioState(std::sync::Arc::new(std::sync::Mutex::new(audio::AudioFrame::default()))))
        .invoke_handler(tauri::generate_handler![open_youtube, platform_capabilities, audio::audio_levels, media::media_session, media::media_control])
        .setup(|app| {
            use tauri::Manager;
            audio::start_audio_loop(app.state::<audio::AudioState>().0.clone());
            Ok(())
        });
    builder
        .run(tauri::generate_context!())
        .expect("error while running Nitrowave");
}
