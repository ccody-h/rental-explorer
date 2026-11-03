import { useState } from "react";
import { Link } from "react-router-dom";

const API_BASE_URL = "http://4.237.58.241:3000";

const initialRegisterForm = {
  email: "",
  password: "",
};

function RegisterPage() {
  const [registerForm, setRegisterForm] = useState(initialRegisterForm);
  const [message, setMessage] = useState({
    type: "",
    text: "",
  });
  const [isRegistering, setIsRegistering] = useState(false);

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

  function getRegisterErrorMessage(status, apiMessage) {
    if (status === 400) {
      return apiMessage || "Both email and password are required.";
    }

    if (status === 409) {
      return apiMessage || "This email already exists.";
    }

    if (status === 429) {
      return apiMessage || "Too many registration attempts. Please try again later.";
    }

    return apiMessage || "Registration failed. Please try again.";
  }

  function handleInputChange(event) {
    const { name, value } = event.target;

    setRegisterForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }));

    setMessage({
      type: "",
      text: "",
    });
  }

  async function handleRegister(event) {
    event.preventDefault();

    const trimmedEmail = registerForm.email.trim();
    const trimmedPassword = registerForm.password.trim();

    if (!trimmedEmail || !trimmedPassword) {
      setMessage({
        type: "error",
        text: "Please enter both an email and password.",
      });
      return;
    }

    setIsRegistering(true);
    setMessage({
      type: "",
      text: "",
    });

    try {
      const response = await fetch(`${API_BASE_URL}/user/register`, {
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
        setMessage({
          type: "error",
          text: getRegisterErrorMessage(response.status, data.message),
        });
        return;
      }

      setMessage({
        type: "success",
        text:
          data.message ||
          "Account registered successfully. You may now login above.",
      });

      setRegisterForm(initialRegisterForm);
    } catch (error) {
      console.error("Registration error:", error);

      setMessage({
        type: "error",
        text: "Could not connect you to registration.",
      });
    } finally {
      setIsRegistering(false);
    }
  }

  return (
    <section className="mt-4">
      <h1>Register</h1>

      <p>Create your account to find your Dream.</p>

      <div className="card">
        <div className="card-body">
          {message.text && (
            <div
              className={`alert ${
                message.type === "success" ? "alert-success" : "alert-danger"
              }`}
              role="alert"
            >
              {message.text}
            </div>
          )}

          <form onSubmit={handleRegister}>
            <div className="mb-3">
              <label className="form-label" htmlFor="register-email">
                Email
              </label>

              <input
                id="register-email"
                name="email"
                type="email"
                className="form-control"
                value={registerForm.email}
                onChange={handleInputChange}
                autoComplete="email"
                required
              />
            </div>

            <div className="mb-3">
              <label className="form-label" htmlFor="register-password">
                Password
              </label>

              <input
                id="register-password"
                name="password"
                type="password"
                className="form-control"
                value={registerForm.password}
                onChange={handleInputChange}
                autoComplete="new-password"
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-success"
              disabled={isRegistering}
            >
              {isRegistering ? "Registering..." : "Register Now"}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}

export default RegisterPage;