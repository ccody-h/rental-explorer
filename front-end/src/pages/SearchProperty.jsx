// src/pages/SearchProperty.jsx

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const API_BASE_URL = "http://4.237.58.241:3000";
const RESULTS_PER_PAGE = 10;

const initialFilters = {
  suburb: "",
  state: "",
  postcode: "",
  minimumRent: "",
  maximumRent: "",
  minimumBathrooms: "",
  maximumBathrooms: "",
  minimumBedrooms: "",
  maximumBedrooms: "",
  minimumParking: "",
  maximumParking: "",
  propertyTypes: [],
  minimumRating: "",
  maximumRating: "",
  sortBy: "",
  sortOrder: "",
};

const sortOptions = [
  { value: "id", label: "ID" },
  { value: "title", label: "Title" },
  { value: "rent", label: "Rent" },
  { value: "propertyType", label: "Property Type" },
  { value: "postcode", label: "Postcode" },
  { value: "state", label: "State" },
  { value: "suburb", label: "Suburb" },
  { value: "bathrooms", label: "Bathrooms" },
  { value: "bedrooms", label: "Bedrooms" },
  { value: "parkingSpaces", label: "Parking Spaces" },
  { value: "averageRating", label: "Average Rating" },
  { value: "numRatings", label: "Number of Ratings" },
];

