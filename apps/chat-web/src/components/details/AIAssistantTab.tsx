import { useState } from 'react';
import { Sparkles, ListTodo, MessageSquare, FileText, Loader2, AlertCircle, Copy, Check } from 'lucide-react';
import { api, type SummaryResult, type ActionItemsResult, type QAResult, type AIConfig } from '../../services/api';

interface AIAssistantTabProps {
  roomId: string;
  aiConfig: AIConfig | null;
  threadId?: string;
}

type AIAction = 'summary' | 'action_items' | 'qa';

export function AIAssistantTab({ roomId, aiConfig, threadId }: AIAssistantTabProps) {
  const [activeAction, setActiveAction] = useState<AIAction | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Results
  const [summaryResult, setSummaryResult] = useState<SummaryResult | null>(null);
  const [actionItemsResult, setActionItemsResult] = useState<ActionItemsResult | null>(null);
  const [qaResult, setQAResult] = useState<QAResult | null>(null);

  // Q&A input
  const [question, setQuestion] = useState('');

  // Copy state
  const [copied, setCopied] = useState(false);

  const isFeatureEnabled = (feature: AIAction) => {
    if (!aiConfig?.aiEnabled) return false;
    return aiConfig.enabledFeatures?.includes(feature) ?? false;
  };

  const handleSummarize = async () => {
    if (!isFeatureEnabled('summary')) return;

    setActiveAction('summary');
    setLoading(true);
    setError(null);
    setSummaryResult(null);

    try {
      const result = await api.summarizeConversation(roomId, {
        messageCount: 50,
        threadId,
      });
      setSummaryResult(result);
    } catch (err) {
      console.error('Failed to summarize:', err);
      setError(err instanceof Error ? err.message : 'Không thể tạo tóm tắt');
    } finally {
      setLoading(false);
    }
  };

  const handleExtractActionItems = async () => {
    if (!isFeatureEnabled('action_items')) return;

    setActiveAction('action_items');
    setLoading(true);
    setError(null);
    setActionItemsResult(null);

    try {
      const result = await api.extractActionItems(roomId, {
        messageCount: 50,
        threadId,
      });
      setActionItemsResult(result);
    } catch (err) {
      console.error('Failed to extract action items:', err);
      setError(err instanceof Error ? err.message : 'Không thể trích xuất công việc');
    } finally {
      setLoading(false);
    }
  };

  const handleAskQuestion = async () => {
    if (!isFeatureEnabled('qa') || !question.trim()) return;

    setActiveAction('qa');
    setLoading(true);
    setError(null);
    setQAResult(null);

    try {
      const result = await api.askQuestion(roomId, question, {
        contextMessageCount: 100,
        threadId,
      });
      setQAResult(result);
    } catch (err) {
      console.error('Failed to ask question:', err);
      setError(err instanceof Error ? err.message : 'Không thể lấy câu trả lời');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const renderActionButtons = () => (
    <div className="grid grid-cols-2 gap-2">
      <button
        onClick={handleSummarize}
        disabled={!isFeatureEnabled('summary') || loading}
        className={`
          flex flex-col items-center gap-2 p-4 rounded-lg border transition-colors
          ${!isFeatureEnabled('summary') || loading
            ? 'border-custom-border-100 opacity-50 cursor-not-allowed'
            : 'border-custom-border-200 hover:bg-custom-background-80 hover:border-custom-primary-100/50'
          }
        `}
      >
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
          isFeatureEnabled('summary') && !loading ? 'bg-amber-500/10' : 'bg-custom-background-80'
        }`}>
          <Sparkles size={20} className={isFeatureEnabled('summary') && !loading ? 'text-amber-500' : 'text-custom-text-400'} />
        </div>
        <span className="text-sm font-medium text-custom-text-100">Tóm tắt</span>
        <span className="text-xs text-custom-text-400">Tóm tắt cuộc hội thoại</span>
      </button>

      <button
        onClick={handleExtractActionItems}
        disabled={!isFeatureEnabled('action_items') || loading}
        className={`
          flex flex-col items-center gap-2 p-4 rounded-lg border transition-colors
          ${!isFeatureEnabled('action_items') || loading
            ? 'border-custom-border-100 opacity-50 cursor-not-allowed'
            : 'border-custom-border-200 hover:bg-custom-background-80 hover:border-custom-primary-100/50'
          }
        `}
      >
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
          isFeatureEnabled('action_items') && !loading ? 'bg-blue-500/10' : 'bg-custom-background-80'
        }`}>
          <ListTodo size={20} className={isFeatureEnabled('action_items') && !loading ? 'text-blue-500' : 'text-custom-text-400'} />
        </div>
        <span className="text-sm font-medium text-custom-text-100">Công việc</span>
        <span className="text-xs text-custom-text-400">Trích xuất công việc cần làm</span>
      </button>
    </div>
  );

  const renderQASection = () => (
    <div className="mt-4 p-4 rounded-lg border border-custom-border-200 bg-custom-background-90">
      <div className="flex items-center gap-2 mb-3">
        <MessageSquare size={16} className={loading ? 'text-custom-text-400' : 'text-green-500'} />
        <span className="text-sm font-medium text-custom-text-100">Đặt câu hỏi</span>
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Hỏi về cuộc hội thoại..."
          disabled={!isFeatureEnabled('qa') || loading}
          className="flex-1 px-3 py-2 rounded-lg bg-custom-background-100 border border-custom-border-200 text-sm text-custom-text-100 placeholder:text-custom-text-400 focus:outline-none focus:border-custom-primary-100 disabled:opacity-50"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleAskQuestion();
            }
          }}
        />
        <button
          onClick={handleAskQuestion}
          disabled={!isFeatureEnabled('qa') || !question.trim() || loading}
          className="px-4 py-2 rounded-lg bg-custom-primary-100 text-white text-sm font-medium hover:bg-custom-primary-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Hỏi
        </button>
      </div>
    </div>
  );

  const renderResult = () => {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center py-8">
          <Loader2 size={32} className="text-custom-primary-100 animate-spin mb-3" />
          <p className="text-sm text-custom-text-400">
            {activeAction === 'summary' && 'Đang tạo tóm tắt...'}
            {activeAction === 'action_items' && 'Đang trích xuất công việc...'}
            {activeAction === 'qa' && 'Đang suy nghĩ...'}
          </p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
          <div className="flex items-start gap-2">
            <AlertCircle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-500">Lỗi</p>
              <p className="text-sm text-custom-text-300 mt-1">{error}</p>
            </div>
          </div>
        </div>
      );
    }

    // Summary result
    if (summaryResult) {
      return (
        <div className="p-4 rounded-lg bg-custom-background-80 border border-custom-border-200">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-amber-500" />
              <span className="text-sm font-medium text-custom-text-100">Tóm tắt</span>
            </div>
            <button
              onClick={() => handleCopy(summaryResult.summary)}
              className="p-1.5 rounded hover:bg-custom-background-90 text-custom-text-400 hover:text-custom-text-100 transition-colors"
              title="Sao chép"
            >
              {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
            </button>
          </div>
          <p className="text-sm text-custom-text-200 whitespace-pre-wrap">{summaryResult.summary}</p>
          <p className="text-xs text-custom-text-400 mt-3">
            Dựa trên {summaryResult.messageCount} tin nhắn
          </p>
        </div>
      );
    }

    // Action items result
    if (actionItemsResult) {
      return (
        <div className="p-4 rounded-lg bg-custom-background-80 border border-custom-border-200">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <ListTodo size={16} className="text-blue-500" />
              <span className="text-sm font-medium text-custom-text-100">Công việc cần làm</span>
            </div>
            <button
              onClick={() => handleCopy(actionItemsResult.items.map(i => `- ${i.task}`).join('\n'))}
              className="p-1.5 rounded hover:bg-custom-background-90 text-custom-text-400 hover:text-custom-text-100 transition-colors"
              title="Sao chép"
            >
              {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
            </button>
          </div>
          {actionItemsResult.items.length === 0 ? (
            <p className="text-sm text-custom-text-400">Không tìm thấy công việc nào trong cuộc hội thoại.</p>
          ) : (
            <ul className="space-y-2">
              {actionItemsResult.items.map((item, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded bg-custom-background-90 flex items-center justify-center text-xs text-custom-text-400 flex-shrink-0 mt-0.5">
                    {index + 1}
                  </span>
                  <div className="flex-1">
                    <p className="text-sm text-custom-text-200">{item.task}</p>
                    {(item.assignee || item.priority) && (
                      <div className="flex items-center gap-2 mt-1">
                        {item.assignee && (
                          <span className="text-xs text-custom-text-400">@{item.assignee}</span>
                        )}
                        {item.priority && (
                          <span className={`text-xs px-1.5 py-0.5 rounded ${
                            item.priority === 'high' ? 'bg-red-500/10 text-red-500' :
                            item.priority === 'medium' ? 'bg-amber-500/10 text-amber-500' :
                            'bg-green-500/10 text-green-500'
                          }`}>
                            {item.priority}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
          <p className="text-xs text-custom-text-400 mt-3">
            Dựa trên {actionItemsResult.messageCount} tin nhắn
          </p>
        </div>
      );
    }

    // Q&A result
    if (qaResult) {
      return (
        <div className="p-4 rounded-lg bg-custom-background-80 border border-custom-border-200">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <MessageSquare size={16} className="text-green-500" />
              <span className="text-sm font-medium text-custom-text-100">Câu trả lời</span>
            </div>
            <button
              onClick={() => handleCopy(qaResult.answer)}
              className="p-1.5 rounded hover:bg-custom-background-90 text-custom-text-400 hover:text-custom-text-100 transition-colors"
              title="Sao chép"
            >
              {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
            </button>
          </div>
          <p className="text-sm text-custom-text-200 whitespace-pre-wrap">{qaResult.answer}</p>
          {qaResult.sources && qaResult.sources.length > 0 && (
            <div className="mt-3 pt-3 border-t border-custom-border-200">
              <p className="text-xs text-custom-text-400 mb-2">Nguồn:</p>
              <div className="space-y-1">
                {qaResult.sources.slice(0, 3).map((source, index) => (
                  <p key={index} className="text-xs text-custom-text-300 truncate">
                    &quot;{source.content.slice(0, 100)}...&quot;
                  </p>
                ))}
              </div>
            </div>
          )}
        </div>
      );
    }

    return null;
  };

  // If AI is not enabled
  if (!aiConfig?.aiEnabled) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="w-16 h-16 mb-4 rounded-2xl bg-custom-background-80 flex items-center justify-center">
          <Sparkles size={32} className="text-custom-text-300" />
        </div>
        <p className="text-sm font-medium text-custom-text-200 mb-1">Trợ lý AI đã tắt</p>
        <p className="text-xs text-custom-text-400 text-center max-w-xs">
          Tính năng AI chưa được bật cho kênh này. Liên hệ quản trị viên để bật.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-custom-border-200 bg-custom-background-90">
        <div className="flex items-center gap-2 text-sm text-custom-text-300">
          <Sparkles size={14} />
          <span>Trợ lý AI</span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto vertical-scrollbar scrollbar-sm p-4 space-y-4">
        {renderActionButtons()}
        {isFeatureEnabled('qa') && renderQASection()}

        {/* Results area */}
        {(loading || error || summaryResult || actionItemsResult || qaResult) && (
          <div className="mt-4">
            {renderResult()}
          </div>
        )}

        {/* Disabled features info */}
        {aiConfig && (
          <div className="mt-4 p-3 rounded-lg bg-custom-background-80">
            <p className="text-xs text-custom-text-400">
              <span className="font-medium">Tính năng đã bật: </span>
              {aiConfig.enabledFeatures.length > 0
                ? aiConfig.enabledFeatures.join(', ')
                : 'Chưa có - liên hệ admin để bật'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
