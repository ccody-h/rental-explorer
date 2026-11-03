const knex = require("../db/knex");

// Formats database date/time
function formatDateTime(value) {
  if (!value) {
    return null;
  }

  return new Date(value).toISOString();
}

// Returns a list of states/territories
async function getStates(req, res) {
  try {
    const queryParams = Object.keys(req.query);

    if (queryParams.length > 0) {
      return res.status(400).json({
        error: true,
        message: `Invalid query parameters: ${queryParams.join(
          ", "
        )}. Query parameters are not permitted.`,
      });
    }

    const states = await knex("data")
      .distinct("state")
      .whereNotNull("state")
      .orderBy("state", "asc");

    const stateList = states.map((row) => row.state);

    return res.status(200).json(stateList);
  } catch (error) {
    console.error("Failed to fetch states:", error);

    return res.status(500).json({
      error: true,
      message: "Failed to fetch states",
    });
  }
}

// Returns a list of property types
async function getPropertyTypes(req, res) {
  try {
    const queryParams = Object.keys(req.query);

    if (queryParams.length > 0) {
      return res.status(400).json({
        error: true,
        message: `Invalid query parameters: ${queryParams.join(
          ", "
        )}. Query parameters are not permitted.`,
      });
    }

    const propertyTypes = await knex("data")
      .distinct("propertyType")
      .whereNotNull("propertyType")
      .orderBy("propertyType", "asc");

    const propertyTypeList = propertyTypes.map((row) => row.propertyType);

    return res.status(200).json(propertyTypeList);
  } catch (error) {
    console.error("Failed to fetch property types:", error);

    return res.status(500).json({
      error: true,
      message: "Failed to fetch property types",
    });
  }
}

