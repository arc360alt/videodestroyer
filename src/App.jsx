import React, { useState, useRef, useEffect } from 'react';
import { Upload, Skull, Download, Play, AlertCircle, Loader2, Sliders } from 'lucide-react';

export default function VideoDestroyer() {
  const [file, setFile] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [outputUrl, setOutputUrl] = useState(null);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);

  // Destruction settings
  const [settings, setSettings] = useState({
    resolution: '640x360',
    quality: 31,
    fps: 15,
    audioBitrate: '8k',
    distortion: 'max'
  });

  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    const handleBeforeUnload = () => {
      if (outputUrl) {
        navigator.sendBeacon('https://vdapi.arc360hub.com/cleanup');
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (outputUrl) {
        fetch('https://vdapi.arc360hub.com/cleanup', { method: 'POST' });
      }
    };
  }, [outputUrl]);

  const cleanupServer = async () => {
    try {
      await fetch('https://vdapi.arc360hub.com/cleanup', { method: 'POST' });
    } catch (err) {
      console.error('Cleanup failed:', err);
    }
  };

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setOutputUrl(null);
      setError(null);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type.startsWith('video/')) {
      setFile(droppedFile);
      setOutputUrl(null);
      setError(null);
    }
  };

  const destroyVideo = async () => {
    if (!file) return;

    setProcessing(true);
    setProgress(0);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('video', file);
      formData.append('resolution', settings.resolution);
      formData.append('quality', settings.quality);
      formData.append('fps', settings.fps);
      formData.append('audioBitrate', settings.audioBitrate);
      formData.append('distortion', settings.distortion);

      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) return 90;
          const newProgress = prev + Math.random() * 15;
          return Math.min(Math.round(newProgress), 90);
        });
      }, 800);

      const response = await fetch('https://vdapi.arc360hub.com/destroy', {
        method: 'POST',
        body: formData
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to process video');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      
      setProgress(100);
      setOutputUrl(url);
      setProcessing(false);

    } catch (err) {
      setError('Failed to destroy video: ' + err.message);
      setProcessing(false);
      setProgress(0);
    }
  };

  const downloadVideo = () => {
    if (!outputUrl) return;
    const a = document.createElement('a');
    a.href = outputUrl;
    a.download = 'destroyed_' + (file?.name || 'video.mp4');
    a.click();
  };

  const presets = {
    mild: { resolution: '1280x720', quality: 23, fps: 24, audioBitrate: '128k', distortion: 'mild' },
    medium: { resolution: '854x480', quality: 27, fps: 20, audioBitrate: '64k', distortion: 'medium' },
    heavy: { resolution: '640x360', quality: 29, fps: 18, audioBitrate: '32k', distortion: 'heavy' },
    max: { resolution: '640x360', quality: 31, fps: 15, audioBitrate: '8k', distortion: 'max' }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-black text-white p-4 sm:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            
            <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-red-500 to-purple-500 bg-clip-text text-transparent">
              Video Destroyer
            </h1>

          </div>
          <p className="text-gray-400 text-base sm:text-lg px-4">
            We will do all the hard work for you, you can just sit back and watch your video be obliterated!
          </p>
        </div>

        {/* Upload Area */}
        {!file && (
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => fileInputRef.current?.click()}
            className="border-4 border-dashed border-purple-500 rounded-2xl p-12 sm:p-16 text-center cursor-pointer hover:border-red-500 hover:bg-purple-900/20 transition-all duration-300"
          >
            <Upload className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 text-purple-400" />
            <p className="text-lg sm:text-xl mb-2">Drop your video here or click to browse</p>
            <p className="text-gray-500 text-sm">Supports MP4, AVI, MOV, and more. 250MB Upload Limit.</p>
            <input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        )}

        {/* File Info & Settings */}
        {file && !outputUrl && (
          <div className="space-y-6">
            <div className="bg-gray-800/50 backdrop-blur rounded-2xl p-6 sm:p-8 border border-purple-500/30">
              <div className="flex items-center justify-between mb-6">
                <div className="flex-1 min-w-0">
                  <h3 className="text-xl font-semibold mb-1">Selected Video</h3>
                  <p className="text-gray-400 truncate">{file.name}</p>
                  <p className="text-sm text-gray-500">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <button
                  onClick={() => setFile(null)}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors ml-4"
                >
                  Remove
                </button>
              </div>

              {/* Destruction Presets */}
              <div className="mb-6">
                <h4 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Sliders className="w-5 h-5" />
                  Destruction Level
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {Object.entries(presets).map(([name, preset]) => (
                    <button
                      key={name}
                      onClick={() => setSettings(preset)}
                      className={`py-3 px-4 rounded-lg font-semibold transition-all ${
                        JSON.stringify(settings) === JSON.stringify(preset)
                          ? 'bg-gradient-to-r from-red-600 to-purple-600 scale-105'
                          : 'bg-gray-700 hover:bg-gray-600'
                      }`}
                    >
                      {name.charAt(0).toUpperCase() + name.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Advanced Settings */}
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="w-full py-2 text-purple-400 hover:text-purple-300 transition-colors text-sm font-semibold"
              >
                {showAdvanced ? '▼' : '▶'} Advanced Settings
              </button>

              {showAdvanced && (
                <div className="mt-4 space-y-4 bg-gray-900/50 rounded-xl p-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2">Resolution</label>
                    <select
                      value={settings.resolution}
                      onChange={(e) => setSettings({...settings, resolution: e.target.value})}
                      className="w-full bg-gray-700 rounded-lg px-3 py-2 text-white"
                    >
                      <option value="1920x1080">1920x1080 (HD)</option>
                      <option value="1280x720">1280x720 (HD)</option>
                      <option value="854x480">854x480 (SD)</option>
                      <option value="640x360">640x360 (Low)</option>
                      <option value="426x240">426x240 (Potato)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2">
                      Quality (Higher = More Destruction): {settings.quality}
                    </label>
                    <input
                      type="range"
                      min="15"
                      max="31"
                      value={settings.quality}
                      onChange={(e) => setSettings({...settings, quality: parseInt(e.target.value)})}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2">FPS: {settings.fps}</label>
                    <input
                      type="range"
                      min="10"
                      max="60"
                      value={settings.fps}
                      onChange={(e) => setSettings({...settings, fps: parseInt(e.target.value)})}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2">Audio Quality</label>
                    <select
                      value={settings.audioBitrate}
                      onChange={(e) => setSettings({...settings, audioBitrate: e.target.value})}
                      className="w-full bg-gray-700 rounded-lg px-3 py-2 text-white"
                    >
                      <option value="192k">192k (Good)</option>
                      <option value="128k">128k (Okay)</option>
                      <option value="64k">64k (Bad)</option>
                      <option value="32k">32k (Terrible)</option>
                      <option value="8k">8k (Nightmare)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2">Distortion Level</label>
                    <select
                      value={settings.distortion}
                      onChange={(e) => setSettings({...settings, distortion: e.target.value})}
                      className="w-full bg-gray-700 rounded-lg px-3 py-2 text-white"
                    >
                      <option value="none">None</option>
                      <option value="mild">Mild</option>
                      <option value="medium">Medium</option>
                      <option value="heavy">Heavy</option>
                      <option value="max">Maximum</option>
                    </select>
                  </div>
                </div>
              )}

              {!processing && (
                <button
                  onClick={destroyVideo}
                  className="w-full mt-6 py-4 bg-gradient-to-r from-red-600 to-purple-600 hover:from-red-500 hover:to-purple-500 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all duration-300 transform hover:scale-105"
                >
                  <Skull className="w-6 h-6" />
                  DESTROY THIS VIDEO
                  <Skull className="w-6 h-6" />
                </button>
              )}

              {processing && (
                <div className="space-y-4 mt-6">
                  <div className="flex items-center justify-center gap-3 text-xl">
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <span>Destroying your video...</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-4 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-red-500 to-purple-500 h-full transition-all duration-500 flex items-center justify-end px-2"
                      style={{ width: `${progress}%` }}
                    >
                      <span className="text-xs font-bold">{progress}%</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Output */}
        {outputUrl && (
          <div className="bg-gray-800/50 backdrop-blur rounded-2xl p-6 sm:p-8 border border-green-500/30 space-y-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <h3 className="text-xl sm:text-2xl font-bold text-green-400">Video Destroyed Successfully!</h3>
            </div>

            <video
              ref={videoRef}
              src={outputUrl}
              controls
              className="w-full rounded-xl bg-black"
            />

            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={downloadVideo}
                className="flex-1 py-3 bg-green-600 hover:bg-green-500 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors"
              >
                <Download className="w-5 h-5" />
                Download Destroyed Video
              </button>
              <button
                onClick={() => {
                  cleanupServer();
                  setFile(null);
                  setOutputUrl(null);
                  setProgress(0);
                }}
                className="flex-1 py-3 bg-purple-600 hover:bg-purple-500 rounded-xl font-bold transition-colors"
              >
                Destroy Another Video
              </button>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-900/30 border border-red-500 rounded-xl p-4 flex items-center gap-3 mt-6">
            <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0" />
            <p className="text-red-300">{error}</p>
          </div>
        )}

        {/* Info Sections */}
        <div className="mt-12 space-y-6">
          <div className="bg-gray-800/30 backdrop-blur rounded-2xl p-6 border border-gray-700">
            <h4 className="text-lg font-semibold mb-3 text-purple-400">Destruction Profiles Explained:</h4>
            <ul className="space-y-2 text-gray-300 text-sm">
              <li><strong className="text-green-400">Mild:</strong> Slightly compressed, still watchable</li>
              <li><strong className="text-yellow-400">Medium:</strong> Noticeably degraded quality and audio</li>
              <li><strong className="text-orange-400">Heavy:</strong> Heavily corrupted with artifacts</li>
              <li><strong className="text-red-400">Max:</strong> Complete annihilation - choppy, distorted, glitchy chaos</li>
            </ul>
          </div>

          <div className="bg-gray-800/30 backdrop-blur rounded-2xl p-6 border border-gray-700">
            <h4 className="text-lg font-semibold mb-3 text-purple-400">Important Notes:</h4>
            <ul className="space-y-2 text-gray-300 text-sm">
              <li>• If the video returns unchanged, the server is likely down</li>
              <li>• These videos can be VERY loud - turn down your volume first!</li>
              <li>• Upload limit: 250MB to save on storage</li>
              <li>• Processing time varies based on video length and settings</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-16 pt-8 border-t border-purple-900/50">
          <div className="flex flex-col items-center gap-3">
            <div className="flex items-center gap-2 text-gray-400">
              <span className="text-sm">Video Destroyer v2.0</span>
            </div>
            <p className="text-gray-500 text-xs text-center">
              Powered by FFmpeg • Max file size: 250MB
            </p>
            <p className="text-gray-600 text-xs">
              © 2020-2025 • Ark360 Studios
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}