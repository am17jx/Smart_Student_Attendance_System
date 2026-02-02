import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Camera, XCircle, ZoomIn, MinusCircle, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Slider } from "@/components/ui/slider";

interface QRScannerProps {
    readonly onScanSuccess: (decodedText: string) => void;
    readonly onScanError?: (error: string) => void;
    readonly isActive: boolean;
    readonly onStop: () => void;
}

export function QRScanner({ onScanSuccess, onScanError, isActive, onStop }: QRScannerProps) {
    const scannerRef = useRef<Html5Qrcode | null>(null);
    const [error, setError] = useState<string>("");
    const [isScanning, setIsScanning] = useState(false);
    const isProcessingRef = useRef(false);

    // Zoom state
    const [zoomLevel, setZoomLevel] = useState(1);
    const [minZoom, setMinZoom] = useState(1);
    const [maxZoom, setMaxZoom] = useState(1);
    const [supportsZoom, setSupportsZoom] = useState(false);
    const videoTrackRef = useRef<MediaStreamTrack | null>(null);

    useEffect(() => {
        if (!isActive) {
            stopScanning();
            return;
        }

        startScanning();

        return () => {
            stopScanning();
        };
    }, [isActive]);

    const startScanning = async () => {
        try {
            setError("");
            isProcessingRef.current = false;

            // Initialize scanner
            if (!scannerRef.current) {
                scannerRef.current = new Html5Qrcode("qr-reader");
            }

            const config = {
                fps: 10,
                qrbox: { width: 250, height: 250 },
                aspectRatio: 1,
            };

            await scannerRef.current.start(
                { facingMode: "environment" },
                config,
                (decodedText) => {
                    if (isProcessingRef.current) {
                        console.log("Already processing a scan, ignoring...");
                        return;
                    }

                    console.log("QR Code detected:", decodedText);
                    isProcessingRef.current = true;

                    stopScanning().then(() => {
                        onScanSuccess(decodedText);
                    });
                },
                (errorMessage) => {
                    if (!errorMessage.includes("NotFoundException")) {
                        console.warn("QR Scan error:", errorMessage);
                    }
                }
            );

            setIsScanning(true);

            // Check for zoom capability after scanner starts
            checkZoomCapability();
        } catch (err: any) {
            console.error("Failed to start scanner:", err);
            let errorMsg = "فشل في الوصول إلى الكاميرا";

            if (err.name === "NotAllowedError") {
                errorMsg = "تم رفض الوصول إلى الكاميرا. يرجى السماح بالوصول من إعدادات المتصفح.";
            } else if (err.name === "NotFoundError") {
                errorMsg = "لم يتم العثور على كاميرا على هذا الجهاز.";
            } else if (err.name === "NotReadableError") {
                errorMsg = "الكاميرا قيد الاستخدام من قبل تطبيق آخر.";
            } else if (err.message) {
                errorMsg = err.message;
            }

            setError(errorMsg);
            if (onScanError) {
                onScanError(errorMsg);
            }
        }
    };

    const checkZoomCapability = async () => {
        try {
            // Get the video element created by Html5Qrcode
            const videoElement = document.querySelector('#qr-reader video') as HTMLVideoElement;
            if (!videoElement || !videoElement.srcObject) {
                console.log("Video element not found");
                return;
            }

            const mediaStream = videoElement.srcObject as MediaStream;
            const track = mediaStream.getVideoTracks()[0];

            if (!track) {
                console.log("No video track found");
                return;
            }

            videoTrackRef.current = track;

            // Check if zoom is supported
            const capabilities = track.getCapabilities?.();
            if (capabilities && 'zoom' in capabilities) {
                const zoomCaps = capabilities.zoom as { min: number; max: number; step?: number };
                setMinZoom(zoomCaps.min || 1);
                setMaxZoom(zoomCaps.max || 1);
                setSupportsZoom(zoomCaps.max > 1);

                // Get current zoom level
                const settings = track.getSettings?.();
                if (settings && 'zoom' in settings) {
                    setZoomLevel(settings.zoom as number || 1);
                }

                console.log("Zoom capabilities:", zoomCaps);
            } else {
                console.log("Zoom not supported by this camera");
                setSupportsZoom(false);
            }
        } catch (err) {
            console.error("Error checking zoom capability:", err);
            setSupportsZoom(false);
        }
    };

    const applyZoom = async (newZoom: number) => {
        try {
            if (!videoTrackRef.current || !supportsZoom) return;

            const clampedZoom = Math.min(Math.max(newZoom, minZoom), maxZoom);

            await videoTrackRef.current.applyConstraints({
                advanced: [{ zoom: clampedZoom } as any]
            });

            setZoomLevel(clampedZoom);
        } catch (err) {
            console.error("Error applying zoom:", err);
        }
    };

    const handleZoomIn = () => {
        const step = (maxZoom - minZoom) / 10;
        applyZoom(zoomLevel + step);
    };

    const handleZoomOut = () => {
        const step = (maxZoom - minZoom) / 10;
        applyZoom(zoomLevel - step);
    };

    const handleSliderChange = (values: number[]) => {
        applyZoom(values[0]);
    };

    const stopScanning = async () => {
        if (scannerRef.current && isScanning) {
            try {
                await scannerRef.current.stop();
                setIsScanning(false);
                videoTrackRef.current = null;
                setSupportsZoom(false);
                setZoomLevel(1);
            } catch (err) {
                console.error("Error stopping scanner:", err);
            }
        }
    };

    const handleStop = () => {
        isProcessingRef.current = false;
        stopScanning();
        onStop();
    };

    return (
        <div className="space-y-4">
            {error && (
                <Alert variant="destructive">
                    <XCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            <div className="relative">
                <div
                    id="qr-reader"
                    className="rounded-xl overflow-hidden border-2 border-primary/20 shadow-lg"
                    style={{ width: "100%", maxWidth: "500px", margin: "0 auto" }}
                />

                {isScanning && (
                    <div className="absolute top-2 right-2 bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2 animate-pulse">
                        <Camera className="h-4 w-4" />
                        جاري المسح...
                    </div>
                )}
            </div>

            {/* Zoom Controls */}
            {isScanning && supportsZoom && (
                <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between text-sm">
                        <span className="font-medium flex items-center gap-2">
                            <ZoomIn className="h-4 w-4" />
                            التقريب (Zoom)
                        </span>
                        <span className="text-muted-foreground">
                            {zoomLevel.toFixed(1)}x
                        </span>
                    </div>

                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={handleZoomOut}
                            disabled={zoomLevel <= minZoom}
                            className="h-8 w-8"
                        >
                            <MinusCircle className="h-4 w-4" />
                        </Button>

                        <Slider
                            value={[zoomLevel]}
                            min={minZoom}
                            max={maxZoom}
                            step={(maxZoom - minZoom) / 20}
                            onValueChange={handleSliderChange}
                            className="flex-1"
                        />

                        <Button
                            variant="outline"
                            size="icon"
                            onClick={handleZoomIn}
                            disabled={zoomLevel >= maxZoom}
                            className="h-8 w-8"
                        >
                            <PlusCircle className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}

            {isScanning && (
                <Button
                    variant="outline"
                    onClick={handleStop}
                    className="w-full"
                >
                    إيقاف المسح
                </Button>
            )}
        </div>
    );
}

