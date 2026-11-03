import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

const API_BASE_URL = "http://4.237.58.241:3000";

function PropertyDetails() {
  const { id } = useParams();

  const [rental, setRental] = useState(null);
  const [userRating, setUserRating] = useState("");

  const [isLoadingRental, setIsLoadingRental] = useState(true);
  const [isLoadingUserRating, setIsLoadingUserRating] = useState(false);
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);

  const [error, setError] = useState("");
  const [ratingMessage, setRatingMessage] = useState("");

  const token = localStorage.getItem("token");
  const tokenType = localStorage.getItem("tokenType") || "Bearer";
  const isLoggedIn = Boolean(token);

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

  function getRatingErrorMessage(status, apiMessage) {
    if (status === 400) {
      return apiMessage || "Please select a rating between 1 and 5.";
    }

    if (status === 401) {
      return apiMessage || "Your login session has expired. Please log in again.";
    }

    if (status === 403) {
      return apiMessage || "You do not have permission to rate this rental.";
    }

    if (status === 404) {
      return apiMessage || "This rental could not be found.";
    }

    return apiMessage || "Could not submit rating. Please try again.";
  }

  function formatValue(value) {
    if (value === null || value === undefined || value === "") {
      return "N/A";
    }

    return value;
  }

  function formatRent(rent) {
    if (rent === null || rent === undefined || rent === "") {
      return "N/A";
    }

    return `$${Number(rent).toLocaleString()}`;
  }

  function formatAverageRating(averageRating) {
    if (!averageRating) {
      return "No ratings yet";
    }

    return `${averageRating} stars`;
  }

  function getMapUrl(latitude, longitude) {
    if (!latitude || !longitude) {
      return "";
    }

    return `https://maps.google.com/maps?q=${latitude},${longitude}&z=15&output=embed`;
  }

  function formatDescription(description) {
  if (!description) {
    return "No description available.";
  }

  return description
    .replaceAll("<br/>", "\n")
    .replaceAll("<br />", "\n")
    .replaceAll("<br>", "\n")
    .trim();
}

  useEffect(() => {
    const controller = new AbortController();

    async function fetchRental() {
      setIsLoadingRental(true);
      setError("");

      try {
        const response = await fetch(`${API_BASE_URL}/rentals/${id}`, {
          signal: controller.signal,
        });

        const data = await getApiResponse(response);

        if (!response.ok) {
          throw new Error(data.message || "Could not load rental details.");
        }

        setRental(data);
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error("Rental details error:", error);
          setError(error.message);
        }
      } finally {
        setIsLoadingRental(false);
      }
    }

    fetchRental();

    return () => {
      controller.abort();
    };
  }, [id]);

  useEffect(() => {
    const controller = new AbortController();

    async function fetchUserRating() {
      if (!isLoggedIn) {
        setUserRating("");
        return;
      }

      setIsLoadingUserRating(true);

      try {
        const response = await fetch(`${API_BASE_URL}/ratings/rentals/${id}`, {
          headers: {
            Authorization: `${tokenType} ${token}`,
          },
          signal: controller.signal,
        });

        const data = await getApiResponse(response);

        if (!response.ok) {
          return;
        }

        if (data.rating) {
          setUserRating(String(data.rating));
        }
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error("Could not load user rating:", error);
        }
      } finally {
        setIsLoadingUserRating(false);
      }
    }

    fetchUserRating();

    return () => {
      controller.abort();
    };
  }, [id, isLoggedIn, token, tokenType]);

  async function refreshRentalDetails() {
    try {
      const response = await fetch(`${API_BASE_URL}/rentals/${id}`);
      const data = await getApiResponse(response);

      if (response.ok) {
        setRental(data);
      }
    } catch (error) {
      console.error("Could not refresh rental details:", error);
    }
  }

  async function handleRatingSubmit(event) {
    event.preventDefault();

    if (!userRating) {
      setRatingMessage("Please select a rating before submitting.");
      return;
    }

    setIsSubmittingRating(true);
    setRatingMessage("");

    try {
      const response = await fetch(`${API_BASE_URL}/ratings/rentals/${id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `${tokenType} ${token}`,
        },
        body: JSON.stringify({
          rating: Number(userRating),
        }),
      });

      const data = await getApiResponse(response);

      if (!response.ok) {
        setRatingMessage(getRatingErrorMessage(response.status, data.message));
        return;
      }

      setRatingMessage("Rating submitted successfully.");
      await refreshRentalDetails();
    } catch (error) {
      console.error("Rating submission error:", error);
      setRatingMessage("Could not connect to the rating API.");
    } finally {
      setIsSubmittingRating(false);
    }
  }

  if (isLoadingRental) {
    return <p>Loading details...</p>;
  }

  if (error) {
    return (
      <div className="alert alert-danger" role="alert">
        {error}
      </div>
    );
  }

  if (!rental) {
    return <p>No rental found.</p>;
  }

  const mapUrl = getMapUrl(rental.latitude, rental.longitude);

  return (
    <section className="rental-details-page">
      <h1>{formatValue(rental.title)}</h1>

      <div className="rental-details-layout">
        <div className="rental-info">
          <section className="details-card">
            <h2>Description</h2>
            <p style={{ whiteSpace: "pre-line" }}>
              {formatDescription(rental.description)}
            </p>
          </section>

          <section className="details-card">
            <h2>Property Details</h2>

            <p>
              <strong>Weekly Rent:</strong> {formatRent(rental.rent)}
            </p>

            <p>
              <strong>Property Type:</strong>{" "}
              {formatValue(rental.propertyType)}
            </p>

            <p>
              <strong>Bedrooms:</strong> {formatValue(rental.bedrooms)}
            </p>

            <p>
              <strong>Bathrooms:</strong> {formatValue(rental.bathrooms)}
            </p>

            <p>
              <strong>Parking Spaces:</strong>{" "}
              {formatValue(rental.parkingSpaces)}
            </p>

            <p>
              <strong>Amenities:</strong> {formatValue(rental.amenities)}
            </p>

            <p>
              <strong>Agency:</strong> {formatValue(rental.agencyName)}
            </p>
          </section>

          <section className="details-card">
            <h2>Location</h2>

            <p>
              <strong>Street Address:</strong>{" "}
              {formatValue(rental.streetAddress)}
            </p>

            <p>
              <strong>Suburb:</strong> {formatValue(rental.suburb)}
            </p>

            <p>
              <strong>Postcode:</strong> {formatValue(rental.postcode)}
            </p>

            <p>
              <strong>State:</strong> {formatValue(rental.state)}
            </p>
          </section>

          <section className="details-card">
            <h2>Ratings</h2>

            <p>
              <strong>Average Rating:</strong>{" "}
              {formatAverageRating(rental.averageRating)}
            </p>

            <p>
              <strong>Number of Ratings:</strong> {rental.numRatings ?? 0}
            </p>

            {ratingMessage && (
              <div
                className={`alert ${
                  ratingMessage.includes("successfully")
                    ? "alert-success"
                    : "alert-danger"
                } py-2`}
                role="alert"
              >
                {ratingMessage}
              </div>
            )}

            {isLoggedIn ? (
              <form onSubmit={handleRatingSubmit} className="rating-form">
                <label htmlFor="rating">
                  <strong>Your Rating:</strong>
                </label>

                <select
                  id="rating"
                  className="form-select"
                  value={userRating}
                  onChange={(event) => {
                    setUserRating(event.target.value);
                    setRatingMessage("");
                  }}
                  disabled={isLoadingUserRating || isSubmittingRating}
                >
                  <option value="">
                    {isLoadingUserRating
                      ? "Loading your rating..."
                      : "Select rating"}
                  </option>
                  <option value="1">1 star</option>
                  <option value="2">2 stars</option>
                  <option value="3">3 stars</option>
                  <option value="4">4 stars</option>
                  <option value="5">5 stars</option>
                </select>

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isSubmittingRating || isLoadingUserRating}
                >
                  {isSubmittingRating ? "Submitting..." : "Submit Rating"}
                </button>
              </form>
            ) : (
              <p>You must be logged in to rate this rental.</p>
            )}
          </section>
        </div>

        <aside className="rental-map-section">
          <h2>Map</h2>

          {mapUrl ? (
            <iframe
              title={`Map showing ${formatValue(rental.title)}`}
              src={mapUrl}
              width="100%"
              height="350"
              style={{ border: 0 }}
              loading="lazy"
            />
          ) : (
            <p>Map location is not available for this rental.</p>
          )}
        </aside>
      </div>
    </section>
  );
}

export default PropertyDetails;