import { motion } from 'motion/react';
import { Users } from 'lucide-react';

export function WaitingState() {
  return (
    <div className="w-full h-full flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        {/* Animated gradient circle */}
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="w-32 h-32 mx-auto mb-8 rounded-full flex items-center justify-center relative bg-gradient-to-br from-ts-orange to-ts-teal"
          style={{
            boxShadow: '0 0 60px rgba(255, 136, 0, 0.3)',
          }}
        >
          <motion.div
            animate={{
              scale: [1, 0.9, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="w-28 h-28 rounded-full bg-ts-bg-dark flex items-center justify-center"
          >
            <Users className="w-12 h-12 text-ts-teal" />
          </motion.div>
        </motion.div>

        {/* Text */}
        <motion.h2
          animate={{
            opacity: [0.7, 1, 0.7],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="text-ts-teal mb-2 text-xl font-semibold"
        >
          Waiting for others to join...
        </motion.h2>
        <p className="text-ts-text-secondary">
          Share the meeting link to get started
        </p>

        {/* Animated dots */}
        <div className="flex items-center justify-center gap-2 mt-6">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.3, 1, 0.3],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: i * 0.2,
              }}
              className="w-2 h-2 rounded-full bg-gradient-to-br from-ts-orange to-ts-teal"
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
}
