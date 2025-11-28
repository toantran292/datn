import React, { Component } from 'react';
import type { JitsiTrack } from '@/types/jitsi';

interface VideoProps {
  videoTrack?: JitsiTrack;
  autoPlay?: boolean;
  className?: string;
  muted?: boolean;
  id?: string;
}

/**
 * Component that renders a video element for a passed in video track.
 * Based on Jitsi Meet's Video.tsx implementation.
 */
export class Video extends Component<VideoProps, {}> {
  private _videoElement: HTMLVideoElement | null = null;
  private _mounted = false;
  private _isAttaching = false;

  static defaultProps = {
    autoPlay: true,
    className: '',
    muted: true,
    id: ''
  };

  constructor(props: VideoProps) {
    super(props);
    this._setVideoElement = this._setVideoElement.bind(this);
  }

  componentDidMount() {
    this._mounted = true;

    if (this._videoElement) {
      this._videoElement.volume = 0;
    }

    this._attachTrack(this.props.videoTrack).finally(() => {
      if (this._videoElement && this.props.autoPlay && this._mounted) {
        // Small delay to ensure track is fully attached
        setTimeout(() => {
          if (this._videoElement && this._mounted) {
            this._videoElement.play().catch((error) => {
              // Suppress "interrupted" errors as they're expected during track changes
              if (!error.message?.includes('interrupted')) {
                console.error('[Video] Play error:', error);
              }
            });
          }
        }, 100);
      }
    });
  }

  componentWillUnmount() {
    this._mounted = false;
    this._detachTrack(this.props.videoTrack);
  }

  shouldComponentUpdate(nextProps: VideoProps) {
    const currentJitsiTrack = this.props.videoTrack;
    const nextJitsiTrack = nextProps.videoTrack;

    // Only update if the track object changes (reference comparison)
    if (currentJitsiTrack !== nextJitsiTrack) {
      this._detachTrack(this.props.videoTrack);
      this._attachTrack(nextProps.videoTrack).then(() => {
        // After attaching, try to play if autoPlay is enabled
        if (this._videoElement && this.props.autoPlay && this._mounted) {
          this._videoElement.play().catch((error) => {
            console.error('[Video] Play error after track change:', error);
          });
        }
      }).catch(() => {
        // Error already logged
      });
    }

    // Allow re-render if className changes
    if (this.props.className !== nextProps.className) {
      return true;
    }

    // Blackbox this component from React re-renders
    return false;
  }

  render() {
    const { autoPlay, className, id, muted } = this.props;

    return (
      <video
        ref={this._setVideoElement}
        autoPlay={autoPlay}
        playsInline
        muted={muted}
        className={className}
        id={id}
      />
    );
  }

  private _attachTrack(videoTrack?: JitsiTrack): Promise<void> {
    if (!videoTrack) {
      this._isAttaching = false;
      return Promise.resolve();
    }

    if (!this._videoElement) {
      console.warn('[Video] Attach called without video element');
      this._isAttaching = false;
      return Promise.resolve();
    }

    if (this._isAttaching) {
      console.log('[Video] Already attaching, skipping...');
      return Promise.resolve();
    }

    this._isAttaching = true;
    console.log('[Video] Attaching track:', videoTrack.getId());

    return Promise.resolve(videoTrack.attach(this._videoElement))
      .then(() => {
        this._isAttaching = false;
      })
      .catch((error: Error) => {
        this._isAttaching = false;
        console.error('[Video] Attach error:', error);
      });
  }

  private _detachTrack(videoTrack?: JitsiTrack) {
    if (this._videoElement && videoTrack) {
      console.log('[Video] Detaching track:', videoTrack.getId());
      try {
        videoTrack.detach(this._videoElement);
      } catch (error) {
        console.error('[Video] Detach error:', error);
      }
    }
  }

  private _setVideoElement(element: HTMLVideoElement | null) {
    this._videoElement = element;
  }
}
