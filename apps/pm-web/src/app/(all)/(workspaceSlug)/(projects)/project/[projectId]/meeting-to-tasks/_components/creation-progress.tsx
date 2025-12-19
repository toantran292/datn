"use client";

import { Card, Spinner, ProgressBar } from "@blueprintjs/core";

interface CreationProgressProps {
  tasksCount: number;
}

export function CreationProgress({ tasksCount }: CreationProgressProps) {
  return (
    <Card className="p-6">
      <div className="text-center space-y-6">
        <Spinner size={60} />
        <div>
          <h2 className="text-2xl font-bold mb-2">⏳ Đang tạo {tasksCount} tasks...</h2>
          <p className="text-gray-600">
            Vui lòng chờ trong giây lát. Đang tạo tất cả tasks cùng lúc.
          </p>
        </div>
        <ProgressBar intent="primary" />
      </div>
    </Card>
  );
}
