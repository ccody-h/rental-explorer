import { BrowserRouter, Routes, Route } from "react-router-dom";

import Navbar from "./components/Navbar";

import "./App.css";

import LandingPage from "./pages/LandingPage";
import SearchProperty from "./pages/SearchProperty";
import PropertyDetails from "./pages/PropertyDetails";
import RegisterPage from "./pages/RegisterPage";
import RatingPage from "./pages/RatingPage";

function App() {
  return (
    <BrowserRouter>
      <Navbar />

      <div className="container mt-4">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/search" element={<SearchProperty />} />
          <Route path="/rentals/:id" element={<PropertyDetails />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/rated-rentals" element={<RatingPage />} />

          <Route
            path="*"
            element={
              <section className="text-center">
                <h1>Page Not Found</h1>
                <p>The page you are looking for does not exist.</p>
              </section>
            }
          />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;