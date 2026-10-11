// "Now playing" from any app (Spotify, a browser tab, Media Player, ...) through Windows'
// System Media Transport Controls, the same source the volume flyout uses. Nitrowave never
// touches the other app's stream or account: it reads the metadata Windows publishes and
// sends the same play/pause/skip commands as a keyboard's media keys.
use serde::{Deserialize, Serialize};
use windows::Media::Control::{
    GlobalSystemMediaTransportControlsSession as Session,
    GlobalSystemMediaTransportControlsSessionManager as Manager,
    GlobalSystemMediaTransportControlsSessionPlaybackStatus as Status,
};

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct MediaInfo {
    title: String,
    artist: String,
    app: String,
    playing: bool,
    position: f64,
    duration: f64,
}

#[derive(Deserialize, Clone, Copy)]
#[serde(rename_all = "camelCase")]
pub enum MediaAction {
    Toggle,
    Next,
    Previous,
    Restart,
}

// Metadata comes from other programs; cap it so a hostile or broken app cannot flood the UI.
fn clip(value: windows::core::HSTRING, max: usize) -> String {
    value.to_string_lossy().chars().filter(|c| !c.is_control()).take(max).collect()
}

const TICKS_PER_SECOND: f64 = 10_000_000.0;

fn current_session() -> windows::core::Result<Session> {
    wasapi::initialize_mta().ok()?;
    Manager::RequestAsync()?.join()?.GetCurrentSession()
}

fn read_session() -> windows::core::Result<MediaInfo> {
    let session = current_session()?;
    let properties = session.TryGetMediaPropertiesAsync()?.join()?;
    let playing = session.GetPlaybackInfo()?.PlaybackStatus()? == Status::Playing;
    let (position, duration) = match session.GetTimelineProperties() {
        Ok(timeline) => {
            let start = timeline.StartTime().map(|t| t.Duration).unwrap_or(0);
            let end = timeline.EndTime().map(|t| t.Duration).unwrap_or(0);
            let position = timeline.Position().map(|t| t.Duration).unwrap_or(0);
            (((position - start).max(0)) as f64 / TICKS_PER_SECOND, ((end - start).max(0)) as f64 / TICKS_PER_SECOND)
        }
        Err(_) => (0.0, 0.0),
    };
    Ok(MediaInfo {
        title: clip(properties.Title()?, 160),
        artist: clip(properties.Artist()?, 160),
        app: clip(session.SourceAppUserModelId()?, 160),
        playing,
        position,
        duration,
    })
}

fn control(action: MediaAction) -> windows::core::Result<bool> {
    let session = current_session()?;
    match action {
        MediaAction::Toggle => session.TryTogglePlayPauseAsync()?.join(),
        MediaAction::Next => session.TrySkipNextAsync()?.join(),
        MediaAction::Previous => session.TrySkipPreviousAsync()?.join(),
        MediaAction::Restart => session.TryChangePlaybackPositionAsync(0)?.join(),
    }
}

// WinRT calls block until the other app answers, so they run off the main thread.
#[tauri::command]
pub async fn media_session() -> Option<MediaInfo> {
    tauri::async_runtime::spawn_blocking(|| read_session().ok()).await.ok().flatten()
}

#[tauri::command]
pub async fn media_control(action: MediaAction) -> Result<bool, String> {
    tauri::async_runtime::spawn_blocking(move || control(action).map_err(|error| error.message().to_string()))
        .await
        .map_err(|error| error.to_string())?
}
