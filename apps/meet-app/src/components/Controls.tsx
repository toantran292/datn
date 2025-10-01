'use client';
import React from 'react';

export default function Controls(props: {
    onJoinHost():void; onJoinGuest():void; onLeave():void;
    onShare():void; onCopyInvite():void; toggleView():void;
    inviteUrl?: string; viewLabel: string;
}) {
    const { onJoinHost, onJoinGuest, onLeave, onShare, onCopyInvite, toggleView, inviteUrl, viewLabel } = props;
    return (
        <div style={{ display:'flex', gap:8, marginBottom:12 }}>
            <button onClick={onJoinHost}>Join as Host</button>
            <button onClick={onJoinGuest}>Join as Guest</button>
            <button onClick={onLeave}>Leave</button>
            <button onClick={onShare}>Share screen</button>
            <button onClick={onCopyInvite}>Copy Invite</button>
            {inviteUrl && <span style={{fontSize:12,opacity:.7}}>Invite: {inviteUrl}</span>}
            <button onClick={toggleView}>{viewLabel}</button>
        </div>
    );
}
