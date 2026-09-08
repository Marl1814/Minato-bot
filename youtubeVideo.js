function buildYoutubeHtml() {
    return `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { 
        background: #0d0f17; 
        color: #fff; 
        font-family: system-ui, -apple-system, sans-serif; 
        display: flex; 
        flex-direction: column; 
        align-items: center; 
        justify-content: center; 
        min-height: 100vh; 
        padding: 10px; 
    }
    .player-card {
        width: 100%;
        max-width: 480px;
        background: #1a1d29;
        border: 2px solid #8b5cf6;
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 4px 15px rgba(0,0,0,0.5);
    }
    .iframe-wrapper {
        position: relative;
        width: 100%;
        padding-top: 56.25%; /* Relación de aspecto 16:9 */
    }
    iframe {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        border: none;
    }
    .info {
        padding: 12px;
        text-align: center;
    }
    .title {
        font-size: 14px;
        font-weight: bold;
        color: #a7f3d0;
    }
    .subtitle {
        font-size: 11px;
        color: #9ca3af;
        margin-top: 4px;
    }
</style>
</head>
<body>

    <div class="player-card">
        <div class="iframe-wrapper">
            <iframe 
                src="https://www.youtube-nocookie.com/embed/9w4mtmIgHpU?autoplay=1&rel=0&playsinline=1" 
                title="YouTube Video"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                allowfullscreen>
            </iframe>
        </div>
        <div class="info">
            <div class="title">🌙 Yofukashi no Uta OP Full</div>
            <div class="subtitle">Daten - Sub. Español 『AMV』</div>
        </div>
    </div>

</body>
</html>`;
}

module.exports = { buildYoutubeHtml };
