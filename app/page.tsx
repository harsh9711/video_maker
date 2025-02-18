"use client";
import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  PlayCircle,
  PauseCircle,
  Plus,
  Upload,
  Sparkles,
  Heart,
  Share2,
  MessageCircle,
} from "lucide-react";
import Card from "../component/Card";
import MarkerEditor from "../component/MarkEditor";
import Button from "../component/Button";
import { Marker } from "../component/MarkEditor";
import dynamic from "next/dynamic";
import { Alert, AlertDescription } from "@/component/Alert";
import { CardContent } from "@/component/ui/card";

interface VideoPlayerProps {
  videoUrl: string;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  onTimeUpdate: () => void;
}

const VideoPlayer = dynamic(
  () =>
    Promise.resolve((props: VideoPlayerProps) => (
      <video
        ref={props.videoRef}
        className="w-full aspect-video"
        src={props.videoUrl}
        onTimeUpdate={props.onTimeUpdate}
        controls={false}
        suppressHydrationWarning
      />
    )),
  { ssr: false }
);

const VideoConfigurator = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [markers, setMarkers] = useState<Marker[]>([]);
  const [selectedMarker, setSelectedMarker] = useState<Marker | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [likes, setLikes] = useState(0);
  const [comments, setComments] = useState<Comment[]>([]);
  const [showEmoji, setShowEmoji] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleLike = () => {
    setLikes((prev) => prev + 1);
    setShowEmoji(true);
    setTimeout(() => setShowEmoji(false), 1000);
  };

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!videoRef.current) return;

      switch (e.key) {
        case "ArrowLeft":
          if (e.shiftKey) {
            videoRef.current.currentTime = Math.max(
              0,
              videoRef.current.currentTime - 5
            );
          } else {
            videoRef.current.currentTime = Math.max(
              0,
              videoRef.current.currentTime - 1
            );
          }
          break;
        case "ArrowRight":
          if (e.shiftKey) {
            videoRef.current.currentTime = Math.min(
              videoRef.current.duration,
              videoRef.current.currentTime + 5
            );
          } else {
            videoRef.current.currentTime = Math.min(
              videoRef.current.duration,
              videoRef.current.currentTime + 1
            );
          }
          break;
        case " ":
          e.preventDefault();
          togglePlayPause();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [togglePlayPause]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setVideoUrl(url);
      setMarkers([]); // Reset markers for new video
      setSelectedMarker(null);
      setCurrentTime(0);
      setIsPlaying(false);
    }
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video) return;

    setCurrentTime(video.currentTime);

    const activeMarker = markers.find(
      (marker) => Math.abs(marker.timestamp - video.currentTime) < 0.5
    );

    if (activeMarker && !selectedMarker) {
      video.pause();
      setIsPlaying(false);
      setSelectedMarker(activeMarker);
    }
  };

  // Loading markers when video is uploaded
  useEffect(() => {
    if (videoUrl) {
      fetchMarkers();
    }
  }, [videoUrl]);

  const fetchMarkers = async () => {
    try {
      const response = await fetch(
        `/api/markers?videoId=${encodeURIComponent(videoUrl!)}`
      );
      const data = await response.json();
      setMarkers(data);
    } catch (error) {
      console.error("Failed to fetch markers:", error);
    }
  };

  const handleTimelineClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current) return;

    // Stop event propagation to prevent unwanted side effects
    event.stopPropagation();

    const timeline = event.currentTarget;
    const rect = timeline.getBoundingClientRect();
    const clickPosition = event.clientX - rect.left;
    const clickRatio = clickPosition / rect.width;
    const newTime = clickRatio * videoRef.current.duration;

    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const addMarker = useCallback(
    async (event?: React.MouseEvent) => {
      // If the event exists, prevent it from bubbling up
      if (event) {
        event.preventDefault();
        event.stopPropagation();
      }

      if (videoRef.current && videoUrl) {
        const currentTime = videoRef.current.currentTime;
        const newMarker = {
          videoId: videoUrl,
          timestamp: currentTime,
          content: "New interaction point",
          type: "text",
        };

        try {
          const response = await fetch("/api/markers", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(newMarker),
          });
          const savedMarker = await response.json();
          setMarkers((prev) =>
            [...prev, savedMarker].sort((a, b) => a.timestamp - b.timestamp)
          );
          setSelectedMarker(savedMarker);
          // Pause the video when adding a marker
          videoRef.current.pause();
          setIsPlaying(false);
        } catch (error) {
          console.error("Failed to add marker:", error);
        }
      }
    },
    [videoRef, videoUrl]
  );
  const updateMarker = useCallback(
    async (markerId: string, updates: Partial<Marker>) => {
      try {
        const response = await fetch(`/api/markers/${markerId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updates),
        });
        const updatedMarker = await response.json();
        setMarkers((prev) =>
          prev.map((marker) =>
            marker._id === markerId ? updatedMarker : marker
          )
        );
      } catch (error) {
        console.error("Failed to update marker:", error);
      }
    },
    []
  );
  const deleteMarker = useCallback(
    async (markerId: string) => {
      try {
        await fetch(`/api/markers/${markerId}`, {
          method: "DELETE",
        });
        setMarkers((prev) => prev.filter((marker) => marker._id !== markerId));

        // After deletion, seek to the first marker or the start of the video
        if (markers.length > 1) {
          const firstMarker = markers[0];
          videoRef.current!.currentTime = firstMarker.timestamp;
        } else {
          videoRef.current!.currentTime = 0;
        }
        setSelectedMarker(null);
      } catch (error) {
        console.error("Failed to delete marker:", error);
      }
    },
    [markers]
  );
   
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.addEventListener("timeupdate", handleTimeUpdate);
      return () => {
        videoRef.current?.removeEventListener("timeupdate", handleTimeUpdate);
      };
    }
  }, [handleTimeUpdate]);

  if (!isClient) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      <div className="container mx-auto p-4">
        {/* Conditionally render the Upload Another Video Button */}
        {videoUrl && (
          <div className="mb-4 text-center">
            <Button
              onClick={triggerFileUpload}
              className="group flex items-center gap-2 bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white rounded-xl px-6 py-3 transform transition-all hover:scale-105"
            >
              <Upload
                size={20}
                className="group-hover:rotate-12 transition-transform"
              />
              Upload Another Video
            </Button>
          </div>
        )}

        {/* New Feature: Trending Alert */}
        <Alert className="mb-6  flex items-center justify-center bg-gradient-to-r from-pink-500 to-purple-500 text-white border-none">
          <Sparkles className="h-4 w-4" />
          <AlertDescription>
            🔥 Trending now: Create your own interactive video moments!
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Video Section */}
          <Card className="bg-white/90 backdrop-blur-sm border-none shadow-xl rounded-2xl overflow-hidden">
            <CardContent className="p-6">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept="video/*"
                className="hidden"
              />

              {!videoUrl ? (
                <div className="bg-gradient-to-r from-violet-100 to-pink-100 rounded-2xl p-8 text-center">
                  <Button
                    onClick={triggerFileUpload}
                    className="group flex items-center gap-2 bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white rounded-xl px-6 py-3 transform transition-all hover:scale-105"
                  >
                    <Upload
                      size={20}
                      className="group-hover:rotate-12 transition-transform"
                    />
                    Drop your video here
                  </Button>
                  <p className="mt-3 text-sm text-gray-600">
                    ✨ Create something amazing
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="relative rounded-xl overflow-hidden shadow-2xl">
                    <VideoPlayer
                      videoUrl={videoUrl}
                      videoRef={videoRef}
                      onTimeUpdate={handleTimeUpdate}
                    />

                    {/* New Feature: Social Interactions */}
                    <div className="absolute right-4 top-4 flex flex-col gap-4">
                      <button
                        onClick={handleLike}
                        className="bg-white/90 p-2 rounded-full shadow-lg hover:bg-pink-100 transition-colors"
                      >
                        <Heart
                          className={`h-6 w-6 ${
                            likes > 0
                              ? "text-pink-500 fill-pink-500"
                              : "text-gray-700"
                          }`}
                        />
                        <span className="text-xs font-bold">{likes}</span>
                      </button>
                      <button className="bg-white/90 p-2 rounded-full shadow-lg hover:bg-blue-100 transition-colors">
                        <Share2 className="h-6 w-6 text-gray-700" />
                      </button>
                      <button className="bg-white/90 p-2 rounded-full shadow-lg hover:bg-purple-100 transition-colors">
                        <MessageCircle className="h-6 w-6 text-gray-700" />
                        <span className="text-xs font-bold">
                          {comments.length}
                        </span>
                      </button>
                    </div>

                    {/* Emoji Animation */}
                    {showEmoji && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <span className="text-6xl animate-bounce">❤️</span>
                      </div>
                    )}

                    {/* Custom Controls */}
                    <div
                      className="absolute bottom-4 left-4 right-4 flex items-center gap-4 bg-black/60 backdrop-blur-md p-3 rounded-xl"
                      onClick={handleTimelineClick} // Ensure this is attached
                    >
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={togglePlayPause}
                        className="text-white hover:text-pink-400 transition-all"
                      >
                        {isPlaying ? (
                          <PauseCircle size={24} />
                        ) : (
                          <PlayCircle size={24} />
                        )}
                      </Button>

                      <div className="relative flex-1 h-2 bg-gray-300/50 rounded-full cursor-pointer">
                        <div
                          className="absolute h-full bg-gradient-to-r from-violet-500 to-pink-500 rounded-full"
                          style={{
                            width: `${
                              (currentTime /
                                (videoRef.current?.duration || 1)) *
                              100
                            }%`,
                          }}
                        />
                        {markers.map((marker) => (
                          <div
                            key={marker._id}
                            className="absolute w-4 h-4 bg-white rounded-full cursor-pointer transform -translate-y-1/4 hover:scale-125 transition-transform"
                            style={{
                              left: `${
                                (marker.timestamp /
                                  (videoRef.current?.duration || 1)) *
                                100
                              }%`,
                            }}
                            onClick={() => setSelectedMarker(marker)}
                          >
                            <div className="w-2 h-2 bg-pink-500 rounded-full m-1" />
                          </div>
                        ))}
                      </div>

                      <Button
                        variant="ghost"
                        onClick={addMarker}
                        className="text-white hover:text-pink-400 transition-all"
                      >
                        <Plus size={24} />
                      </Button>
                    </div>
                  </div>

                  {/* New Feature: Interactive Moments */}
                  <div className="bg-gradient-to-r from-violet-100 to-pink-100 p-4 rounded-xl">
                    <h3 className="text-lg font-bold bg-gradient-to-r from-violet-600 to-pink-600 text-transparent bg-clip-text mb-3">
                      ✨ Your Moments
                    </h3>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                        {markers.map((marker) => (
                        <div
                          key={marker._id}
                          className={`p-3 rounded-lg cursor-pointer transition-all hover:scale-102 ${
                            selectedMarker?._id === marker._id
                              ? "bg-gradient-to-r from-violet-200 to-pink-200"
                              : "bg-white/80 hover:bg-white"
                          }`}
                          onClick={() => setSelectedMarker(marker)}
                        >
                          <p className="font-medium text-black">
                            {marker.timestamp.toFixed(1)}s
                          </p>
                          <p className="text-sm text-gray-600">
                            {marker.content}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Marker Editor Section */}
          <div className="h-full">
            {selectedMarker ? (
              <MarkerEditor
                marker={selectedMarker}
                onUpdate={updateMarker}
                onDelete={deleteMarker}
                onClose={() => setSelectedMarker(null)}
              />
            ) : (
              <Card className="h-full bg-white/90 backdrop-blur-sm border-none shadow-xl rounded-2xl">
                <CardContent className="p-6 h-full flex flex-col items-center justify-center text-center">
                  <Sparkles className="h-12 w-12 text-purple-500 mb-4" />
                  <p className="text-lg bg-gradient-to-r from-violet-600 to-pink-600 text-transparent bg-clip-text font-bold">
                    {videoUrl
                      ? "✨ Click anywhere on the timeline to add your magic ✨"
                      : "Upload a video to start creating interactive moments"}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Prevent SSR for the entire component
export default dynamic(() => Promise.resolve(VideoConfigurator), {
  ssr: false,
});
