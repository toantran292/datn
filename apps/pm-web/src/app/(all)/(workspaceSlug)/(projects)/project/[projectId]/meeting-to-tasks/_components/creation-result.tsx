"use client";

import Link from "next/link";
import { CheckCircle2, AlertTriangle, RefreshCw, ExternalLink, CheckCheck, XCircle, AlertCircle, ArrowRight } from "lucide-react";
import { Button } from "@uts/design-system/ui";
import { BulkCreateTasksResponse } from "../types";

interface CreationResultProps {
  result: BulkCreateTasksResponse;
  onReset: () => void;
  projectId: string;
  workspaceSlug: string;
}

export function CreationResult({
  result,
  onReset,
  projectId,
  workspaceSlug,
}: CreationResultProps) {
  const { stats, created, failed } = result;
  const allSucceeded = stats.failed === 0;
  const successRate = Math.round((stats.succeeded / stats.total) * 100);

  return (
    <div className="space-y-8">
      {/* Summary Card with Enhanced Gradient Background */}
      <div className="relative rounded-2xl border border-custom-border-200 bg-gradient-to-br from-custom-background-100 via-custom-background-90 to-custom-background-100 overflow-hidden shadow-2xl">
        {/* Decorative background elements */}
        <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent pointer-events-none" />
        <div className="absolute -top-24 -right-24 size-48 bg-green-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 size-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative p-12">
          <div className="flex flex-col items-center text-center">
            {/* Icon with Enhanced Animation and Glow */}
            <div className={`mb-8 flex items-center justify-center size-28 rounded-full transition-all duration-500 ${
              allSucceeded
                ? "bg-gradient-to-br from-green-500/30 to-green-600/20 shadow-2xl shadow-green-500/30 ring-4 ring-green-500/20"
                : stats.succeeded > 0
                  ? "bg-gradient-to-br from-yellow-500/30 to-orange-600/20 shadow-2xl shadow-yellow-500/30 ring-4 ring-yellow-500/20"
                  : "bg-gradient-to-br from-red-500/30 to-red-600/20 shadow-2xl shadow-red-500/30 ring-4 ring-red-500/20"
            }`}>
              {allSucceeded ? (
                <CheckCircle2 className="size-14 text-green-600 drop-shadow-lg" strokeWidth={2.5} />
              ) : stats.succeeded > 0 ? (
                <AlertTriangle className="size-14 text-yellow-600 drop-shadow-lg" strokeWidth={2.5} />
              ) : (
                <XCircle className="size-14 text-red-600 drop-shadow-lg" strokeWidth={2.5} />
              )}
            </div>

            {/* Title with better typography */}
            <h2 className="text-4xl font-extrabold text-custom-text-100 mb-2 tracking-tight">
              {allSucceeded
                ? `Hoàn tất! Đã tạo ${stats.succeeded} tasks`
                : `Đã tạo ${stats.succeeded} trong ${stats.total} tasks`}
            </h2>

            {allSucceeded ? (
              <p className="text-base text-custom-text-300 mb-8 font-medium">
                Tất cả tasks đã được tạo thành công và sẵn sàng sử dụng
              </p>
            ) : (
              <p className="text-base text-custom-text-300 mb-8 font-medium">
                {stats.failed} tasks không thể tạo do lỗi hệ thống
              </p>
            )}

            {/* Enhanced Stats Grid with Cards */}
            <div className={`grid ${stats.failed > 0 ? 'grid-cols-3' : 'grid-cols-2'} gap-6 mt-2 w-full max-w-xl`}>
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-green-500/20 to-green-600/10 rounded-2xl blur-xl group-hover:blur-2xl transition-all" />
                <div className="relative bg-custom-background-100 rounded-2xl border border-green-500/30 p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                  <div className="mb-3 flex items-center justify-center size-20 rounded-2xl bg-gradient-to-br from-green-500/20 to-green-600/10 mx-auto">
                    <div className="text-4xl font-black text-green-600">{stats.succeeded}</div>
                  </div>
                  <p className="text-xs font-bold text-green-600 uppercase tracking-wider">Thành công</p>
                </div>
              </div>

              {stats.failed > 0 && (
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-br from-red-500/20 to-red-600/10 rounded-2xl blur-xl group-hover:blur-2xl transition-all" />
                  <div className="relative bg-custom-background-100 rounded-2xl border border-red-500/30 p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                    <div className="mb-3 flex items-center justify-center size-20 rounded-2xl bg-gradient-to-br from-red-500/20 to-red-600/10 mx-auto">
                      <div className="text-4xl font-black text-red-600">{stats.failed}</div>
                    </div>
                    <p className="text-xs font-bold text-red-600 uppercase tracking-wider">Thất bại</p>
                  </div>
                </div>
              )}

              <div className="relative group">
                <div className={`absolute inset-0 bg-gradient-to-br ${successRate === 100 ? 'from-green-500/20 to-green-600/10' : 'from-yellow-500/20 to-orange-600/10'} rounded-2xl blur-xl group-hover:blur-2xl transition-all`} />
                <div className={`relative bg-custom-background-100 rounded-2xl border ${successRate === 100 ? 'border-green-500/30' : 'border-yellow-500/30'} p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105`}>
                  <div className={`mb-3 flex items-center justify-center size-20 rounded-2xl bg-gradient-to-br mx-auto ${
                    successRate === 100 ? 'from-green-500/20 to-green-600/10' : 'from-yellow-500/20 to-orange-600/10'
                  }`}>
                    <div className={`text-4xl font-black ${successRate === 100 ? 'text-green-600' : 'text-yellow-600'}`}>
                      {successRate}%
                    </div>
                  </div>
                  <p className={`text-xs font-bold uppercase tracking-wider ${successRate === 100 ? 'text-green-600' : 'text-yellow-600'}`}>Tỷ lệ</p>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Actions with better buttons */}
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mt-12">
            <Link href={`/${workspaceSlug}/project/${projectId}`} className="w-full sm:w-auto">
              <Button
                variant="primary"
                size="lg"
                className="w-full shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 bg-gradient-to-r from-custom-primary-100 to-custom-primary-80"
              >
                <ExternalLink className="size-5" />
                <span className="font-bold">Xem tất cả tasks</span>
                <ArrowRight className="size-5 ml-1" />
              </Button>
            </Link>
            <Button
              variant="neutral-primary"
              size="lg"
              onClick={onReset}
              className="w-full sm:w-auto shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
            >
              <RefreshCw className="size-5" />
              <span className="font-bold">Tạo meeting khác</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Created Tasks List */}
      {created.length > 0 && (
        <div className="rounded-2xl border border-custom-border-200 bg-custom-background-100 overflow-hidden shadow-xl">
          <div className="px-8 py-6 border-b border-custom-border-200 bg-gradient-to-r from-green-500/10 via-green-500/5 to-transparent">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center size-12 rounded-xl bg-gradient-to-br from-green-500/20 to-green-600/10 shadow-lg">
                <CheckCheck className="size-6 text-green-600" strokeWidth={2.5} />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-extrabold text-custom-text-100 mb-1">
                  Tasks đã tạo thành công
                </h3>
                <p className="text-sm text-custom-text-400 font-medium">
                  Click vào task để xem chi tiết và chỉnh sửa
                </p>
              </div>
              <div className="flex items-center justify-center size-12 rounded-xl bg-gradient-to-br from-green-500/20 to-green-600/10 shadow-lg">
                <span className="text-lg font-black text-green-600">{created.length}</span>
              </div>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {created.map((task, index) => (
                <Link
                  key={task.issueId}
                  href={`/${workspaceSlug}/project/${projectId}/issue/${task.issueId}`}
                  className="relative flex items-center gap-5 p-5 rounded-xl border-2 border-custom-border-200 bg-gradient-to-br from-custom-background-100 to-custom-background-90 hover:from-custom-background-90 hover:to-custom-background-80 hover:border-custom-primary-100 hover:shadow-xl transition-all duration-300 group"
                >
                  {/* Success indicator with animation */}
                  <div className="flex items-center justify-center size-12 rounded-xl bg-gradient-to-br from-green-500/20 to-green-600/10 shadow-md group-hover:shadow-lg group-hover:scale-110 transition-all duration-300 flex-shrink-0">
                    <CheckCircle2 className="size-6 text-green-600" strokeWidth={2.5} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-custom-primary-100/15 border border-custom-primary-100/30 text-sm font-extrabold text-custom-primary-100 shadow-sm group-hover:shadow-md transition-all">
                        {task.issueKey}
                        <ExternalLink className="size-3.5 opacity-0 group-hover:opacity-100 transition-all duration-300" />
                      </span>
                    </div>
                    <p className="text-base font-bold text-custom-text-100 truncate group-hover:text-custom-primary-100 transition-colors">
                      {task.title}
                    </p>
                  </div>

                  {/* Arrow indicator */}
                  <div className="flex items-center justify-center size-10 rounded-xl bg-custom-background-80 text-custom-text-400 flex-shrink-0 group-hover:bg-custom-primary-100/10 group-hover:text-custom-primary-100 transition-all duration-300">
                    <ArrowRight className="size-5 opacity-60 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300" strokeWidth={2.5} />
                  </div>

                  {/* Hover effect border */}
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-custom-primary-100/0 via-custom-primary-100/5 to-custom-primary-100/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Failed Tasks List */}
      {failed.length > 0 && (
        <div className="rounded-2xl border-2 border-red-500/40 bg-gradient-to-br from-red-500/5 to-custom-background-100 overflow-hidden shadow-xl">
          <div className="px-8 py-6 border-b border-red-500/40 bg-gradient-to-r from-red-500/15 via-red-500/8 to-transparent">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center size-12 rounded-xl bg-gradient-to-br from-red-500/30 to-red-600/20 shadow-lg">
                <AlertCircle className="size-6 text-red-600" strokeWidth={2.5} />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-extrabold text-red-600 mb-1">
                  Tasks thất bại
                </h3>
                <p className="text-sm text-red-600/80 font-medium">
                  Các tasks sau không thể tạo do lỗi hệ thống
                </p>
              </div>
              <div className="flex items-center justify-center size-12 rounded-xl bg-gradient-to-br from-red-500/30 to-red-600/20 shadow-lg">
                <span className="text-lg font-black text-red-600">{failed.length}</span>
              </div>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {failed.map((task, index) => (
                <div
                  key={index}
                  className="rounded-xl border-2 border-red-500/30 bg-gradient-to-br from-custom-background-100 to-custom-background-90 p-6 shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <div className="flex items-start gap-5">
                    <div className="flex items-center justify-center size-12 rounded-xl bg-gradient-to-br from-red-500/20 to-red-600/10 shadow-md flex-shrink-0">
                      <XCircle className="size-6 text-red-600" strokeWidth={2.5} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-base font-extrabold text-custom-text-100 mb-3">
                        {task.title}
                      </h4>
                      <div className="rounded-xl bg-red-500/10 border-2 border-red-500/30 p-4 mb-3 shadow-inner">
                        <p className="text-sm text-red-600 leading-relaxed font-mono font-semibold">
                          {task.error}
                        </p>
                      </div>
                      {task.code && (
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-bold text-custom-text-400">Error code:</span>
                          <code className="text-sm font-mono px-3 py-1.5 rounded-lg bg-red-500/10 text-red-600 border-2 border-red-500/30 shadow-sm font-bold">
                            {task.code}
                          </code>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
