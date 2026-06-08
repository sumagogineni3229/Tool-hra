"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, RefreshCw, CheckCircle2, XCircle } from "lucide-react";
import { motion } from "framer-motion";

export default function AttendanceWebcam({ onCapture, onClose }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [isCaptured, setIsCaptured] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" }
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error("Error accessing webcam:", err);
      setError("Webcam access denied. Please allow camera permissions.");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
  };

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");

      // Set canvas dimensions to match video stream
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Draw the video frame to the canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Convert to base64
      const dataUrl = canvas.toDataURL("image/webp");
      setCapturedImage(dataUrl);
      setIsCaptured(true);
    }
  };

  const retake = () => {
    setIsCaptured(false);
    setCapturedImage(null);
  };

  const confirm = () => {
    onCapture(capturedImage);
    stopCamera();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[110] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-6">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-[2.5rem] p-8 max-w-xl w-full shadow-2xl relative overflow-hidden"
      >
        <button
          type="button"
          onClick={() => { stopCamera(); onClose(); }}
          className="absolute top-6 right-6 w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all z-10 cursor-pointer"
        >
          <XCircle className="w-6 h-6" />
        </button>

        <h3 className="text-2xl font-black text-slate-900 mb-6 tracking-tight">Attendance Verification</h3>

        <div className="relative aspect-video bg-slate-100 rounded-3xl overflow-hidden shadow-inner border border-slate-200">
          {error ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-white">
              <XCircle className="w-12 h-12 text-rose-500 mb-4" />
              <p className="text-rose-600 font-bold text-xs">{error}</p>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className={`w-full h-full object-cover ${isCaptured ? "hidden" : ""}`}
              />
              {isCaptured ? (
                <>
                  <img src={capturedImage} className="w-full h-full object-cover" alt="Captured" />
                  <div className="absolute inset-0 bg-slate-900/10 transition-opacity" />
                </>
              ) : (
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2">
                  <button
                    type="button"
                    onClick={captureImage}
                    className="w-16 h-16 rounded-full bg-slate-900 text-white flex items-center justify-center shadow-xl shadow-slate-400 active:scale-90 transition-transform cursor-pointer"
                  >
                    <Camera className="w-8 h-8" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        <canvas ref={canvasRef} className="hidden" />

        <div className="mt-8 flex gap-4">
          {isCaptured ? (
            <>
              <button
                type="button"
                onClick={retake}
                className="flex-1 py-4 font-bold text-slate-400 bg-slate-50 rounded-2xl hover:text-slate-900 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <RefreshCw className="w-5 h-5" />
                Retake
              </button>
              <button
                type="button"
                onClick={confirm}
                className="flex-1 py-4 font-bold text-white bg-slate-900 rounded-2xl hover:bg-emerald-600 transition-all shadow-lg shadow-slate-200 flex items-center justify-center gap-2 cursor-pointer"
              >
                <CheckCircle2 className="w-5 h-5" />
                Confirm Attendance
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => { stopCamera(); onClose(); }}
              className="w-full py-4 font-bold text-slate-400 bg-slate-50 rounded-2xl hover:text-slate-900 transition-all cursor-pointer"
            >
              Cancel
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
