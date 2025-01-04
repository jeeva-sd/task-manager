import React, { useCallback, useRef, useState } from "react";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { toBlobURL } from "@ffmpeg/util";

const HomePage: React.FC = () => {
    const screenVideoRef = useRef<HTMLVideoElement | null>(null);
    const cameraVideoRef = useRef<HTMLVideoElement | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const recordingRef = useRef(false); // Use ref to control recording status
    const [isRecording, setIsRecording] = useState(false);
    const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
    const ffmpegRef = useRef<FFmpeg | null>(null);
    const [loading, setLoading] = useState(false);

    const load = useCallback(async () => {
        if (ffmpegRef.current) return;
        setLoading(true);

        const baseURL = "https://unpkg.com/@ffmpeg/core-mt@0.12.6/dist/esm";
        const ffmpeg = new FFmpeg();

        await ffmpeg.load({
            coreURL: await toBlobURL(
                `${baseURL}/ffmpeg-core.js`,
                "text/javascript"
            ),
            wasmURL: await toBlobURL(
                `${baseURL}/ffmpeg-core.wasm`,
                "application/wasm"
            ),
            workerURL: await toBlobURL(
                `${baseURL}/ffmpeg-core.worker.js`,
                "text/javascript"
            ),
        });

        setLoading(false);
        ffmpegRef.current = ffmpeg;
    }, []);

    const startRecording = async () => {
        try {
            const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: { displaySurface: 'monitor' } });
            const cameraStream = await navigator.mediaDevices.getUserMedia({ video: true });

            if (screenVideoRef.current && cameraVideoRef.current) {
                setIsRecording(true);
                recordingRef.current = true;

                screenVideoRef.current.srcObject = screenStream;
                cameraVideoRef.current.srcObject = cameraStream;

                // Wait for both videos to start playing
                await Promise.all([
                    new Promise<void>((resolve) => {
                        screenVideoRef.current!.onloadedmetadata = () => resolve();
                    }),
                    new Promise<void>((resolve) => {
                        cameraVideoRef.current!.onloadedmetadata = () => resolve();
                    }),
                ]);

                screenVideoRef.current?.play();
                cameraVideoRef.current?.play();

                // Create a new MediaRecorder for the combined streams
                const combinedStream = new MediaStream();
                screenStream.getTracks().forEach((track) => combinedStream.addTrack(track));
                cameraStream.getTracks().forEach((track) => combinedStream.addTrack(track));

                mediaRecorderRef.current = new MediaRecorder(combinedStream, {
                    mimeType: "video/webm",
                });

                mediaRecorderRef.current.ondataavailable = (e) => {
                    chunksRef.current.push(e.data);
                };

                mediaRecorderRef.current.onstop = async () => {
                    const ffmpeg = ffmpegRef.current;
                    if (!ffmpeg || !ffmpeg.loaded) {
                        console.error("FFmpeg is not initialized or not loaded.");
                        return;
                    }

                    const blob = new Blob(chunksRef.current, { type: 'video/webm' });
                    const videoFile = new File([blob], 'recorded_video.webm', { type: 'video/webm' });

                    const inputFileName = 'input.webm';  // Path to the input file in FFmpeg's virtual file system
                    const outputFileName = 'output.mp4'; // Path to the output file

                    try {
                        // Write the WebM file to FFmpeg's virtual file system
                        const ffmpeg = ffmpegRef.current;
                        const inputFileName = videoFile.name;
                        console.log(inputFileName, 'inputFileName')
                        const outputFileName = `output.mp4`;

                        const startTime = 1;
                        const endTime = 5;

                        const arrayBuffer = await videoFile.arrayBuffer();
                        await ffmpeg?.writeFile(inputFileName, new Uint8Array(arrayBuffer));

                        // await ffmpeg?.writeFile(inputFileName, await fetchFile(videoFile));
                        await ffmpeg?.exec([
                            "-ss", startTime.toString(),
                            "-i", inputFileName,
                            "-t", (endTime - startTime).toString(),
                            "-c", "copy",
                            outputFileName,
                        ]);

                        const fileData = await ffmpeg?.readFile(outputFileName);
                        const data = new Uint8Array(fileData as ArrayBuffer);
                        const downloadUrl = URL.createObjectURL(new Blob([data.buffer], { type: "video/mp4" }));

                        // Update the download URL state
                        setDownloadUrl(downloadUrl);

                        // Reset chunks for the next recording
                        chunksRef.current = [];
                    } catch (error) {
                        console.error("Error during FFmpeg processing:", error);
                    }
                };

                mediaRecorderRef.current.start();
            }
        } catch (err) {
            console.error("Error starting recording", err);
            alert("Failed to start screen recording.");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && recordingRef.current) {
            mediaRecorderRef.current.stop();
        }
        recordingRef.current = false;
        setIsRecording(false);
    };

    return (
        <div className="flex flex-col items-center w-full p-4 space-y-4">

            <button onClick={load}>{loading ? <>Loading...</> : <>Load</>}</button>

            <div className="relative w-full" style={{ paddingBottom: '56.25%' /* 16:9 aspect ratio */ }}>
                {/* Screen Video - 16:9 Aspect Ratio */}
                <video ref={screenVideoRef} className="absolute top-0 left-0 w-full h-full object-cover" />

                {/* Camera Video - Rounded, Positioned Bottom-Right */}
                <video
                    ref={cameraVideoRef}
                    className="absolute bottom-4 right-4 object-cover border-4 border-white"
                    style={{
                        width: '20vw',  // Set width to 20% of the viewport width
                        height: '20vw', // Set height to 20% of the viewport width (keeps square)
                        maxWidth: '200px', // Limit maximum width
                        maxHeight: '200px', // Limit maximum height
                        borderRadius: '50%', // Ensure the overlay stays circular
                    }}
                />
            </div>

            <button
                onClick={isRecording ? stopRecording : startRecording}
                className={`px-6 py-2 rounded-md ${isRecording ? "bg-red-600" : "bg-green-600"} text-white shadow-md`}
            >
                {isRecording ? "Stop Recording" : "Start Recording"}
            </button>

            {downloadUrl && (
                <a href={downloadUrl} download="recording.mp4" className="text-blue-500 underline">
                    Download Recording
                </a>
            )}
        </div>


    );
};

export { HomePage };
