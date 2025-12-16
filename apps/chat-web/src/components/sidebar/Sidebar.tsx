import { useMemo, useState } from 'react';
import { Users } from 'lucide-react';
import { useAppHeaderContext } from '@uts/design-system/ui';
import type { Room } from '../../types';
import { SidebarCategory, MenuItem } from './SidebarCategory';
import { ChannelItem } from './ChannelItem';
import { DMItem } from './DMItem';

export interface SidebarProps {
  rooms: Room[];
  orgLevelRooms: Room[];
  projectRooms: Room[];
  currentProjectId: string | null | undefined;
  selectedRoomId: string | null;
  isComposingDM?: boolean;
  onSelectRoom: (roomId: string) => void;
  onCreateOrgChannel: () => void;
  onCreateProjectChannel: () => void;
  onCreateDM: () => void;
  onStartComposeDM?: () => void;
  onBrowseOrgChannels: () => void;
  onBrowseProjectChannels: () => void;
  getDMName: (room: Room) => string;
}

export function Sidebar({
  rooms,
  orgLevelRooms,
  projectRooms,
  currentProjectId,
  selectedRoomId,
  isComposingDM = false,
  onSelectRoom,
  onCreateOrgChannel,
  onCreateProjectChannel,
  onCreateDM,
  onStartComposeDM,
  onBrowseOrgChannels,
  onBrowseProjectChannels,
  getDMName,
}: SidebarProps) {
  const { currentProject } = useAppHeaderContext();
  const [projectMenuOpen, setProjectMenuOpen] = useState(false);
  const [orgMenuOpen, setOrgMenuOpen] = useState(false);

  // Split rooms into channels and DMs
  const orgChannels = useMemo(() => orgLevelRooms.filter(r => r.type === 'channel'), [orgLevelRooms]);
  const projectChannels = useMemo(() => projectRooms.filter(r => r.type === 'channel'), [projectRooms]);
  const dms = useMemo(() => rooms.filter(r => r.type === 'dm'), [rooms]);

  return (
    <div className="w-[260px] border-r border-custom-border-200 flex flex-col h-full bg-custom-background-100">
      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto py-3 vertical-scrollbar scrollbar-sm">
        {/* Project Channels - Only show when in project context */}
        {currentProjectId && (
          <SidebarCategory
            title={currentProject?.name || 'Project'}
            defaultExpanded={true}
            onAddClick={onCreateProjectChannel}
            onMoreClick={() => setProjectMenuOpen(!projectMenuOpen)}
            showMoreMenu={projectMenuOpen}
            onCloseMoreMenu={() => setProjectMenuOpen(false)}
            moreMenuContent={
              <>
                <MenuItem onClick={() => {
                  onCreateProjectChannel();
                  setProjectMenuOpen(false);
                }}>
                  Create channel
                </MenuItem>
                <MenuItem onClick={() => {
                  onBrowseProjectChannels();
                  setProjectMenuOpen(false);
                }}>
                  Browse channels
                </MenuItem>
              </>
            }
            isEmpty={projectChannels.length === 0}
            emptyMessage="No project channels"
          >
            {projectChannels.map((room) => (
              <ChannelItem
                key={room.id}
                room={room}
                selected={selectedRoomId === room.id}
                onClick={() => onSelectRoom(room.id)}
                displayName={room.name || 'Unnamed Channel'}
              />
            ))}
          </SidebarCategory>
        )}

        {/* Workspace Channels */}
        <SidebarCategory
          title="Workspace"
          defaultExpanded={true}
          onAddClick={onCreateOrgChannel}
          onMoreClick={() => setOrgMenuOpen(!orgMenuOpen)}
          showMoreMenu={orgMenuOpen}
          onCloseMoreMenu={() => setOrgMenuOpen(false)}
          moreMenuContent={
            <>
              <MenuItem onClick={() => {
                onCreateOrgChannel();
                setOrgMenuOpen(false);
              }}>
                Create channel
              </MenuItem>
              <MenuItem onClick={() => {
                onBrowseOrgChannels();
                setOrgMenuOpen(false);
              }}>
                Browse channels
              </MenuItem>
            </>
          }
          isEmpty={orgChannels.length === 0}
          emptyMessage="No workspace channels"
        >
          {orgChannels.map((room) => (
            <ChannelItem
              key={room.id}
              room={room}
              selected={selectedRoomId === room.id}
              onClick={() => onSelectRoom(room.id)}
              displayName={room.name || 'Unnamed Channel'}
            />
          ))}
        </SidebarCategory>

        {/* Direct Messages */}
        <SidebarCategory
          title="Direct Messages"
          icon={<Users size={14} />}
          defaultExpanded={true}
          onAddClick={onStartComposeDM || onCreateDM}
          isEmpty={dms.length === 0}
          emptyMessage="No conversations yet"
        >
          {/* Show "New Message" item when composing */}
          {isComposingDM && (
            <div className="px-2 mb-1">
              <div className="flex items-center gap-2 px-2 py-1.5 bg-custom-primary-100/10 rounded-md">
                <div className="w-5 h-5 rounded bg-custom-primary-100/20 flex items-center justify-center">
                  <span className="text-custom-primary-100 text-xs">+</span>
                </div>
                <span className="text-sm font-medium text-custom-primary-100">New Message</span>
              </div>
            </div>
          )}
          {dms.map((room) => (
            <DMItem
              key={room.id}
              room={room}
              selected={!isComposingDM && selectedRoomId === room.id}
              onClick={() => onSelectRoom(room.id)}
              displayName={getDMName(room)}
            />
          ))}
        </SidebarCategory>
      </div>
    </div>
  );
}
