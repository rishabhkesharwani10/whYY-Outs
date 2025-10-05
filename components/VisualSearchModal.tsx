import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleGenAI, Type } from "@google/genai";
import { useProducts } from '../hooks/useProducts.ts';
import Icon from './Icon.tsx';

const fileToBase64 = (file: File): Promise<{mimeType: string, data: string}> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
        if (typeof reader.result === 'string') {
            const [header, data] = reader.result.split(',');
            const mimeType = header.match(/:(.*?);/)?.[1] || file.type;
            resolve({ mimeType, data });
        } else {
            reject(new Error('Failed to read file.'));
        }
    };
    reader.onerror = (error) => reject(error);
  });

const VisualSearchModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const [mode, setMode] = useState<'select' | 'camera' | 'preview'>('select');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    const { products } = useProducts();
    const navigate = useNavigate();
    const aiRef = useRef<GoogleGenAI | null>(null);

    useEffect(() => {
        // Initialize the GoogleGenAI client.
        // As per guidelines, assume process.env.API_KEY is available in the execution environment.
        aiRef.current = new GoogleGenAI({ apiKey: process.env.API_KEY });
    }, []);

    const stopStream = useCallback(() => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
    }, [stream]);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            const file = event.target.files[0];
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
            setMode('preview');
        }
    };

    const handleCameraOpen = async () => {
        setError(null);
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
            setStream(mediaStream);
            setMode('camera');
        } catch (err: any) {
            console.error("Camera access error:", err);
            let message = "Could not access the camera. Please ensure it's not in use by another app.";
            if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                message = "Camera access denied. To use this feature, please allow camera permission in your browser settings.";
            } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
                message = "No camera found on your device.";
            }
            setError(message);
            setMode('select');
        }
    };

    const handleCapture = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            canvas.getContext('2d')?.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
            canvas.toBlob(blob => {
                if (blob) {
                    const file = new File([blob], "capture.jpg", { type: "image/jpeg" });
                    setImageFile(file);
                    setImagePreview(URL.createObjectURL(file));
                    setMode('preview');
                    stopStream();
                }
            }, 'image/jpeg');
        }
    };
    
    const handleSearch = async () => {
      if (!imageFile || !aiRef.current) {
          setError("Visual search is currently unavailable.");
          return;
      }
      setIsLoading(true);
      setError(null);

      try {
          const { mimeType, data: base64Data } = await fileToBase64(imageFile);
          
          const productContext = products.map(p => ({
              id: p.id, name: p.name, category: p.categoryId, description: p.description.substring(0, 150)
          }));

          const prompt = `You are an expert visual search AI for whYYOuts. Find products from the catalog that are visually similar to the user's image. Analyze style, color, pattern, and shape. Return an array of the top 8 matching product IDs. The response MUST be a JSON object with a 'productIds' key. If no matches are found, return an empty array. Catalog: ${JSON.stringify(productContext)}`;
          
          const imagePart = { inlineData: { mimeType, data: base64Data } };
          const textPart = { text: prompt };

          const responseSchema = {
              type: Type.OBJECT,
              properties: { productIds: { type: Type.ARRAY, items: { type: Type.STRING } } },
              required: ['productIds']
          };

          const response = await aiRef.current.models.generateContent({
              model: 'gemini-2.5-flash',
              contents: { parts: [imagePart, textPart] },
              config: { responseMimeType: "application/json", responseSchema }
          });

          const result = JSON.parse(response.text);
          navigate('/shop', { state: { visualSearchResults: result.productIds } });
          onClose();

      } catch (err) {
          console.error("Visual Search Error:", err);
          setError("Sorry, something went wrong. Please try another image.");
      } finally {
          setIsLoading(false);
      }
    };

    useEffect(() => {
        if (mode === 'camera' && stream && videoRef.current) {
            videoRef.current.srcObject = stream;
        }
        return () => { if(mode !== 'camera') stopStream(); }
    }, [mode, stream, stopStream]);
    
    const handleClose = () => {
      stopStream();
      onClose();
    };

    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 print:hidden" onClick={handleClose}>
          <div className="bg-brand-dark border border-brand-gold/20 rounded-lg shadow-2xl w-full max-w-md page-fade-in relative flex flex-col h-[70vh]" onClick={e => e.stopPropagation()}>
              <header className="flex items-center justify-between p-4 border-b border-brand-gold/20 flex-shrink-0">
                  <h2 className="font-serif text-2xl text-brand-light flex items-center gap-3"><Icon name="camera" className="w-6 h-6 text-brand-gold"/>Visual Search</h2>
                  <button onClick={handleClose} className="p-1 text-brand-light/70 hover:text-white">&times;</button>
              </header>
              <div className="flex-grow p-6 flex flex-col justify-center items-center text-center overflow-y-auto">
                  {error && <p className="text-red-400 mb-4">{error}</p>}
                  {isLoading && (
                      <div className="flex flex-col items-center gap-4">
                          <div className="w-12 h-12 border-4 border-brand-gold/20 border-t-brand-gold rounded-full animate-spin"></div>
                          <p className="text-brand-light/80 animate-pulse">Finding similar items...</p>
                      </div>
                  )}

                  {!isLoading && mode === 'select' && (
                      <div className="space-y-4 w-full">
                          <button onClick={handleCameraOpen} className="w-full flex items-center justify-center gap-3 text-lg font-semibold p-6 bg-brand-gold/10 border-2 border-dashed border-brand-gold/40 rounded-lg text-brand-gold hover:bg-brand-gold/20 transition-colors">
                              <Icon name="camera" className="w-6 h-6"/> Use Camera
                          </button>
                          <button onClick={() => fileInputRef.current?.click()} className="w-full flex items-center justify-center gap-3 text-lg font-semibold p-6 bg-brand-gold/10 border-2 border-dashed border-brand-gold/40 rounded-lg text-brand-gold hover:bg-brand-gold/20 transition-colors">
                              <Icon name="upload" className="w-6 h-6"/> Upload Image
                          </button>
                          <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
                      </div>
                  )}

                  {!isLoading && mode === 'camera' && (
                      <div className="w-full h-full flex flex-col items-center">
                          <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover rounded-lg bg-black/50"></video>
                          <button onClick={handleCapture} className="mt-4 font-sans text-sm tracking-widest px-8 py-3 border border-brand-gold bg-brand-gold text-brand-dark hover:bg-brand-gold-dark">Capture</button>
                          <canvas ref={canvasRef} className="hidden"></canvas>
                      </div>
                  )}
                  
                  {!isLoading && mode === 'preview' && imagePreview && (
                      <div className="w-full h-full flex flex-col items-center">
                          <img src={imagePreview} alt="Preview" className="w-full h-full object-contain rounded-lg bg-black/50" />
                          <div className="flex gap-4 mt-4">
                              <button onClick={() => setMode('select')} className="font-sans text-sm tracking-widest px-6 py-2 border border-brand-light/50 text-brand-light/80 hover:bg-brand-light/10">Change</button>
                              <button onClick={handleSearch} className="font-sans text-sm tracking-widest px-8 py-3 border border-brand-gold bg-brand-gold text-brand-dark hover:bg-brand-gold-dark">Search</button>
                          </div>
                      </div>
                  )}
              </div>
          </div>
      </div>
    );
};

export default VisualSearchModal;