// Searches rental properties using filters, sorting, ratings, and pagination
async function searchRentals(req, res) {
  try {
    const allowedQueryParams = [
      "suburb",
      "state",
      "postcode",
      "minimumRent",
      "maximumRent",
      "minimumBathrooms",
      "maximumBathrooms",
      "minimumBedrooms",
      "maximumBedrooms",
      "minimumParking",
      "maximumParking",
      "propertyTypes",
      "minimumRating",
      "maximumRating",
      "sortBy",
      "sortOrder",
      "page",
    ];

    const queryParams = Object.keys(req.query);

    const invalidQueryParams = queryParams.filter(
      (param) => !allowedQueryParams.includes(param)
    );

    if (invalidQueryParams.length > 0) {
      return res.status(400).json({
        error: true,
        message: `Invalid query parameters: ${invalidQueryParams.join(
          ", "
        )}. Query parameters are not permitted.`,
      });
    }

    const {
      suburb,
      state,
      postcode,
      minimumRent,
      maximumRent,
      minimumBathrooms,
      maximumBathrooms,
      minimumBedrooms,
      maximumBedrooms,
      minimumParking,
      maximumParking,
      propertyTypes,
      minimumRating,
      maximumRating,
      sortBy,
      sortOrder,
      page = 1,
    } = req.query;

    const validStates = ["ACT", "NSW", "NT", "Qld", "SA", "Tas", "Vic", "WA"];

    const validPropertyTypes = [
      "acreage/semi-rural",
      "apartment",
      "duplex/semi-detached",
      "flat",
      "house",
      "other",
      "studio",
      "terrace",
      "townhouse",
      "unit",
      "villa",
    ];

    const sortableColumns = {
      id: "data.id",
      title: "data.title",
      rent: "data.rent",
      propertyType: "data.propertyType",
      latitude: "data.latitude",
      longitude: "data.longitude",
      postcode: "data.postcode",
      state: "data.state",
      suburb: "data.suburb",
      bathrooms: "data.bathrooms",
      bedrooms: "data.bedrooms",
      parkingSpaces: "data.parkingSpaces",
      averageRating: "averageRating",
      numRatings: "numRatings",
    };

    const isNonNegativeInteger = (value) => /^\d+$/.test(String(value));
    const isPageNumber = (value) => /^[1-9]\d*$/.test(String(value));
    const isNonNegativeNumber = (value) =>
      !Number.isNaN(Number(value)) && Number(value) >= 0;

    // Validate postcode
    if (postcode !== undefined && !/^\d{1,4}$/.test(String(postcode))) {
      return res.status(400).json({
        error: true,
        message:
          "Invalid postcode parameter. Must be an integer in the range of 0000-9999.",
      });
    }

    // Validate state
    if (state !== undefined && !validStates.includes(state)) {
      return res.status(400).json({
        error: true,
        message: "Invalid state parameter. Must be a valid Australian state.",
      });
    }

    // Validate non-negative integer
    const integerFilters = [
      ["minimumRent", minimumRent],
      ["maximumRent", maximumRent],
      ["minimumBathrooms", minimumBathrooms],
      ["maximumBathrooms", maximumBathrooms],
      ["minimumBedrooms", minimumBedrooms],
      ["maximumBedrooms", maximumBedrooms],
      ["minimumParking", minimumParking],
      ["maximumParking", maximumParking],
    ];

    for (const [name, value] of integerFilters) {
      if (value !== undefined && !isNonNegativeInteger(value)) {
        return res.status(400).json({
          error: true,
          message: `Invalid ${name} parameter. Must be a non-negative integer.`,
        });
      }
    }

    // Validate rating 
    if (minimumRating !== undefined && !isNonNegativeNumber(minimumRating)) {
      return res.status(400).json({
        error: true,
        message:
          "Invalid minimumRating parameter. Must be a non-negative number.",
      });
    }

    if (maximumRating !== undefined && !isNonNegativeNumber(maximumRating)) {
      return res.status(400).json({
        error: true,
        message:
          "Invalid maximumRating parameter. Must be a non-negative number.",
      });
    }

    // Validate page
    if (!isPageNumber(page)) {
      return res.status(400).json({
        error: true,
        message:
          "Invalid page parameter. Must be an integer greater than or equal to 1.",
      });
    }

    // Validate sorting
    if (sortBy !== undefined && !Object.keys(sortableColumns).includes(sortBy)) {
      return res.status(400).json({
        error: true,
        message:
          "Invalid sortBy parameter. Must refer to a valid sortable property.",
      });
    }

    if (sortOrder !== undefined && !["asc", "desc"].includes(sortOrder)) {
      return res.status(400).json({
        error: true,
        message: "Invalid sortOrder parameter. Must be 'asc' or 'desc'.",
      });
    }

    if (sortOrder !== undefined && sortBy === undefined) {
      return res.status(400).json({
        error: true,
        message: "Invalid sortOrder parameter. sortBy must be specified.",
      });
    }

    // propertyTypes can be a single string or array
    const propertyTypeList =
      propertyTypes === undefined
        ? undefined
        : Array.isArray(propertyTypes)
        ? propertyTypes
        : [propertyTypes];

    if (propertyTypeList !== undefined) {
      const invalidPropertyTypes = propertyTypeList.filter(
        (type) => !validPropertyTypes.includes(type)
      );

      if (invalidPropertyTypes.length > 0) {
        return res.status(400).json({
          error: true,
          message:
            "Invalid propertyTypes parameter. Must contain valid property types.",
        });
      }
    }

    const perPage = 10;
    const currentPage = Number(page);
    const offset = (currentPage - 1) * perPage;

    const baseQuery = knex("data")
      .leftJoin("ratings", "data.id", "ratings.rental_id")
      .groupBy("data.id")
      .select("data.*")
      .avg({ averageRating: "ratings.rating" })
      .count({ numRatings: "ratings.id" });

    // Apply text filters
    if (suburb !== undefined) {
      baseQuery.where("data.suburb", suburb);
    }

    if (state !== undefined) {
      baseQuery.where("data.state", state);
    }

    if (postcode !== undefined) {
      baseQuery.where("data.postcode", Number(postcode));
    }

    // Apply numeric filters
    if (minimumRent !== undefined) {
      baseQuery.where("data.rent", ">=", Number(minimumRent));
    }

    if (maximumRent !== undefined) {
      baseQuery.where("data.rent", "<=", Number(maximumRent));
    }

    if (minimumBathrooms !== undefined) {
      baseQuery.where("data.bathrooms", ">=", Number(minimumBathrooms));
    }

    if (maximumBathrooms !== undefined) {
      baseQuery.where("data.bathrooms", "<=", Number(maximumBathrooms));
    }

    if (minimumBedrooms !== undefined) {
      baseQuery.where("data.bedrooms", ">=", Number(minimumBedrooms));
    }

    if (maximumBedrooms !== undefined) {
      baseQuery.where("data.bedrooms", "<=", Number(maximumBedrooms));
    }

    if (minimumParking !== undefined) {
      baseQuery.where("data.parkingSpaces", ">=", Number(minimumParking));
    }

    if (maximumParking !== undefined) {
      baseQuery.where("data.parkingSpaces", "<=", Number(maximumParking));
    }

    if (propertyTypeList !== undefined) {
      baseQuery.whereIn("data.propertyType", propertyTypeList);
    }

    // Apply rating filters
    if (minimumRating !== undefined) {
      baseQuery.havingRaw("AVG(ratings.rating) >= ?", [
        Number(minimumRating),
      ]);
    }

    if (maximumRating !== undefined) {
      baseQuery.havingRaw("AVG(ratings.rating) <= ?", [
        Number(maximumRating),
      ]);
    }

    // Count the grouped results
    const totalResult = await knex
      .count({ total: "*" })
      .from(
        baseQuery.clone().clearSelect().select("data.id").as("filteredRentals")
      )
      .first();

    const total = Number(totalResult.total);

    const results = await baseQuery
      .clone()
      .select(
        "data.id",
        "data.title",
        "data.rent",
        "data.propertyType",
        "data.latitude",
        "data.longitude",
        "data.postcode",
        "data.state",
        "data.suburb",
        "data.bathrooms",
        "data.bedrooms",
        "data.parkingSpaces"
      )
      .orderBy(
        sortBy ? sortableColumns[sortBy] : "data.id",
        sortBy ? sortOrder || "asc" : "asc"
      )
      .limit(perPage)
      .offset(offset);

    // Format database rows
    const formattedResults = results.map((rental) => ({
      id: rental.id,
      title: rental.title,
      rent: rental.rent,
      propertyType: rental.propertyType,
      latitude: rental.latitude === null ? null : Number(rental.latitude),
      longitude: rental.longitude === null ? null : Number(rental.longitude),
      postcode: rental.postcode,
      state: rental.state,
      suburb: rental.suburb,
      bathrooms: rental.bathrooms,
      bedrooms: rental.bedrooms,
      parkingSpaces: rental.parkingSpaces,
      averageRating:
        rental.averageRating === null ? null : Number(rental.averageRating),
      numRatings: Number(rental.numRatings),
    }));

    const lastPage = Math.ceil(total / perPage);

    return res.status(200).json({
      data: formattedResults,
      pagination: {
        perPage,
        currentPage,
        from: offset,
        to: offset + formattedResults.length,
        total,
        lastPage,
        prevPage: currentPage > 1 ? currentPage - 1 : null,
        nextPage: currentPage < lastPage ? currentPage + 1 : null,
      },
    });
  } catch (error) {
    console.error("Failed to search rentals:", error);

    return res.status(500).json({
      error: true,
      message: "Failed to search rentals",
    });
  }
}

