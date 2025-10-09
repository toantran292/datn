"use client"
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useRouter } from "next/navigation";
import { MeetingGrid } from "@/components/MeetingGrid";
import { ScreenShareView } from "@/components/ScreenShareView";
import { ControlsToolbar } from "@/components/ControlsToolbar";
import { WaitingState } from "@/components/WaitingState";
import { CompactHuddle } from "@/components/CompactHuddle";
import { ChatPanel } from "@/components/ChatPanel";
import { useLocalMedia } from "@/hooks/useLocalMedia";
import { useScreenShare } from "@/hooks/useScreenShare";

type ViewMode =
    | "waiting"
    | "grid"
    | "screenShare"
    | "compact"
    | "compactGrid"
    | "focusView";

// Base participant images
const baseAvatars = [
    "https://images.unsplash.com/photo-1581065178047-8ee15951ede6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjB3b21hbiUyMGJ1c2luZXNzJTIwcG9ydHJhaXR8ZW58MXx8fHwxNzU5ODQwNTI3fDA&ixlib=rb-4.1.0&q=80&w=1080",
    "https://images.unsplash.com/photo-1723537742563-15c3d351dbf2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBtYW4lMjBidXNpbmVzcyUyMHBvcnRyYWl0fGVufDF8fHx8MTc1OTkzNjYyMXww&ixlib=rb-4.1.0&q=80&w=1080",
    "https://images.unsplash.com/photo-1740153204804-200310378f2f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx5b3VuZyUyMHByb2Zlc3Npb25hbCUyMGFzaWFuJTIwcG9ydHJhaXR8ZW58MXx8fHwxNzU5OTU4NjQxfDA&ixlib=rb-4.1.0&q=80&w=1080",
    "https://images.unsplash.com/photo-1652471943570-f3590a4e52ed?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBidXNpbmVzcyUyMGhlYWRzaG90fGVufDF8fHx8MTc1OTg0NjE5N3ww&ixlib=rb-4.1.0&q=80&w=1080",
    "https://images.unsplash.com/photo-1656313826909-1f89d1702a81?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkaXZlcnNlJTIwcHJvZmVzc2lvbmFsJTIwcG9ydHJhaXR8ZW58MXx8fHwxNzU5OTQ0ODIxfDA&ixlib=rb-4.1.0&q=80&w=1080",
    "https://images.unsplash.com/photo-1758518727077-ffb66ffccced?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxidXNpbmVzcyUyMHByb2Zlc3Npb25hbCUyMHNtaWxpbmd8ZW58MXx8fHwxNzU5OTU0Mjk3fDA&ixlib=rb-4.1.0&q=80&w=1080",
    "https://images.unsplash.com/photo-1627161683077-e34782c24d81?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxidXNpbmVzcyUyMGhlYWRzaG90JTIwd29tYW58ZW58MXx8fHwxNzU5OTQ2NDA1fDA&ixlib=rb-4.1.0&q=80&w=1080",
    "https://images.unsplash.com/photo-1719257751404-1dea075324bd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBtYW4lMjBoZWFkc2hvdHxlbnwxfHx8fDE3NTk5MDA3Nzl8MA&ixlib=rb-4.1.0&q=80&w=1080",
];

const firstNames = [
    "Sarah",
    "Marcus",
    "Yuki",
    "Alex",
    "Maya",
    "Jordan",
    "Emma",
    "Liam",
    "Sophia",
    "Noah",
    "Olivia",
    "Ethan",
    "Ava",
    "Mason",
    "Isabella",
    "Lucas",
    "Mia",
    "Oliver",
    "Charlotte",
    "James",
    "Amelia",
    "Logan",
    "Harper",
    "Benjamin",
    "Evelyn",
    "Elijah",
    "Abigail",
    "William",
    "Emily",
    "Henry",
    "Elizabeth",
    "Sebastian",
    "Sofia",
    "Jack",
    "Avery",
    "Michael",
    "Ella",
    "Alexander",
    "Scarlett",
    "Daniel",
    "Grace",
    "Matthew",
    "Chloe",
    "Samuel",
    "Victoria",
    "David",
    "Riley",
    "Joseph",
    "Aria",
    "Carter",
];
const lastNames = [
    "Chen",
    "Johnson",
    "Tanaka",
    "Rivera",
    "Patel",
    "Lee",
    "Smith",
    "Williams",
    "Brown",
    "Jones",
    "Garcia",
    "Martinez",
    "Rodriguez",
    "Wilson",
    "Anderson",
    "Taylor",
    "Thomas",
    "Moore",
    "Jackson",
    "Martin",
    "Thompson",
    "White",
    "Lopez",
    "Gonzalez",
    "Harris",
    "Clark",
    "Lewis",
    "Robinson",
    "Walker",
    "Hall",
    "Young",
    "Allen",
    "King",
    "Wright",
    "Scott",
    "Torres",
    "Nguyen",
    "Hill",
    "Flores",
    "Green",
    "Adams",
    "Nelson",
    "Baker",
    "Mitchell",
    "Perez",
    "Roberts",
    "Turner",
    "Phillips",
    "Campbell",
    "Parker",
];

