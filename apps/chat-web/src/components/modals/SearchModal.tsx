import { useState, useEffect, useCallback, useRef } from 'react';
import { Search, X, Hash, MessageSquare, Calendar, User, Filter, ChevronRight } from 'lucide-react';
import { ModalCore, EModalPosition, EModalWidth } from '@uts/design-system/ui';
import { api, type SearchResultItem, type SearchOptions } from '../../services/api';
import type { Room } from '../../types';
import type { UserInfo } from '../../contexts/ChatContext';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  rooms: Room[];
  onNavigateToMessage: (roomId: string, messageId: string) => void;
  usersCache: Map<string, UserInfo>;
}

export function SearchModal({
  isOpen,
  onClose,
  rooms,
  onNavigateToMessage,
  usersCache,
}: SearchModalProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [showFilters, setShowFilters] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState<string>('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const inputRef = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Keyboard shortcut (Ctrl+K / Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (!isOpen) {
          // This would need to be handled by parent
        }
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Debounced search
  const performSearch = useCallback(async (searchQuery: string, options: SearchOptions = {}) => {
    if (searchQuery.length < 2) {
      setResults([]);
      setTotal(0);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const searchOptions: SearchOptions = {
        limit: 20,
        ...options,
      };

      if (selectedRoomId) {
        searchOptions.roomId = selectedRoomId;
      }
      if (startDate) {
        searchOptions.startDate = startDate;
      }
      if (endDate) {
        searchOptions.endDate = endDate;
      }

      const result = await api.searchMessages(searchQuery, searchOptions);
      setResults(result.items);
      setTotal(result.total);
    } catch (err) {
      console.error('Search failed:', err);
      setError('Failed to search. Please try again.');
      setResults([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [selectedRoomId, startDate, endDate]);

  // Handle query change with debounce
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (query.length >= 2) {
      searchTimeoutRef.current = setTimeout(() => {
        performSearch(query);
      }, 300);
    } else {
      setResults([]);
      setTotal(0);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [query, performSearch]);

  const handleClose = () => {
    setQuery('');
    setResults([]);
    setTotal(0);
    setError(null);
    setShowFilters(false);
    setSelectedRoomId('');
    setStartDate('');
    setEndDate('');
    onClose();
  };

  const handleResultClick = (result: SearchResultItem) => {
    onNavigateToMessage(result.roomId, result.id);
    handleClose();
  };

  const getRoomName = (roomId: string) => {
    const room = rooms.find(r => r.id === roomId);
    return room?.name || 'Unknown Channel';
  };

  const getUserName = (userId: string) => {
    const user = usersCache.get(userId);
    return user?.displayName || 'Unknown User';
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Render highlighted content
  const renderHighlight = (highlight?: string, content?: string) => {
    const text = highlight || content || '';
    // The backend returns <mark>...</mark> tags for highlighting
    return (
      <span
        className="text-sm text-custom-text-300 line-clamp-2"
        dangerouslySetInnerHTML={{ __html: text }}
      />
    );
  };

  if (!isOpen) return null;

  return (
    <ModalCore
      isOpen={isOpen}
      handleClose={handleClose}
      position={EModalPosition.TOP}
      width={EModalWidth.XXXL}
    >
      <div className="flex flex-col max-h-[80vh]">
        {/* Search Header */}
        <div className="p-4 border-b border-custom-border-200">
          <div className="flex items-center gap-3">
            <Search size={20} className="text-custom-text-400 flex-shrink-0" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Search messages... (min 2 characters)"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 bg-transparent border-none outline-none text-custom-text-100 placeholder:text-custom-text-400 text-lg"
              autoFocus
            />
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`p-2 rounded-lg transition-colors ${
                  showFilters || selectedRoomId || startDate || endDate
                    ? 'bg-custom-primary-100/10 text-custom-primary-100'
                    : 'text-custom-text-400 hover:text-custom-text-100 hover:bg-custom-background-80'
                }`}
                title="Filters"
              >
                <Filter size={18} />
              </button>
              <button
                onClick={handleClose}
                className="p-2 rounded-lg text-custom-text-400 hover:text-custom-text-100 hover:bg-custom-background-80 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Keyboard hint */}
          <div className="flex items-center gap-2 mt-2 text-xs text-custom-text-400">
            <kbd className="px-1.5 py-0.5 rounded bg-custom-background-80 font-mono">ESC</kbd>
            <span>to close</span>
            <span className="mx-2">•</span>
            <kbd className="px-1.5 py-0.5 rounded bg-custom-background-80 font-mono">⌘K</kbd>
            <span>to open search</span>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="p-4 border-b border-custom-border-200 bg-custom-background-90">
            <div className="grid grid-cols-3 gap-4">
              {/* Room filter */}
              <div>
                <label className="block text-xs font-medium text-custom-text-300 mb-1.5">
                  Channel
                </label>
                <select
                  value={selectedRoomId}
                  onChange={(e) => setSelectedRoomId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-custom-background-100 border border-custom-border-200 text-sm text-custom-text-100 focus:outline-none focus:border-custom-primary-100"
                >
                  <option value="">All channels</option>
                  {rooms.filter(r => r.type === 'channel').map((room) => (
                    <option key={room.id} value={room.id}>
                      # {room.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date range */}
              <div>
                <label className="block text-xs font-medium text-custom-text-300 mb-1.5">
                  From Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-custom-background-100 border border-custom-border-200 text-sm text-custom-text-100 focus:outline-none focus:border-custom-primary-100"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-custom-text-300 mb-1.5">
                  To Date
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-custom-background-100 border border-custom-border-200 text-sm text-custom-text-100 focus:outline-none focus:border-custom-primary-100"
                />
              </div>
            </div>

            {/* Clear filters button */}
            {(selectedRoomId || startDate || endDate) && (
              <button
                onClick={() => {
                  setSelectedRoomId('');
                  setStartDate('');
                  setEndDate('');
                }}
                className="mt-3 text-xs text-custom-primary-100 hover:underline"
              >
                Clear all filters
              </button>
            )}
          </div>
        )}

        {/* Results */}
        <div className="flex-1 overflow-y-auto vertical-scrollbar scrollbar-sm">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-8 h-8 mb-3 border-2 border-custom-primary-100/20 border-t-custom-primary-100 rounded-full animate-spin" />
              <p className="text-sm text-custom-text-400">Searching...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <p className="text-sm text-red-500 mb-2">{error}</p>
              <button
                onClick={() => performSearch(query)}
                className="text-sm text-custom-primary-100 hover:underline"
              >
                Try again
              </button>
            </div>
          ) : query.length < 2 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 mb-4 rounded-2xl bg-custom-background-80 flex items-center justify-center">
                <Search size={32} className="text-custom-text-300" />
              </div>
              <p className="text-sm font-medium text-custom-text-200 mb-1">
                Search your messages
              </p>
              <p className="text-xs text-custom-text-400 max-w-xs">
                Enter at least 2 characters to search across all your channels and direct messages
              </p>
            </div>
          ) : results.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 mb-4 rounded-2xl bg-custom-background-80 flex items-center justify-center">
                <MessageSquare size={32} className="text-custom-text-300" />
              </div>
              <p className="text-sm font-medium text-custom-text-200 mb-1">
                No results found
              </p>
              <p className="text-xs text-custom-text-400 max-w-xs">
                Try different keywords or adjust your filters
              </p>
            </div>
          ) : (
            <>
              {/* Results count */}
              <div className="px-4 py-2 border-b border-custom-border-200 bg-custom-background-90">
                <p className="text-xs text-custom-text-400">
                  Found <span className="font-medium text-custom-text-200">{total}</span> {total === 1 ? 'result' : 'results'} for &quot;{query}&quot;
                </p>
              </div>

              {/* Results list */}
              <div className="divide-y divide-custom-border-200">
                {results.map((result) => (
                  <button
                    key={result.id}
                    onClick={() => handleResultClick(result)}
                    className="w-full p-4 text-left hover:bg-custom-background-80 transition-colors group"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        {/* Channel & User info */}
                        <div className="flex items-center gap-2 mb-1.5">
                          <div className="flex items-center gap-1 text-xs text-custom-text-400">
                            <Hash size={12} />
                            <span className="font-medium">{getRoomName(result.roomId)}</span>
                          </div>
                          <span className="text-custom-text-400">•</span>
                          <div className="flex items-center gap-1 text-xs text-custom-text-400">
                            <User size={12} />
                            <span>{getUserName(result.userId)}</span>
                          </div>
                          <span className="text-custom-text-400">•</span>
                          <div className="flex items-center gap-1 text-xs text-custom-text-400">
                            <Calendar size={12} />
                            <span>{formatDate(result.createdAt)}</span>
                          </div>
                        </div>

                        {/* Message content with highlight */}
                        <div className="pr-8">
                          {renderHighlight(result.highlight, result.content)}
                        </div>

                        {/* Thread indicator */}
                        {result.threadId && (
                          <div className="mt-1.5 flex items-center gap-1 text-xs text-custom-primary-100">
                            <MessageSquare size={12} />
                            <span>In thread</span>
                          </div>
                        )}
                      </div>

                      {/* Arrow */}
                      <ChevronRight
                        size={16}
                        className="text-custom-text-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-1"
                      />
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Style for highlight marks */}
      <style jsx global>{`
        .search-highlight mark,
        mark {
          background-color: rgba(var(--color-primary-100), 0.3);
          color: inherit;
          padding: 0 2px;
          border-radius: 2px;
        }
      `}</style>
    </ModalCore>
  );
}
