import { BrowserRouter as Router, Routes, Route, Link, Outlet, useNavigate, useParams } from "react-router-dom";
import SquareTable from "./tables/SquareTable";
import RectangleTable from "./tables/RectangleTable";

const tables = [
  { id: 1, status: "Available", name: "DR-12", shape: "square", area: "a1" },
  { id: 2, status: "Available", name: "DR-13", shape: "square", area: "a2" },
  { id: 3, status: "Available", name: "DR-14", shape: "square", area: "a3" },
  { id: 4, status: "Available", name: "DR-12", shape: "square", area: "b1" },
  { id: 5, status: "Available", name: "DR-12", shape: "square", area: "b2" },
  { id: 6, status: "Available", name: "DR-12", shape: "square", area: "b3" },
  { id: 7, status: "Available", name: "DR-12", shape: "square", area: "c1" },
  { id: 8, status: "Available", name: "DR-12", shape: "square", area: "c2" },
  { id: 9, status: "Available", name: "DR-12", shape: "square", area: "c3" },
  { id: 10, status: "Available", name: "DR-16", shape: "rectangle", area: "rect" },
];

const statusColors = {
  Available: "bg-gray-500",
  Seated: "bg-orange-500",
  Dirty: "bg-purple-500",
  Ordered: "bg-blue-500",
  "Not Available": "bg-red-500",
};

function TableManagement() {
  return (
    <div className="flex-1 p-6">
      {/* Status Legend */}
      <div className="flex gap-4 mb-6">
        {Object.keys(statusColors).map((status) => (
          <span
            key={status}
            className={`px-3 py-1 rounded-full text-sm ${statusColors[status]} text-white`}
          >
            {status}
          </span>
        ))}
      </div>

      {/* Custom Table Grid */}
      <div
        className="w-full h-full"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr) 2fr",
          gridTemplateRows: "repeat(3, 1fr)",
          gap: "2rem",
          gridTemplateAreas: `
            "a1 a2 a3 rect"
            "b1 b2 b3 rect"
            "c1 c2 c3 rect"
          `,
          alignItems: "center",
          justifyItems: "center",
          minHeight: "600px",
        }}
      >
        {tables.map((table) => (
          <Link
            key={table.id}
            to={`/tables/${table.id}`}
            style={{
              gridArea: table.area,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {table.shape === "square" ? (
              <SquareTable status={table.status} name={table.name} />
            ) : (
              <RectangleTable status={table.status} name={table.name} />
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}

export default TableManagement;