// Generate 50 participants
function generateParticipants(count: number) {
    return Array.from({ length: count }, (_, i) => ({
        id: String(i + 1),
        name: `${firstNames[i % firstNames.length]} ${lastNames[i % lastNames.length]}`,
        avatarUrl: baseAvatars[i % baseAvatars.length],
        isSpeaking: i === 1, // Marcus Johnson starts as speaker
        isMuted: Math.random() > 0.7,
        caption:
            i === 1 ? "Let's focus on the Q3 roadmap next" : "",
    }));
}

const captions = [
    "Let's focus on the Q3 roadmap next",
    "I agree with that approach",
    "Can we review the metrics?",
    "That makes sense to me",
    "Great point about the timeline",
    "We should prioritize mobile first",
    "What about the budget constraints?",
    "I can take that action item",
    "Let me share my screen",
    "Good question, let me check",
];

export default function App() {
    const router = useRouter();
    const [viewMode, setViewMode] =
        useState<ViewMode>("grid");
    const [participantCount, setParticipantCount] = useState(12);
    const [isMicOn, setIsMicOn] = useState(false);
    const [isVideoOn, setIsVideoOn] = useState(false);
    const [isCaptionsOn, setIsCaptionsOn] = useState(false);
    const [isScreenSharing, setIsScreenSharing] = useState(false);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [unreadMessages, setUnreadMessages] = useState(0);
    const [showGridCaptions, setShowGridCaptions] = useState(true);
    const [participants, setParticipants] = useState(() => {
        const base = generateParticipants(participantCount);
        return [{ id: 'local', name: 'You', avatarUrl: base[0]?.avatarUrl || '', isSpeaking: false, isMuted: !isMicOn, caption: '', isLocal: true }, ...base];
    });
    const [duration, setDuration] = useState("12:34");

    // Local media for self-preview
    const { videoStream, enableVideo, disableVideo, enableMic, disableMic, audioLevel } = useLocalMedia();
    const { isSharing, screenStream, toggleShare } = useScreenShare();

    // Update participants when count changes
    useEffect(() => {
        setParticipants((prev) => {
            const base = generateParticipants(participantCount);
            const local = prev.find(p => p.id === 'local') || { id: 'local', name: 'You', avatarUrl: base[0]?.avatarUrl || '', isSpeaking: false, isMuted: !isMicOn, caption: '', isLocal: true };
            return [local, ...base];
        });
    }, [participantCount]);

    // Simulate speaking participants rotation
    useEffect(() => {
        const interval = setInterval(() => {
            setParticipants((prev) => {
                const next = [...prev];
                // Clear all speaking
                next.forEach((p) => {
                    p.isSpeaking = false;
                    p.caption = "";
                });
                // Pick random speaker
                const speakerIndex = Math.floor(
                    Math.random() * next.length,
                );
                next[speakerIndex].isSpeaking = false;
                if (isCaptionsOn) {
                    next[speakerIndex].caption =
                        captions[
                        Math.floor(Math.random() * captions.length)
                        ];
                }
                return next;
            });
        }, 4000);

        return () => clearInterval(interval);
    }, [isCaptionsOn]);

    // Update captions when caption toggle changes
    useEffect(() => {
        setParticipants((prev) => {
            const next = [...prev];
            next.forEach((p) => {
                if (!isCaptionsOn) {
                    p.caption = "";
                } else if (p.isSpeaking) {
                    p.caption =
                        captions[
                        Math.floor(Math.random() * captions.length)
                        ];
                }
            });
            return next;
        });
    }, [isCaptionsOn]);

    // Simulate unread messages when chat is closed
    useEffect(() => {
        if (!isChatOpen) {
            const interval = setInterval(() => {
                setUnreadMessages((prev) => Math.min(prev + 1, 99));
            }, 10000); // New message every 10 seconds

            return () => clearInterval(interval);
        } else {
            setUnreadMessages(0);
        }
    }, [isChatOpen]);

    const handleToggleScreenShare = () => {
        const next = !isScreenSharing;
        setIsScreenSharing(next);
        if (next) setViewMode("screenShare"); else setViewMode("grid");
        void toggleShare();
    };

    const handleViewModeChange = (mode: ViewMode) => {
        setViewMode(mode);
        // Adjust participant count based on mode
        if (mode === "compactGrid" || mode === "focusView") {
            setParticipantCount(50);
            setIsScreenSharing(true);
        } else if (mode === "screenShare") {
            setParticipantCount(12);
            setIsScreenSharing(true);
        } else if (mode === "grid") {
            setParticipantCount(50); // Show paginated grid with 50 participants
            setIsScreenSharing(false);
        } else {
            setParticipantCount(6);
            setIsScreenSharing(false);
        }
    };

    // Determine screen share view mode
    const getScreenShareViewMode = () => {
        if (viewMode === "compactGrid") return "compactGrid";
        if (viewMode === "focusView") return "focusView";
        return "default";
    };

    // Sync local preview with camera state
    useEffect(() => {
        (async () => {
            try {
                if (isVideoOn) {
                    await enableVideo();
                } else {
                    disableVideo();
                }
            } catch { }
        })();
    }, [isVideoOn, enableVideo, disableVideo]);

    // Sync mic capture with mic toggle
    useEffect(() => {
        (async () => {
            try {
                if (isMicOn) {
                    await enableMic();
                } else {
                    disableMic();
                }
            } catch { }
        })();
    }, [isMicOn, enableMic, disableMic]);

    // Mark local speaking when audio level is high
    useEffect(() => {
        setParticipants(prev => prev.map(p => p.id === 'local' ? { ...p, isSpeaking: audioLevel > 8 } : p));
    }, [audioLevel]);

    return (
        <div
            className="h-dvh w-full relative overflow-hidden flex"
            style={{ background: "var(--ts-bg-dark)" }}
        >
            {/* Main content area */}
            <div className="flex-1 relative overflow-hidden">
                <AnimatePresence mode="wait">
                    {viewMode === "waiting" && (
                        <motion.div
                            key="waiting"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="w-full h-full"
                        >
                            <WaitingState />
                        </motion.div>
                    )}

                    {viewMode === "grid" && (
                        <motion.div
                            key="grid"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="w-full h-full"
                        >
                            <MeetingGrid
                                participants={participants}
                                showCaptions={isCaptionsOn}
                                onToggleCaptions={() => setIsCaptionsOn(!isCaptionsOn)}
                                localVideoStream={videoStream}
                            />
                        </motion.div>
                    )}

                    {(viewMode === "screenShare" ||
                        viewMode === "compactGrid" ||
                        viewMode === "focusView") && (
                            <motion.div
                                key="screenShare"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="w-full h-full"
                            >
                                <ScreenShareView
                                    participants={participants}
                                    sharerName="You"
                                    meetingTitle="Product Strategy Q3"
                                    duration={duration}
                                    isRecording={true}
                                    viewMode={getScreenShareViewMode()}
                                    showCaptions={isCaptionsOn}
                                    onToggleCaptions={() => setIsCaptionsOn(!isCaptionsOn)}
                                    micOn={isMicOn}
                                    videoOn={isVideoOn}
                                    screenShareOn={isScreenSharing}
                                    localVideoStream={videoStream}
                                    localScreenStream={screenStream}
                                    localAudioLevel={audioLevel}
                                />
                            </motion.div>
                        )}
                </AnimatePresence>

                {/* Compact huddle overlay */}
                <AnimatePresence>
                    {viewMode === "compact" && (
                        <CompactHuddle
                            participants={participants.slice(0, 6)}
                            onExpand={() => handleViewModeChange("grid")}
                            onClose={() => setViewMode("waiting")}
                        />
                    )}
                </AnimatePresence>

                {/* Controls toolbar - shown for all views except waiting and compact */}
                {viewMode !== "waiting" && viewMode !== "compact" && (
                    <ControlsToolbar
                        isMicOn={isMicOn}
                        isVideoOn={isVideoOn}
                        isCaptionsOn={isCaptionsOn}
                        isScreenSharing={isScreenSharing}
                        isChatOpen={isChatOpen}
                        unreadCount={unreadMessages}
                        onToggleMic={() => setIsMicOn(!isMicOn)}
                        onToggleVideo={() => setIsVideoOn(!isVideoOn)}
                        onToggleCaptions={() =>
                            setIsCaptionsOn(!isCaptionsOn)
                        }
                        onToggleScreenShare={handleToggleScreenShare}
                        onToggleChat={() => setIsChatOpen(!isChatOpen)}
                        onShowParticipants={() =>
                            console.log("Show participants")
                        }
                        onShowSettings={() => console.log("Show settings")}
                        onLeave={() => router.replace('/auth-join')}
                    />
                )}

                {/* Local preview tile is now part of MeetingGrid as a participant */}
            </div>

            {/* Chat Panel */}
            <AnimatePresence>
                {isChatOpen &&
                    viewMode !== "waiting" &&
                    viewMode !== "compact" && (
                        <ChatPanel onClose={() => setIsChatOpen(false)} />
                    )}
            </AnimatePresence>

            {/* View switcher (Demo controls) */}
            <motion.div
                initial={{ x: -100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="fixed top-6 right-6 z-40"
            >
                <div
                    className="rounded-xl backdrop-blur-xl border border-[var(--ts-border)] overflow-hidden"
                    style={{
                        background: "rgba(17, 24, 39, 0.9)",
                        boxShadow: "0 4px 16px rgba(0, 0, 0, 0.3)",
                    }}
                >
                    <div className="px-3 py-2 border-b border-[var(--ts-border)]">
                        <p className="text-[13px] text-[var(--ts-text-secondary)]">
                            View Mode
                        </p>
                    </div>
                    <div className="p-2 flex flex-col gap-1">
                        <ViewButton
                            active={viewMode === "waiting"}
                            onClick={() => handleViewModeChange("waiting")}
                        >
                            Waiting State
                        </ViewButton>
                        <ViewButton
                            active={viewMode === "grid"}
                            onClick={() => handleViewModeChange("grid")}
                        >
                            Grid View
                        </ViewButton>
                        <ViewButton
                            active={viewMode === "screenShare"}
                            onClick={() =>
                                handleViewModeChange("screenShare")
                            }
                        >
                            Screen Share
                        </ViewButton>
                        <ViewButton
                            active={viewMode === "compactGrid"}
                            onClick={() =>
                                handleViewModeChange("compactGrid")
                            }
                        >
                            Compact Grid (50)
                        </ViewButton>
                        <ViewButton
                            active={viewMode === "focusView"}
                            onClick={() => handleViewModeChange("focusView")}
                        >
                            Focus View
                        </ViewButton>
                        <ViewButton
                            active={viewMode === "compact"}
                            onClick={() => handleViewModeChange("compact")}
                        >
                            Compact Huddle
                        </ViewButton>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}

interface ViewButtonProps {
    active: boolean;
    onClick: () => void;
    children: React.ReactNode;
}

function ViewButton({
    active,
    onClick,
    children,
}: ViewButtonProps) {
    return (
        <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClick}
            className={`px-3 py-2 rounded-lg text-left transition-all ${active
                ? "text-white"
                : "text-[var(--ts-text-secondary)] hover:text-white hover:bg-[var(--ts-card-surface)]"
                }`}
            style={
                active
                    ? {
                        background:
                            "linear-gradient(135deg, var(--ts-orange) 0%, var(--ts-teal) 100%)",
                    }
                    : undefined
            }
        >
            {children}
        </motion.button>
    );
}