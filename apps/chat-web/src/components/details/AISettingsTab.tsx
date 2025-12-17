import { useState, useEffect, useRef } from 'react';
import { Bot, Sparkles, FileText, ListTodo, MessageSquare, AlertCircle, Shield, Loader2, Copy, Check, Settings, ExternalLink, StopCircle } from 'lucide-react';
import { api, type AIConfig, type AIFeature, type SummaryResult, type QAResult } from '../../services/api';
import { MarkdownContent } from '../common';

// Helper to strip HTML and truncate text for source preview
function getSourcePreview(html: string, maxLength: number = 80): string {
  // Strip HTML tags
  const text = html.replace(/<[^>]*>/g, '').trim();
  // Truncate if needed
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

interface AISettingsTabProps {
  roomId: string;
  canConfigure: boolean; // Only org owner/admin can configure
  threadId?: string;
  onNavigateToMessage?: (messageId: string) => void;
}

type ViewMode = 'assistant' | 'settings';

const AI_FEATURES: { key: AIFeature; label: string; description: string; icon: React.ReactNode }[] = [
  {
    key: 'summary',
    label: 'Conversation Summary',
    description: 'Summarize recent messages in the channel',
    icon: <Sparkles size={16} />,
  },
  {
    key: 'action_items',
    label: 'Action Items',
    description: 'Extract tasks and action items from conversations',
    icon: <ListTodo size={16} />,
  },
  {
    key: 'qa',
    label: 'Q&A Assistant',
    description: 'Ask questions about channel content',
    icon: <MessageSquare size={16} />,
  },
  {
    key: 'document_summary',
    label: 'Document Summary',
    description: 'Summarize attached documents',
    icon: <FileText size={16} />,
  },
];

export function AISettingsTab({ roomId, canConfigure, threadId, onNavigateToMessage }: AISettingsTabProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('assistant');
  const [config, setConfig] = useState<AIConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // AI Assistant state
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [summaryResult, setSummaryResult] = useState<SummaryResult | null>(null);
  const [qaResult, setQAResult] = useState<QAResult | null>(null);
  const [question, setQuestion] = useState('');
  const [copied, setCopied] = useState(false);

  // Streaming state
  const [streamingText, setStreamingText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingType, setStreamingType] = useState<'summary' | 'action_items' | 'qa' | null>(null);
  const [streamingSources, setStreamingSources] = useState<QAResult['sources']>([]);
  const [askedQuestion, setAskedQuestion] = useState(''); // Store the question that was asked
  const streamAbortRef = useRef<{ abort: () => void } | null>(null);

  useEffect(() => {
    loadConfig();
  }, [roomId]);

  const loadConfig = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getAIConfig(roomId);
      setConfig(data);
    } catch (err) {
      console.error('Failed to load AI config:', err);
      setError('Failed to load AI settings');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAI = async (enabled: boolean) => {
    if (!config || !canConfigure) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await api.updateAIConfig(roomId, { aiEnabled: enabled });
      setConfig(updated);
    } catch (err) {
      console.error('Failed to toggle AI:', err);
      setError('Failed to update AI settings. Only workspace owners and admins can configure AI.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleFeature = async (feature: AIFeature, enabled: boolean) => {
    if (!config || !canConfigure) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await api.toggleAIFeature(roomId, feature, enabled);
      setConfig(updated);
    } catch (err) {
      console.error('Failed to toggle feature:', err);
      setError('Failed to update AI feature. Only workspace owners and admins can configure AI.');
    } finally {
      setSaving(false);
    }
  };

  const isFeatureEnabled = (feature: AIFeature) => {
    if (!config?.aiEnabled) return false;
    return config.enabledFeatures?.includes(feature) ?? false;
  };

  const handleStopStreaming = () => {
    if (streamAbortRef.current) {
      streamAbortRef.current.abort();
      streamAbortRef.current = null;
    }
    setIsStreaming(false);
    setStreamingType(null);
    setAiLoading(false);
  };

  const handleSummarize = () => {
    if (!isFeatureEnabled('summary')) return;

    // Reset states
    setAiLoading(true);
    setIsStreaming(true);
    setStreamingType('summary');
    setAiError(null);
    setSummaryResult(null);
    setQAResult(null);
    setStreamingText('');
    setStreamingActionItemsText('');
    setStreamingSources([]);

    let fullText = '';

    const controller = api.streamSummarizeConversation(
      roomId,
      { messageCount: 50, threadId },
      {
        onChunk: (chunk) => {
          fullText += chunk;
          setStreamingText(fullText);
        },
        onDone: (messageCount) => {
          setSummaryResult({ summary: fullText, messageCount });
          setStreamingText('');
          setIsStreaming(false);
          setStreamingType(null);
          setAiLoading(false);
          streamAbortRef.current = null;
        },
        onError: (error) => {
          setAiError(error);
          setStreamingText('');
          setIsStreaming(false);
          setStreamingType(null);
          setAiLoading(false);
          streamAbortRef.current = null;
        },
      },
    );

    streamAbortRef.current = controller;
  };

  // State for streaming action items
  const [streamingActionItemsText, setStreamingActionItemsText] = useState('');
  const [actionItemsMessageCount, setActionItemsMessageCount] = useState(0);

  const handleExtractActionItems = () => {
    if (!isFeatureEnabled('action_items')) return;

    // Reset states
    setAiLoading(true);
    setIsStreaming(true);
    setStreamingType('action_items');
    setAiError(null);
    setSummaryResult(null);
    setQAResult(null);
    setStreamingText('');
    setStreamingActionItemsText('');
    setStreamingSources([]);

    let fullText = '';

    const controller = api.streamExtractActionItems(
      roomId,
      { messageCount: 50, threadId },
      {
        onChunk: (chunk) => {
          fullText += chunk;
          setStreamingActionItemsText(fullText);
        },
        onDone: (messageCount) => {
          setActionItemsMessageCount(messageCount);
          // Keep the streamed text as result, don't need structured items
          setStreamingActionItemsText(fullText);
          setIsStreaming(false);
          setStreamingType(null);
          setAiLoading(false);
          streamAbortRef.current = null;
        },
        onError: (error) => {
          setAiError(error);
          setStreamingActionItemsText('');
          setIsStreaming(false);
          setStreamingType(null);
          setAiLoading(false);
          streamAbortRef.current = null;
        },
      },
    );

    streamAbortRef.current = controller;
  };

  const handleAskQuestion = () => {
    if (!isFeatureEnabled('qa') || !question.trim()) return;

    // Reset states
    setAiLoading(true);
    setIsStreaming(true);
    setStreamingType('qa');
    setAiError(null);
    setSummaryResult(null);
    setQAResult(null);
    setStreamingText('');
    setStreamingActionItemsText('');
    setStreamingSources([]);

    const questionText = question;
    setQuestion('');
    setAskedQuestion(questionText); // Store the question for display

    let fullText = '';
    let sources: QAResult['sources'] = [];

    const controller = api.streamAskQuestion(
      roomId,
      questionText,
      { contextMessageCount: 100, threadId },
      {
        onSources: (receivedSources) => {
          sources = receivedSources;
          setStreamingSources(receivedSources);
        },
        onChunk: (chunk) => {
          fullText += chunk;
          setStreamingText(fullText);
        },
        onDone: () => {
          setQAResult({ answer: fullText, sources });
          setStreamingText('');
          setStreamingSources([]);
          setIsStreaming(false);
          setStreamingType(null);
          setAiLoading(false);
          streamAbortRef.current = null;
        },
        onError: (error) => {
          setAiError(error);
          setStreamingText('');
          setStreamingSources([]);
          setIsStreaming(false);
          setStreamingType(null);
          setAiLoading(false);
          streamAbortRef.current = null;
        },
      },
    );

    streamAbortRef.current = controller;
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 mx-auto mb-2 border-2 border-custom-primary-100/20 border-t-custom-primary-100 rounded-full animate-spin" />
          <p className="text-sm text-custom-text-400">Loading AI...</p>
        </div>
      </div>
    );
  }

  if (error && !config) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="text-center">
          <AlertCircle size={32} className="mx-auto mb-2 text-red-500" />
          <p className="text-sm text-red-500">{error}</p>
          <button onClick={loadConfig} className="mt-3 text-sm text-custom-primary-100 hover:underline">
            Try again
          </button>
        </div>
      </div>
    );
  }

  // Render AI Assistant view
  const renderAssistantView = () => {
    if (!config?.aiEnabled) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center p-4">
          <div className="w-16 h-16 mb-4 rounded-2xl bg-custom-background-80 flex items-center justify-center">
            <Bot size={32} className="text-custom-text-300" />
          </div>
          <p className="text-sm font-medium text-custom-text-200 mb-1">AI Assistant Disabled</p>
          <p className="text-xs text-custom-text-400 text-center max-w-xs">
            {canConfigure
              ? 'Enable AI in Settings to use intelligent features.'
              : 'Contact a workspace admin to enable AI features.'}
          </p>
          {canConfigure && (
            <button
              onClick={() => setViewMode('settings')}
              className="mt-3 text-sm text-custom-primary-100 hover:underline"
            >
              Go to Settings
            </button>
          )}
        </div>
      );
    }

    return (
      <div className="p-4 space-y-4">
        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={handleSummarize}
            disabled={!isFeatureEnabled('summary') || aiLoading}
            className={`flex flex-col items-center gap-2 p-3 rounded-lg border transition-colors ${
              isFeatureEnabled('summary')
                ? 'border-custom-border-200 hover:bg-custom-background-80 hover:border-amber-500/50'
                : 'border-custom-border-100 opacity-50 cursor-not-allowed'
            }`}
          >
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              isFeatureEnabled('summary') ? 'bg-amber-500/10' : 'bg-custom-background-80'
            }`}>
              <Sparkles size={16} className={isFeatureEnabled('summary') ? 'text-amber-500' : 'text-custom-text-400'} />
            </div>
            <span className="text-xs font-medium text-custom-text-100">Summarize</span>
          </button>

          <button
            onClick={handleExtractActionItems}
            disabled={!isFeatureEnabled('action_items') || aiLoading}
            className={`flex flex-col items-center gap-2 p-3 rounded-lg border transition-colors ${
              isFeatureEnabled('action_items')
                ? 'border-custom-border-200 hover:bg-custom-background-80 hover:border-blue-500/50'
                : 'border-custom-border-100 opacity-50 cursor-not-allowed'
            }`}
          >
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              isFeatureEnabled('action_items') ? 'bg-blue-500/10' : 'bg-custom-background-80'
            }`}>
              <ListTodo size={16} className={isFeatureEnabled('action_items') ? 'text-blue-500' : 'text-custom-text-400'} />
            </div>
            <span className="text-xs font-medium text-custom-text-100">Action Items</span>
          </button>
        </div>

        {/* Q&A Section */}
        {isFeatureEnabled('qa') && (
          <div className="p-3 rounded-lg border border-custom-border-200 bg-custom-background-90">
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare size={14} className="text-green-500" />
              <span className="text-xs font-medium text-custom-text-100">Ask a Question</span>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Ask about the conversation..."
                disabled={aiLoading}
                className="flex-1 px-2 py-1.5 rounded-md bg-custom-background-100 border border-custom-border-200 text-xs text-custom-text-100 placeholder:text-custom-text-400 focus:outline-none focus:border-custom-primary-100 disabled:opacity-50"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleAskQuestion();
                  }
                }}
              />
              <button
                onClick={handleAskQuestion}
                disabled={!question.trim() || aiLoading}
                className="px-3 py-1.5 rounded-md bg-custom-primary-100 text-white text-xs font-medium hover:bg-custom-primary-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Ask
              </button>
            </div>
          </div>
        )}

        {/* Streaming Content */}
        {isStreaming && streamingText && (
          <div className="p-3 rounded-lg bg-custom-background-80 border border-custom-border-200">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Loader2 size={14} className="text-custom-primary-100 animate-spin" />
                <span className="text-xs font-medium text-custom-text-100">
                  {streamingType === 'qa' ? 'Answering...' : 'Generating...'}
                </span>
              </div>
              <button
                onClick={handleStopStreaming}
                className="flex items-center gap-1 px-2 py-1 rounded text-xs text-red-500 hover:bg-red-500/10 transition-colors"
              >
                <StopCircle size={12} />
                Stop
              </button>
            </div>
            {/* Show question for Q&A streaming */}
            {streamingType === 'qa' && askedQuestion && (
              <div className="mb-3 pb-2 border-b border-custom-border-200">
                <p className="text-xs font-medium text-custom-text-400 mb-1">Question:</p>
                <p className="text-sm text-custom-text-100 italic">&ldquo;{askedQuestion}&rdquo;</p>
              </div>
            )}
            {streamingType === 'qa' && <p className="text-xs font-medium text-custom-text-400 mb-1">Answer:</p>}
            <MarkdownContent content={streamingText} />
            {/* Show sources while streaming Q&A */}
            {streamingSources && streamingSources.length > 0 && (
              <div className="mt-2 pt-2 border-t border-custom-border-200">
                <p className="text-xs font-medium text-custom-text-400 mb-1">Sources:</p>
                <div className="space-y-1">
                  {streamingSources.slice(0, 3).map((source, index) => (
                    <button
                      key={index}
                      onClick={() => onNavigateToMessage?.(source.messageId)}
                      className="w-full text-left text-xs text-custom-text-300 bg-custom-background-90 px-2 py-1.5 rounded hover:bg-custom-background-80 hover:text-custom-text-100 transition-colors group flex items-start gap-2"
                      title="Click to go to message"
                    >
                      <span className="flex-1 line-clamp-2">{getSourcePreview(source.content)}</span>
                      <ExternalLink size={12} className="flex-shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Loading (initial, before streaming starts) */}
        {aiLoading && !isStreaming && (
          <div className="flex flex-col items-center justify-center py-6">
            <Loader2 size={24} className="text-custom-primary-100 animate-spin mb-2" />
            <p className="text-xs text-custom-text-400">Processing...</p>
          </div>
        )}

        {/* Loading with spinner only (streaming but no text yet) - only for summary/QA */}
        {isStreaming && streamingType !== 'action_items' && !streamingText && streamingSources?.length === 0 && (
          <div className="flex flex-col items-center justify-center py-6">
            <Loader2 size={24} className="text-custom-primary-100 animate-spin mb-2" />
            <p className="text-xs text-custom-text-400">Starting stream...</p>
            <button
              onClick={handleStopStreaming}
              className="mt-2 flex items-center gap-1 px-2 py-1 rounded text-xs text-red-500 hover:bg-red-500/10 transition-colors"
            >
              <StopCircle size={12} />
              Cancel
            </button>
          </div>
        )}

        {/* Error */}
        {aiError && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
            <div className="flex items-start gap-2">
              <AlertCircle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-red-500">{aiError}</p>
            </div>
          </div>
        )}

        {/* Summary Result */}
        {summaryResult && (
          <div className="p-3 rounded-lg bg-custom-background-80 border border-custom-border-200">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Sparkles size={14} className="text-amber-500" />
                <span className="text-xs font-medium text-custom-text-100">Summary</span>
              </div>
              <button
                onClick={() => handleCopy(summaryResult.summary)}
                className="p-1 rounded hover:bg-custom-background-90 text-custom-text-400 hover:text-custom-text-100"
              >
                {copied ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
              </button>
            </div>
            <MarkdownContent content={summaryResult.summary} />
            <p className="text-xs text-custom-text-400 mt-2 pt-2 border-t border-custom-border-200">
              Based on {summaryResult.messageCount} messages
            </p>
          </div>
        )}

        {/* Action Items Result - Streaming or Completed */}
        {(streamingActionItemsText || streamingType === 'action_items') && !summaryResult && !qaResult && (
          <div className="p-3 rounded-lg bg-custom-background-80 border border-custom-border-200">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {isStreaming ? (
                  <Loader2 size={14} className="text-blue-500 animate-spin" />
                ) : (
                  <ListTodo size={14} className="text-blue-500" />
                )}
                <span className="text-xs font-medium text-custom-text-100">
                  {isStreaming ? 'Extracting Action Items...' : 'Action Items'}
                </span>
              </div>
              <div className="flex items-center gap-1">
                {isStreaming && (
                  <button
                    onClick={handleStopStreaming}
                    className="flex items-center gap-1 px-2 py-1 rounded text-xs text-red-500 hover:bg-red-500/10 transition-colors"
                  >
                    <StopCircle size={12} />
                    Stop
                  </button>
                )}
                {!isStreaming && streamingActionItemsText && (
                  <button
                    onClick={() => handleCopy(streamingActionItemsText)}
                    className="p-1 rounded hover:bg-custom-background-90 text-custom-text-400 hover:text-custom-text-100"
                  >
                    {copied ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
                  </button>
                )}
              </div>
            </div>
            {streamingActionItemsText ? (
              <>
                <MarkdownContent content={streamingActionItemsText} />
                {!isStreaming && actionItemsMessageCount > 0 && (
                  <p className="text-xs text-custom-text-400 mt-2 pt-2 border-t border-custom-border-200">
                    Based on {actionItemsMessageCount} messages
                  </p>
                )}
              </>
            ) : (
              <div className="flex items-center justify-center py-4">
                <Loader2 size={20} className="text-blue-500 animate-spin" />
              </div>
            )}
          </div>
        )}

        {/* Q&A Result */}
        {qaResult && (
          <div className="p-3 rounded-lg bg-custom-background-80 border border-custom-border-200">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <MessageSquare size={14} className="text-green-500" />
                <span className="text-xs font-medium text-custom-text-100">Q&A</span>
              </div>
              <button
                onClick={() => handleCopy(qaResult.answer)}
                className="p-1 rounded hover:bg-custom-background-90 text-custom-text-400 hover:text-custom-text-100"
              >
                {copied ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
              </button>
            </div>
            {/* Show the question */}
            {askedQuestion && (
              <div className="mb-3 pb-2 border-b border-custom-border-200">
                <p className="text-xs font-medium text-custom-text-400 mb-1">Question:</p>
                <p className="text-sm text-custom-text-100 italic">&ldquo;{askedQuestion}&rdquo;</p>
              </div>
            )}
            <p className="text-xs font-medium text-custom-text-400 mb-1">Answer:</p>
            <MarkdownContent content={qaResult.answer} />
            {qaResult.sources && qaResult.sources.length > 0 && (
              <div className="mt-2 pt-2 border-t border-custom-border-200">
                <p className="text-xs font-medium text-custom-text-400 mb-1">Sources:</p>
                <div className="space-y-1">
                  {qaResult.sources.slice(0, 3).map((source, index) => (
                    <button
                      key={index}
                      onClick={() => onNavigateToMessage?.(source.messageId)}
                      className="w-full text-left text-xs text-custom-text-300 bg-custom-background-90 px-2 py-1.5 rounded hover:bg-custom-background-80 hover:text-custom-text-100 transition-colors group flex items-start gap-2"
                      title="Click to go to message"
                    >
                      <span className="flex-1 line-clamp-2">{getSourcePreview(source.content)}</span>
                      <ExternalLink size={12} className="flex-shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // Render Settings view
  const renderSettingsView = () => (
    <div className="p-4 space-y-4">
      {/* Permission Notice */}
      {!canConfigure && (
        <div className="flex items-start gap-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
          <Shield size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
          <div className="text-xs">
            <p className="font-medium text-amber-600">View Only</p>
            <p className="text-custom-text-400 mt-0.5">Only workspace owners and admins can configure AI.</p>
          </div>
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className="flex items-start gap-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
          <AlertCircle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-red-500">{error}</p>
        </div>
      )}

      {/* Master Toggle */}
      <div className="flex items-center justify-between p-3 bg-custom-background-80 rounded-lg">
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
            config?.aiEnabled ? 'bg-custom-primary-100/20' : 'bg-custom-background-90'
          }`}>
            <Bot size={16} className={config?.aiEnabled ? 'text-custom-primary-100' : 'text-custom-text-400'} />
          </div>
          <div>
            <div className="font-medium text-xs text-custom-text-100">AI Assistant</div>
            <div className="text-xs text-custom-text-400">
              {config?.aiEnabled ? 'Enabled' : 'Disabled'}
            </div>
          </div>
        </div>
        <button
          onClick={() => handleToggleAI(!config?.aiEnabled)}
          disabled={!canConfigure || saving}
          className={`relative w-9 h-5 rounded-full transition-colors ${
            config?.aiEnabled ? 'bg-custom-primary-100' : 'bg-custom-background-90'
          } ${!canConfigure ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
            config?.aiEnabled ? 'translate-x-4' : 'translate-x-0.5'
          }`} />
        </button>
      </div>

      {/* Feature Toggles */}
      {config?.aiEnabled && (
        <div className="space-y-2">
          <h3 className="text-xs font-medium text-custom-text-300 uppercase tracking-wider px-1">Features</h3>
          {AI_FEATURES.map((feature) => {
            const isEnabled = config?.enabledFeatures?.includes(feature.key);
            return (
              <div key={feature.key} className="flex items-center justify-between p-2 bg-custom-background-80 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className={`w-6 h-6 rounded flex items-center justify-center ${
                    isEnabled ? 'bg-custom-primary-100/20 text-custom-primary-100' : 'bg-custom-background-90 text-custom-text-400'
                  }`}>
                    {feature.icon}
                  </div>
                  <div>
                    <div className="text-xs font-medium text-custom-text-100">{feature.label}</div>
                    <div className="text-xs text-custom-text-400">{feature.description}</div>
                  </div>
                </div>
                <button
                  onClick={() => handleToggleFeature(feature.key, !isEnabled)}
                  disabled={!canConfigure || saving}
                  className={`relative w-8 h-4 rounded-full transition-colors ${
                    isEnabled ? 'bg-custom-primary-100' : 'bg-custom-background-90'
                  } ${!canConfigure ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full shadow transition-transform ${
                    isEnabled ? 'translate-x-4' : 'translate-x-0.5'
                  }`} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Model Info */}
      {config?.aiEnabled && (
        <div className="p-2 bg-custom-background-80 rounded-lg">
          <div className="text-xs text-custom-text-400">
            <span className="font-medium">Model:</span> {config.modelName || 'gpt-4o-mini'}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="flex flex-col h-full">
      {/* Header with sub-tabs */}
      <div className="px-4 py-2 border-b border-custom-border-200 bg-custom-background-90">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setViewMode('assistant')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              viewMode === 'assistant'
                ? 'bg-custom-primary-100/10 text-custom-primary-100'
                : 'text-custom-text-400 hover:text-custom-text-100 hover:bg-custom-background-80'
            }`}
          >
            <Sparkles size={12} />
            Assistant
          </button>
          <button
            onClick={() => setViewMode('settings')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              viewMode === 'settings'
                ? 'bg-custom-primary-100/10 text-custom-primary-100'
                : 'text-custom-text-400 hover:text-custom-text-100 hover:bg-custom-background-80'
            }`}
          >
            <Settings size={12} />
            Settings
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto vertical-scrollbar scrollbar-sm">
        {viewMode === 'assistant' ? renderAssistantView() : renderSettingsView()}
      </div>
    </div>
  );
}