function SearchProperty() {
  const [rentals, setRentals] = useState([]);
  const [states, setStates] = useState([]);
  const [propertyTypes, setPropertyTypes] = useState([]);

  const [filters, setFilters] = useState(initialFilters);
  const [appliedFilters, setAppliedFilters] = useState(initialFilters);

  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [isLoadingFilters, setIsLoadingFilters] = useState(false);
  const [isLoadingRentals, setIsLoadingRentals] = useState(false);
  const [error, setError] = useState("");

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

  function getRentalListFromResponse(data) {
    const rentalList =
      data?.data || data?.rentals || data?.results || data?.records || data;

    return Array.isArray(rentalList) ? rentalList : null;
  }

  useEffect(() => {
    const controller = new AbortController();

    async function fetchFilterOptions() {
      setIsLoadingFilters(true);

      try {
        const [statesResponse, propertyTypesResponse] = await Promise.all([
          fetch(`${API_BASE_URL}/rentals/states`, {
            signal: controller.signal,
          }),
          fetch(`${API_BASE_URL}/rentals/property-types`, {
            signal: controller.signal,
          }),
        ]);

        const statesData = await getApiResponse(statesResponse);
        const propertyTypesData = await getApiResponse(propertyTypesResponse);

        if (!statesResponse.ok) {
          throw new Error(statesData.message || "Could not load states.");
        }

        if (!propertyTypesResponse.ok) {
          throw new Error(
            propertyTypesData.message || "Could not load property types."
          );
        }

        setStates(Array.isArray(statesData) ? statesData : []);
        setPropertyTypes(
          Array.isArray(propertyTypesData) ? propertyTypesData : []
        );
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error("Filter options error:", error);
          setError("Could not load search filter options.");
        }
      } finally {
        setIsLoadingFilters(false);
      }
    }

    fetchFilterOptions();

    // cancels the request if the component unmounts before loading finishes.
    return () => {
      controller.abort();
    };
  }, []);

  // loads results when the page number or submitted filters change.
  useEffect(() => {
    const controller = new AbortController();

    async function fetchRentals() {
      setIsLoadingRentals(true);
      setError("");

      try {
        const queryParams = buildSearchQuery(appliedFilters);

        queryParams.append("page", String(page));

        const response = await fetch(
          `${API_BASE_URL}/rentals/search?${queryParams.toString()}`,
          {
            signal: controller.signal,
          }
        );

        const data = await getApiResponse(response);

        if (!response.ok) {
          setRentals([]);
          setPagination(null);
          setError(data.message || "Could not load rental search results.");
          return;
        }

        const rentalList = getRentalListFromResponse(data);

        if (!rentalList) {
          console.log("Unexpected rental search response:", data);
          setRentals([]);
          setPagination(null);
          setError("Rental data loaded, but it was not in the expected format.");
          return;
        }

        setRentals(rentalList);
        setPagination(data.pagination || null);
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error("Rental search error:", error);
          setRentals([]);
          setPagination(null);
          setError("Could not connect to the rental search API.");
        }
      } finally {
        setIsLoadingRentals(false);
      }
    }

    fetchRentals();

    return () => {
      controller.abort();
    };
  }, [page, appliedFilters]);

  function buildSearchQuery(filterValues) {
    const queryParams = new URLSearchParams();

    Object.entries(filterValues).forEach(([key, value]) => {
      if (key === "propertyTypes") {
        value.forEach((propertyType) => {
          queryParams.append("propertyTypes", propertyType);
        });

        return;
      }

      if (typeof value === "string" && value.trim() !== "") {
        queryParams.append(key, value.trim());
      }
    });

    return queryParams;
  }

  function formatPropertyType(propertyType) {
    if (!propertyType) {
      return "N/A";
    }

    return propertyType
      .split("/")
      .map((part) =>
        part
          .split("-")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join("-")
      )
      .join("/");
  }

  function handleFilterChange(event) {
    const { name, value } = event.target;

    setFilters((currentFilters) => ({
      ...currentFilters,
      [name]: value,
    }));
  }

  function handleStateChange(state) {
    setFilters((currentFilters) => ({
      ...currentFilters,
      state,
    }));
  }

  function handlePropertyTypeChange(event) {
    const { value, checked } = event.target;

    setFilters((currentFilters) => {
      const currentPropertyTypes = currentFilters.propertyTypes;

      if (checked) {
        return {
          ...currentFilters,
          propertyTypes: [...currentPropertyTypes, value],
        };
      }

      return {
        ...currentFilters,
        propertyTypes: currentPropertyTypes.filter(
          (propertyType) => propertyType !== value
        ),
      };
    });
  }

  function handleSearchSubmit(event) {
    event.preventDefault();

    setAppliedFilters({
      ...filters,
      suburb: filters.suburb.trim(),
      postcode: filters.postcode.trim(),
    });

    setPage(1);
  }

  function clearFilters() {
    setFilters(initialFilters);
    setAppliedFilters(initialFilters);
    setPage(1);
  }

  function goToPreviousPage() {
    setPage((currentPage) => Math.max(currentPage - 1, 1));
  }

  function goToNextPage() {
    setPage((currentPage) => currentPage + 1);
  }

  function formatRent(rent) {
    if (rent === null || rent === undefined || rent === "") {
      return "N/A";
    }

    return `$${Number(rent).toLocaleString()}`;
  }

  function formatRating(rental) {
    if (rental.averageRating === null || rental.averageRating === undefined) {
      return "No ratings yet";
    }

    return `${rental.averageRating} stars (${rental.numRatings || 0})`;
  }

  function getActiveFilterCount() {
    return Object.entries(appliedFilters).reduce((count, [key, value]) => {
      if (key === "propertyTypes") {
        return count + value.length;
      }

      return value ? count + 1 : count;
    }, 0);
  }

  const hasNextPage = pagination?.totalPages
    ? page < pagination.totalPages
    : rentals.length === RESULTS_PER_PAGE;

  const activeFilterCount = getActiveFilterCount();

  return (
    <section className="search-page">
      <div className="search-page-header">
        <h1>Find the Dream that fits your needs</h1>
        <p>
          Start Searching Below.
        </p>
      </div>

      <form className="search-panel" onSubmit={handleSearchSubmit}>
        <div className="search-panel-top">
          <div>
            <h2>Search filters</h2>
            <p>
              {activeFilterCount > 0
                ? `${activeFilterCount} filter${
                    activeFilterCount === 1 ? "" : "s"
                  } currently applied.`
                : "No filters applied yet."}
            </p>
          </div>

          <button
            type="button"
            className="btn btn-outline-primary"
            onClick={() => setIsAdvancedOpen((currentValue) => !currentValue)}
          >
            {isAdvancedOpen ? "Hide Advanced" : "Advanced Search"}
          </button>
        </div>

        <div className="quick-search-grid">
          <div>
            <label className="form-label" htmlFor="suburb">
              Suburb
            </label>

            <input
              id="suburb"
              name="suburb"
              type="text"
              className="form-control"
              placeholder="e.g. Brisbane"
              value={filters.suburb}
              onChange={handleFilterChange}
            />
          </div>

          <div>
            <label className="form-label" htmlFor="postcode">
              Postcode
            </label>

            <input
              id="postcode"
              name="postcode"
              type="number"
              className="form-control"
              placeholder="e.g. 4054"
              value={filters.postcode}
              onChange={handleFilterChange}
            />
          </div>

          <div>
            <label className="form-label" htmlFor="minimumRent">
              Minimum Rent
            </label>

            <input
              id="minimumRent"
              name="minimumRent"
              type="number"
              min="0"
              className="form-control"
              placeholder="e.g. 400"
              value={filters.minimumRent}
              onChange={handleFilterChange}
            />
          </div>

          <div>
            <label className="form-label" htmlFor="maximumRent">
              Maximum Rent
            </label>

            <input
              id="maximumRent"
              name="maximumRent"
              type="number"
              min="0"
              className="form-control"
              placeholder="e.g. 850"
              value={filters.maximumRent}
              onChange={handleFilterChange}
            />
          </div>
        </div>

        <div className="state-filter-row">
          <span>State</span>

          <button
            type="button"
            className={`btn btn-sm ${
              filters.state === "" ? "btn-primary" : "btn-outline-primary"
            }`}
            onClick={() => handleStateChange("")}
          >
            Any
          </button>

          {states.map((state) => (
            <button
              type="button"
              key={state}
              className={`btn btn-sm ${
                filters.state === state ? "btn-primary" : "btn-outline-primary"
              }`}
              onClick={() => handleStateChange(state)}
            >
              {state}
            </button>
          ))}
        </div>

        {isAdvancedOpen && (
          <div className="advanced-search-section">
            <div className="advanced-filter-block">
              <h3>Property Types</h3>

              {isLoadingFilters ? (
                <p className="text-muted">Loading property types...</p>
              ) : (
                <div className="property-type-grid">
                  {propertyTypes.map((propertyType) => (
                    <label className="property-type-option" key={propertyType}>
                      <input
                        type="checkbox"
                        value={propertyType}
                        checked={filters.propertyTypes.includes(propertyType)}
                        onChange={handlePropertyTypeChange}
                      />

                      <span>{formatPropertyType(propertyType)}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div className="advanced-filter-block">
              <h3>Bedrooms, bathrooms and parking</h3>

              <div className="advanced-range-grid">
                <div>
                  <label className="form-label" htmlFor="minimumBedrooms">
                    Min Bedrooms
                  </label>

                  <input
                    id="minimumBedrooms"
                    name="minimumBedrooms"
                    type="number"
                    min="0"
                    className="form-control"
                    value={filters.minimumBedrooms}
                    onChange={handleFilterChange}
                  />
                </div>

                <div>
                  <label className="form-label" htmlFor="maximumBedrooms">
                    Max Bedrooms
                  </label>

                  <input
                    id="maximumBedrooms"
                    name="maximumBedrooms"
                    type="number"
                    min="0"
                    className="form-control"
                    value={filters.maximumBedrooms}
                    onChange={handleFilterChange}
                  />
                </div>

                <div>
                  <label className="form-label" htmlFor="minimumBathrooms">
                    Min Bathrooms
                  </label>

                  <input
                    id="minimumBathrooms"
                    name="minimumBathrooms"
                    type="number"
                    min="0"
                    className="form-control"
                    value={filters.minimumBathrooms}
                    onChange={handleFilterChange}
                  />
                </div>

                <div>
                  <label className="form-label" htmlFor="maximumBathrooms">
                    Max Bathrooms
                  </label>

                  <input
                    id="maximumBathrooms"
                    name="maximumBathrooms"
                    type="number"
                    min="0"
                    className="form-control"
                    value={filters.maximumBathrooms}
                    onChange={handleFilterChange}
                  />
                </div>

                <div>
                  <label className="form-label" htmlFor="minimumParking">
                    Min Parking
                  </label>

                  <input
                    id="minimumParking"
                    name="minimumParking"
                    type="number"
                    min="0"
                    className="form-control"
                    value={filters.minimumParking}
                    onChange={handleFilterChange}
                  />
                </div>

                <div>
                  <label className="form-label" htmlFor="maximumParking">
                    Max Parking
                  </label>

                  <input
                    id="maximumParking"
                    name="maximumParking"
                    type="number"
                    min="0"
                    className="form-control"
                    value={filters.maximumParking}
                    onChange={handleFilterChange}
                  />
                </div>
              </div>
            </div>

            <div className="advanced-filter-block">
              <h3>Ratings and sorting</h3>

              <div className="advanced-range-grid">
                <div>
                  <label className="form-label" htmlFor="minimumRating">
                    Min Rating
                  </label>

                  <input
                    id="minimumRating"
                    name="minimumRating"
                    type="number"
                    min="0"
                    max="5"
                    step="0.5"
                    className="form-control"
                    placeholder="0 to 5"
                    value={filters.minimumRating}
                    onChange={handleFilterChange}
                  />
                </div>

                <div>
                  <label className="form-label" htmlFor="maximumRating">
                    Max Rating
                  </label>

                  <input
                    id="maximumRating"
                    name="maximumRating"
                    type="number"
                    min="0"
                    max="5"
                    step="0.5"
                    className="form-control"
                    placeholder="0 to 5"
                    value={filters.maximumRating}
                    onChange={handleFilterChange}
                  />
                </div>

                <div>
                  <label className="form-label" htmlFor="sortBy">
                    Sort By
                  </label>

                  <select
                    id="sortBy"
                    name="sortBy"
                    className="form-select"
                    value={filters.sortBy}
                    onChange={handleFilterChange}
                  >
                    <option value="">Default</option>

                    {sortOptions.map((sortOption) => (
                      <option key={sortOption.value} value={sortOption.value}>
                        {sortOption.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="form-label" htmlFor="sortOrder">
                    Sort Order
                  </label>

                  <select
                    id="sortOrder"
                    name="sortOrder"
                    className="form-select"
                    value={filters.sortOrder}
                    onChange={handleFilterChange}
                    disabled={!filters.sortBy}
                  >
                    <option value="">Default</option>
                    <option value="asc">Ascending</option>
                    <option value="desc">Descending</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="search-actions">
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isLoadingRentals}
          >
            {isLoadingRentals ? "Searching..." : "Search Rentals"}
          </button>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={clearFilters}
            disabled={isLoadingRentals}
          >
            Clear Filters
          </button>
        </div>
      </form>

      {isLoadingRentals && <p className="text-muted">Loading rental results...</p>}

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      {!isLoadingRentals && !error && (
        <>
          <div className="results-summary">
            <h2>Search Results</h2>

            <p>
              Showing {rentals.length} rental{rentals.length === 1 ? "" : "s"}{" "}
              on page {page}
              {pagination?.totalPages ? ` of ${pagination.totalPages}` : ""}.
            </p>
          </div>

          {rentals.length === 0 ? (
            <div className="empty-results-card">
              <h3>No rental results found</h3>
              <p>
                Try removing one or two filters, widening your rent range, or
                searching a nearby suburb.
              </p>
            </div>
          ) : (
            <div className="rental-results-grid">
              {rentals.map((rental, index) => (
                <article className="rental-result-card" key={rental.id || index}>
                  <div className="rental-result-card-header">
                    <div>
                      <p className="result-location">
                        {rental.suburb || "Unknown suburb"},{" "}
                        {rental.state || "Unknown state"}
                      </p>

                      <h3>{rental.title || "Rental property"}</h3>
                    </div>

                    <div className="result-rent">{formatRent(rental.rent)}</div>
                  </div>

                  <div className="result-property-type">
                    {formatPropertyType(rental.propertyType)}
                  </div>

                  <div className="result-stat-grid">
                    <div>
                      <span>Bedrooms</span>
                      <strong>{rental.bedrooms ?? "N/A"}</strong>
                    </div>

                    <div>
                      <span>Bathrooms</span>
                      <strong>{rental.bathrooms ?? "N/A"}</strong>
                    </div>

                    <div>
                      <span>Parking</span>
                      <strong>{rental.parkingSpaces ?? "N/A"}</strong>
                    </div>

                    <div>
                      <span>Postcode</span>
                      <strong>{rental.postcode || "N/A"}</strong>
                    </div>
                  </div>

                  <div className="result-card-footer">
                    <span>{formatRating(rental)}</span>

                    <Link className="btn btn-outline-primary" to={`/rentals/${rental.id}`}>
                      View Details
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}

          <div className="d-flex justify-content-between align-items-center mt-4">
            <button
              type="button"
              className="btn btn-secondary"
              disabled={page === 1}
              onClick={goToPreviousPage}
            >
              Previous 10
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
              Next 10
            </button>
          </div>
        </>
      )}
    </section>
  );
}

export default SearchProperty;