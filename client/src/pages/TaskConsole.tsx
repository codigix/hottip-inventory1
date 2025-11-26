
import { useQuery } from "@tanstack/react-query";
import React, { useMemo } from "react";

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

  const tasks = useMemo(() => (Array.isArray(data) ? data : []), [data]);
  const activeTasks = useMemo(
    () => tasks.filter((task: any) => ["Running", "In Progress", "Active"].includes(task.status)),
    [tasks]
  );
  const scheduledTasks = useMemo(
    () => tasks.filter((task: any) => task.status === "Scheduled"),
    [tasks]
  );
  const completedTasks = useMemo(
    () => tasks.filter((task: any) => ["Completed", "Done"].includes(task.status)),
    [tasks]
  );
  const logs = useMemo(() => {
    if (Array.isArray(data?.logs)) return data.logs;
    return tasks.slice(0, 5).map((task: any, index: number) => ({
      id: task.id || index,
      message: `${task.title} updated`,
      timestamp: task.updatedAt || task.dueDate || new Date().toISOString(),
    }));
  }, [data, tasks]);

  const handleStop = (taskId: string) => {
    console.info("Stopping task", taskId);
  };

  const handleRestart = (taskId: string) => {
    console.info("Restarting task", taskId);
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <h1 className="text-3xl font-bold mb-4" data-tour="admin-tasks-header">Admin Task Console</h1>
      <p className="mb-6 text-muted-foreground">Create, assign, and track cross-department tasks and productivity metrics.</p>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="bg-white rounded shadow p-4 space-y-4 lg:col-span-2" data-tour="admin-tasks-active-list">
          <h2 className="text-lg font-semibold">Active Tasks</h2>
          {isLoading ? (
            <div className="py-8 text-center text-muted-foreground">Loading...</div>
          ) : error ? (
            <div className="py-8 text-center text-red-600">{error.message || "Failed to load tasks."}</div>
          ) : activeTasks.length ? (
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-3">Task</th>
                  <th className="text-left py-2 px-3">Assigned To</th>
                  <th className="text-left py-2 px-3">Status</th>
                  <th className="text-left py-2 px-3">Due Date</th>
                  <th className="text-left py-2 px-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {activeTasks.map((task: any) => (
                  <tr key={task.id} className="border-b last:border-0">
                    <td className="py-2 px-3">{task.title}</td>
                    <td className="py-2 px-3">{task.assignedTo || "-"}</td>
                    <td className="py-2 px-3">{task.status}</td>
                    <td className="py-2 px-3">{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "-"}</td>
                    <td className="py-2 px-3 flex flex-wrap gap-2">
                      <button
                        className="border px-3 py-1 rounded"
                        onClick={() => handleStop(task.id)}
                        data-tour="admin-tasks-stop-button"
                      >
                        Stop
                      </button>
                      <button
                        className="border px-3 py-1 rounded"
                        onClick={() => handleRestart(task.id)}
                        data-tour="admin-tasks-restart-button"
                      >
                        Restart
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="py-8 text-center text-muted-foreground">No active tasks.</div>
          )}
        </section>
        <section className="bg-white rounded shadow p-4 space-y-4" data-tour="admin-tasks-scheduled-list">
          <h2 className="text-lg font-semibold">Scheduled Tasks</h2>
          {scheduledTasks.length ? (
            <ul className="space-y-2 text-sm">
              {scheduledTasks.map((task: any) => (
                <li key={task.id} className="border rounded px-3 py-2">
                  <p className="font-medium">{task.title}</p>
                  <p className="text-muted-foreground">{task.scheduledFor || task.dueDate || "Pending schedule"}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No scheduled tasks.</p>
          )}
          <section className="space-y-4" data-tour="admin-tasks-completed-list">
            <h2 className="text-lg font-semibold">Recently Completed</h2>
            {completedTasks.length ? (
              <ul className="space-y-2 text-sm">
                {completedTasks.slice(0, 5).map((task: any) => (
                  <li key={task.id} className="border rounded px-3 py-2">
                    <p className="font-medium">{task.title}</p>
                    <p className="text-muted-foreground">Closed on {task.completedAt ? new Date(task.completedAt).toLocaleDateString() : "-"}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No completed tasks yet.</p>
            )}
          </section>
        </section>
      </div>
      <div className="bg-white rounded shadow p-4 mt-6" data-tour="admin-tasks-logs">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Task Logs</h2>
          <span className="text-sm text-muted-foreground">{logs.length} entries</span>
        </div>
        <ul className="space-y-2 text-sm">
          {logs.length ? (
            logs.map((log: any) => (
              <li key={log.id} className="flex items-center justify-between">
                <p>{log.message}</p>
                <span className="text-muted-foreground">{new Date(log.timestamp).toLocaleString()}</span>
              </li>
            ))
          ) : (
            <li className="text-muted-foreground">No log entries available.</li>
          )}
        </ul>
      </div>
    </div>
  );
};

export default TaskConsole;
