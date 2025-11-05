import React, { useState, useRef, useEffect } from 'react';
import { Upload, Skull, Download, Play, AlertCircle, Loader2 } from 'lucide-react';

export default function VideoDestroyer() {
  const [file, setFile] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [outputUrl, setOutputUrl] = useState(null);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);

  // Cleanup on page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (outputUrl) {
        navigator.sendBeacon('https://vdapi.arc360hub.com/cleanup');
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      // Cleanup when component unmounts
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

      // Start progress simulation (since we can't track real FFmpeg progress easily)
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) return 90; // Cap at 90% until complete
          const newProgress = prev + Math.random() * 15;
          return Math.min(Math.round(newProgress), 90); // Round and cap at 90
        });
      }, 800);

      // Call the Python Flask backend
      const response = await fetch('https://vdapi.arc360hub.com/destroy', {
        method: 'POST',
        body: formData
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to process video');
      }

      // Get the destroyed video as a blob
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-black text-white p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <h1 className="text-5xl font-bold bg-gradient-to-r from-red-500 to-purple-500 bg-clip-text text-transparent">
              Video Destroyer
            </h1>
          </div>
          <p className="text-gray-400 text-lg">
            We will do all the hard work for you, you can just sit back and watch your video be obliterated!
          </p>
        </div>

        {/* Upload Area */}
        {!file && (
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => fileInputRef.current?.click()}
            className="border-4 border-dashed border-purple-500 rounded-2xl p-16 text-center cursor-pointer hover:border-red-500 hover:bg-purple-900/20 transition-all duration-300"
          >
            <Upload className="w-16 h-16 mx-auto mb-4 text-purple-400" />
            <p className="text-xl mb-2">Drop your video here or click to browse</p>
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

        {/* File Info */}
        {file && !outputUrl && (
          <div className="bg-gray-800/50 backdrop-blur rounded-2xl p-8 border border-purple-500/30">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-semibold mb-1">Selected Video</h3>
                <p className="text-gray-400">{file.name}</p>
                <p className="text-sm text-gray-500">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              <button
                onClick={() => setFile(null)}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
              >
                Remove
              </button>
            </div>

            {!processing && (
              <button
                onClick={destroyVideo}
                className="w-full py-4 bg-gradient-to-r from-red-600 to-purple-600 hover:from-red-500 hover:to-purple-500 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all duration-300 transform hover:scale-105"
              >
                <Skull className="w-6 h-6" />
                DESTROY THIS VIDEO
                <Skull className="w-6 h-6" />
              </button>
            )}

            {processing && (
              <div className="space-y-4">
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
        )}

        {/* Output */}
        {outputUrl && (
          <div className="bg-gray-800/50 backdrop-blur rounded-2xl p-8 border border-green-500/30 space-y-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <h3 className="text-2xl font-bold text-green-400">Video Destroyed Successfully!</h3>
            </div>

            <video
              ref={videoRef}
              src={outputUrl}
              controls
              className="w-full rounded-xl bg-black"
            />

            <div className="flex gap-4">
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
          <div className="bg-red-900/30 border border-red-500 rounded-xl p-4 flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-red-400" />
            <p className="text-red-300">{error}</p>
          </div>
        )}

        {/* Info */}
        <div className="mt-12 bg-gray-800/30 backdrop-blur rounded-2xl p-6 border border-gray-700">
          <h4 className="text-lg font-semibold mb-3 text-purple-400">Destruction Features:</h4>
          <ul className="space-y-2 text-gray-300">
            <li>• MPEG4 codec with maximum quality destruction (q:v 31)</li>
            <li>• AC3 audio at 8k bitrate - causes stuttering and glitches</li>
            <li>• Bitstream noise injection for corrupted artifacts</li>
            <li>• Volume cranked to 50dB for clipping and distortion</li>
            <li>• 15fps for choppy playback</li>
            <li>• Crushed resolution and heavy compression</li>
          </ul>
        </div>
        {/* Info */}
        <div className="mt-12 bg-gray-800/30 backdrop-blur rounded-2xl p-6 border border-gray-700">
          <h4 className="text-lg font-semibold mb-3 text-purple-400">Things to know:</h4>
          <ul className="space-y-2 text-gray-300">
            <li>• If you upload a video and it just returns that video back to you, thats means the server is down.</li>
            <li>• These videos can be VERY loud, so please turn down your volume to avoid, well, that.</li>
            <li>• There is an upload limit of 250MB to save on storage.</li>
          </ul>
        </div>

{/* Fancy Footer */}
        <footer className="mt-16 pt-8 border-t border-purple-900/50">
          <div className="flex flex-col items-center gap-3">
            <div className="flex items-center gap-2 text-gray-400">
              <span className="text-sm">Video Destroyer v1.0</span>
            </div>
            <p className="text-gray-500 text-xs">
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