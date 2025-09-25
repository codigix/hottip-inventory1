
import { useQuery } from "@tanstack/react-query";
import React from "react";

const fetchTasks = async () => {
  const res = await fetch("/api/admin/tasks");
  if (!res.ok) throw new Error("Failed to fetch tasks");
  return res.json();
};

const TaskConsole: React.FC = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ["/admin/tasks"],
    queryFn: fetchTasks,
  });

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <h1 className="text-3xl font-bold mb-4">Admin Task Console</h1>
      <p className="mb-6 text-muted-foreground">Create, assign, and track cross-department tasks and productivity metrics.</p>
      <div className="bg-white rounded shadow p-4">
        {isLoading ? (
          <div className="py-8 text-center text-muted-foreground">Loading...</div>
        ) : error ? (
          <div className="py-8 text-center text-red-600">{error.message || "Failed to load tasks."}</div>
        ) : (
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-3">Task</th>
                <th className="text-left py-2 px-3">Assigned To</th>
                <th className="text-left py-2 px-3">Status</th>
                <th className="text-left py-2 px-3">Due Date</th>
              </tr>
            </thead>
            <tbody>
              {Array.isArray(data) && data.length > 0 ? (
                data.map((task: any) => (
                  <tr key={task.id} className="border-b last:border-0">
                    <td className="py-2 px-3">{task.title}</td>
                    <td className="py-2 px-3">{task.assignedTo || "-"}</td>
                    <td className="py-2 px-3">{task.status}</td>
                    <td className="py-2 px-3">{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "-"}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-muted-foreground">No tasks found.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default TaskConsole;
