"use client";

import { useState, useEffect, useRef } from "react";
import { X, Camera, Trash2, CheckCircle2, AlertTriangle, UploadCloud, ZoomIn } from "lucide-react";
import { apiClient } from "@/lib/apiClient";

export default function EditProfilePicModal({ isOpen, onClose, currentUser, onSuccess }) {
  // Modal mode: 'view' | 'upload' | 'crop'
  const [mode, setMode] = useState("view");
  const [photo, setPhoto] = useState("");
  const [originalImage, setOriginalImage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState(null);

  // Cropping state
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const prevIsOpenRef = useRef(false);

  useEffect(() => {
    if (isOpen && !prevIsOpenRef.current && currentUser) {
      const currentPhoto = currentUser.userPhoto || "";
      setPhoto(currentPhoto);
      setMode(currentPhoto ? "view" : "upload");
      setNotification(null);
      setOriginalImage("");
      setScale(1);
      setOffset({ x: 0, y: 0 });
    }
    prevIsOpenRef.current = isOpen;
  }, [currentUser, isOpen]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        setNotification({
          type: "error",
          message: "Image size should be less than 2MB."
        });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setOriginalImage(reader.result);
        setPhoto(reader.result);
        setMode("crop");
        setScale(1);
        setOffset({ x: 0, y: 0 });
        setNotification(null);
      };
      reader.readAsDataURL(file);
    }
  };

  // Drag handlers for cropping
  const handleMouseDown = (e) => {
    if (e.type === "mousedown") {
      e.preventDefault(); // Prevents default browser image drag ghost behavior
    }
    
    let clientX = 0;
    let clientY = 0;
    if (e.touches && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else if (e.clientX !== undefined) {
      clientX = e.clientX;
      clientY = e.clientY;
    } else {
      return;
    }

    setIsDragging(true);
    dragStartRef.current = { x: clientX - offset.x, y: clientY - offset.y };
  };

  // Wire up global listeners for smooth dragging outside of the crop circle bounds
  useEffect(() => {
    if (!isDragging) return;

    const handleGlobalMove = (e) => {
      if (e.cancelable) {
        e.preventDefault(); // Prevent scrolling on touch screens during drag
      }

      let clientX = 0;
      let clientY = 0;
      if (e.touches && e.touches.length > 0) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else if (e.clientX !== undefined) {
        clientX = e.clientX;
        clientY = e.clientY;
      } else {
        return;
      }

      setOffset({
        x: clientX - dragStartRef.current.x,
        y: clientY - dragStartRef.current.y
      });
    };

    const handleGlobalUp = () => {
      setIsDragging(false);
    };

    window.addEventListener("mousemove", handleGlobalMove);
    window.addEventListener("mouseup", handleGlobalUp);
    window.addEventListener("touchmove", handleGlobalMove, { passive: false });
    window.addEventListener("touchend", handleGlobalUp);

    return () => {
      window.removeEventListener("mousemove", handleGlobalMove);
      window.removeEventListener("mouseup", handleGlobalUp);
      window.removeEventListener("touchmove", handleGlobalMove);
      window.removeEventListener("touchend", handleGlobalUp);
    };
  }, [isDragging]);

  // Crop image using HTML5 Canvas
  const generateCroppedImage = () => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = originalImage;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        // Target size for profile picture
        const targetSize = 300;
        canvas.width = targetSize;
        canvas.height = targetSize;

        // Background color
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, targetSize, targetSize);

        const imgWidth = img.width;
        const imgHeight = img.height;
        const imgRatio = imgWidth / imgHeight;

        // Size in UI is w-48 (192px)
        const containerSize = 192;

        let drawWidth, drawHeight;
        if (imgRatio > 1) {
          drawHeight = containerSize;
          drawWidth = containerSize * imgRatio;
        } else {
          drawWidth = containerSize;
          drawHeight = containerSize / imgRatio;
        }

        const zoomFactor = targetSize / containerSize;
        const finalWidth = drawWidth * scale * zoomFactor;
        const finalHeight = drawHeight * scale * zoomFactor;

        // Coordinates centered
        const centerX = targetSize / 2;
        const centerY = targetSize / 2;
        const destX = centerX - (finalWidth / 2) + (offset.x * zoomFactor);
        const destY = centerY - (finalHeight / 2) + (offset.y * zoomFactor);

        ctx.drawImage(img, destX, destY, finalWidth, finalHeight);
        resolve(canvas.toDataURL("image/jpeg", 0.9));
      };
      img.onerror = (err) => reject(err);
    });
  };

  const handleSaveCropped = async () => {
    setIsSubmitting(true);
    setNotification(null);
    const userId = currentUser.id || currentUser._id;
    const isAdding = !currentUser.userPhoto;
    try {
      const croppedBase64 = await generateCroppedImage();
      const result = await apiClient.updateUserProfilePic(userId, croppedBase64);
      if (result.success) {
        setPhoto(result.user.userPhoto);
        setMode("view");
        setNotification({
          type: "success",
          message: isAdding ? "Profile photo added successfully!" : "Profile photo changed successfully!"
        });
        if (onSuccess) {
          onSuccess(result.user);
        }
      } else {
        setNotification({
          type: "error",
          message: result.message || "Failed to update profile picture."
        });
      }
    } catch (err) {
      console.error(err);
      setNotification({
        type: "error",
        message: "Failed to adjust and crop photo."
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setIsSubmitting(true);
    setNotification(null);
    const userId = currentUser.id || currentUser._id;
    try {
      const result = await apiClient.updateUserProfilePic(userId, "");
      if (result.success) {
        setPhoto("");
        setMode("upload");
        setNotification({
          type: "success",
          message: "Profile photo removed successfully!"
        });
        if (onSuccess) {
          onSuccess(result.user);
        }
      } else {
        setNotification({
          type: "error",
          message: result.message || "Failed to delete profile picture."
        });
      }
    } catch (err) {
      setNotification({
        type: "error",
        message: "An unexpected error occurred while deleting."
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const currentBadgeColor = currentUser?.badgeColor || "bg-indigo-600";
  const userInitials = currentUser?.initials || 
    currentUser?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 
    "EE";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-white border border-slate-200/80 rounded-2xl p-6 shadow-2xl animate-slide-up flex flex-col gap-5 text-slate-800">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-650">
              <Camera className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-base text-slate-900 leading-none font-sans">
                {mode === "view" ? "View Profile Photo" : mode === "crop" ? "Adjust & Crop Photo" : "Upload Profile Photo"}
              </span>
              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-1">Profile Security Settings</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-55 transition-colors text-slate-400 hover:text-slate-700 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Alert Notification */}
        {notification && (
          <div
            className={`p-3.5 rounded-xl text-xs font-semibold leading-relaxed flex items-start gap-2.5 border transition-all animate-fade-in ${
              notification.type === "success"
                ? "bg-emerald-50 border-emerald-100 text-emerald-850"
                : "bg-rose-50 border-rose-100 text-rose-800"
            }`}
          >
            {notification.type === "success" ? (
              <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-4.5 h-4.5 text-rose-500 shrink-0 mt-0.5" />
            )}
            <span>{notification.message}</span>
          </div>
        )}

        {/* Body Content */}
        <div className="flex flex-col items-center gap-5 my-2">
          
          {/* mode === 'view': See Large Profile Picture */}
          {mode === "view" && (
            <div className="flex flex-col items-center gap-5 w-full animate-fade-in">
              <div className="relative w-48 h-48 rounded-full overflow-hidden border-2 border-slate-250 bg-slate-50 flex items-center justify-center shadow-md">
                {photo ? (
                  <img src={photo} alt="Profile Lightbox" className="w-full h-full object-cover" />
                ) : (
                  <div className={`w-full h-full flex items-center justify-center text-white text-5xl font-black ${currentBadgeColor}`}>
                    {userInitials}
                  </div>
                )}
              </div>
              
              <div className="flex items-center gap-3 w-full">
                <label className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 active:bg-slate-100 transition-all cursor-pointer shadow-sm select-none">
                  <UploadCloud className="w-4 h-4 text-slate-500" />
                  <span>Change Photo</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>

                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isSubmitting}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-rose-250 text-xs font-semibold text-rose-600 hover:bg-rose-50 active:bg-rose-100 transition-all cursor-pointer shadow-sm disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4 text-rose-500" />
                  <span>Remove Photo</span>
                </button>
              </div>
            </div>
          )}

          {/* mode === 'upload': Upload Area */}
          {mode === "upload" && (
            <div className="flex flex-col items-center gap-4 w-full animate-fade-in">
              <label className="w-full border-2 border-dashed border-slate-250 rounded-2xl p-8 bg-slate-50 flex flex-col items-center justify-center gap-3 hover:border-slate-350 cursor-pointer group transition-colors">
                <div className="p-3 bg-white rounded-full border border-slate-150 group-hover:scale-105 transition-transform">
                  <UploadCloud className="w-6 h-6 text-slate-400" />
                </div>
                <div className="flex flex-col items-center text-center">
                  <span className="text-xs font-bold text-slate-750">Select profile headshot image</span>
                  <span className="text-[10px] text-slate-400 mt-1">Supports JPG, PNG (Max 2MB)</span>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            </div>
          )}

          {/* mode === 'crop': Crop and Drag Adjustments */}
          {mode === "crop" && (
            <div className="flex flex-col items-center gap-4 w-full animate-fade-in">
              
              {/* Crop Frame Circular Viewport */}
              <div 
                onMouseDown={handleMouseDown}
                onTouchStart={handleMouseDown}
                className="relative w-48 h-48 rounded-full overflow-hidden border-2 border-indigo-500 bg-slate-100 flex items-center justify-center shadow-inner cursor-grab active:cursor-grabbing select-none pointer-events-auto shrink-0"
                title="Drag to adjust position"
              >
                <img 
                  src={photo} 
                  alt="Crop Preview" 
                  style={{
                    transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
                    transformOrigin: 'center center'
                  }}
                  className="w-full h-full object-cover pointer-events-none select-none"
                />
              </div>

              {/* Range Slider for Scale Zoom */}
              <div className="flex flex-col gap-1.5 w-full mt-2">
                <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                  <span>Zoom / scale photo</span>
                  <span className="font-mono text-indigo-600">{(scale * 100).toFixed(0)}%</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="3"
                  step="0.05"
                  value={scale}
                  onChange={(e) => setScale(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-slate-150 rounded-lg appearance-none cursor-pointer accent-indigo-600 focus:outline-none"
                />
              </div>

              {/* Helper Drag Instruction Notice */}
              <div className="text-[10px] text-slate-400 font-semibold leading-relaxed text-center">
                💡 Click and drag the photo inside the circle to adjust its position.
              </div>

              {/* Crop Control Save Options */}
              <div className="flex items-center gap-3 w-full border-t border-slate-100 pt-4 mt-2">
                <button
                  type="button"
                  onClick={() => {
                    setPhoto(currentUser.userPhoto || "");
                    setMode(currentUser.userPhoto ? "view" : "upload");
                  }}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-650 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveCropped}
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 rounded-xl text-xs font-semibold text-white bg-slate-950 hover:bg-slate-850 active:bg-black transition-all shadow-md shadow-slate-950/15 flex items-center justify-center gap-1.5 disabled:bg-slate-300 disabled:text-slate-500 disabled:shadow-none"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Save Photo</span>
                  )}
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Footer Actions for View and Upload Modes */}
        {mode !== "crop" && (
          <div className="flex items-center gap-3 border-t border-slate-100 pt-4 mt-1">
            <button
              type="button"
              onClick={onClose}
              className="w-full py-3 rounded-xl bg-slate-950 hover:bg-slate-850 active:bg-black text-xs font-semibold text-white transition-all shadow-md shadow-slate-950/10 cursor-pointer text-center"
            >
              Close Settings
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
