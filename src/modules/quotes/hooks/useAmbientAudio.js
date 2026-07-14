import { useCallback, useEffect, useRef, useState } from "react";

const ambientTrackModules = import.meta.glob(
    [
        "../assets/music/*.m4a",
        "../assets/music/*.mp3",
        "../assets/music/*.ogg",
        "../assets/music/*.wav",
    ],
    { eager: true, import: "default" },
);

const ambientTracks = Object.entries(ambientTrackModules)
    .sort(([leftPath], [rightPath]) => leftPath.localeCompare(rightPath))
    .map(([, trackUrl]) => trackUrl);

const AMBIENT_VOLUME = 0.3;

function fadeVolume(audio, targetVolume, duration, animationFrameRef, onComplete) {
    window.cancelAnimationFrame(animationFrameRef.current);
    const initialVolume = audio.volume;
    const startedAt = performance.now();

    const updateVolume = (currentTime) => {
        const elapsed = Math.max(currentTime - startedAt, 0);
        const progress = Math.min(elapsed / duration, 1);
        const nextVolume = initialVolume + ((targetVolume - initialVolume) * progress);
        audio.volume = Math.min(Math.max(nextVolume, 0), 1);

        if (progress < 1) {
            animationFrameRef.current = window.requestAnimationFrame(updateVolume);
        } else {
            animationFrameRef.current = null;
            onComplete?.();
        }
    };

    animationFrameRef.current = window.requestAnimationFrame(updateVolume);
}

export default function useAmbientAudio() {
    const animationFrameRef = useRef(null);
    const audioRef = useRef(null);
    const currentTrackIndexRef = useRef(0);
    const shouldPlayRef = useRef(false);
    const [isPlaying, setIsPlaying] = useState(false);

    const playNextTrack = useCallback(async () => {
        const audio = audioRef.current;
        if (!audio || !shouldPlayRef.current || ambientTracks.length === 0) return;

        currentTrackIndexRef.current = (currentTrackIndexRef.current + 1) % ambientTracks.length;
        audio.src = ambientTracks[currentTrackIndexRef.current];

        try {
            await audio.play();
        } catch (error) {
            shouldPlayRef.current = false;
            setIsPlaying(false);
            console.error("Không thể phát bài nhạc nền tiếp theo.", error);
        }
    }, []);

    const getAudio = useCallback(() => {
        if (ambientTracks.length === 0) return null;

        if (!audioRef.current) {
            const audio = new Audio(ambientTracks[currentTrackIndexRef.current]);
            audio.loop = false;
            audio.preload = "auto";
            audio.volume = 0;
            audio.onended = () => void playNextTrack();
            audio.onpause = () => setIsPlaying(false);
            audio.onplay = () => setIsPlaying(true);
            audioRef.current = audio;
        }

        return audioRef.current;
    }, [playNextTrack]);

    const startAmbient = useCallback(async () => {
        const audio = getAudio();
        if (!audio) {
            console.error("Không tìm thấy file nhạc nền.");
            return false;
        }

        shouldPlayRef.current = true;

        try {
            await audio.play();
            fadeVolume(audio, AMBIENT_VOLUME, 1200, animationFrameRef);
            return true;
        } catch (error) {
            shouldPlayRef.current = false;
            console.error("Không thể phát nhạc nền.", error);
            return false;
        }
    }, [getAudio]);

    const stopAmbient = useCallback(() => {
        const audio = audioRef.current;
        shouldPlayRef.current = false;
        if (!audio || audio.paused) return;

        if (document.hidden) {
            window.cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
            audio.volume = 0;
            audio.pause();
            return;
        }

        fadeVolume(audio, 0, 800, animationFrameRef, () => audio.pause());
    }, []);

    useEffect(() => () => {
        shouldPlayRef.current = false;
        window.cancelAnimationFrame(animationFrameRef.current);

        if (audioRef.current) {
            audioRef.current.onended = null;
            audioRef.current.onpause = null;
            audioRef.current.onplay = null;
            audioRef.current.pause();
            audioRef.current.src = "";
            audioRef.current = null;
        }
    }, []);

    return { isPlaying, startAmbient, stopAmbient };
}
