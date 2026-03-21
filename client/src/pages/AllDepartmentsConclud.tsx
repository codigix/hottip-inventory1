
import { useQuery } from "@tanstack/react-query";
import React from "react";

const fetchSummary = async () => {
  const res = await fetch("/api/admin/summary");
  if (!res.ok) throw new Error("Failed to fetch summary");
  return res.json();
};

const AllDepartmentsConclud: React.FC = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ["/admin/summary"],
    queryFn: fetchSummary,
  });

  return (
    <div className=" mx-auto p-4">
      <h1 className="text-xl  mb-4">All Departments Summary</h1>
      {isLoading ? (
        <div className="py-8 text-center text-gray-500">Loading...</div>
      ) : error ? (
        <div className="py-8 text-center text-red-600">{error.message || "Failed to load summary."}</div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded shadow p-4">
              <h2 className=" mb-2">Total Employees</h2>
              <p className="text-xl ">{data?.totalEmployees ?? "-"}</p>
            </div>
            <div className="bg-white rounded shadow p-4">
              <h2 className=" mb-2">Total Revenue</h2>
              <p className="text-xl ">₹{data?.totalRevenue?.toLocaleString("en-IN") ?? "-"}</p>
            </div>
            <div className="bg-white rounded shadow p-4">
              <h2 className=" mb-2">Open Tasks</h2>
              <p className="text-xl ">{data?.openTasks ?? "-"}</p>
            </div>
          </div>
          <div className="bg-white rounded shadow p-4">
            <h2 className=" mb-4">Department Performance</h2>
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-3">Department</th>
                  <th className="text-left py-2 px-3">Employees</th>
                  <th className="text-left py-2 px-3">Revenue</th>
                  <th className="text-left py-2 px-3">Open Tasks</th>
                  <th className="text-left py-2 px-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {Array.isArray(data?.departments) && data.departments.length > 0 ? (
                  data.departments.map((dept: any) => (
                    <tr key={dept.name} className="border-b last:border-0">
                      <td className="py-2 px-3">{dept.name}</td>
                      <td className="py-2 px-3">{dept.employees}</td>
                      <td className="py-2 px-3">₹{dept.revenue?.toLocaleString("en-IN") ?? "-"}</td>
                      <td className="py-2 px-3">{dept.openTasks}</td>
                      <td className={`py-2 px-3 ${dept.statusColor || ""}`}>{dept.status}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-gray-500">No department data found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default AllDepartmentsConclud;
