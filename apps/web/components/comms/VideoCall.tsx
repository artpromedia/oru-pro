"use client";

import { useEffect, useState } from "react";
import { Mic, MicOff, PhoneOff, Video, VideoOff, ScreenShare } from "lucide-react";

export type VideoCallProps = {
  type: "audio" | "video";
  channelId: string;
  onEnd: () => void;
};

export const VideoCall = ({ type, channelId, onEnd }: VideoCallProps) => {
  const [muted, setMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(type === "audio");
  const [sharing, setSharing] = useState(false);

  useEffect(() => {
    setCameraOff(type === "audio");
  }, [type]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70">
      <div className="w-full max-w-3xl rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div>
            <p className="text-sm text-slate-500">Channel</p>
            <h3 className="text-lg font-semibold text-slate-900">{channelId}</h3>
          </div>
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
            {type === "audio" ? "Audio" : "Video"} call active
          </span>
        </div>

        <div className="h-80 bg-slate-900 text-white">
          <div className="flex h-full items-center justify-center">
            {cameraOff ? (
              <div className="rounded-full bg-slate-800 px-6 py-4 text-center">
                <p className="text-lg font-semibold">Camera disabled</p>
                <p className="text-sm text-slate-400">Enable camera to share video</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4">
                <div className="h-32 w-48 rounded-xl bg-slate-800" />
                <p className="text-sm text-slate-400">Live preview</p>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500" /> Connected
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMuted((prev) => !prev)}
              className={`rounded-full p-3 ${muted ? "bg-rose-50 text-rose-600" : "bg-slate-100 text-slate-700"}`}
            >
              {muted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
            </button>
            <button
              onClick={() => setCameraOff((prev) => !prev)}
              className={`rounded-full p-3 ${cameraOff ? "bg-rose-50 text-rose-600" : "bg-slate-100 text-slate-700"}`}
            >
              {cameraOff ? <VideoOff className="h-5 w-5" /> : <Video className="h-5 w-5" />}
            </button>
            <button
              onClick={() => setSharing((prev) => !prev)}
              className={`rounded-full p-3 ${sharing ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-700"}`}
            >
              <ScreenShare className="h-5 w-5" />
            </button>
            <button onClick={onEnd} className="rounded-full bg-rose-600 p-3 text-white shadow-lg">
              <PhoneOff className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoCall;
