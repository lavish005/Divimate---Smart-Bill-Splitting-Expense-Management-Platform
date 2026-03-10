import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";

const Layout = () => {
  return (
    <div className="min-h-screen bg-background font-sans antialiased flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-6 md:px-6 lg:px-8 max-w-7xl animate-in fade-in duration-500">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
