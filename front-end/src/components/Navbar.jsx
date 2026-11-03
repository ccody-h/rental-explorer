import { useEffect, useState } from "react";
import { Link, NavLink } from "react-router-dom";

const API_BASE_URL = "http://4.237.58.241:3000";

function Navbar() {
  const [showLogin, setShowLogin] = useState(false);
  const [loginForm, setLoginForm] = useState({
    email: "",
    password: "",
  });

  const [loggedInUser, setLoggedInUser] = useState(null);
  const [loginMessage, setLoginMessage] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem("loggedInUser");

    if (storedUser) {
      setLoggedInUser(storedUser);
    }
  }, []);

  async function getApiResponse(response) {
    const contentType = response.headers.get("content-type");

    if (contentType && contentType.includes("application/json")) {
      return await response.json();
    }

    const text = await response.text();

    return {
      message: text || "Something went wrong.",
    };
  }

  function handleInputChange(event) {
    const { name, value } = event.target;

    setLoginForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }));

    setLoginMessage("");
  }

  function getLoginErrorMessage(status, apiMessage) {
    if (status === 400) {
      return apiMessage || "Both email and password are required.";
    }

    if (status === 401) {
      return apiMessage || "Incorrect email or password.";
    }

    if (status === 429) {
      return apiMessage || "Too many login attempts. Please try again later.";
    }

    return apiMessage || "Login failed. Please try again.";
  }

  async function handleLogin(event) {
    event.preventDefault();

    const trimmedEmail = loginForm.email.trim();
    const trimmedPassword = loginForm.password.trim();

    if (!trimmedEmail || !trimmedPassword) {
      setLoginMessage("Please enter both an email and password.");
      return;
    }

    setIsLoggingIn(true);
    setLoginMessage("");

    try {
      const response = await fetch(`${API_BASE_URL}/user/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: trimmedEmail,
          password: trimmedPassword,
        }),
      });

      const data = await getApiResponse(response);

      if (!response.ok) {
        setLoginMessage(getLoginErrorMessage(response.status, data.message));
        return;
      }

      if (!data.token) {
        setLoginMessage("Login succeeded, but no bearer token was returned.");
        return;
      }

      localStorage.setItem("loggedInUser", trimmedEmail);
      localStorage.setItem("token", data.token);
      localStorage.setItem("tokenType", data.tokenType || "Bearer");

      setLoggedInUser(trimmedEmail);
      setLoginForm({
        email: "",
        password: "",
      });
      setShowLogin(false);
    } catch (error) {
      console.error("Login error:", error);
      setLoginMessage("Could not connect to the login API.");
    } finally {
      setIsLoggingIn(false);
    }
  }

  function handleLogout() {
    localStorage.removeItem("loggedInUser");
    localStorage.removeItem("token");
    localStorage.removeItem("tokenType");

    setLoggedInUser(null);
    setShowLogin(false);
    setLoginMessage("");
  }

  return (
    <nav className="navbar navbar-expand-lg navbar-dark position-relative">
      <div className="container">
        <Link className="navbar-brand" to="/">
          Dream Property 4 U
        </Link>

        <div className="navbar-nav me-auto">
          <NavLink className="nav-link" to="/">
            Home
          </NavLink>

          <NavLink className="nav-link" to="/search">
            Search
          </NavLink>

          {loggedInUser && (
            <NavLink className="nav-link" to="/rated-rentals">
              Rated Rentals
            </NavLink>
          )}
        </div>

        {loggedInUser ? (
          <div className="d-flex align-items-center gap-2">
            <span className="text-light small">{loggedInUser}</span>

            <button
              type="button"
              className="btn btn-outline-light"
              onClick={handleLogout}
            >
              Logout
            </button>
          </div>
        ) : (
          <button
            type="button"
            className="btn btn-outline-light"
            aria-expanded={showLogin}
            aria-controls="login-dropdown"
            onClick={() => {
              setShowLogin((currentValue) => !currentValue);
              setLoginMessage("");
            }}
          >
            Login
          </button>
        )}
      </div>

      {showLogin && !loggedInUser && (
        <div
          id="login-dropdown"
          className="card position-absolute end-0 mt-2 me-4 shadow"
          style={{ top: "56px", width: "300px", zIndex: 1000 }}
        >
          <div className="card-body">
            <h2 className="h5 card-title">Login</h2>

            {loginMessage && (
              <div className="alert alert-danger py-2" role="alert">
                {loginMessage}
              </div>
            )}

            <form onSubmit={handleLogin}>
              <div className="mb-3">
                <label className="form-label" htmlFor="login-email">
                  Email
                </label>

                <input
                  id="login-email"
                  name="email"
                  type="email"
                  className="form-control"
                  value={loginForm.email}
                  onChange={handleInputChange}
                  autoComplete="email"
                  required
                />
              </div>

              <div className="mb-3">
                <label className="form-label" htmlFor="login-password">
                  Password
                </label>

                <input
                  id="login-password"
                  name="password"
                  type="password"
                  className="form-control"
                  value={loginForm.password}
                  onChange={handleInputChange}
                  autoComplete="current-password"
                  required
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary w-100"
                disabled={isLoggingIn}
              >
                {isLoggingIn ? "Logging in..." : "Login"}
              </button>
            </form>

            <p className="mt-3 mb-0">
              Not registered?{" "}
              <Link to="/register" onClick={() => setShowLogin(false)}>
                Create an account
              </Link>
            </p>
          </div>
        </div>
      )}
    </nav>
  );
}

export default Navbar;