// Returns data for one property by ID
async function getRentalById(req, res) {
  try {
    const queryParams = Object.keys(req.query);

    if (queryParams.length > 0) {
      return res.status(400).json({
        error: true,
        message: `Invalid query parameters: ${queryParams.join(
          ", "
        )}. Query parameters are not permitted.`,
      });
    }

    const { id } = req.params;

    // Validate path
    if (!/^[1-9]\d*$/.test(String(id))) {
      return res.status(404).json({
        error: true,
        message: "No rental exists with this ID.",
      });
    }

    const rental = await knex("data")
      .leftJoin("ratings", "data.id", "ratings.rental_id")
      .where("data.id", Number(id))
      .groupBy("data.id")
      .select(
        "data.title",
        "data.rent",
        "data.description",
        "data.propertyType",
        "data.locality",
        "data.latitude",
        "data.longitude",
        "data.postcode",
        "data.state",
        "data.streetAddress",
        "data.suburb",
        "data.bathrooms",
        "data.bedrooms",
        "data.parkingSpaces",
        "data.agencyName",
        "data.amenities"
      )
      .avg({ averageRating: "ratings.rating" })
      .count({ numRatings: "ratings.id" })
      .first();

    if (!rental) {
      return res.status(404).json({
        error: true,
        message: "No rental exists with this ID.",
      });
    }

    // Fetch all reviews for this
    const reviews = await knex("ratings")
      .join("users", "ratings.user_id", "users.id")
      .where("ratings.rental_id", Number(id))
      .select(
        "ratings.rating",
        "users.email as user",
        "ratings.comment",
        "ratings.date_time as dateTime"
      )
      .orderBy("ratings.date_time", "desc");

    const formattedReviews = reviews.map((review) => {
      const reviewObject = {
        rating: review.rating,
        user: review.user,
        dateTime: formatDateTime(review.dateTime),
      };

      if (review.comment !== null && review.comment !== undefined) {
        reviewObject.comment = review.comment;
      }

      return reviewObject;
    });

    return res.status(200).json({
      title: rental.title,
      rent: rental.rent,
      description: rental.description,
      propertyType: rental.propertyType,
      locality: rental.locality,
      latitude: rental.latitude === null ? null : Number(rental.latitude),
      longitude: rental.longitude === null ? null : Number(rental.longitude),
      postcode: rental.postcode,
      state: rental.state,
      streetAddress: rental.streetAddress,
      suburb: rental.suburb,
      bathrooms: rental.bathrooms,
      bedrooms: rental.bedrooms,
      parkingSpaces: rental.parkingSpaces,
      agencyName: rental.agencyName,
      amenities: rental.amenities,
      averageRating:
        rental.averageRating === null ? null : Number(rental.averageRating),
      numRatings: Number(rental.numRatings),
      reviews: formattedReviews,
    });
  } catch (error) {
    console.error("Failed to fetch rental by ID:", error);

    return res.status(500).json({
      error: true,
      message: "Failed to fetch rental",
    });
  }
}

module.exports = {
  getStates,
  getPropertyTypes,
  searchRentals,
  getRentalById,
};