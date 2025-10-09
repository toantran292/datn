import { motion, AnimatePresence } from 'motion/react';
import { Maximize2, X, MessageSquareText } from 'lucide-react';

interface Participant {
    id: string;
    name: string;
    avatarUrl: string;
    isSpeaking: boolean;
    caption?: string;
}

interface CompactCaptionProps {
    participants: Participant[];
    onExpand: () => void;
    onClose: () => void;
}

export function CompactCaption({ participants, onExpand, onClose }: CompactCaptionProps) {
    const active = participants.find((p) => p.isSpeaking) ?? participants[0];
    const captionText = active?.caption || 'Waiting for captions…';

    return (
        <motion.div
            initial={{ x: 400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 400, opacity: 0 }}
            className="fixed bottom-6 right-6 z-50"
            drag
            dragMomentum={false}
            dragElastic={0}
        >
            <div
                className="rounded-2xl backdrop-blur-xl border border-[var(--ts-border)] overflow-hidden min-w-[320px]"
                style={{
                    background: 'rgba(17, 24, 39, 0.95)',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
                }}
            >
                {/* Header */}
                <div className="px-4 py-3 border-b border-[var(--ts-border)] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <motion.div
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="w-2 h-2 rounded-full bg-[var(--ts-teal)]"
                        />
                        <span className="text-white">Live Captions</span>
                    </div>

                    <div className="flex items-center gap-1">
                        <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={onClose}
                            className="p-1.5 rounded-lg hover:bg-[var(--ts-card-surface)] transition-colors"
                        >
                            <X className="w-4 h-4 text-[var(--ts-text-secondary)]" />
                        </motion.button>
                    </div>
                </div>

                {/* Body */}
                <div className="p-4 flex items-start gap-3">
                    {/* Avatar */}
                    {active && (
                        <div className="relative">
                            <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-[var(--ts-border)]">
                                <img src={active.avatarUrl} alt={active.name} className="w-full h-full object-cover" />
                            </div>
                        </div>
                    )}

                    {/* Caption content */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <MessageSquareText className="w-4 h-4 text-[var(--ts-text-secondary)]" />
                            <span className="text-white text-sm truncate">{active?.name ?? 'Unknown'}</span>
                        </div>
                        <AnimatePresence mode="wait">
                            <motion.p
                                key={captionText}
                                initial={{ opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -6 }}
                                className="text-[var(--ts-text-secondary)] text-[13px] leading-relaxed line-clamp-3"
                            >
                                {captionText}
                            </motion.p>
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}


