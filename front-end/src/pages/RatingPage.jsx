import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const API_BASE_URL = "http://4.237.58.241:3000";
const RATINGS_PER_PAGE = 20;

function RatingPage() {
  const [ratedRentals, setRatedRentals] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);

  const [isLoadingRatings, setIsLoadingRatings] = useState(true);
  const [error, setError] = useState("");

  const token = localStorage.getItem("token");
  const tokenType = localStorage.getItem("tokenType") || "Bearer";
  const loggedInUser = localStorage.getItem("loggedInUser");

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

  function getRatingsErrorMessage(status, apiMessage) {
    if (status === 400) {
      return apiMessage || "Invalid page number.";
    }

    if (status === 401) {
      return (
        apiMessage ||
        "You are not authorised to view rated rentals. Please log in again."
      );
    }

    if (status === 429) {
      return apiMessage || "Too many requests. Please try again later.";
    }

    return apiMessage || "Could not load rated rentals.";
  }

  function getRatingsListFromResponse(data) {
    const ratingsList = data?.data || data?.ratings || data?.results || data;

    return Array.isArray(ratingsList) ? ratingsList : [];
  }

  async function fetchRentalDetails(rentalId, signal) {
    try {
      const response = await fetch(`${API_BASE_URL}/rentals/${rentalId}`, {
        signal,
      });

      const data = await getApiResponse(response);

      if (!response.ok) {
        return null;
      }

      return data;
    } catch (error) {
      if (error.name !== "AbortError") {
        console.error("Could not load rental:", rentalId, error);
      }

      return null;
    }
  }

  useEffect(() => {
    const controller = new AbortController();

    async function fetchRatedRentals() {
      if (!token) {
        setRatedRentals([]);
        setPagination(null);
        setError("You must be logged in to view your rated rentals.");
        setIsLoadingRatings(false);
        return;
      }

      setIsLoadingRatings(true);
      setError("");

      try {
        const response = await fetch(`${API_BASE_URL}/ratings?page=${page}`, {
          headers: {
            Authorization: `${tokenType} ${token}`,
          },
          signal: controller.signal,
        });

        const data = await getApiResponse(response);

        if (!response.ok) {
          setRatedRentals([]);
          setPagination(null);
          setError(getRatingsErrorMessage(response.status, data.message));
          return;
        }

        const ratingsList = getRatingsListFromResponse(data);

        const rentalsWithRatings = await Promise.all(
          ratingsList.map(async (ratingItem) => {
            const rental = await fetchRentalDetails(
              ratingItem.rentalId,
              controller.signal
            );

            return {
              rental,
              rating: ratingItem,
            };
          })
        );

        setRatedRentals(rentalsWithRatings);
        setPagination(data.pagination || null);
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error("Rated rentals error:", error);
          setRatedRentals([]);
          setPagination(null);
          setError("Could not connect to the ratings.");
        }
      } finally {
        setIsLoadingRatings(false);
      }
    }

    fetchRatedRentals();

    return () => {
      controller.abort();
    };
  }, [page, token, tokenType]);

  function goToPreviousPage() {
    setPage((currentPage) => Math.max(currentPage - 1, 1));
  }

  function goToNextPage() {
    setPage((currentPage) => currentPage + 1);
  }

  function formatDate(dateValue) {
    if (!dateValue) {
      return "N/A";
    }

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return dateValue;
    }

    return date.toLocaleString();
  }

  function formatRent(rent) {
    if (rent === null || rent === undefined || rent === "") {
      return "N/A";
    }

    return `$${Number(rent).toLocaleString()}`;
  }

  function formatRating(rating) {
    if (!rating) {
      return "N/A";
    }

    return `${rating} ${Number(rating) === 1 ? "star" : "stars"}`;
  }

  const hasNextPage = pagination?.totalPages
    ? page < pagination.totalPages
    : ratedRentals.length === RATINGS_PER_PAGE;

  if (!loggedInUser || !token) {
    return (
      <section className="mt-4">
        <h1>Rated Rentals</h1>

        <div className="alert alert-warning" role="alert">
          You must be logged in to view your rated rentals.
        </div>
      </section>
    );
  }

  return (
    <section className="mt-4">
      <h1>Rated Rentals</h1>

      <p className="text-muted">
        View the rental properties you have previously rated.
      </p>

      {isLoadingRatings && <p>Loading rated rentals...</p>}

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      {!isLoadingRatings && !error && ratedRentals.length === 0 && (
        <div className="alert alert-info" role="alert">
          You have not rated any rentals yet.
        </div>
      )}

      {!isLoadingRatings && !error && ratedRentals.length > 0 && (
        <>
          <div className="table-responsive">
            <table className="table table-bordered table-striped align-middle">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Rent</th>
                  <th>Property Type</th>
                  <th>Postcode</th>
                  <th>State</th>
                  <th>Suburb</th>
                  <th>Bathrooms</th>
                  <th>Bedrooms</th>
                  <th>Parks</th>
                  <th>Your Rating</th>
                  <th>Rated</th>
                </tr>
              </thead>

              <tbody>
                {ratedRentals.map((item) => {
                  const { rental, rating } = item;

                  return (
                    <tr key={`${rating.rentalId}-${rating.dateTime}`}>
                      <td>
                        {rental ? (
                          <Link to={`/rentals/${rating.rentalId}`}>
                            {rental.title || "Rental details"}
                          </Link>
                        ) : (
                          `Rental ${rating.rentalId}`
                        )}
                      </td>

                      <td>{formatRent(rental?.rent)}</td>
                      <td>{rental?.propertyType || "N/A"}</td>
                      <td>{rental?.postcode || "N/A"}</td>
                      <td>{rental?.state || "N/A"}</td>
                      <td>{rental?.suburb || "N/A"}</td>
                      <td>{rental?.bathrooms ?? "N/A"}</td>
                      <td>{rental?.bedrooms ?? "N/A"}</td>
                      <td>{rental?.parkingSpaces ?? "N/A"}</td>
                      <td>{formatRating(rating.rating)}</td>
                      <td>{formatDate(rating.dateTime)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="d-flex justify-content-between align-items-center mt-3">
            <button
              type="button"
              className="btn btn-secondary"
              disabled={page === 1}
              onClick={goToPreviousPage}
            >
              Previous {RATINGS_PER_PAGE}
            </button>

            <span>
              Page {page}
              {pagination?.totalPages ? ` of ${pagination.totalPages}` : ""}
            </span>

            <button
              type="button"
              className="btn btn-secondary"
              disabled={!hasNextPage}
              onClick={goToNextPage}
            >
              Next {RATINGS_PER_PAGE}
            </button>
          </div>
        </>
      )}
    </section>
  );
}

export default RatingPage;