import React, { useCallback, useRef, useState } from "react";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { toBlobURL, fetchFile } from "@ffmpeg/util";

export const HomePage: React.FC = () => {
    const screenVideoRef = useRef<HTMLVideoElement | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const recordingRef = useRef(false); // Use ref to control recording status
    const [isRecording, setIsRecording] = useState(false);
    const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
    const ffmpegRef = useRef<FFmpeg | null>(null);
    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [time, setTime] = useState(0);

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

        ffmpeg.on('progress', e => {
            setTime(e.time);
            setProgress(e.progress * 100);
        });

        setLoading(false);
        ffmpegRef.current = ffmpeg;
    }, []);

    const startRecording = async () => {
        try {
            const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: { displaySurface: 'monitor' } });

            setIsRecording(true);
            recordingRef.current = true;

            if (!screenVideoRef.current) return;
            screenVideoRef.current.srcObject = screenStream;

            screenVideoRef.current.onloadedmetadata = () => {
                screenVideoRef.current?.play();

                mediaRecorderRef.current = new MediaRecorder(screenStream, {
                    bitsPerSecond: 248832000,
                    mimeType: "video/webm",
                });

                mediaRecorderRef.current.ondataavailable = (e) => {
                    chunksRef.current.push(e.data);
                };

                mediaRecorderRef.current.onstop = async () => {
                    const ffmpeg = ffmpegRef.current;
                    if (!ffmpeg) return;
                    console.log("two");

                    // Create a blob from the chunks collected during recording
                    const blob = new Blob(chunksRef.current, { type: 'video/webm' });

                    // Convert the blob to a File
                    const videoFile = new File([blob], 'recorded_video.webm', { type: 'video/webm' });

                    // Define output file name and input file name
                    const inputFileName = videoFile.name;
                    const outputFileName = 'output.mp4';

                    // Write the WebM file to FFmpeg virtual file system
                    await ffmpeg.writeFile(inputFileName, await fetchFile(videoFile));

                    // Execute FFmpeg to convert the video, set 30 FPS, and optimize it
                    await ffmpeg.exec([
                        '-i', inputFileName,          // Input file
                        '-r', '30',                   // Set constant 30 FPS
                        '-c:v', 'libx264',            // Use libx264 codec for video
                        '-preset', 'fast',            // Use a fast encoding preset
                        '-c:a', 'aac',                // Use AAC codec for audio
                        '-b:a', '192k',               // Set audio bitrate to 192k
                        '-y',                         // Overwrite output file if exists
                        outputFileName                // Output file name
                    ]);

                    // Read the processed file from FFmpeg's file system
                    const fileData = await ffmpeg.readFile(outputFileName);

                    // Create a Blob from the output file and generate a download URL
                    const data = new Uint8Array(fileData as ArrayBuffer);
                    const downloadUrl = URL.createObjectURL(new Blob([data.buffer], { type: 'video/mp4' }));

                    // Update the download URL state
                    setDownloadUrl(downloadUrl);

                    // Reset chunks for next recording
                    chunksRef.current = [];
                };

                mediaRecorderRef.current.start(1000);
                screenStream.getTracks().forEach((track) => track.addEventListener("ended", stopRecording));
            };
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

            <div> progress: {progress}</div>
            <div> time: {time}</div>

            <button onClick={load}>{loading ? <>Loading...</> : <>Load</>}</button>
            <div className="flex flex-col items-center space-y-2">
                <video ref={screenVideoRef} className="w-6/12" />
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
